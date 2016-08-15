# A simple DB Solution
This is not intended to be a replacement for any sort of enterprise, full scale and fully functional database with transactional integrity and complex queries. Instead, its aimed at the simple scenarios where select and CRUD operations are by an ID (key) and transactional integrity will be handled externally, if its needed. 

The implementation does favor AWS Lambda runtime a bit. Not entirely purposeful but that is one of the places this makes the most sense. Its a fast, easy to setup solution, for an application that needs to get running quickly, then require little to no maintenance. Keep in mind, that while all of this is true, S3 does offer some pretty compelling performance and availability. Some of the available behavior like versioning and cross region replication further extends the availability and its general competition against other hosted solutions.
 
_Keep in mind, however, that cross region replication and versioning have not yet been incorporated into this solution._

# Promises
Everything has been promisized, this is so far, the best way to handle the asynchronous behavior. I'll look into adding synchronous type API's later if there is a demand for it.

# Why S3?

S3 Availability

S3 Pricing

S3 Scalability

S3 Replication

S3 Versions

# I'm from SQL
Welcome! Most everything is straight forward, think of this more as folders and files rather than tables and records. 

When documentation says bucket or collection, associate it to a table.
When documentation says record or document, associate that to a row in a table.

# Create and Update
Logically these are the same operations. There is no previously known state before the action is taken. This means that if you specify an ID that already exists, the document will be blindly overwritten with your new record. So you have to have a good naming convention for your id's or you need to ensure you maintain a good reference. For example, if your application has an authentication service, you would store a detailed profile record in an ID that was stored on that external authentication service. This way there is nothing to figure out, just a retrieval of known data.

# Setup

1\. Add the dependency.

	npm install s3-db
 
2\. Set the configuration
 
	const s3dbConfiguration = {
	  appname: 'app',
	  environment: 'dev',
	  region: 'us-west-2', //Omit if in Lambda and want to use Lambda's region
	  accessKeyId: 'YOUR_AWS_ACCESS_KEY_ID', //Omit if in Lambda
	  secretAccessKey: 'YOUR_AWS_SCRET_ACCESS_KEY' //Omit if in Lambda
	}

3\. Add the requirement in your code

    const s3db = require('s3-db')(s3dbConfiguration);
    
4\. Use it! Look at the examples for common scenarios.
 
# Examples

## Create a new Table/Collection/Bucket

	const users = s3db.create('users');

## List the current Tables/Collections/Buckets and list its contents.
Generally you aren't going to go through the list method to find a bucket you need. 

__*IMPORTANT: CURRENTLY, a list of records is not the actual records, but pointers to the records. You will need to load the underlying record to get at its data after you've identified the one you want from the list. Will likely be the next item to fix. Haven't decided to solve it with a proxy, or optimistic loading.*__

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

## Create a record in a created bucket
When your record saves, and it does not currently have an id attribute, one will be added to it. 

	const users = s3db.bucketOf('users');
	const user = {name : 'Richard Cranium'} 
	users.save(user);

## Load a record, change it, save it, delete it.
Clearly a very logical operation, but it demonstrates everything I want to communicate at the moment.

	const users = s3db.bucketOf('users');
	users.load('1234')
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

# Deleting a bucket.
To avoid accidental loss of data the default configuration does not allow buckets to be deleted. If you do want this behavior, scroll down below to the configuration section and look for the allowDrop section.

# __meta
Each record returned will have a \_\_meta attribute added to it which will contain extra properties that are specific to that document or bucket. In the case of a document it will contain the file attributes or Metadata attached to that doc within AWS s3, in addition to basic attributes like eTag or file size. Similarly for a bucket, it will contain the tags. It is safe to reference this data, the __meta name is used to avoid naming collisions. 

_If you provide a property of your own with __meta on a record you are saving, it will be deleted or overwritten._

# Configurations

### Appname
Used in naming to keep your application unique. The default needs to be overridden.

	{
      appname : 'app'
	}

### Environment
Used in naming to keep your application unique. The default needs to be overridden.

	{
      environment : 'dev'
	}


### AWS Credentials
If you are not running this in an environment where AWS picks up your credentials automatically then you can set your access id and secret access key on the s3 object of the configuration.

	{
	  accessKeyId : 'YOUR ACCES ID',
	  secretAccessKey : 'YOUR ACCESS KEY'
	}

### Region
The default region is looked up in the environment at process.env.AWS\_REGION and then process.env.AWS\_DEFAULT_REGION (default in AWS Lambda). This can be overridden in the configuration within s3 via the region attribute.

	{
      region : 'us-west2'
	}

### pageSize
Determines how many results will be returned, by default, for each list request on a bucket of records. The default value is 100. A value larger than 1000 will be ignored and likely result in a cap of 1000, since AWS imposes that limit.

	{
	  s3 : {
	    pageSize : 100
	  }
	}

### allowDrop
To enable dropping of buckets through the API.

	{
	  s3 : {
	    allowDrop: true
	  }
	}
	
### ID's (advanced)

#### Attirbute name.
You can change then name of the id attribute from the default of 'id' by setting the name attribute of the id configuration. The name must be JavaScript attribute friendly. The below changes the default to _id from id.

	{
	  id : {
	    name: '_id'
	  }
	}

#### Generation
By default we use https://www.npmjs.com/browse/keyword/uuid to create a unique ID that has a low chance of collision. You can change this to another function within the configuration.

	{
	  id : {
	    generator : function(){..your logic here}
	  }
	}

### Bucket Names (advanced)
To keep bucket names unique, the name for each bucket created will have the appname environment and s3-db all prefixed to it. The default configuration creates a string using the following. 

	's3-db.' + appname + '.' + environment + '-'
	
To change it you can provide a new function in the configuration.

	{
	  s3: {
	    bucket : {
	      prefix: function(){
	      	... your logic here
	      }
	    }
	  }
	}

If you need a more complex name than the above or have pre-existing names you want to filter out that mistakenly match, you have 3 other functions that you can override. 
- name(name), is used to create a name using the prefix provided. 
- isOwned(fqn), is fed the full bucket name and used to check ownership, based on the name.
- parseName(fqn), should pull out the specific bucket/table/collection name of records that your application references.

	{
	  s3: {
	    bucket : {
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
	      }
	    }
	  }
	}

### Formatting saved files (advanced)
By default each file is saved unformatted. If you want to add formatting (done via JSON.stringify) you need to pass in a spacing pattern. The below example will format each new indentation with a single tab.

	{
	  s3 : {
	    file : {
	      spacer: '\t'
	    }
	  }
	}


