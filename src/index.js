
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

    db : 's3-db',
    appname: 'app',
    environment: (process.env.AWS_LAMBDA_FUNCTION_VERSION || 'dev').replace(/\$/g,"").toLowerCase(),
    region: process.env.AWS_DEFAULT_REGION || 'us-west-2',
    onlyUpdateOnMD5Change: true,
    collideOnMissmatch: true,
    pageSize : 100,
    bucket: {
      prefix: () => {
        return 's3-db.' + configuration.appname + '.' + configuration.environment + '-';
      },
      name: (name)  => {
        return configuration.bucket.prefix() + name;
      },
      isOwned: (fqn) => {
        return configuration.bucket.prefix().length === 0 || fqn.startsWith(configuration.bucket.prefix());
      },
      parseName: (fqn) => {
        if(configuration.bucket.prefix().length > 0 ){
          return fqn.substring(configuration.bucket.prefix().length);
        } else {
          return fqn;
        }
      }
    },
    id:{
      name: 'id',
      generator: function(){
        return configuration.db + '-' + new Date().getTime()
      }
    }
  };

  function updateAttributes(configuration,_configuration){
    if(typeof _configuration === "string") {
      configuration.appname = _configuration;
    } else {
      for(var name in _configuration) {
        if(typeof configuration[name] === 'object') {
          updateAttributes(configuration[name],_configuration[name]);
        } else {
          configuration[name] = _configuration[name];
        }
      }
    }
  }
  
  //TODO Validation

  updateAttributes(configuration,_configuration || {});
  
  return require('./s3-db')(configuration);
}

