'use strict';

/**
 * @see https://www.npmjs.com/package/s3-db
 */
module.exports = (overrides) => {
  const configuration = {
    db: process.env.S3DB_NAME || 's3-db',
    /*
     * Placeholder to allow changing the underlying storage mechanism
     *  from S3 to local, or somet other mechanism.
     */
    provider: {
      name: process.env.PROVIDER_NAME || 'aws-s3',
      /*
       * AWS Lambda functions store the region they are executing within in
       *  the AWS_DEFAULT_REGION variable. Otherwise we default ot us-east-1 which
       *  is AWS default datacenter.
       *
       * Note: Previous versions defaulted to us-west-2 because it is the region I
       *  typically use.
       */
      region: process.env.AWS_DEFAULT_REGION || 'us-east-1',
      // accessKeyId:'',
      // secretAccessKey:''
    },
    /*
     * Can be set to an empty string value if you do not have multiple
     *  versions of the application running in the same environment.
     */
    environment: (process.env.AWS_LAMBDA_FUNCTION_VERSION || 'dev').replace(/\$/g,"").toLowerCase(),
    /*
     * By default, a requested update to a document, such as a call to record.save()
     *  will only invoke a call to S3 if a change to the document is detected.
     *  Setting this value to false, will ensure an update is sent to S3 even
     *  if the record itself was not modified by the operations attempted.
     */
    onlyUpdateOnMD5Change: true,
    /*
     * Some primitive missmatch detection using the eTag on the document and
     *  MD5 value matching. This makes a call to S3 for the 'header' information
     *  of a document during update to do this verification. Each time a document
     *  is updated in S3 the MD5 is stored under a tag so that a fetch of the
     *  entire document is not necesary to do this detection.
     *
     * If you want to be optimistic about the sanitation of your transactions
     *  or dont care about background updates being overwritten, you can
     *  set this value to false and gain a slight performance boost on updates/creates
     *  of documents.
     */
    collideOnMissmatch: true,
    /*
     * How many documents are returned during a list or search on a colletion.
     */
    pageSize : 100,
    /*
     * Configures the behavior of how we treate a collection.
     */
    collection: {
      /*
       * How each S3 collection will be named.
       */
      name: name  => `${configuration.db}.${configuration.environment}.${name}`,
      /*
       * Used to determine if the current database and environment owns the
       *  s3 collection.
       */
      isOwned: fqn => fq.startsWith(configuration.collection.name('')),
      /*
       * Parses the s3 collection fqn to get the name familiar to the application.
       */
      parseName: fqn => fqn.substring(configuration.collection.name('').length)
    },
    /*
     * ID Generation logic.
     */
    id:{
      /*
       * The value on the document to use as the key for the S3 Object.
       */
      propertyName: 'id',
      /*
       * A generator to ensure that the keys are always unique, when an id
       *  is not provided. Generally an external library should be used
       *  to create a UUID rather than fall back on this. However I did not
       *  want to bundle another library so this primitive implementation stands
       *  as a place holder.
       */
      generator: collectionName => `${configuration.db}-${configuration.environment}-${new Date().getTime()}`
    }
  }

  /*
   * Allows for a simple configuration when all the defaults are OK.
   */
  if(typeof overrides === "string"){
    Object.assign(configuration,{db: overrides})
  } else {
    Object.assign(configuration,overrides);
  }

  /*
   * The AWS PRovider interacts with S3 on behalf of the behaviors
   *  exposed in the S3-DB API.
   */
  const provider   = require('./lib/AWSProvider')(configuration);
  const Collection = require('./Collection');
  const Document   = require('./Document');

  return require('./Database')(configuration,provider,Collection,Document);
}
