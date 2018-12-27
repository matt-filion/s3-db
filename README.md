# Looking for Opinions!
This has been in reasonable use and helped a lot of projects but I have seen a shift, and myself have taken part in that shift, over to TypeScript. That, in combination with new knowledge based on experience, has me thinking about this projects future. I'd like to reduce or remove many of the manual points of intervention as being required and propose a more simplified API. However, I dont know everyones use cases, so please, share your opinion with me.

# Proposal
1. TypeScript first implementation.
1. Well communicated and reasonable defaults. Environment variable overrides for all values. Default module will be @s3-db/configuration-default, but should have additional modules such as @s3-db/configuration-secrets-manager and @s3-db/configuration-parameter-store that would have a cascading lookup strategy. A reasonable default will be established with each of these but it will be modifiable.
1. Modularized components to make it easier to override key aspects. All under the parent @s3-db/\*. For each child module, they will register themselves with the global s3-db instance. This should keep the work being done by the core @s3-db module minimized. All it has to do is look for all modules prefixed with @s3-db. Modules would look something like the following. **(still need to validate the viability of this)**
    ```
    import { ConfigurationFactory, ConfigurationProvider } from 's3-db';
    class DefaultS3DBConfiguration implements ConfigurationProvider {
       ...stuff
       init()
    }
    ConfigurationFactory.register(new DefaultS3DBConfiguration());
    ```
1. Utilize async/await to remove the 'necessity' of promises.
1. Decorators for the global definition of the s3-db instance.
    ```
    import { s3db, collection, Collection } from 's3-db';
    @s3db({
        config: 'values',
        go: 'here'
    })

    class SomeObject {
        private users:Collection<User>;
        constructor(@collection('users') collection:Collection){
            this.users = collection;
        }
        doAThing(event:APIGatewayEvent<User>,context:Context,callback:Callback): void{
            this.logger.debug('create() - ',event);
            const user:User = users.save(event.body)
            callback(null,{
                statusCode: 200,
                body: user
            });
        }
    }
    ```
1. A primitive simple validator (that can be easily overridden) to validate objects. @s3-db/validator
    ```
    import { key, required, } from 's3-db';

    class interface {
        @key
        key:string;
        
        @required
        name:string;
    }
    ```
1. Similarly for validation have a couple of serialization options. Each one with a default priority so that if multiple are included you end up with a chain @s3-db/serializer-json, @s3-db/serializer-zip, @s3-db/serializer-aes-256. Only @s3-db/serializer.json would be default. However, if you then included @s3-db/serializer-zip your files would be zipped before being persisted, rather than being flat JSON. If you added @s3-db/serializer-aes-256 it would sit between json and zip, to encrypt the file before it is saved. Will need to define a public interface so that it is easy to extend with additional options.
1. Move some of the 'bucket' type functions off of the document and onto the Collection.
1. Module for logging @s3-db/logging that will use a customized version of lamlog, but allow for a very easy updating of logging to an external framework with a simple wrapper.
1. A serverless plugin that would include the right modules, and include extra functionality to create s3 buckets appropriately and s3 permissions rather than having to update the serverless.yaml file. 
1. Modules for search @s3-db/search-default will use the s3 default pagination behavior. @s3-db/search-elastic-search would use an elastic search instance to lookup documenst and would not be limited to just startswith type searching. Maybe a @s3-db/search-s3-index would have some simplistic index it would maintain for low volume scenarios (10,000 or less docs), which would maintain an index that would be capable of regex based search. **Sorting?**
   ```
   interface DocumentSearch {
      find(query:string | RegExp, pageSize:number = 10, pageKey?:string, fields?:Array<string>):DocumentList<extends Document<any>>;
   }
   class DocumentReference{
      ...
   }
   class DocumentList extends Array<DocumentReference>{
      public readonly count:number;
      public readonly pageSize:number;
      public readonly pageKey:string;
   }
   ```


# Document DB API wrapper for AWS S3.
[AWS S3](https://aws.amazon.com/s3) is incredibly cheap, has 2 9's of availability, 12 9s of resiliency, triggers via [AWS Lambda](https://aws.amazon.com/lambda/), cross region replication, versioning and pretty decent [Performance](./docs/Performance.md). Its a pretty compelling database solution for a lot of scenarios. A few other people agree, see [Pet Warden's blog](https://petewarden.com/2010/10/01/how-i-ended-up-using-s3-as-my-database/) and [this interesting solution](http://www.s3nosql.com.s3.amazonaws.com/infinitedata.html).

# REFERENCE OF PREVIOUS API's BELOW HERE
------

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
