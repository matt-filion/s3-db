
/**
 * Entry point
 * @see https://bitbucket.org/sexycastle/s3-db/src
 */
module.exports = function(_configuration){

  /*
   * Set configuration defaults so that if nothing is specified we can
   *  still test for its existence without having to worry about 
   *  undefined exceptions.
   */
  const defaults = {

    db : 's3-db',
    appname: 'app',
    environment: 'dev',
    region: 'us-west-2',

    s3:{
      bucket: {
        prefix: function(){
          return 's3-db.' + defaults.appname + '.' + defaults.environment + '-';
        },
        name: function(name){
          return this.prefix() + name;
        },
        isOwned: function(fqn){
          return this.prefix().length === 0 || fqn.startsWith(this.prefix());
        },
        parseName: function(fqn){
          if(this.prefix().length > 0 ){
            return fqn.substring(this.prefix().length);
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
      generator: require('uuid').v4
    }
  };
  
  //TODO overwrite defaults with the _configuration provdied.

  const configuration = _configuration || defaults;
  return require('./s3-db')(configuration);

}