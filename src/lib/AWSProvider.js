'use strict'

/**
 * Wrapper for AWS S3 API's.
 *
 * @param s3
 * @param configuration
 */
module.exports = function(config){

  const AWS                 = require('aws-sdk');
  const region              = config.get('provider.region');
  const accessKeyId         = config.get('provider.accessKeyId');
  const secretAccessKey     = config.get('provider.secretAccessKey');
  const s3                  = new AWS.S3({region,accessKeyId,secretAccessKey});
  const bucketName          = name => Utils.render(config.get('db.namePattern'),{db:config.get('db'),name});
  const getCollectionConfig = (name,setting) => config.get(`collections.${name}.${setting}`) || config.get('collections.default.${setting}');

  return {

    /**
     * @return Array of the collection names
     */
    listCollections: () => s3.listBuckets().promise()
      .then( results => results.Buckets.map( bucket => bucket.Name ) ),

    /**
     *
     */
    createCollection: name => s3.createBucket({
        Bucket: bucketName(name), ACL: 'private'
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
    dropCollection: name => s3.deleteBucket({
        Bucket: bucketName(name)
      }).promise(),

    /*
     * Tags are used to track what buckets were created by
     *  s3-db so we know what ones to list out when a list request
     *  is being made.
     */
    setCollectionTags: (name,tags) => {
      const params = {
        Bucket: bucketName(name),
        Tagging: { TagSet: [] }
      };

      Object.keys(tags).forEach(name => {
        params.Tagging.TagSet.push({
          Key: name,
          Value: tags[name]
        });
      })
      return s3.putBucketTagging(params).promise();
    },

    /*
     * Tags are used to track what buckets were created by
     *  s3-db so we know what ones to list out when a list request
     *  is being made.
     */
    getCollectionTags: name => s3.getBucketTagging({Bucket: bucketName(name)})
      .promise()
      .then( tagging => tagging.TagSet.map( tag => {return {[tag.Key]:tag.Value}})),

    /**
     *
     */
    findDocuments: (name,startsWith,continuationToken) => {
      const params = {
        Bucket : bucketName(name),
        FetchOwner: false,
        MaxKeys: getCollectionConfig(name,'pageSize')
      };

      if(startsWith) params.Prefix = startsWith
      if(continuationToken) params.ContinuationToken = continuationToken

      return s3.listObjectsV2(params).promise()
        .then( data => data.Contents )
        .then( results => results.map( result => result.Key) )
    },

    /**
     *
     */
    deleteDocument: (name,id) => s3.deleteObject({
      Bucket: bucketName(name), Key: id
    }).promise(),

    /**
     *
     */
    getDocumentHead : (name,id) => s3.headObject({
      Bucket: bucketName(name), Key: id
    }).promise(),

    /**
     *
     */
    getDocument : (name,id) => s3.getObject({
      Bucket: bucketName(name), Key: id
    }).promise(),

    /**
     *
     */
    putDocument : (request) => {
      const params = {
        Bucket: bucketName(request.collection),
        Key: request.id,
        ContentType: 'application/json',
        ContentLength: request.body.length,
        Body: request.body,
      };

      if(request.metadata){
        params.Metadata = request.metadata;
        if(metadata.md5) {
          params.ContentMD5 = metadata.md5;
        }
      }

      if(getCollectionConfig(name,'encryption')) params.ServerSideEncryption = 'AES256'

      return s3.putObject(params).promise();
    },

    /*
     * Gets the metadata from the providers attributes.
     */
    buildListMetaData: results => {
      const metadata = {
        hasMore :          results.IsTruncated,
        batchSize:         results.MaxKeys,
        resultCount:       results.KeyCount,
        continuationToken: results.NextContinuationToken,
        bucket:            results.Name,
        commonPrefixes:    results.CommonPrefixes
      }

      if(results.Prefix) metadata.startsWith = results.Prefix

      return metadata;
    },

    getDocumentBody: file => typeof file.Body === 'string' ? file.Body : file.Body.toString(),

    buildDocumentMetaData: document => {
      const metadata = document.Metadata || {};

      if(document.Size) metadata.size = document.Size
      if(document.StorageClass) metadata.storageClass = document.StorageClass
      if(document.ContentLength) metadata.size = document.ContentLength;
      if(document.ServerSideEncryption) metadata.encryption = document.ServerSideEncryption
      if(document.LastModified) metadata.lastModified = new Date(document.LastModified)
      if(document.ETag) metadata.eTag = document.ETag.replace(/"/g,'') /* Fix the stupid AWS eTag. */

      return metadata;
    }
  }
}
