'use strict'
/**
 * Wrapper for AWS S3 API's.
 *  
 * @param s3
 * @param configuration
 */
module.exports = function(configuration){

  const crypto          = require('crypto');
  const AWS             = require('aws-sdk');
  const region          = configuration.region || process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION;
  const accessKeyId     = configuration.accessKeyId || null;
  const secretAccessKey = configuration.secretAccessKey || null;
  const awsConfig       = {region:region,accessKeyId:accessKeyId,secretAccessKey:secretAccessKey};
  const s3              = new AWS.S3(awsConfig); 

  const instance = {
    
    /**
     * 
     */
    createBucket : (bucket) => {
      var params = {
        Bucket: configuration.bucket.name(bucket), /* required */
        ACL: 'private'
      };
      return s3.createBucket(params).promise();
    },
    
    /*
     * Tags are used to track what buckets were created by
     *  s3-db so we know what ones to list out when a list request
     *  is being made.
     */
    putBucketTagging : (bucket,tags) => {
      var params = {
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
    
    dropBucket: (bucket) => {
      var params = {
        Bucket: configuration.bucket.name(bucket)
      };
      return s3.deleteBucket(params).promise();
    },

    /**
     * 
     */
    listBuckets: () => {
      return s3.listBuckets().promise();
    },

    /**
     * 
     */
    listObjects: (bucket,startsWith,continuationToken) => {

      var params = {
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
    deleteObject : (bucket,id) => {
      var params = { Bucket : configuration.bucket.name(bucket), Key : id };
      return s3.deleteObject(params).promise();
    },
    
    /**
     * 
     */
    headObject : (bucket,id) => {
      var params = {Bucket : configuration.bucket.name(bucket), Key : id};
      return s3.headObject(params).promise();
    },

    /**
     * 
     */
    getObject : (bucket,id) => {
      var params = {Bucket : configuration.bucket.name(bucket), Key : id};
      return s3.getObject(params).promise();
    },

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

  return {

    listBuckets: instance.listBuckets,
    createBucket: instance.createBucket,
    putBucketTagging: instance.putBucketTagging,
    dropBucket: instance.dropBucket,
    
    getObjectSignature: instance.getObjectSignature,
    getObject: instance.getObject,
    deleteObject: instance.deleteObject,
    putObject: instance.putObject,
    listObjects: instance.listObjects,
    headObject: instance.headObject
  }
  
}