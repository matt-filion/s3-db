## [Main Docs](../README.md)

# Configurations
The configurations have been re-done as a part of 2.0. Many items are not backwards compatable, outside of the basics, but everything is now overridable via environment variables. Though, it should be noted, that in cases where the configuration is a function, defining it as an environment variable will break. All environment variables are converted to strings.

The configurations are purposely friendly to serverless.com framework, so all variables can be easily defined in serverless.yml under process.environment and easily overridden with each deployment.

## Example
```|JSON
{
  db: {
    name: 'string',
    environment: 'string',
    namePattern: '${db.name}.${db.environment}-${name}', // name is passed in, db.* comes from the configuration.
    allowDrop: false
  },
  provider: {
    name: 'aws-s3',
    region: 'us-west-2',
    accessKeyId: 'key',
    secretAccessKey: 'secret'
  },
  collections: {
    default: {
      id: {
        //Passing in the document is new with 2.0
        generator: document => {/* logic to generate the doc id */},
        propertyName: 'id'
      },
      onlyUpdateOnMD5Change: true,
      collideOnMissmatch: false,
      errorOnNotFound: false,
      encryption: true,
      pageSize: 100
    },
    users: {
      id: {
        propertyName: 'mobilePhone'
      },
      pageSize: 1000
    }
  },
  serializer: {
    serialize: data => {},
    deserialize: data => {},
  }
}

```

## Overrides
You can override configurations in one of two ways, as an argument to the database instance, or as process.env properties.

Example showing the configuration argument to the database instance.
```|JavaScript
const Database = require('s3-db');
const database = new Database({
  db: {
    name: 'super-duper'
  },
  collections: {
    users: {
      pageSize: 500
    }
  }
})
```

Example showing process.env overrides.
```|JavaScript

process.env['db_name'] = 'super-duper';
process.env['collections_users_pageSize'] = 500;

const Database = require('s3-db');
/*
 * At the time of creation, the configurations will be read from process.env.
 *  For some configurations, the value can be changed on the fly, but it is
 *  not done intentionally, so I would not rely on it.
 */
const database = new Database();
```

Example showing overrides, but via ```serverless.yml```
```|yml
service: super-service

provider:
  name: aws
  runtime: nodejs4.3
  region: us-west-2
  environment:
    db_name: super-duper
    collections_users_pageSize: 500
```

## Reference
To make the configuration a bit easier to read, since tables render so unreliable across git and npmjs, each configuration is referenced in dot notation.

#### Database
* **db.name** (process.env: db_name or S3DB_NAME, default: 's3-db') Sets the name for the logical database. 
* **db.environment** (process.env: db_environment or STAGE or AWS_LAMBDA_FUNCTION_VERSION, default: 'dev'). 
* **db.namePattern** (process.env: db_namePattern, default: '${db.name}.${db.environment}-${name}') Sets the naming convention for each bucket. _The ${name} variable must always be at the end._ Feeds into the naming of each bucket, and to determine 'ownership' of a bucket for the database. In the case of ownership, the pattern is used with an empty string for name, and bucket name that ```startsWith``` the resulting value, is considered owned by the logical database
* **db.allowDrop** (process.env: db_allowDrop, default: false) If true, the code will attempt to execute collection drops (bucket deletes). Additional permissions will likely have to be added to allow this.

#### Provider
Only allows AWS. Have not seen a request or interest for anything else yet.
* **provider.region** (process.env: provider_region or AWS_DEFAULT_REGION, default: 'us-east-1') Sets the region where the buckets will be looked for.
* **provider.accessKeyId** (process.env: provider_accessKeyId) Not needed for [Lambda](https://aws.amazon.com/lambda/) or [serverless.com](http://serverless.com). Not needed if [AWS CLI](https://aws.amazon.com/cli/) has been configured. 
* **provider.secretAccessKey** (process.env: provider_secretAccessKey) Not needed for [Lambda](https://aws.amazon.com/lambda/) or [serverless.com](http://serverless.com). Not needed if [AWS CLI](https://aws.amazon.com/cli/) has been configured. 

#### Collections
For each of these configurations, the 'default' value can be changed out for the collection name you wish to override the value for. This will give you collection specific configurations. See the above example, the 'users' child underneat 'collections' is an example of a collection specific configuration. The name is the name for the collection, not the bucket name, the name as the logical database instance knows the collection by.
* **collections.default.id.propertyName** (process.env: collections_default_id_propertyName, default: 'id') The attribute on the document to use as the key for the document.
* **collections.default.id.generator** (default: UUID) If no id is populated on a document as its being saved, this is the logic that will be used to generate the id. The function that is used to generate the id will recieve the document as an argument. 
* **collections.default.onlyUpdateOnMD5Change** (process.env: collections_default_onlyUpdateOnMD5Change, default: true) By default, a requested update to a document, such as a call to document.save() will only invoke a call to S3 if a change to the document is detected. Setting this value to false, will ensure an update is sent to S3 even if the document itself was not determined to be modified.
* **collections.default.collideOnMissmatch** (process.env: collections_default_collideOnMissmatch, default: false) Some primitive missmatch detection using the eTag on the document and MD5 value matching. This makes a call to S3 for the 'header' information of a document during update to do this verification. Each time a document is updated in S3 the MD5 is stored under a tag so that a fetch of the entire document is not necessary to do this detection. 
* **collections.default.encryption** (process.env: collections_default_encryption, default: true) Tells S3 to encrypt each document it stores, using the default encryption.
* **collections.default.pageSize** (process.env: collections_default_pageSize, default: 100) The maximum number of documents to return when doing a find() operation. S3 limits this to being no greater than 1000.
