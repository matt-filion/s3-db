'use strict';

/**
 * @see https://www.npmjs.com/package/s3-db
 */
module.exports = function(overrides){

  const Common   = require('./lib/Common');
  const Config   = require('lamcfg');
  const defaults = {
    db: {
      name: process.env['S3DB_NAME'] || 's3-db',
      environment: process.env['STAGE'] || process.env['AWS_LAMBDA_FUNCTION_VERSION'] || 'dev',
      namePattern: '${db.name}.${db.environment}-${name}'
    },
    provider: {
      name: 'aws-s3',
      region: process.env['AWS_DEFAULT_REGION'] || 'us-east-1'
    },
    collections: {
      default: {}
    },
    serializer: {}
  };
  const config = new Config({defaults});

  /*
   * Allows for a simple configuration when all the defaults are OK.
   */
  if(typeof overrides === "string"){
    config.update({db:{name:overrides}});
  } else if(overrides) {
    config.update(overrides);
  }

  const provider        = require('./lib/AWSProvider')(config);
  const serializer      = require('./lib/Serializer')(config);
  const Collection      = require('./Collection');
  const DocumentFactory = require('./DocumentFactory');
  const Database        = require('./Database');

  return new Database(config,provider,serializer,Collection,DocumentFactory);
}
