'use strict'
/**
 * Entry point
 * @see https://bitbucket.org/sexycastle/s3-db/src
 */
module.exports = (_configuration) => {

  /*
   * Set configuration defaults so that if nothing is specified we can
   *  still test for its existence without having to worry about
   *  undefined exceptions.
   */
  const configuration = {

    db: 's3-db',
    appname: 'app',
    environment: (process.env.AWS_LAMBDA_FUNCTION_VERSION || 'dev').replace(/\$/g,"").toLowerCase(),
    region: process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'us-west-2',
    onlyUpdateOnMD5Change: true,
    collideOnMissmatch: true,
    pageSize : 100,
    bucket: {
      prefix: () => 's3-db.' + configuration.appname + '.' + configuration.environment + '-',
      name: (name)  => configuration.bucket.prefix() + name,
      isOwned: (fqn) => configuration.bucket.prefix().length === 0 || fqn.startsWith(configuration.bucket.prefix()),
      parseName: (fqn) => configuration.bucket.prefix().length > 0 ? fqn.substring(configuration.bucket.prefix().length) : fqn
    },
    id:{
      name: 'id',
      generator: () => configuration.db + '-' + new Date().getTime()
    }
  };

  if(typeof _configuration === "string"){
    _configuration = {appname: _configuration}
  }

  Object.assign(configuration,_configuration)

  return require('./s3-db')(configuration);
}
