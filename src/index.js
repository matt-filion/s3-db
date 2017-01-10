'use strict';

/**
 * @see https://www.npmjs.com/package/s3-db
 */
module.exports = (overrides) => {

  const Common = require('./lib/Common');

  /*
   * @see https://bitbucket.org/sexycastle/s3-db/docs/Configuration.md
   */
  const configuration = {
    db: process.env.S3DB_NAME || 's3-db',
    provider: {
      name: process.env.PROVIDER_NAME || 'aws-s3',
      /*
       * Note: Previous versions defaulted to us-west-2 because it is the region I
       *  typically use.
       */
      region: process.env.AWS_DEFAULT_REGION || 'us-east-1',
    },
    environment: (process.env.AWS_LAMBDA_FUNCTION_VERSION || 'dev').replace(/\$/g,"").toLowerCase(),
    onlyUpdateOnMD5Change: true,
    collideOnMissmatch: true,
    pageSize: 100,
    encryption: true,
    collection: {
      name: name  => `${configuration.db}.${configuration.environment}.${name}`,
      isOwned: fqn => fq.startsWith(configuration.collection.name('')),
      parseName: fqn => fqn.substring(configuration.collection.name('').length)
    },
    id:{
      propertyName: 'id',
      /* @see https://gist.github.com/jed/982883 */
      generator: collectionName => Common.uuid()
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

  const provider   = require('./lib/AWSProvider')(configuration);
  const Collection = require('./Collection');
  const Document   = require('./Document');

  return require('./Database')(configuration,provider,Collection,Document);
}
