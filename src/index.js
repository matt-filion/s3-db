
/**
 * Entry point
 * 
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
    accessKeyId: 'AKIAJSURJYEJ6XX5YEBQ',
    secretAccessKey:'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',

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

const s3dbConfiguration = {
  appname: 'app',
  environment: 'dev',
  region: 'us-west-2', //Omit if in Lambda and want to use Lambda's region
  accessKeyId: 'YOUR_AWS_ACCESS_KEY_ID', //Omit if in Lambda
  secretAccessKey: 'YOUR_AWS_SCRET_ACCESS_KEY' //Omit if in Lambda
}
var s3db = module.exports(s3dbConfiguration);

const users = s3db.bucketOf('users');
const user = {name : 'Richard Cranium',id:'hello-world'} 
  users.load('hello-world')
    .then(function(user){
      user.size = 1234;
      user.sex = 'male';
      return users.save(user);
    })
    .then(function(user){
      return users.delete(user.id);
    })
    .then(function(results){
      console.log("record deleted",results);
    })
    .fail(function(error){
        console.error(error.stack);
    })



////var result = s3db.create('user',{author:'Matt Filion'});
//var result = s3db.list()
//.then(function(buckets){
//  console.log("buckets",buckets);
//  buckets[0]
//    .get()
//    .save({name:'Phelpsy Mikesy'})
//    .then(function(results){
//      console.log("created --->",results);
//      return Q();
//    })
//    .then(function(){
//      return buckets[0].get().list();
//    })
//    .then(function(results){
//      console.log("results bucket contents",results)
//    })
//    .fail(function(error){
//      console.error(error.stack);
//    })
//})
//.catch(function(error){
//  console.error(error);
//});