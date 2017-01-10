s3-db
======

## [Feedback Appreciated](https://bitbucket.org/sexycastle/s3-db/issues?status=new&status=open)
Open an issue here https://bitbucket.org/sexycastle/s3-db/issues?status=new&status=open.

# Summary

Document database API wrapped around Amazon S3. Doesn't attempt to overcome the limitations of S3 like querying.

S3 is incredibly cheap, has 2 9's of availability, 12 9s of resiliency, triggers via [Lambda](3), cross region replication and versioning. Its a pretty compelling database solution for a lot of application scenarios. A few other people agree, see [Pet Warden's blog](https://petewarden.com/2010/10/01/how-i-ended-up-using-s3-as-my-database/) and [this interesting solution](http://www.s3nosql.com.s3.amazonaws.com/infinitedata.html).

### What its not
s3-db is not intended to be a replacement for anything in the ballpark of enterprise, full scale and fully functional database with transactional integrity and complex queries. Instead, its aimed at simple common scenarios around a known ID.

# Getting Started
Install dependencies and the s3-db module.

```
    npm install aws-sdk --save-dev
    npm install s3-db --save
```

Assuming your execution environment is [Lambda](3), or you have [AWS CLI](1) configured locally (with all S3 permissions), just use it! Quick example of getting a user and setting the age on it. *If you do not have either of those, check out the [Configuration] or [Examples] page*.

```javascript
   const database = require('s3-db')('database');
   const users    = database.getCollection('users');
   users.get('my-user')
    .then( user => {user.age = 32; return user})
    .then( user => user.save());
```

## Permissions

To setup the AWS S3 permissions for exactly what is needed, here is the policy.

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
        "Resource": "arn:aws:s3:::s3-db*", //Neesd to change if your db name changes.
        "Effect": "Allow"
    }

```
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

# API
Some changes have been made over the 1.0.X versions to simplify things a touch. There are 3 objects to care about, database, collection and document. A database is a collection of collections (s3 buckets) logically grouped together for a singular purpose.

## Database
Each instance of s3-db is a logical 'Database' instance, hence the -db in s3-db... :-)

| function | Description | Returns
| --- | ------------- | ----|
| ```getName()``` | Returns the name of the Database. | string |
| ```getCollectionNames()``` | Returns a name of all the Collections identified in this Databases configured scope. | Promise ( Array of Strings ) |
| ```getCollection('name-of')``` | Returns a Collection instance you can use to start interacting with the Document's in the Collection | Collection |
| ```createCollection('name-of')``` | Creates a new collection (s3 bucket) to start storing Documents within. | Promise( Collection ) |
| ```dropCollection('name-of')``` | Assuming the Configuration and aws permissions permit it, it deletes an S3 bucket from the databases view. | Promise( {} ) |

## Collection
Used to create, lookup and delete Documents.

| function | Description | Returns
| --- | ------------- | ----|
| ```getName()``` | Returns the name of the Collection. | string |
| ```find('prefix')``` | Returns an Array of documents where the key's start with the prefix. If the prefix is omitted then it just returns all documents. Pagination is required to get through all of the documents as there is a hard AWS limit on 1000 names per request.<br> ```results.next()``` The Array is decorated with a convenience function to get the ```next()``` collection set (ONLY if there is more). <br>```results[0].getDocument()``` Each record returned is also decorated with a ```getDocument()``` function to load the underlying document. | Promise( Array of String) |
| ```getDocument('id')``` | Loads the Document identified by the id. | Promise( Document ) |
| ```deleteDocument('id')``` | Deletes the Document identified by the id. | Promise( {} ) |
| ```saveDocument(Document or object) | Saves the state of an existing Document or creates a Document from an object provided. | Promise(Document) |

## Document
Each logical item returned is the same data stored, but decorated with some convenience methods.

| function | Description | Returns
| --- | ------------- | ----|
| ```isModified()``` | Checks to see if the underlying document has been changed (in S3) since it was last loaded. It uses the document head and matching of the eTag and MD5 to determine if it was modified. | Promise( Document ) or Promise.reject() |
| ```save()``` | Saves the state of the document. | Promise( Document ) |
| ```refresh()``` | Discards any existing changes and reloads the underlying Document | Promise( Document ) |
| ```delete()``` | Deletes the underlying s3 document. | Promise( {} ) |

[1](https://aws.amazon.com/cli/)
[2](https://serverless.com/)
[3](https://aws.amazon.com/lambda/)
