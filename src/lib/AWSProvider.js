'use strict'


const Common = require('./Common');
const Check  = Common.Check;
const Utils  = Common.Utils;

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
  const bucketName          = fqn => fqn.name.indexOf('/') === -1 ? `${fqn.prefix}${fqn.name}` : `${fqn.prefix}${fqn.name.substring(0,fqn.name.indexOf('/'))}`;
  const getId               = (fqn,id) => fqn.name.indexOf('/') === -1 ? id : `${fqn.name.substring(fqn.name.indexOf('/')+1)}/${id}`;
  const getCollectionConfig = fqn => Utils.getCollectionConfig(fqn,config);

  return {
    database: {

      /**
       * @return Array of the collection names
       */
      listCollections: () => s3.listBuckets().promise()
        .then( results => results.Buckets.map( bucket => bucket.Name ) ),

      /**
       *
       */
      createCollection: fqn => s3.createBucket({
          Bucket: bucketName(fqn), ACL: 'private'
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
      dropCollection: fqn => s3.deleteBucket({
          Bucket:  bucketName(fqn)
        }).promise()
    },

    collection: {
      // /*
      //  * Tags are used to track what buckets were created by
      //  *  s3-db so we know what ones to list out when a list request
      //  *  is being made.
      //  */
      // getCollectionTags: fqn => s3.getBucketTagging({Bucket: bucketName(fqn)})
      //   .promise()
      //   .then( tagging => tagging.TagSet.map( tag => {return {[tag.Key]:tag.Value}})),
      // /*
      //  * Tags are used to track what buckets were created by
      //  *  s3-db so we know what ones to list out when a list request
      //  *  is being made.
      //  */
      // setCollectionTags: (fqn,tags) => {
      //   const params = {
      //     Bucket:  bucketName(fqn),
      //     Tagging: { TagSet: [] }
      //   };

      //   Object.keys(tags).forEach(name => {
      //     params.Tagging.TagSet.push({
      //       Key: name,
      //       Value: tags[name]
      //     });
      //   })
      //   return s3.putBucketTagging(params).promise();
      // }
      /**
       *
       */
      findDocuments: (fqn,startsWith,continuationToken) => {
        const params = {
          Bucket : bucketName(fqn),
          FetchOwner: false,
          MaxKeys: getCollectionConfig(fqn).get('pageSize',100)
        };

        if(fqn.name.indexOf('/')!==-1) params.Delimiter = '/';
        if(startsWith) params.Prefix = fqn.name.indexOf('/')===-1 ? startsWith : `{fqn.name.substring(fqn.name.indexOf('/')+1}/${startsWith}`;
        if(continuationToken) params.ContinuationToken = continuationToken;

        return s3.listObjectsV2(params).promise()
          .then( data => data.Contents )
          .then( results => results.map( result => result.Key) )
      },

      /**
       *
       */
      deleteDocument: (fqn,id) => s3.deleteObject({
        Bucket: bucketName(fqn), Key: getId(fqn,id)
      }).promise(),

      /**
       *
       */
      getDocumentHead: (fqn,id) => s3.headObject({
        Bucket: bucketName(fqn), Key: getId(fqn,id)
      }).promise(),

      /**
       *
       */
      getDocument: (fqn,id) => s3.getObject({
        Bucket: bucketName(fqn), Key: getId(fqn,id)
      }).promise(),

      /**
       *
       */
      copyDocument: (sourceFQN,sourceId,sourceETag,destinationFQN,destinationId) => {
        const params = {
          Bucket: bucketName(destinationFQN),
          Key: getId(destinationFQN,destinationId),
          CopySource:`${bucketName(sourceFQN)}${getId(sourceFQN,sourceId)}`,
          MetadataDirective: 'COPY'
        };
        if(getCollectionConfig(request.fqn).get('encryption',true)) params.ServerSideEncryption = 'AES256';
        if(sourceETag) params.CopySourceIfMatch = sourceETag;
        return s3.copyObject(params).promise();
      },

      /**
       *
       */
      putDocument: (request) => {
        const params = {
          Bucket: bucketName(request.fqn),
          Key: getId(request.fqn,request.id),
          ContentType: 'application/json',
          ContentLength: Buffer.byteLength(request.body, 'utf8'),
          Body: request.body,
          ContentMD5: Utils.signature(request.body)
        };

        if(request.metadata){
          params.Metadata = request.metadata;
        }

        if(getCollectionConfig(request.fqn).get('encryption',true)) params.ServerSideEncryption = 'AES256';

        return s3.putObject(params).promise().then( response => Object.assign(response,{Body:request.body,Metadata:params.Metadata}));
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
    },

    document: {

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
}