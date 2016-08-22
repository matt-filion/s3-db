const s3db = require('../src')({
  accessKeyId  : '',
  secretAccessKey : '',
//  ,errorOnNotFound:true
});

var users = s3db.bucketOf('users');

/*
 * List out users
 */
//users
//  .list()
//  .then( (results) => {console.log('results',results)});

/*
 * Load a record that doesnt exist.
 */

users
  .load("!@#kljasdpf123jqw-d09fj")
  .then(user => console.log("user --> ",user))
  .fail( error => console.error("error",error) )

/*
 * Example in docs.
 */
s3db.list()
  .then( results => { console.log("results",results); return results[0].get() } ) //Select the first item from the results.
  .then( bucket => { console.log("bucket",bucket); return bucket.list() } )
  .then( records => console.log("records",records) )
  .fail( error => console.error("error",error) )

/*
 * Create a new doc and delete it.
 */
users
  .save( {testing:'this-new-doc'} )
  .then( user => users.load(user.id))
  .then( user => { console.log("user",user); return user; })
//  .then( user => users.delete(user.id) )
//  .then( user => { console.log("deleted ",user); return user; })
  .fail( error => console.error("error",error) )
  
/*
 * Example on docs.
 */
users.save({name : 'Richard Cranium'})
  .then( user => users.load(user.id))
  .then( user => {
    user.size = 1234;
    user.sex = 'male';
    return users.save(user);
  })
  .then( user => users.delete(user.id) )
  .then( user => console.log("done",user) )
  .fail( error => console.error(error.stack) )
    
