
# Examples
List the current buckets, choose one, and list its contents.
```javascript
    s3db.list()
    	.then( results => results[0] ) //Select the first item from the results.
    	.then( bucket => bucket.list() )
    	.then( records => console.log("records",records) );
    	.then( record => { record.attribute=true; return record;} );
    	.then( record => record.save() );
```

Create a record, load it, change it, save it, delete it. Not a very logical operation, but it demonstrates everything I want to demonstrate.

```javascript
  const user = {name : 'Richard Cranium'}
	s3db.bucketOf('users')
		.save(user)
		.then( user => {
			user.size = 1234;
			user.sex = 'male';
			return user;
		})
		.then( user => users.save() )
		.then( user => {
			user.size = 122345;
			user.sex = 'female';
			return user;
		})
		.then( user => users.reload() )
		.then( user => users.delete(user.id) )
		.fail( error => console.error(error.stack) )
```
