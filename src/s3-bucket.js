  
module.exports = function(name,_S3,_configuration) {

  const METANAME      = '__s3db';
  const Q             = require('q');
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
     * Loads a specific record.
     */
    load : (id) => {
      return S3.getObject(instance.bucket,id)
        .then( data => S3DBRecord.newRecord(data))
        .then( record => {
          record.save   = () => instance.save(record)
          record.delete = () => instance.delete(record.id)
          record.reload = () => instance.load(record.id)
          return record;
        })
        .fail( error => {
          if(error.code==='NoSuchKey' && !configuration.errorOnNotFound){
            return Q();
          } else {
            return Q.reject(error);
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
              return Q.reject('Collision, the document has been modified.');
            }
            return Q([instance.bucket,record[idName],record]);
          })
      } else {
        return Q([instance.bucket,record[idName],record]);
      }
    },
    
    /**
     * Creates a new file within S3.
     */
    save : (record) => {
      
      if(!record){
        return Q.reject("Cannot save undefined or null objects.");
      }
      
      /*
       * If the MD5 of the object to write has not changed, then 
       *  do not bother doing an update at S3.
       */
      if(configuration.onlyUpdateOnMD5Change && S3DBRecord.isModified(record)) {
        return Q(record);

      } else {
        
        return instance._isModified(record)
          .spread( (bucket,id,record) => {

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
            
            return Q([bucket,id,toWrite,metaData])
          })
          .spread(S3.putObject)
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
    delete: instance.delete,
    save: instance.save
  }
}