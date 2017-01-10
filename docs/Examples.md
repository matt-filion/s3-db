## [Main Docs](./README.md)


# [Serverless.com](http://serverless.com)
I use [serverless.com](http://serverless.com) for quite a bit of my development and it also happens to be the best way to take advantage of some of the additional S3 features like triggers off an S3 bucket. The combination of these s3-db and [serverless.com](http://serverless.com) makes for some incredibly rapid data centric development.



<!--
_Serverless.com serverless.yml example_

This will give s3-db to manage and create buckets that begin with the name s3-db, which is a configured
 default for the start of the name.
```yml

provider:
  name: aws
  runtime: nodejs4.3
  iamRoleStatements:
    -  Effect: "Allow"
       Action:
         - "s3:ListBucket"
         - "s3:ListAllMyBuckets"
         - "s3:CreateBucket"
         - "s3:PutBucketTagging"
         - "s3:ListObject"
         - "s3:DeleteObject"
         - "s3:GetObject"
        - "s3:PutObject"
       Resource:
         Fn::Join:
           - ""
           - - "arn:aws:s3:::s3-db*"

``` -->

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
