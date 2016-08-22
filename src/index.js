
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
    environment: (process.env.AWS_LAMBDA_FUNCTION_VERSION || 'dev').replace(/\$/g,""),
    region: process.env.AWS_DEFAULT_REGION || 'us-west-2',

    s3:{
      bucket: {
        prefix: () => {
          return 's3-db.' + configuration.appname + '.' + configuration.environment + '-';
        },
        name: (name)  => {
          return configuration.s3.bucket.prefix() + name;
        },
        isOwned: (fqn) => {
          return configuration.s3.bucket.prefix().length === 0 || fqn.startsWith(configuration.s3.bucket.prefix());
        },
        parseName: (fqn) => {
          if(configuration.s3.bucket.prefix().length > 0 ){
            return fqn.substring(configuration.s3.bucket.prefix().length);
          } else {
            return fqn;
          }
        }
      },
      file: {
        spacer : null
      },
      pageSize : 100
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

  updateAttributes(configuration,_configuration || {});
  
  console.log("configuration",configuration);

  return require('./s3-db')(configuration);
}

