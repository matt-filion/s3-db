# Document database API wrapped around [AWS S3](https://aws.amazon.com/s3).

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
database.getCollection('users')
  .then( users => users.getDocument('my-user') )
  .then( user => {user.age = 32; return user} )
  .then( user => user.save() );
```

# Permissions

To setup the [AWS S3](https://aws.amazon.com/s3) permissions for exactly what is needed, here is the policy.

```javascript
  {
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "Stmt1506028208000",
            "Effect": "Allow",
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
            "Resource": [
                "arn:aws:s3:::s3-db*" //Needs to change if your db name changes.
            ]
        }
    ]
  }
```

note: _"s3:DeleteBucket" has been omitted because it becomes much easier to delete a bucket with this solution and generally wont be needed in most cases. To delete buckets via this API you must update the Configuration and add the additional permission to the policy._

# Latest (2.0)
The biggest changes here were under the covers and making the framework more configurable. 
* A lot more unit testing.
* Can now configure each collection independently.
* Can now add custom serializers.
* Every configuration can be overridden using environment variables (process.env);
* Much better coverage for Unit tests.
* Added a dependency on lamcfg, for the configuration capabilities.
* Added document copying and renaming.
* Added subCollection for easier managing of folders within a logical collection/bucket.
* Can configure your collection at the time it is used by passing in a second argument of collection specific configurations.
* Hook for validation of documents at the time of saving, updating and copying.

# API
Dot notation indicates the parent object where you can find the API call. The header of each section indicates the logical starting point for each API call.

## Database
```:JavaScript
const Database = require('s3-db');
const database  = new Database();
....
```

* ```database.getName()``` :string - Returns the name of the Database.
* ```getCollectionNames()``` :[Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)<Array<string>> - Returns a name of all the [Collection](#collection)s identified in this Databases configured scope.
* ```getCollection('name-of',config:object)``` :[Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)<[Collection](#collection)> - Returns a [Collection](#collection) instance you can use to start interacting with the [Document](#document)'s in the [Collection](#collection). Optionally, you can provided the configuration specific to this collection such as id genration.
* ```createCollection('name-of')``` :[Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)<[Collection](#collection) > - Creates a new collection ([AWS S3](https://aws.amazon.com/s3) bucket) to start storing [Document](#document)s within. 
*```dropCollection('name-of')``` :[Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise) - Assuming the Configuration and aws permissions permit it, it deletes an [AWS S3](https://aws.amazon.com/s3) bucket from the databases view.


## Collection
```:JavaScript
const Database = require('s3-db');
const databse  = new Database();
database.getCollection('x',{id:{propertyName:'name'}})
  .then( collection => .... )
```

* ```getName()``` :string - Returns the name of the [Collection](#collection).
* ```find('prefix')``` : [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)<[DocumentList](#DocumentList)> - Returns all id's where the id start with the prefix provided. If the prefix is omitted then it just returns all document ids. Pagination is required to get through all of the documents as there is a hard AWS limit on 1000 names per request.
* ```getDocument('id')```:[Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)<[Document](#document)> - Loads the [Document](#document) identified by the id. 
* ```deleteDocument('id')```:[Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise) - Deletes the [Document](#document) identified by the id. 
* ```saveDocument([Document](#document) or Object, Object )```:[Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)<[Document](#document)> - Saves the state of an existing [Document](#document) or creates a [Document](#document) from an object provided. The second argument is a single level document of the metadata to attach to the document.
* ```copy([Document](#document),newId:string)```:[Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)<[Document](#document)> - Creates a copy of the provided document, either with the ID provided, or a new ID generated using the id generator of the collection.
* ```subCollection(name:string)```:[Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)<[Collection](#collection) > - Creates a collection that will logically name itself within the parent collection using S3's folder alias's (IE using slashes "/".)
* ```getHead('id')```:[Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)<Object> - Returns the metadata of the object without returning the document.
* ```exists('id')```:[Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)<boolean> - Checks to see if the document exists in S3, without loading the document.


## DocumentList
```:JavaScript
const Database = require('s3-db');
const databse  = new Database();
database.getColletion('x')
  .then( collection => collection.find() )
  .then( results => .... )
```

* ```results.next()```:[Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)<[DocumentList](#DocumentList)> - The next batch of results. This method will not exist if there is nothing left to iterate through.
* ```results.hasMore```:boolean - True, if there is more results to be returned.

## DocumentRef
```:JavaScript
const Database = require('s3-db');
const databse  = new Database();
database.getColletion('x')
  .then( collection => collection.find() )
  .then( results => results[0] )
  .then( documentRef => documentRef.getDocument() )
  .then( document => {
    document.value = 'change';
    return document.save();
  })
```

* ```documentRef.getDocument()```:[Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)<[Document](#document)> - Loads the corresponding document for this item in the DocumentList.
* ```documentRef.id```:string - The id of the document.

## Document
```:JavaScript
const Database = require('s3-db');
const databse  = new Database();
database.getColletion('x')
  .then( collection => collection.getDocument('x') )
  .then( document => {
    document.value = 'change';
    return document.save();
  })
```

* ```document.save()```:[Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)<[Document](#document)> - Saves the state of the document.
* ```document.refresh()```:[Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)<[Document](#document)> -  Discards any existing changes and reloads the underlying [Document](#document).
* ```document.delete()```:[Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise) - Deletes the underlying [AWS S3](https://aws.amazon.com/s3) document.
* ```document.copyTo([Collection](#collection),'newId')```:[Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise) - Copies the document to the target [Collection](#collection). Optionally, you can specify the new ID of the document that will be created, or when its excluded, it will use the id generation of the target collection.
* ```document.rename()```:[Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)<[Document](#document)> - Changes the name of the underlying [AWS S3](https://aws.amazon.com/s3) document.
* ```document.getHead()```:[Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)<Object> - Gets the underlying metadata for the document, from S3.
* ```document.getMetadata()```:<Object> - Gets the 'current' metadata of the object. Does not do a check against S3.

note: _You may notice additional functions on each document instance, it is unwise to use thse as they are used by the framework itself and may change without notice._
