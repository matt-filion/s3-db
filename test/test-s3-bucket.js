const configuration = {
  accessKeyId  : '',
  secretAccessKey : '',
  db : 's3-db',
  appname: 'app',
  environment: 'dev',
  region: 'us-west-2',
  collideOnMissmatch:false,
  onlyUpdateOnMD5Change:true,
  pageSize : 2,
  bucket: {
    prefix: () => {
      return 's3-db.' + configuration.appname + '.' + configuration.environment + '-';
    },
    name: (name)  => {
      return configuration.bucket.prefix() + name;
    },
    isOwned: (fqn) => {
      return configuration.bucket.prefix().length === 0 || fqn.startsWith(configuration.s3.bucket.prefix());
    },
    parseName: (fqn) => {
      if(configuration.bucket.prefix().length > 0 ){
        return fqn.substring(configuration.s3.bucket.prefix().length);
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
//    ,errorOnNotFound:true
};
const S3    = require('../src/s3-wrapper')(configuration);
const users = require('../src/s3-bucket')('users',S3,configuration);

//console.time('user.list');
//users.list()
//  .then( users => { users.forEach(user => console.log("user",user)); return users; }) 
//  .then( users => { console.log("users.hasMore",users.hasMore ); return users; } ) 
//  .then( users => { if(users.hasMore) { return users.next() } else { return [] }  } ) 
//  .then( users => { console.log("users.hasMore 2",users.hasMore ); return users; } ) 
//  .then( users => console.log("users 2",users ) ) 
//  .fail( error => console.error("Error:",error))
//  .fin( () => console.timeEnd('user.list') )

//try {
//  
//users.load('+18184686271')
//  .then( user => {
//    console.time('user.save');
//    user.personality ? delete user.personality : user.personality = 'awesome'
//    return user;
//  })
//  .then( user => users.save(user))
//  .then( user => console.log("saved 2",user))
//  .fail( error => console.error("Error:",error))
//  .fin( () => console.timeEnd('user.save') )
//} catch(e){
//  console.error(e)
//}