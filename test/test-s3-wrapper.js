const configuration = {
    accessKeyId  : '',
    secretAccessKey : '',
  db : 's3-db',
  appname: 'app',
  environment: 'dev',
  region: 'us-west-2',
  collideOnETagMissmatch:true,
  collideOnMD5Missmatch:true,
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
const S3 = require('../src/s3-wrapper')(configuration);

S3.putObject('users','+18182682762',{name:'Sarah',id:'+18182682762'})
//  .then( user => S3.getObject('users','+18182682762')) 
//  .then(console.log)
  .then( user => S3.headObject('users','+18182682762')) 
  .then(console.log)
  .fail(console.error)

//S3.headObject('users','+18185686271',{name:'Matt',last:'Filio'},'4fb0f9e32fa0c4a0bec1a72873fa44e0') 
//  .then(console.log)
//  .then(function(){
//    S3.headObject('users','+18185686271',{name:'Matt',last:'Filio'},'4fb0f9e32fa0c4a0bec1a72873fa44e0') 
//    .then(console.log)
//    .fail(console.error)
//  })
//  .fail(console.error)
//S3.headObject('users','+18184686271')
//  .then( result => console.log(result) )