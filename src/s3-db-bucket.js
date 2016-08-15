  
module.exports = function(name,_S3,_configuration){

  const Q        = require('q');
  const instance = {
    S3: null,
    configuration: null,
    bucket: null,
    
    _initialize : function(name,S3,configuration){
      instance.S3            = S3;
      instance.configuration = configuration;
      instance.bucket        = name;
    },
    
    _consistentMeta: function(data){

      var meta = {}

      if(data.Metadata){
        meta = data.Metadata;
      }

      if(data.Size){
        meta.size = data.Size;
      }

      if(data.ContentLength){
        meta.size = data.ContentLength;
      }

      if(data.ServerSideEncryption){
        meta.encryption = data.ServerSideEncryption;
      }

      if(data.LastModified){
        meta.lastModified = new Date(data.LastModified);
      }

      /*
       * Fix the stupid eTag.
       */
      if(data.ETag){
        meta.eTag = data.ETag.replace(/"/g,'');
      }

      return meta;
      
    },

    _listResponse : function(data) {
      
      var response = {
          hasMore :    data.IsTruncated,
          batchSize:   data.MaxKeys,
          resultCount: data.KeyCount,
          results:     []
      };

      if(data.Prefix){
        response.startsWith = data.Prefix;
      }

      data.Contents.forEach(function(record){
        response.results.push({
          id : record.Key,
          get : function(){ return instance.load(record.Key) },
          __meta : instance._consistentMeta(record)
        })
      });

      return [response,data];
    },

    _attachNext : function(response,data){

      /*
       * Simplify the gathering of the next batch of results
       *  with a convenience function.
       */
      if(response.hasMore){

        /*
         * TODO be nice to have a collection of some sort that will do this under the covers
         *  as its being iterated through, but not realistic for the short term.
         */
        response.next = function(){
          return instance.S3.listObjects(instance.bucket,response.startsWith,data.NextContinuationToken)
            .then(function(data){
              return instance._listResponse(data);
            })
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
    list : function(startsWith){
      return instance.S3.listObjects(instance.bucket,startsWith)
        .then(function(data){
          return instance._listResponse(data);
        })
        .spread(instance._attachNext)
    },

    /**
     * Loads a specific record.
     */
    load : function(id){
      return instance.S3.getObject(instance.bucket,id)
        .then(function(data){
          var body   = data.Body.toString();
          var record = JSON.parse(body);

          record.__meta = instance._consistentMeta(data);

          return Q(record);
        });
    },

    /**
     * Removes the file at the specified location.
     */
    delete : function(id){
      return instance.S3.deleteObject(instance.bucket,id);
    },

    /**
     * Creates a new file within S3.
     */
    save : function(record){

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
        .then(function(data){
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