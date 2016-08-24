  
module.exports = function(name,summary,_S3,_configuration) {

  const METANAME       = '__s3db';
  const LIST_MARKER    = 'LIST';
  const LOAD_MARKER    = 'LOAD';
  const SAVE_MARKER    = 'SAVE';
  const SUMMARY_MARKER = 'SUMMARY';
  const Q              = require('q');
  const crypto         = require('crypto');
  const S3DBRecord     = require('./s3-record');
  const S3             = _S3;
  const configuration  = _configuration;
  const instance = {
    _initialize : (name,summary) => {
      instance.bucket   = name;
      instance.summary  = summary;
    },

    _mapResults : data => {

      var results = data.Contents
        .map(record => S3DBRecord.decorate({ id : record.Key },record))
        .map(record => {record.get = () => instance.load(record.id); return record} );

      return Q([data,results])
    },


    summary : id => {
      return S3.headObject(instance.bucket,id)
        .then(head => Q([result,head]) )
        .spread(instance._applySummary)
        /*
         * Add a flag to detect that this object is from a list so
         *  we can keep people from saving them as they may not have
         *  all data loaded.
         */
        .then(record => Q(S3DBRecord.setOrigin(record,SUMMARY_MARKER)))
    },
    
    _applySummary : (record,head) => {
      var head     = result.value[1];
      var metaData = S3DBRecord.parseMeta(head)
      var record   = result.value[0];

      instance.summary.forEach(summary => record[summary] = metaData[summary])

      return S3DBRecord.decorate(record,head);
    },
    
    _summarize : (data,results) => {

      if(instance.summary && !instance.summary.length!==0){

        var promises = results.map( result => 
          S3.headObject(instance.bucket,result.id)
            .then(head => Q([result,head]) )
        )

        return Q.allSettled(promises)
          .then(results => {
            return results.map( instance._applySummary )
            /*
             * Add a flag to detect that this object is from a list so
             *  we can keep people from saving them as they may not have
             *  all data loaded.
             */
            .map(record => S3DBRecord.setOrigin(record,LIST_MARKER))
          })
          .then(results => Q([data,results]));

      } else {
        return Q([data,results]);
      }
    },
    
    _listResponse : (data,results) => {

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
            .then( instance._mapResults )
            .spread( instance._summarize )
            .spread( instance._listResponse )
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
        .then( instance._mapResults )
        .spread( instance._summarize )
        .spread( instance._listResponse )
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
        .then( record=> S3DBRecord.setOrigin(record,LOAD_MARKER) )
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

      if(S3DBRecord.getOrigin(record)===LIST_MARKER){
        return Q.reject("Cannot save a list item as a new record, it is only a summary and may be incomplete. Call record.get() to load the record for that list item.")
      }

      if(S3DBRecord.getOrigin(record)===SUMMARY_MARKER){
        return Q.reject("Cannot save a summary as a new record, it is only a summary and may be incomplete. Call record.get() to load the record for that list item.")
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

            var toWrite  = S3DBRecord.serialize(record);
            var metaData = {
              md5 : S3DBRecord.signature(toWrite)
            }
            
            if(instance.summary){
              instance.summary.forEach(summary => metaData[summary] = record[summary].toString())
            }

            /*
             * Update the metadata on the record before saving, since 
             *  this is where we have the data.
             */
            S3DBRecord.decorate(record,{Body:toWrite})
            S3DBRecord.setOrigin(record,SAVE_MARKER);

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
  
  instance._initialize(name,summary);
 
  return {
    name: name,
    summary: summary,
    list: instance.list,
    load: instance.load,
    delete: instance.delete,
    save: instance.save
  }
}