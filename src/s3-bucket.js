'use strict'  
module.exports = function(name,_S3,_configuration) {

  const METANAME      = '__s3db';
  const crypto        = require('crypto');
  const S3DBRecord    = require('./s3-record');
  const S3            = _S3;
  const configuration = _configuration;
  const instance = {
    _initialize : (name) => {
      instance.bucket = name;
    },
    _listResponse : (data) => {
      
      var results = data.Contents
        .map(record => S3DBRecord.decorate({ id : record.Key },record))
        .map(record => {record.get = () => instance.load(record.id); return record} )

      var metadata = {
        hasMore :          data.IsTruncated,
        batchSize:         data.MaxKeys,
        resultCount:       data.KeyCount,
        continuationToken: data.NextContinuationToken,
        bucket:            data.Name,
        commonPrefixes:    data.CommonPrefixes
      };

      if(data.Prefix) metadata.startsWith = data.Prefix

      Object.defineProperty(results, METANAME, {value:{metadata:metadata}});

      results.hasMore = metadata.hasMore;

      if(results.hasMore) {
        results.next = () => {
          return S3.listObjects(instance.bucket,results[METANAME].metadata.startsWith,results[METANAME].metadata.continuationToken)
            .then( data => instance._listResponse(data))
        }
      }

      
      return results;
    },

    /**
     * Lists out all of the files within the bucket,
     *  though within the limits of s3's api, only
     *  100 at a time.
     */
    list : (startsWith) => {
      return S3.listObjects(instance.bucket,startsWith)
        .then( data => instance._listResponse(data) )
    },
    
    /**
     * Loads all of the ID's identified.
     */
    loadAll: ids => {
      
     var promises =
       /*
        * Remove all of the duplicate IDs.
        */
        ids
          .map(id => {
            if(id === 'object') {
              var idName = configuration.id.name;
              if(id[idName]) {
                return id[idName];
              }
            }
            return id;
          })
          .reduce( (accumulator,current,index,array) => {
            if(accumulator.indexOf(current)==-1){
              accumulator.push(current);
            }
            return accumulator;
          },[])
        /*
         * Creates a promise, that catches any errors, which
         *  is necessary with Promise.all's fail fast behavior. Otherwise
         *  documents that are not found will cause no documents to load
         *  at all. 
         */
        .map( id => instance.load(id).catch(e => Promise.resolve()) )
      
      return Promise.all( promises )
        .then(results => {
          /*
           * The filter will remove the 'undefined'
           *  results for documents that were not found.
           */
          return results.filter( item => item)
        })
    },

    /**
     * Loads a specific record.
     */
    load : id => {
      return S3.getObject(instance.bucket,id)
        .then( data => S3DBRecord.newRecord(data))
        .then( record => {
          record.save   = () => instance.save(record)
          record.delete = () => instance.delete(record.id)
          record.reload = () => instance.load(record.id)
          return record;
        })
        .catch( error => {
          if(error.code==='NoSuchKey' && !configuration.errorOnNotFound){
            return Promise.resolve();
          } else {
            return Promise.reject(error);
          }
        })
    },

    /**
     * Removes the file at the specified location.
     */
    delete : (id) => {
      return S3.deleteObject(instance.bucket,id);
    },
    
    _isModified : (record) => {
      
      var idName = configuration.id.name;
      var id     = record[idName] || configuration.id.generator();

      if(!record[idName]){
        record[idName] = id;
      }

      if(S3DBRecord.isS3DBRecord(record) && configuration.collideOnMissmatch){
        return S3.headObject(instance.bucket,record[idName])
          .then( head => {
            if(S3DBRecord.hasSourceChanged(record,head)){
              return Promise.reject('Collision, the document has been modified.');
            }
            return Promise.resolve({bucket:instance.bucket,id:record[idName],record:record});
          })
      } else {
        return Promise.resolve({bucket:instance.bucket,id:record[idName],record:record});
      }
    },
    
    /**
     * Creates a new file within S3.
     */
    save : (record) => {
      
      if(!record){
        return Promise.reject("Cannot save undefined or null objects.");
      }
      
      /*
       * If the MD5 of the object to write has not changed, then 
       *  do not bother doing an update at S3.
       */
      if(configuration.onlyUpdateOnMD5Change && S3DBRecord.isModified(record)) {
        return Promise.resolve(record);

      } else {
        
        return instance._isModified(record)
          .then( responseWrapper => {
            
            var bucket = responseWrapper.bucket;
            var id     = responseWrapper.id;
            var record = responseWrapper.record;

            //TODO add other tags from the record if they should be available
            // during head, and can we use head for list with a postitive performance
            // increase?
            
            var toWrite  = S3DBRecord.serialize(record);
            var metaData = {
              md5 : S3DBRecord.signature(toWrite)
            }

            /*
             * Update the metadata on the record before saving, since 
             *  this is where we have the data.
             */
            S3DBRecord.decorate(record,{Body:toWrite})
            
            return Promise.resolve({bucket:bucket,id:id,toWrite:toWrite,metaData:metaData})
          })
          .then( wrapper => S3.putObject(wrapper.bucket,wrapper.id,wrapper.toWrite,wrapper.metaData))
          .then( data => S3DBRecord.decorate(record,data) )
          .then( record => {
            record.save   = () => instance.save(record)
            record.delete = () => instance.delete(record.id)
            record.reload = () => instance.load(record.id)
            return record;
          })
          
      }
    }
  }
  
  instance._initialize(name);
 
  return {
    name: name,
    list: instance.list,
    load: instance.load,
    loadAll: instance.loadAll,
    delete: instance.delete,
    save: instance.save
  }
}