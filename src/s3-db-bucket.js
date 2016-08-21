  
module.exports = function(name,_S3,_configuration){

  const Q        = require('q');
  const instance = {
    S3: null,
    configuration: null,
    bucket: null,
    
    _initialize : (name,S3,configuration) => {
      instance.S3            = S3;
      instance.configuration = configuration;
      instance.bucket        = name;
    },
    
    _consistentMeta: (data) => {

      var meta = {}

      if(data.Metadata) meta = data.Metadata
      if(data.Size) meta.size = data.Size
      if(data.ContentLength) meta.size = data.ContentLength;
      if(data.ServerSideEncryption) meta.encryption = data.ServerSideEncryption
      if(data.LastModified) meta.lastModified = new Date(data.LastModified)
      if(data.ETag) meta.eTag = data.ETag.replace(/"/g,'') /* Fix the stupid eTag. */

      return meta;

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
          var record = JSON.parse(data.Body.toString());

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

      var idName = instance.configuration.id.name;
      var id     = record[idName] || instance.configuration.id.generator();

      if(!record[idName]){
        record[idName] = id;
      }

      /*
       * Remove __meta from the saved object so that it doesn't overwrite the value
       *  being returned during load.
       */
      delete record.__meta;

      return instance.S3.putObject(instance.bucket,record[idName],record)
        .then((data) => {
          record.__meta = instance._consistentMeta(data);
          return Q(record); 
        })
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