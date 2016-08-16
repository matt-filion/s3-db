/**
 * Wraps the S3 api calls with Q and adds simplicity where
 *  possible.
 *  
 * @param s3
 * @param configuration
 */
module.exports = function(configuration){

  const AWS             = require('aws-sdk');
  const Q               = require('q');
  const region          = configuration.region || process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION;
  const accessKeyId     = configuration.accessKeyId || null;
  const secretAccessKey = configuration.secretAccessKey || null;
  const awsConfig       = {region:region,accessKeyId:accessKeyId,secretAccessKey:secretAccessKey};
  const s3              = new AWS.S3(awsConfig); 

  const instance = {

    _hasNoerror : function(defer,error,data){

      if(error){
        defer.reject(error);
        return false;
      }

      return true;
    },

    /**
     * 
     */
    createBucket : function(bucket){

      var defer  = Q.defer();
      var params = {
        Bucket: configuration.s3.bucket.name(bucket), /* required */
        ACL: 'private'
      };

      s3.createBucket(params, function(error, data) {
        if(instance._hasNoerror(defer,error,data)){
          defer.resolve(data);
        }
      });

      return defer.promise;
    },
    
    /*
     * Tags are used to track what buckets were created by
     *  s3-db so we know what ones to list out when a list request
     *  is being made.
     */
    putBucketTagging : function(bucket,tags){
      var defer  = Q.defer();
      var params = {
        Bucket: configuration.s3.bucket.name(bucket),
        Tagging: { 
          TagSet: [] 
        }
      };
    
      for(var name in tags){
        params.Tagging.TagSet.push({
          Key: name,
          Value: tags[name]
        });
      }
      
      s3.putBucketTagging(params, function(error, data) {
        if(instance._hasNoerror(defer,error,data)){
          defer.resolve(data);
        }
      });
      return defer.promise;
    },
    
    dropBucket: function(bucket){
      var defer  = Q.defer();
      var params = {
        Bucket: configuration.s3.bucket.name(bucket)
      };
      s3.deleteBucket(params, function(err, data) {
        if(instance._hasNoerror(defer,error,data)){
          defer.resolve(data);
        }
      });
      return defer.promise;
    },

    /**
     * 
     */
    listBuckets: function(){
      var defer  = Q.defer();

      s3.listBuckets(function(error, data) {
        if(instance._hasNoerror(defer,error,data)){
          defer.resolve(data);
        }
      });

      return defer.promise;
    },

    /**
     * 
     */
    listObjects: function(bucket,startsWith,continuationToken){

      var defer  = Q.defer();
      var params = {
        Bucket : configuration.s3.bucket.name(bucket),
        FetchOwner: false,
        MaxKeys: configuration.s3.pageSize
      };

      if(startsWith){
        params.Prefix = startsWith;
      }

      if(continuationToken){
        params.ContinuationToken = continuationToken;
      }

      s3.listObjectsV2(params, function(error, data) {
        if(instance._hasNoerror(defer,error,data)){
          defer.resolve(data);
        }
      });

      return defer.promise;
    },
    
    /**
     * 
     */
    deleteObject : function(bucket,id){
      var defer  = Q.defer();

      s3.deleteObject({ Bucket : configuration.s3.bucket.name(bucket), Key : id }, function(error, data) {
        if(instance._hasNoerror(defer,error,data)){
          defer.resolve(); //?
        }
      });

      return defer.promise;
    },

    /**
     * 
     */
    getObject : function(bucket,id){
      var defer = Q.defer();
      
      //TODO can this be done better with a stream/pipe?

      s3.getObject({Bucket : configuration.s3.bucket.name(bucket), Key : id},function(error,data){
        if(instance._hasNoerror(defer,error,data)){
          defer.resolve(data);
        }
      })

      return defer.promise;
    },

    /**
     * 
     */
    putObject : function(bucket,id,record){

      var defer   = Q.defer();
      var toWrite = JSON.stringify(record,null,configuration.s3.file.spacer);
      var params  = {
        Bucket : configuration.s3.bucket.name(bucket),
        Key : id,
        ContentType: 'application/json',
        ContentLength: toWrite.length,
        Body : toWrite
      };
      
      if(record._metadata){
        params.Metadata = record._metadata;
        delete record._metadata;
      }

      if(!configuration.s3.encryption===false){
        params.ServerSideEncryption = 'AES256';
      }

      s3.putObject(params,function(error,data){
        if(instance._hasNoerror(defer,error,data)){
          defer.resolve(data);
        }
      })

      return defer.promise;
    },
  }

  return {

    listBuckets: instance.listBuckets,
    createBucket: instance.createBucket,
    putBucketTagging: instance.putBucketTagging,
    dropBucket: instance.dropBucket,
    
    getObject: instance.getObject,
    deleteObject: instance.deleteObject,
    putObject: instance.putObject,
    listObjects: instance.listObjects
  }
  
}