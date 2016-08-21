s3-db
======

#### [Feedback Appreciated and Needed](https://bitbucket.org/sexycastle/s3-db/issues?status=new&status=open)

[API](#markdown-header-api) | [Examples](#markdown-header-examples) | [Configurations](#markdown-header-configurations)

Quick and simple data storage solution. Has all CRUD operations. Doesn't attempt to overcome  limitations of S3 like querying.

_s3-db is not intended to be a replacement for any sort of enterprise, full scale and fully functional database with transactional integrity and complex queries. Instead, its aimed at the simple scenarios where select and CRUD operations are by an ID (key), and transactional integrity will be handled externally, if its needed._ 

The implementation does favor AWS Lambda runtime a bit. Not entirely purposeful but that is one of the places this makes the most sense. The exposed API makes use of promises instead of callbacks. 

# Getting Started
Install the AWS SDK, its been purposely omitted. Makes Lambda deploys smaller.
```javascript
    npm install aws-sdk --save-dev
```
Add the dependency.
```javascript
	npm install s3-db --save
```

Add the requirement with your configuration.

```javascript
   //For use within lambda (or serverless v1+), shortcut of just appname.
   const s3db = require('s3-db')('YOUR_APPNAME'); 
   //For non Lambda scenarios.
   const s3db = require('s3-db')({
      appname: 'YOUR_APPNAME',
	  region: 'us-west-2',
	  accessKeyId: 'YOUR_AWS_ACCESS_KEY_ID',
	  secretAccessKey: 'YOUR_AWS_SCRET_ACCESS_KEY'
   });    
    
```

# Examples
IMPORTANT: CURRENTLY, a list of records is not the actual records, a list of ID's. You can call get() after you've identified the one you want from the list. See https://bitbucket.org/sexycastle/s3-db/issues/4/optimistic-loading-on-list-of-records

List the current buckets, choose one, and list its contents.
```javascript
    s3db.list()
    	.then( results => results[0].get() ) //Select the first item from the results.
    	.then( bucket => bucket.list() )
    	.then( records => console.log("records",records) );
```

Create a record, load it, change it, save it, delete it. Not a very logical operation, but it demonstrates everything I want to demonstrate.

```javascript
	const users = s3db.bucketOf('users');
	const user = {name : 'Richard Cranium'} 
	users.save(user)
		.then( user => users.load(user.id) )
		.then( user => {
			user.size = 1234;
			user.sex = 'male';
			return users.save(user);
		})
		.then( user => users.delete(user.id) )
		.fail( error => console.error(error.stack)
```

# API
The API attempts to be as simple to understand as possible. If a function returns a promise, it is indicated with a rocket pointoing to a Q.

- **s3db.** 
    * **list() => Q**
	  List of the visible buckets, for the current configuration. Within the list you can use get() to return a '**bucket**' for that specific item.
    - **create('bucketName') => Q**
	  Creates a new '**bucket**', that will be visible to this configuration.
    - **bucket('bucketName') => Q (v1.0.11)**
	  Returns a specific '**bucket**' to interact with, wrapped in a promise.
    - **bucketOf('bucketName') => **
	  Returns a specific '**bucket**' to interact with.

- **bucket.** 
    - **list('startsWith') => Q** 
	  List of references pointing to the records within the bucket. Within a list, you can use next() to get the next back of records. You can also use get() to return a specific record in the list.
    - **load(id) => Q**
	  A specific record, with __meta further describing the file of the records origin.
    - **delete(id) => Q**
	  Erases a specific document.
    - **save({id:'xxx',...}) => Q**
	  Create or overwrite a specific record. The id attribute determines the underlying file name.

## Why S3?
Basically, S3 is incredibly cheap, has 2 9's of availability, 12 9s of resiliency, cross region replication and versioning. s3-db does not YET take advantage of either versioning or cross region replication.

## I'm from SQL
Welcome! Most everything is straight forward, think of this more as folders and files rather than tables and records. 

## Create and Update
_Logically these are the same operations._ s3-db does not currently make any attempt to know the state before the action is taken. See https://bitbucket.org/sexycastle/s3-db/issues/1/etag-collisions-on-save.

### __meta
Each record returned will have a \_\_meta attribute added to it which will contain extra properties that are specific to that document or bucket. A record will contain the s3 file attributes (eTag or file size) and/or Metadata. Similarly for a bucket, it will contain the tags. It is safe to reference this data, the __meta name is used to avoid naming collisions. _If you provide a property of your own with __meta on a record you are saving, it will be deleted or overwritten._


# Configurations

| Name | Description | Example |
| ------ | ------------------------------- | -------------------------------- |
| appname | Used in naming to keep your application unique. The default needs to be overridden. | { appname : 'app' } |
| environment | Used in naming to keep your application unique. Defaulted to process.env.AWS_LAMBDA_FUNCTION_VERSION for lambda, otherwise 'dev'. | { environment : 'dev' } |
| AWS credentials |  If you are not running this in an environment where AWS picks up your credentials automatically then you can set your access id and secret access key on the s3 object of the configuration. | { accessKeyId : 'YOUR ACCES ID', secretAccessKey : 'YOUR ACCESS KEY' } |
| region |  The default region is looked up in the environment at process.env.AWS\_REGION and then process.env.AWS\_DEFAULT_REGION (default in AWS Lambda). This can be overridden in the configuration within s3 via the region attribute. | {region : 'us-west2'} |
| s3.pageSize | Determines how many results will be returned, by default, for each list request on a bucket of records. The default value is 100. A value larger than 1000 will be ignored and likely result in a cap of 1000, since AWS imposes that limit. | { s3 : { pageSize : 100 } } |
| s3.allowDrop |  **To avoid accidental loss of data the default configuration does not allow buckets to be deleted.** To enable dropping of buckets through the API. | { s3 : { allowDrop: true } } |
| s3.file.spacer | By default each file is saved unformatted. If you want to add formatting (done via JSON.stringify) you need to pass in a spacing pattern. The below example will format each new indentation with a single tab. | { s3 : { file : { spacer: '\t' } } } |
| errorOnNotFound | Default value is false. If set, when a bucket or record is not found, the request will reject the promise | ```javascript {errorOnNotFound:true} ``` |

## ID's (advanced)

### Attirbute name.
You can change then name of the id attribute from the default of 'id' by setting the name attribute of the id configuration. The name must be JavaScript attribute friendly. The below changes the default to _id from id.
```javascript
	{  id : {  name: '_id' } }
```

### Generation
By default it uses a timestamp (new Date().getTime()) to create a unique ID that has a low chance of collision. You can change this to another function within the configuration.
```javascript
	{  id : {
	    generator : require('uuid').v4
	    generator : require('shortid').generate
	} }
```
### Bucket Names (advanced)
To keep bucket names unique, the name for each bucket created will have the appname environment and s3-db all prefixed to it. The default configuration creates a string using the following. 

	's3-db.' + appname + '.' + environment + '-'
	
To change it you can provide a new function in the configuration.

```javascript
	{ s3: { bucket : {
	      prefix: () => {
	      	... your logic here
	}  }  }  }
```

If you need a more complex name than the above or have pre-existing names you want to filter out that mistakenly match, you have 3 other functions that you can override. 
- name(name), is used to create a name using the prefix provided. 
- isOwned(fqn), is fed the full bucket name and used to check ownership, based on the name.
- parseName(fqn), should pull out the specific bucket/table/collection name of records that your application references.

```javascript
	{ s3: { bucket : {
	      name: (name) => {
	      	 return this.prefix() + name;
	      },
	      isOwned: (fqn) => {
	      	 return this.prefix().length === 0 || fqn.startsWith(this.prefix());
	      },
	      parseName: (fqn) => {
	        if(this.prefix().length > 0 ){
	          return fqn.substring(this.prefix().length);
	        } else {
	          return fqn;
	        }
	}  }  }  }
```

