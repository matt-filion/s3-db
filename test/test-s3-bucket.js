const configuration = {
  accessKeyId  : '',
  secretAccessKey : '',
  db : 's3-db',
  appname: 'app',
  environment: 'dev',
  region: 'us-west-2',
  collideOnETagMissmatch:false,
  collideOnMD5Missmatch:false,
  onlyUpdateOnMD5Change:true,
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
//    ,errorOnNotFound:true
};
const S3    = require('../src/s3-wrapper')(configuration);
const users = require('../src/s3-db-bucket')('users',S3,configuration);

try {
  
users.load('+18184686271')
  .then( user => {
    console.time('user.save');
    delete user.personality;
    return user;
  })
  .then( user => users.save(user))
  .then( user => console.log("saved 2",user))
  .fail( error => console.error("Error:",error))
  .fin( () => console.timeEnd('user.save') )
} catch(e){
  console.error(e)
}