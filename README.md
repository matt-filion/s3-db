s3-db
======

#### [Feedback Appreciated and Needed <==](https://bitbucket.org/sexycastle/s3-db/issues?status=new&status=open)

[API](#api) | [Examples](#examples) | [Permissions](#permissions) | [Configurations](#configurations) | [Release Notes](#release-notes)

Quick and simple database solution. Has all CRUD operations. Doesn't attempt to overcome the limitations of S3 like querying. Uses promises. Takes advantage of AWS Lambda runtime.

_s3-db is not intended to be a replacement for any sort of enterprise, full scale and fully functional database with transactional integrity and complex queries. Instead, its aimed at the simple scenarios where select and CRUD operations are by an ID (key), and transactional integrity will be handled externally, if its needed._

## Latest Update v1.0.21 <==
_API breakage_ again. Previously you could use s3db.bucketOf to get a bucket, and it would return a bucket which could be acted upon rather than a promise. Its no longer possible to do it this way. The configuration for the bucket must be loaded when the bucket is loaded.

You can now specify a settings object when creating a bucket. See [API](#api) for details. The summary configuration can give you access to additional fields beyond record id when calling list(). Also gives you access to .summary() which can be used to get summary record information, for scenarios when your record data can take a long time to load but only require a few attributes of information.  

A protection was also added to save, for records that are loaded from a list, so that list items don't end up overwriting the fully populated record. 

## Why S3?
Basically, S3 is incredibly cheap, has 2 9's of availability, 12 9s of resiliency, cross region replication and versioning. s3-db does not YET take advantage of either versioning or cross region replication. Its a pretty compelling database solution for a lot of application scenarios.

# Getting Started
Install the **AWS SDK**, its been purposely omitted.
```javascript
    npm install aws-sdk --save-dev
```

Add the **dependency**.
```javascript
	npm install s3-db --save
```

Add the requirement with your **[configuration](#configurations)**.

```javascript
   //For use within lambda (or serverless v1+)
   const s3db = require('s3-db')('YOUR_APPNAME'); 
   //For non Lambda scenarios.
   const s3db = require('s3-db')({
      appname: 'YOUR_APPNAME',
	  region: 'us-west-2',
	  accessKeyId: 'YOUR_AWS_ACCESS_KEY_ID',
	  secretAccessKey: 'YOUR_AWS_SCRET_ACCESS_KEY'
   });    
    
```

Finally, add the appropriate **[permissions](#permissions)** to the role or user. See the [permissions](#permissions) section below for what is required..

# Examples
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

# API
The API attempts to be as simple to understand as possible.

- **s3db.** 
    - **list(startsWith)**
	  List of the visible buckets.
    - **create('bucketName',configuration)**
	  Creates a new '**bucket**'. The table below outlines the possible configuration attributes.
      
     ```javascript

      
      {
		visibility:'private',// A direct map to the bucket ACL value. Possible values are private, public-read, public-read-write and authenticated-read.
		summary: ['name','age'] // Allows you to specify a few basic type (number, string boolean), root level attributes of a record. These records will then be loaded when .list() or .summary() is called on a bucket.
      }
      
      ```
    - **bucket('bucketName') (v1.0.11)**
	  Returns a specific '**bucket**' to interact with, wrapped in a promise.
    - **bucketOf('bucketName')**
	  Returns a specific '**bucket**' to interact with.
    - **delete('bucketName') || delete('bucketName') Q(v1.0.21)**
	  Deletes a specific '**bucket**', if the configuration allows an all records have been removed.


- **bucket.** 
    - **list('startsWith')** 
	  List of references pointing to the records within the bucket. Within a list, you can use hasNext and next() to get the next batch of records, if there are any. 
    - **load(id)**
	  A specific record.
    - **delete(id)**
	  Erases a specific record.
    - **save({id:'xxx',...})**
	  Create or overwrite a specific record. The id attribute determines the underlying file name. If omitted, an id is generated.
    - **summary(id) (v1.0.21)**
	  Returns the configured summary data for a record.


- **{record}. (v1.0.19)**
    - **reload() (v1.0.19)**
	  Reloads this record from S3.
    - **delete() (v1.0.19)**
	  Erases this record.
    - **save() (v1.0.19)**
	  Saves this record.

## Create and Update
_Logically these are the same operations._ If you enable collideOnMissmatch, then a failure can be caught when the underlying record has changed. See configuration for details.

# Permissions

_AWS Policy example._

```javascript

	{
        "Action": [
            "s3:ListBucket",
            "s3:ListAllMyBuckets",
            "s3:CreateBucket",
            "s3:PutBucketTagging",
            "s3:ListObject",
            "s3:DeleteObject",
            "s3:GetObject",
            "s3:PutObject"
        ],
        "Resource": "arn:aws:s3:::s3-db*",
        "Effect": "Allow"
    }

```

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

```

# Configurations

| Name | Description | default |
| ------ | ------------------------------- | -------------------------------- |
| appname | Used in naming to keep your application unique. The default needs to be overridden. | app |
| environment | Used in naming to keep your application unique. Defaulted to process.env.AWS_LAMBDA_FUNCTION_VERSION for lambda, otherwise 'dev'. | dev |
| AWS credentials |  If you are not running this in an environment where AWS picks up your credentials automatically then you can set your access id and secret access key on the s3 object of the configuration. | not specified |
| region |  The default region is looked up in the environment at process.env.AWS\_REGION and then process.env.AWS\_DEFAULT_REGION (default in AWS Lambda). This can be overridden in the configuration within s3 via the region attribute. | us-west-2 |
| pageSize | Determines how many results will be returned, by default, for each list request on a bucket of records. The default value is 100. A value larger than 1000 will be ignored and likely result in a cap of 1000, since AWS imposes that limit. | 100 |
| allowDrop |  **To avoid accidental loss of data the default configuration does not allow buckets to be deleted.** To enable, change the value to true, you will also need to make sure that your user has the S3 permission "s3:DeleteBucket". | false |
| errorOnNotFound | Default value is false. If set, when a bucket or record is not found, the request will reject the promise | false |
| onlyUpdateOnMD5Change | Each time a record is loaded, as it is serialized an md5 value is captured. On update, before serialization is pushed to S3, the saved MD5 value of the loaded record and the current md5 values are compared. Only if they are different, will a request to S3 be made to update he object. | true |
| collideOnMissmatch | Before a save is executed, a headObject request is done to see if the eTag on the record has been modified, and if the md5 is different, since it was loaded. If either are different, then the promise is rejected. The head check comes at a performance cost of the save operation, since a request must be made to S3 for the metInformation. Though it is not as high as getObject. | false |
| encryption | If you want to enable AES256 encryption for at rest storage of your docs | false |


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
	{ bucket : {
	      prefix: () => {
	      	... your logic here
	}  }  }
```

If you need a more complex name than the above or have pre-existing names you want to filter out that mistakenly match, you have 3 other functions that you can override. 
- name(name), is used to create a name using the prefix provided. 
- isOwned(fqn), is fed the full bucket name and used to check ownership, based on the name.
- parseName(fqn), should pull out the specific bucket/table/collection name of records that your application references.

```javascript
	{ bucket : {
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
	}  }  }
```

# Release Notes

## Update v1.0.19
Recently added a few more API's onto the returned records to allow easier promise chaining. No need to keep track of the bucket, as long as you have the record you will be able to .save(), .reload() or .delete() it.

record.list()_ for a list of records now returns an array decorated with an attribute hasMore, and optionally, a function next(). The next function will get the next records if there is more. This is an _API breakage_. No more object being returned with the contents within a 'results' attribute. Just an array you can immediately use.