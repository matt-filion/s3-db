# Summary

Document database API wrapped around [AWS S3](https://aws.amazon.com/s3).

[AWS S3](https://aws.amazon.com/s3) is incredibly cheap, has 2 9's of availability, 12 9s of resiliency, triggers via [AWS Lambda](https://aws.amazon.com/lambda/), cross region replication, versioning and pretty decent [Performance](./docs/Performance.md). Its a pretty compelling database solution for a lot of scenarios. A few other people agree, see [Pet Warden's blog](https://petewarden.com/2010/10/01/how-i-ended-up-using-s3-as-my-database/) and [this interesting solution](http://www.s3nosql.com.s3.amazonaws.com/infinitedata.html).

# Getting Started
Install dependencies and the s3-db module.

```
npm install aws-sdk --save-dev
npm install s3-db --save
```

Assuming your execution environment is [Lambda](https://aws.amazon.com/lambda/), or you have [AWS CLI](https://aws.amazon.com/cli/) configured locally (with all [AWS S3](https://aws.amazon.com/s3) permissions), just use it! Quick example of getting a user and setting the age on it. 

```javascript
const Database = require('s3-db');
const database = new Database();
const users    = database.getCollection('users');
users.get('my-user')
  .then( user => {user.age = 32; return user} )
  .then( user => user.save() );
```

# Permissions

To setup the [AWS S3](https://aws.amazon.com/s3) permissions for exactly what is needed, here is the policy.

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

note: _"s3:DeleteBucket" has been omitted because it becomes much easier to delete a bucket with this solution and generally wont be needed in most cases. To delete buckets via this API you must update the Configuration and add the additional permission to the policy._

# API
Dot notation indicates the parent object where you can find the API call. The header of each section indicates the logical starting point for each API call.

## Database
```:JavaScript
const Database = require('s3-db');
const databse  = new Database();
....
```

* ```database.getName()``` :string - Returns the name of the Database.
* ```getCollectionNames()``` :[Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)<Array<string>> - Returns a name of all the [Collection](#markdown-header-collection)s identified in this Databases configured scope.
* ```getCollection('name-of')``` :[Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)<[Collection](#markdown-header-collection)> -  Returns a [Collection](#markdown-header-collection) instance you can use to start interacting with the [Document](#markdown-header-document)'s in the [Collection](#markdown-header-collection)
* ```createCollection('name-of')``` :[Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)<[Collection](#markdown-header-collection) > - Creates a new collection ([AWS S3](https://aws.amazon.com/s3) bucket) to start storing [Document](#markdown-header-document)s within. 
*```dropCollection('name-of')``` :[Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise) - Assuming the Configuration and aws permissions permit it, it deletes an [AWS S3](https://aws.amazon.com/s3) bucket from the databases view.


## Collection
```:JavaScript
const Database = require('s3-db');
const databse  = new Database();
database.getColletion('x')
  .then( collection => .... )
```

* ```getName()``` :string - Returns the name of the [Collection](#markdown-header-collection).
* ```find('prefix')``` : [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)<[DocumentList](#markdown-header-DocumentList)> - Returns all id's where the id start with the prefix provided. If the prefix is omitted then it just returns all document ids. Pagination is required to get through all of the documents as there is a hard AWS limit on 1000 names per request.
* ```getDocument('id')```:[Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)<[Document](#markdown-header-document)> - Loads the [Document](#markdown-header-document) identified by the id. 
* ```deleteDocument('id')```:[Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise) - Deletes the [Document](#markdown-header-document) identified by the id. 
* ```saveDocument([Document](#markdown-header-document) or Object)```:[Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)<[Document](#markdown-header-document)> - Saves the state of an existing [Document](#markdown-header-document) or creates a [Document](#markdown-header-document) from an object provided. 


## DocumentList
```:JavaScript
const Database = require('s3-db');
const databse  = new Database();
database.getColletion('x')
  .then( collection => collection.find() )
  .then( results => .... )
```

* ```results.next()```:[Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)<[DocumentList](#markdown-header-DocumentList)> - The next batch of results. This method will not exist if there is nothing left to iterate through.
* ```results.hasMore```:boolean - True, if there is more results to be returned.

## DocumentRef
```:JavaScript
const Database = require('s3-db');
const databse  = new Database();
database.getColletion('x')
  .then( collection => collection.find() )
  .then( results => results[0] )
  .then( documentRef => ... )
```

* ```documentRef.getDocument()```:[Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)<[Document](#markdown-header-document)> - Loads the corresponding document for this item in the DocumentList.
* ```documentRef.id```:string - The id of the document.

## Document
```:JavaScript
const Database = require('s3-db');
const databse  = new Database();
database.getColletion('x')
  .then( collection => collection.getDocument('x') )
  .then( document => .... )
```

* ```document.save()```:[Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)<[Document](#markdown-header-document)> - Saves the state of the document.
* ```document.refresh()```: [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)<[Document](#markdown-header-document)> -  Discards any existing changes and reloads the underlying [Document](#markdown-header-document).
* ```document.delete()```:[Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise) - Deletes the underlying [AWS S3](https://aws.amazon.com/s3) document.

note: _You may notice additional functions on each document instance, it is unwise to use thse as they are used by the framework itself and may change without notice._
