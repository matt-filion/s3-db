
/**
 * S3DB behaviors, for the given configuration.
 */
module.exports = function(configuration){

  const Q      = require('q');
  const Bucket = require('./s3-db-bucket');
  const S3     = require('./s3-wrapper')(configuration);

  const instance = {
    bucket: function(name){
      return Q(new Bucket(name,S3,configuration))
    },
    list: function(){
      return S3.listBuckets()
        .then(function(results){
          var ownedBuckets = [];
          results.Buckets.forEach(function(bucket){
            if(configuration.s3.bucket.isOwned(bucket.Name)){
              ownedBuckets.push({
                name: configuration.s3.bucket.parseName(bucket.Name),
                get: function(){
                  return new Bucket(this.name,S3,configuration)
                },
                __meta:{
                  createdOn:new Date(bucket.CreationDate)
                }
              });
            }
          })
          return Q(ownedBuckets);
        })
    },
    drop: function(name){
      if(configuration.s3.allowDrop){
        return S3.dropBucket(name);
      } else {
        throw "Configuration does not allow buckets to be dropped.";
      }

    },
    create : function(name,tags){
      configuration.s3.bucket.prefix();
      return S3.createBucket(name)
        .then(function(results){

          if(!tags){
            tags = {};
          }

          tags['s3-db'] = configuration.appname;
          tags['s3-db.environment'] = configuration.environment;

          return S3.putBucketTagging(name,tags)
        })
        .then(function(){
          return Q(new Bucket(name,S3,configuration));
        })
        .fail(function(results){

          if(results.code==='BucketAlreadyOwnedByYou'){
            return Q.reject({status:'already-exists'});
          }

          if(results.code==='BucketAlreadyExists'){
            return Q.reject({status:'name-already-taken'});
          }
          
          return Q.reject({status:results.code});
        })
    }
  }

  return {
    list : instance.list,
    create : instance.create,
    bucketOf : instance.bucket,
  }
}