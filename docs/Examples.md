## [Main Docs](../README.md)

# [Serverless.com](http://serverless.com)
I use [serverless.com](http://serverless.com) for quite a bit of my development and it also happens to be the best way to take advantage of some of the additional S3 features like triggers off an S3 bucket. The combination of these s3-db and [serverless.com](http://serverless.com) makes for some incredibly rapid data centric development.

## Use Case
The use case for this example is having a private [Collection](../README.md#markdown-header-collection) that when updated, triggers a lambda function to grab a snippet from the file then copy to a collection that is publicly accessible.

**1. Setup serverless**

```
npm install serverless -g
sls create --template aws-nodejs
```

**2. Add Dependencies**

```
npm install aws-sdk --save-dev
npm install s3-db --save
```

**3. Permissions**

Set the permissions to the role that your [AWS Lambda](https://aws.amazon.com/lambda/) functions will be invoked using. This grants all permissions for reading and creating [Collection](../README.md#markdown-header-collection)s, and all CRUD operations for [Document](../README.md#markdown-header-document). It omits the ability to delete collections. *The resource path on the permissions contains the database name. So if you change the default, you will have to update the permission statement as well.*

```yml
service: your-special-service-name
provider:
  ...
  stage: labs
  environment:
    S3DB_NAME: simple-app
    STAGE: ${self:provider.stage}
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
           - - "arn:aws:s3:::${self:provider.environment.S3DB_NAME}*"
  ...
```

**4. Declare Your Databases**

Rather than relying on ```Database.createCollection('name-of')``` within [serverless.com](http://serverless.com) it makes sense to delegate this off to the [serverless.com](http://serverless.com) configuration, as it becomes a part of the overall cloud formation definition for this logical application.

```yml
resources:
 Resources:
   UserS3Bucket:
     Type: AWS::S3::Bucket
     Properties:
       BucketName: ${self:provider.environment.S3DB_NAME}.${self:provider.environment.STAGE}-userProfile
```

**5. Declare Your Functions **

We will have two functions. One that will act as the primary application. It could be invoked by another [AWS Lambda](https://aws.amazon.com/lambda/) function, respond to an  [AWS SNS](https://aws.amazon.com/sns/) topic or an API gateway call. However, all of these examples will be omitted in an effort towards simplification.

```yml
functions:
  primary:
    handler: handler.primary
  trigger:
    handler: handler.trigger
    events:
      - s3:
          bucket: ${self:provider.environment.APP_NAME}.${self:provider.environment.STAGE}-users
          event: s3:ObjectCreated:*
```

*Note: Because bucket triggers have rules on prefix and postfix of the key, you could have multiple triggers on the same bucket do different tasks for the same file as long as it was renamed each time the process completed.*

**6. The Code**

Simple example of work being done and using S3. This code will only run proeprly within aws lambda or serverless.

```javascript
const Database    = require('s3-db');
const database    = new Database();

module.exports.primary = (event, context, callback) => {
  /* body is a string attribute when the trigger is API gateway. */
  const request = JSON.parse(event.body);
  /* Pretend a bunch of amazing validation is going on, for this super complex use case.*/
  const user = {
    name: request.name,
    secretNickName: 'Non Pub',
    age: request.age
  }
  /* Save the user to the collection, which contains the trigger */
  database.getCollection('users')
    .then( users => users.save(user) )
    .then( user => callback(null,{updateOk:user}) )
    .catch( callback )
}

module.exports.trigger = (event, context, callback) => {
  let userProfile;
  database.getCollection('users')
    .then( users => users.getDocument(event.Records[0].s3.object.key) )
    .then( user => {
      userProfile = {
        id: user.id,
        name: user.name,
      }
    })
    .then( () => database.getCollection('userProfiles') )
    /* Save the file to the public bucket */
    .then( userProfiles => userProfiles.save(userProfile) )
    .then( userProfile => callback(null,{updateOk:userProfile}) )
    .catch( callback )
}
```

# Code Examples
List the current collections, choose one, and list its contents. You wouldn't want to do this with a collection that has a ton of documents. It would likely overload the stack or event queue.
```javascript
const Database = require('s3-db');
const database = new Database();

database.getCollectionNames()
	.then( names => database.getCollection(names[0]) )
	.then( collection => collection.find() )
	.then( documentReferences => documentReferences.map( documentReference => documentReference.getDocument() ))
	.then( promises => Promise.all(promises) )
  .then( documents => documents.forEach( console.log ) );
```

Create a record, load it, change it, save it, delete it. Not a very logical operation, but it demonstrates everything I want to show.

```javascript
const Database = require('s3-db');
const database = new Database();
const user     = {name : 'Richard Cranium'};

database.getCollection('users')
  .then( users => users.save(user ))
	.then( user => {
		user.size = 1234;
		user.sex  = 'male';
		return user;
	})
	.then( user => user.save() )
	.then( user => {
		user.size = 122345;
		user.sex  = 'female';
		return user;
	})
	.then( user => user.refresh() )
	.then( user => user.delete() )
	.catch( error => console.error(error.stack) )
```
