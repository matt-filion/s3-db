const configuration = {
    accessKeyId  : '',
    secretAccessKey : '',
  db : 's3-db',
  appname: 'app',
  environment: 'dev',
  region: 'us-west-2',
  collideOnETagMissmatch:true,
  collideOnMD5Missmatch:true,
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
  pageSize : 100,
  id:{
    name: 'id',
    generator: function(){
      return configuration.db + '-' + new Date().getTime()
    }
  }
//    ,errorOnNotFound:true
};
const S3 = require('../src/s3-wrapper')(configuration);


//S3.putBucketTagging('users',{'s3db':'appname','s3db.environment':'dev','s3db.grouping':'group'})
//  .then(data => console.time('tagging'))
//  .then(data => S3.getBucketTagging('users') )
//  .then(data => console.log("data",data))
//  .then(data => console.timeEnd('tagging'))
//  .catch( error => console.error("error",error));

//S3.putObject('users','+18182682762',{name:'Sarah',id:'+18182682762'})
//  .then( user => S3.getObject('users','+18182682762')) 
//  .then(console.log)
//  .then( user => S3.headObject('users','+18182682762')) 
//  .then(console.log)
//  .fail(console.error)

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