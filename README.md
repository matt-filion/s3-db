# Summary
===
Document database API wrapped around [AWS S3](https://aws.amazon.com/s3). It doesn't attempt to overcome the limitations of [AWS S3](https://aws.amazon.com/s3), such as querying.

[AWS S3](https://aws.amazon.com/s3) is incredibly cheap, has 2 9's of availability, 12 9s of resiliency, triggers via [AWS Lambda](https://aws.amazon.com/lambda/), cross region replication, versioning and pretty decent [Performance](./docs/Performance.md). Its a pretty compelling database solution for a lot of scenarios. A few other people agree, see [Pet Warden's blog](https://petewarden.com/2010/10/01/how-i-ended-up-using-s3-as-my-database/) and [this interesting solution](http://www.s3nosql.com.s3.amazonaws.com/infinitedata.html).

Note: _s3-db is not intended to be a replacement for anything in the ballpark of enterprise, full scale and fully functional database with transactional integrity and complex queries. Instead, its aimed at simple common scenarios around a known ID._

# Getting Started
Install dependencies and the s3-db module.

```
npm install aws-sdk --save-dev
npm install s3-db --save
```

Assuming your execution environment is [Lambda](https://aws.amazon.com/lambda/), or you have [AWS CLI](https://aws.amazon.com/cli/) configured locally (with all [AWS S3](https://aws.amazon.com/s3) permissions), just use it! Quick example of getting a user and setting the age on it. *If you do not have either of those, check out the [Configuration](./docs/Configuration.md) or [Examples](./docs/Examples.md) page*.

```javascript
   const database = require('s3-db')('database');
   const users    = database.getCollection('users');
   users.get('my-user')
    .then( user => {user.age = 32; return user})
    .then( user => user.save());
```

### Permissions

To setup the [AWS S3](https://aws.amazon.com/s3) permissions for exactly what is needed, here is the policy. "s3:DeleteBucket" has been omitted because it becomes much easier to delete a bucket with this solution and generally wont be needed in most cases. To delete buckets via this API you must update the Configuration and add the additional permission to the policy.

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

# API
Some changes have been made over the 1.0.X versions to simplify and embrace existing syntax where it exists.

## Database
Each instance of s3-db is a logical 'Database' instance.

| function | Description | Returns
| --- | ------------- | ----|
| ```getName()``` | Returns the name of the Database. | string |
| ```getCollectionNames()``` | Returns a name of all the [Collection](#markdown-header-collection)s identified in this Databases configured scope. | [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise) ( Array of string ) |
| ```getCollection('name-of')``` | Returns a [Collection](#markdown-header-collection) instance you can use to start interacting with the [Document](#markdown-header-document)'s in the [Collection](#markdown-header-collection) | [Collection](#markdown-header-collection) |
| ```createCollection('name-of')``` | Creates a new collection ([AWS S3](https://aws.amazon.com/s3) bucket) to start storing [Document](#markdown-header-document)s within. | [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)( [Collection](#markdown-header-collection) ) |
| ```dropCollection('name-of')``` | Assuming the Configuration and aws permissions permit it, it deletes an [AWS S3](https://aws.amazon.com/s3) bucket from the databases view. | [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)( {} ) |

## Collection
Used to create, lookup and delete [Document](#markdown-header-document)s.

| function | Description | Returns
| --- | ------------- | ----|
| ```getName()``` | Returns the name of the [Collection](#markdown-header-collection). | string |
| ```find('prefix')``` | Returns an Array of objects where the id start with the prefix provided. If the prefix is omitted then it just returns all document ids. Pagination is required to get through all of the documents as there is a hard AWS limit on 1000 names per request.<br> ```results.next()``` The Array is decorated with a convenience function to get the ```next()``` collection set (ONLY if there is more). <br>```results[0].getDocument()``` Each record returned is also decorated with a ```getDocument()``` function to load the underlying document. | [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)( Array of object) |
| ```getDocument('id')``` | Loads the [Document](#markdown-header-document) identified by the id. | [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)( [Document](#markdown-header-document) ) |
| ```deleteDocument('id')``` | Deletes the [Document](#markdown-header-document) identified by the id. | [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)( {} ) |
| ```saveDocument([Document](#markdown-header-document) or object) | Saves the state of an existing [Document](#markdown-header-document) or creates a [Document](#markdown-header-document) from an object provided. | [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)([Document](#markdown-header-document)) |

## Document
Each logical item returned is the same data stored, but decorated with some convenience methods.

| function | Description | Returns
| --- | ------------- | ----|
| ```isModified()``` | Checks to see if the underlying document has been changed (in [AWS S3](https://aws.amazon.com/s3)) since it was last loaded. It uses the document head and matching of the eTag and MD5 to determine if it was modified. | [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)( [Document](#markdown-header-document) ) or [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise).reject() |
| ```save()``` | Saves the state of the document. | [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)( [Document](#markdown-header-document) ) |
| ```refresh()``` | Discards any existing changes and reloads the underlying [Document](#markdown-header-document) | [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)( [Document](#markdown-header-document) ) |
| ```delete()``` | Deletes the underlying [AWS S3](https://aws.amazon.com/s3) document. | [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)( {} ) |
