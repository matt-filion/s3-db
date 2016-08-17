s3-db
======

#### [Feedback Appreciated and Needed](https://bitbucket.org/sexycastle/s3-db/issues?status=new&status=open)

[API](#api) | [Examples](#examples) | [Configurations](#configurations)

Quick and simple data storage solution. Has most CRUD operations but does't not attempt to overcome the natural limitations of S3 like querying or insert collisions.

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
    const s3db = require('s3-db')({
	  appname: 'app',
	  environment: 'dev',
	  region: 'us-west-2', //Omit if in Lambda and want to use Lambda's region
	  accessKeyId: 'YOUR_AWS_ACCESS_KEY_ID', //Omit if in Lambda
	  secretAccessKey: 'YOUR_AWS_SCRET_ACCESS_KEY' //Omit if in Lambda
	});
```
# API
The API attempts to be as simple to understand as possible. If a function returns a promise, it is indicated with a rocket pointoing to a Q.

- **s3db.** 
    * **list() => Q**
	  List of the visible buckets, for the current configuration. Within the list you can use get() to return a '**bucket**' for that specific item.
    - **create('bucketName') => Q**
	  Creates a new '**bucket**', that will be visible to this configuration.
    - **bucketOf('bucketName') => Q (v1.0.9)**
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
Basically, S3 is incredibly cheap, has 2 9's of availability, 12 9s of resiliency, cross region replication and versioning. This does not YET take advantage of either versioning or cross region replication. Generally, this makes for a very compelling solution to a simple scenario where performance does matter.

## I'm from SQL
Welcome! Most everything is straight forward, think of this more as folders and files rather than tables and records. 

When documentation says bucket or collection, associate it to a table.
When documentation says record or document, associate that to a row in a table.

## Create and Update
_Logically these are the same operations._ This does not make any attempt to know the state before the action is taken. If you specify an ID that already exists, the document will be blindly overwritten with your new record. Have to have a good naming convention for your id's or ensure you maintain a good reference. For example, if your application has an authentication service, you would store a detailed profile record in an ID that was stored on that external authentication service. This way there is nothing to figure out, just a retrieval of known data.

### __meta
Each record returned will have a \_\_meta attribute added to it which will contain extra properties that are specific to that document or bucket. In the case of a document it will contain the file attributes or Metadata attached to that doc within AWS s3, in addition to basic attributes like eTag or file size. Similarly for a bucket, it will contain the tags. It is safe to reference this data, the __meta name is used to avoid naming collisions. _If you provide a property of your own with __meta on a record you are saving, it will be deleted or overwritten._

# Examples

__*IMPORTANT: CURRENTLY, a list of records is not the actual records, but pointers to the records. You will need to call get() on the specific record after you've identified the one you want from the list. Will likely be the next item to fix. Haven't decided to solve it with a proxy, or optimistic loading ([feedback](https://bitbucket.org/sexycastle/s3-db/issues?status=new&status=open)
).*__

List the current buckets, choose one, and list its contents.
```javascript
    s3db.list()
    	.then(function(results){
    		return results[0].get()
    	})
    	.then(function(bucket){
    		return bucket.list();
    	})
    	.then(function(records){
    		console.log("records",records);
    	});
```

## Create a record, load it, change it, save it, delete it.
Clearly a very logical operation, but it demonstrates everything I want to communicate at the moment.

```javascript
	const users = s3db.bucketOf('users');
	const user = {name : 'Richard Cranium'} 
	users.save(user)
		.then(function(user){
			return users.load(user.id)
		})
		.then(function(user){
			user.size = 1234;
			user.sex = 'male';
			return users.save(user);
		})
		.then(function(user){
		    return users.delete(user.id);
		})
		.fail(function(error){
		    console.error(error.stack);
		})
```

# Configurations

| Name | Description | Example |
| ------ | ------------------------------- | -------------------------------- |
| appname | Used in naming to keep your application unique. The default needs to be overridden. | { appname : 'app' } |
| environment | Used in naming to keep your application unique. The default needs to be overridden. | { environment : 'dev' } |
| AWS credentials |  If you are not running this in an environment where AWS picks up your credentials automatically then you can set your access id and secret access key on the s3 object of the configuration. | { accessKeyId : 'YOUR ACCES ID', secretAccessKey : 'YOUR ACCESS KEY' } |
| region |  The default region is looked up in the environment at process.env.AWS\_REGION and then process.env.AWS\_DEFAULT_REGION (default in AWS Lambda). This can be overridden in the configuration within s3 via the region attribute. | {region : 'us-west2'} |
| s3.pageSize | Determines how many results will be returned, by default, for each list request on a bucket of records. The default value is 100. A value larger than 1000 will be ignored and likely result in a cap of 1000, since AWS imposes that limit. | { s3 : { pageSize : 100 } } |
| s3.allowDrop |  **To avoid accidental loss of data the default configuration does not allow buckets to be deleted.** To enable dropping of buckets through the API. | { s3 : { allowDrop: true } } |
| s3.file.spacer | By default each file is saved unformatted. If you want to add formatting (done via JSON.stringify) you need to pass in a spacing pattern. The below example will format each new indentation with a single tab. | { s3 : { file : { spacer: '\t' } } } |

## ID's (advanced)

### Attirbute name.
You can change then name of the id attribute from the default of 'id' by setting the name attribute of the id configuration. The name must be JavaScript attribute friendly. The below changes the default to _id from id.
```javascript
	{  id : {  name: '_id' } }
```

### Generation
By default we use https://www.npmjs.com/browse/keyword/uuid to create a unique ID that has a low chance of collision. You can change this to another function within the configuration.
```javascript
	{  id : {
	    generator : function(){..your logic here}
	} }
```
### Bucket Names (advanced)
To keep bucket names unique, the name for each bucket created will have the appname environment and s3-db all prefixed to it. The default configuration creates a string using the following. 

	's3-db.' + appname + '.' + environment + '-'
	
To change it you can provide a new function in the configuration.

```javascript
	{ s3: { bucket : {
	      prefix: function(){
	      	... your logic here
	}  }  }  }
```

If you need a more complex name than the above or have pre-existing names you want to filter out that mistakenly match, you have 3 other functions that you can override. 
- name(name), is used to create a name using the prefix provided. 
- isOwned(fqn), is fed the full bucket name and used to check ownership, based on the name.
- parseName(fqn), should pull out the specific bucket/table/collection name of records that your application references.

```javascript
	{ s3: { bucket : {
	      name: function(name){
	      	 return this.prefix() + name;
	      },
	      isOwned: function(fqn){
	      	 return this.prefix().length === 0 || fqn.startsWith(this.prefix());
	      },
	      parseName: function(fqn) {
	        if(this.prefix().length > 0 ){
	          return fqn.substring(this.prefix().length);
	        } else {
	          return fqn;
	        }
	}  }  }  }
```

