  
module.exports = function(name,_S3,_configuration){

  const Q        = require('q');
  const crypto   = require('crypto');
  const instance = {
    S3: null,
    configuration: null,
    bucket: null,
    
    _initialize : (name,S3,configuration) => {
      instance.S3            = S3;
      instance.configuration = configuration;
      instance.bucket        = name;
    },

    _serialize: (record) => {
      delete record.__meta;
      return JSON.stringify(record,null,instance.configuration.s3.file.spacer);
    },

    _deserialize: (serialized) => {
      return JSON.parse(serialized);
    },
    
    _signature: (toWrite) => {
      return crypto.createHash('md5').update(toWrite).digest("base64");
    },

    _consistentMeta: (data) => {
      
      var meta = {}

      if(data.Metadata) meta = data.Metadata
      if(data.Size) meta.size = data.Size
      if(data.ContentLength) meta.size = data.ContentLength;
      if(data.ServerSideEncryption) meta.encryption = data.ServerSideEncryption
      if(data.LastModified) meta.lastModified = new Date(data.LastModified)
      if(data.ETag) meta.eTag = data.ETag.replace(/"/g,'') /* Fix the stupid eTag. */
      if(data.Body) meta.md5 = instance._signature(data.Body.toString())

      return meta;
    },

    _isModified : (record) => {

      var idName = instance.configuration.id.name;
      var id     = record[idName] || instance.configuration.id.generator();

      if(!record[idName]){
        record[idName] = id;
      }

      if(record.__meta && (instance.configuration.collideOnETagMissmatch || instance.configuration.collideOnMD5Missmatch)){

        return instance.S3.headObject(instance.bucket,record[idName])
          .then( head => {

            var targetMetaData = instance._consistentMeta(head);

            /*
             * The targetMetaData comes from a headCheck on the object being
             *  overwritten. So if the MD5 on the __meta of the current record
             *  matches the target MD5, the underlying object is likely not
             *  modified.
             */
            if(instance.configuration.collideOnMD5Missmatch && targetMetaData.md5 !== record.__meta.md5){
              return Q.reject("Collision, the document has been modified.");
            }
            
            if(instance.configuration.collideOnETagMissmatch && targetMetaData.eTag !== record.__meta.eTag){
              return Q.reject("Collision, the document has been modified.");
            }
            
            return Q([instance.bucket,record[idName],record]);
          })
      } else {
        return Q([instance.bucket,record[idName],record]);
      }
    },

    _listResponse : (data) => {

      var response = {
          hasMore :    data.IsTruncated,
          batchSize:   data.MaxKeys,
          resultCount: data.KeyCount,
          results:     []
      };

      if(data.Prefix) response.startsWith = data.Prefix

      response.results = data.Contents.map(record => { return {
        id : record.Key,
        get : () => instance.load(record.Key),
        __meta : instance._consistentMeta(record)
      }});

      return [response,data];
    },

    _attachNext : (response,data) => {

      /*
       * Simplify the gathering of the next batch of results
       *  with a convenience function.
       */
      if(response.hasMore){

        /*
         * TODO be nice to have a collection of some sort that will do this under the covers
         *  as its being iterated through, but not realistic for the short term.
         */
        response.next = () => {
          return instance.S3.listObjects(instance.bucket,response.startsWith,data.NextContinuationToken)
            .then( data =>  instance._listResponse(data))
            .spread(instance._attachNext);
        }
      }

      return Q(response);
    },

    /**
     * Lists out all of the files within the bucket,
     *  though within the limits of s3's api, only
     *  100 at a time.
     */
    list : (startsWith) => {
      return instance.S3.listObjects(instance.bucket,startsWith)
        .then( data => instance._listResponse(data) )
        .spread(instance._attachNext)
    },

    /**
     * Loads a specific record.
     */
    load : (id) => {
      return instance.S3.getObject(instance.bucket,id)
        .then((data) => {

          var record = instance._deserialize(data.Body.toString());
          record.__meta = instance._consistentMeta(data);

          return Q(record);
        })
        .fail( error => {
          if(error.code==='NoSuchKey' && !instance.configuration.errorOnNotFound){
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
      return instance.S3.deleteObject(instance.bucket,id);
    },
    
    /**
     * Creates a new file within S3.
     */
    save : (record) => {

      var meta     = record.__meta;
      var toWrite  = instance._serialize(record);
      var md5      = instance._signature(toWrite);
      
      /*
       * Serialization deletes the __meta off of the object
       *  being recorded. So we have to replace it so that
       *  logic can be run against the object.
       */
      record.__meta = meta;
      
      /*
       * If the MD5 of the object to write has not changed, then 
       *  do not bother doing an update at S3.
       */
      if(instance.configuration.onlyUpdateOnMD5Change && meta && meta.md5 === md5) {
        console.log("not modified, no update");
        return Q(record);

      } else {
        
        return instance._isModified(record)
          .spread( (bucket,id,record) => {

            //TODO add other tags from the record if they should be in the list.
            var metaData = {
                md5 : md5
            }
            
            return Q([bucket,id,toWrite,metaData])
          })
          .spread(instance.S3.putObject)
          .then( data => {
            record.__meta = instance._consistentMeta(data);
            return Q(record); 
          })
      }
    }
  }
  
  instance._initialize(name,_S3,_configuration);
 
  return {
    list: instance.list,
    load: instance.load,
    delete: instance.delete,
    save: instance.save
  }
}