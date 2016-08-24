const s3db = require('../src')({
  accessKeyId  : 'AKIAIGYTCWV23QED3ZJQ',
  secretAccessKey : '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'
//  allowDrop:true
//  ,errorOnNotFound:true
});

//s3db.create('users',{summary:['name','sex','age'],visibility:'private'})

s3db.bucketOf('users')
//  .then( users => users.save({name:'Sarah',age:29,sex:'Female'}))
  .then( users => users.list() )
  .then( users => console.log(users) )
  .fail( error => console.error("error",error) )


/*
 * List out users
 */
//users
//  .list()
//  .then( (results) => {console.log('results',results)});
//
///*
// * Load a record that doesnt exist.
// */
//
//users
//  .load("!@#kljasdpf123jqw-d09fj")
//  .then(user => console.log("user --> ",user))
//  .fail( error => console.error("error",error) )
//
///*
// * Example in docs.
// */
//s3db.list()
//  .then( results => { console.log("results",results); return results[0] } ) //Select the first item from the results.
//  .then( bucket => { console.log("bucket",bucket); return bucket.list() } )
//  .then( records => console.log("records",records) )
//  .fail( error => console.error("error",error) )
//
/////*
//// * Create a new doc and delete it.
//// */
//users
//  .save( {testing:'this-new-doc'} )
//  .then( user => users.load(user.id))
//  .then( user => { console.log("user",user); return user; })
//  .then( user => { user.sex='male'; age=32; return user; })
//  .then( user => user.save() )
//  .then( user => { console.log("saved user",user); return user; })
//  .then( user => user.reload() )
//  .then( user => { console.log("reload user",user); return user; })
//  .then( user => { console.log("deleted ",user); return user.delete(); })
//  .fail( error => console.error("error",error) )
//  
/////*
//// * Example on docs.
//// */
//const user = {name : 'Richard Cranium'} 
//s3db.bucketOf('users')
//  .save(user)
//  .then( user => {console.log("user created",user); return user;} )
//  .then( user => {
//    user.size = 1234;
//    user.sex  = 'male';
//    return user;
//  })
//  .then( user => {console.log("user modified",user); return user;} )
//  .then( user => user.save() )
//  .then( user => {console.log("user saved"); return user;} )
//  .then( user => {
//    user.size = 122345;
//    user.sex = 'female';
//    return user;
//  })
//  .then( user => {console.log("user modified a second time"); return user;} )
//  .then( user => user.reload() )
//  .then( user => {console.log("user reloaded"); return user;} )
//  .then( user => user.delete(user.id) )
//  .then( user => {console.log("user deleted"); return user;} )
//  .fail( error => console.error(error.stack) )
    
