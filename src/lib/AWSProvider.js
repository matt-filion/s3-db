'use strict'
/**
 * Wrapper for AWS S3 API's.
 *
 * @param s3
 * @param configuration
 */
module.exports = function(configuration){

  const AWS             = require('aws-sdk');
  const region          = configuration.provider.region;
  const accessKeyId     = configuration.provider.accessKeyId || null;
  const secretAccessKey = configuration.provider.secretAccessKey || null;
  const awsConfig       = {region:region,accessKeyId:accessKeyId,secretAccessKey:secretAccessKey};
  const s3              = new AWS.S3(awsConfig);

  return {

    /**
     *
     */
    createCollection: bucket => s3.createBucket({
        Bucket: configuration.bucket.name(bucket), /* required */
        ACL: 'private'
      })
      .promise()
      .catch( results => {
        let error = {status:results.code};
        if(results.code==='BucketAlreadyOwnedByYou') error = {status:'already-exists'};
        if(results.code==='BucketAlreadyExists') error = {status:'name-already-taken'};
        return Promise.reject(error);
      }),

    /*
     * Remove a collection from the underlying source.
     */
    dropCollection: bucket => s3.deleteBucket({
        Bucket: configuration.bucket.name(bucket)
      }).promise(),

    /**
     *
     */
    listCollections: () => s3.listBuckets().promise(),
    /*
     * Tags are used to track what buckets were created by
     *  s3-db so we know what ones to list out when a list request
     *  is being made.
     */
    putBucketTagging: (bucket,tags) => {
      const params = {
        Bucket: configuration.bucket.name(bucket),
        Tagging: {
          TagSet: []
        }
      };

      Object.keys(tags).forEach(name => {
        params.Tagging.TagSet.push({
          Key: name,
          Value: tags[name]
        });
      })
      return s3.putBucketTagging(params).promise();
    },

    /**
     *
     */
    listObjects: (bucket,startsWith,continuationToken) => {

      const params = {
        Bucket : configuration.bucket.name(bucket),
        FetchOwner: false,
        MaxKeys: configuration.pageSize
      };

      if(startsWith) params.Prefix = startsWith
      if(continuationToken) params.ContinuationToken = continuationToken

      return s3.listObjectsV2(params).promise();
    },

    /**
     *
     */
    deleteObject: (bucket,id) => s3.deleteObject({
       Bucket : configuration.bucket.name(bucket), Key : id
    }).promise(),

    /**
     *
     */
    headObject : (bucket,id) => s3.headObject({
      Bucket : configuration.bucket.name(bucket), Key : id
    }).promise(),

    /**
     *
     */
    getObject : (bucket,id) => s3.getObject({
      Bucket : configuration.bucket.name(bucket), Key : id
    }).promise(),

    /**
     *
     */
    putObject : (bucket,id,toWrite,metadata) => {
      var params = {
        Bucket : configuration.bucket.name(bucket),
        Key : id,
        ContentType: 'application/json',
        ContentLength: toWrite.length,
        Body : toWrite,
      };

      if(metadata){
        params.Metadata = metadata;
        if(metadata.md5) {
          params.ContentMD5 = metadata.md5;
        }
      }

      if(configuration.encryption) params.ServerSideEncryption = 'AES256'

      return s3.putObject(params).promise();
    },
  }
}
