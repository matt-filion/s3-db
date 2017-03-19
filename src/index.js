'use strict';

const Common   = require('./lib/Common');
const Config   = require('lamcfg');
const Database = require('./Database');

/**
 * @see https://www.npmjs.com/package/s3-db
 */
module.exports = function(overrides){

  const defaults = {
    db: {
      name: process.env['S3DB_NAME'] || 's3-db',
      environment: process.env['STAGE'] || process.env['AWS_LAMBDA_FUNCTION_VERSION'] || 'dev',
      namePattern: '${db.name}:${db.environment}::${name}',
      allowDrop: false
    },
    provider: {
      name: 'aws-s3',
      region: process.env['AWS_DEFAULT_REGION'] || 'us-east-1'
    },
    collections: {
      default: {
        pageSize: 100,
        encryption: true,
        onlyUpdateOnMD5Change: true,
        collideOnMissmatch: false,
        id:{
          propertyName: 'id',
          /* @see https://gist.github.com/jed/982883 */
          generator: Common.uuid
        }
      }
    }
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

  const provider   = require('./lib/AWSProvider')(config);
  const Collection = require('./Collection');
  const Document   = require('./Document');

  return new Database(config,provider,Collection,Document);
}
