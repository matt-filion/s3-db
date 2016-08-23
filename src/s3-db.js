
/**
 * S3DB behaviors, for the given configuration.
 */
module.exports = function(configuration) {

  const Q          = require('q');
  const S3DBBucket = require('./s3-bucket');
  const S3         = require('./s3-wrapper')(configuration);

  const instance = {
    bucket: (name) => new S3DBBucket(name,S3,configuration),
    list: () => S3.listBuckets()
      .then(function(results){
        console.log(configuration);
        var buckets = results.Buckets
          .filter( bucket => configuration.bucket.isOwned( bucket.Name ) )
          .map( bucket => instance.bucket( configuration.bucket.parseName( bucket.Name ) ) )
        console.log("buckets",buckets);
        return Q(buckets);
      })
    ,
    drop: (name) =>{
      if(configuration.allowDrop){
        return S3.dropBucket(name);
      } else {
        throw "Configuration does not allow buckets to be dropped.";
      }
    },
    create : (name,tags) => {
      return S3.createBucket(name)
        .then((results) => {

          if(!tags){ tags = {}; }

          tags['s3-db']             = configuration.appname;
          tags['s3-db.environment'] = configuration.environment;

          return S3.putBucketTagging(name,tags)
        })
        .then(() => Q(instance.bucket(name,S3,configuration) ) )
        .fail((results) => {

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
    bucket : (name) => Q(instance.bucket(name)),
    bucketOf : instance.bucket
  }
}