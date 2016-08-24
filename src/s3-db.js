
/**
 * S3DB behaviors, for the given configuration.
 */
module.exports = function(configuration) {

  const TAG_NAME_MARKER      = 's3db';
  const TAG_NAME_SUMMARY     = 's3db-summary';
  const TAG_NAME_ENVIRONMENT = 's3db-environment';
  
  const Q          = require('q');
  const S3DBBucket = require('./s3-bucket');
  const S3         = require('./s3-wrapper')(configuration);

  const instance = {

    bucket: (name) =>{
      return S3.getBucketTagging(name)
        .then(tags => {
          var summaryTag = tags.TagSet.find( tag => tag.Key===TAG_NAME_SUMMARY)
          var summary = summaryTag ? summaryTag.Value.split(' ') : undefined;
          return Q([name,summary]) 
        })
        .spread( (name,summary) => new S3DBBucket(name,summary,S3,configuration))
    },
 
    list: () => S3.listBuckets()
      .then(function(results){
        console.log(configuration);
        var buckets = results.Buckets
          .filter( bucket => configuration.bucket.isOwned( bucket.Name ) )
          .map( bucket => instance.bucket( configuration.bucket.parseName( bucket.Name ) ) )
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

    create : (name,settings) => {
      
      // - bucket visibility 'private | public-read | public-read-write | authenticated-read'
      
      return S3.createBucket(name,settings.visibility)
        .then((results) => {

          /*
           * Validate that summary fields do not have any commas in them. This may bork
           *  the splitting into summary items otherwise.
           */
          if(settings.summary) {
            settings.summary.forEach(item => { if(item.indexOf(' ')!==-1) throw "Summary names cannot have a comma" })
          }
          
          var tags = {}
          tags[TAG_NAME_MARKER]      = configuration.appname
          tags[TAG_NAME_ENVIRONMENT] = configuration.environment,
          tags[TAG_NAME_SUMMARY]     = settings.summary ? settings.summary.join(' ') : ''

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
    delete : instance.drop,
    drop : instance.drop,
    bucket : instance.bucket,
    bucketOf : instance.bucket
  }
}