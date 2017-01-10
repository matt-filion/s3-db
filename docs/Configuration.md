# Configurations

All of the available configurations to change the underlying behavior of s3-db. One of the primary goals is to keep the amount of out of the box configuration minimal, so where possible reasonable defaults have been established.

There is also a lot of potential for friendly usage along side of [serverless.com][2], so some environment properties have been added in to make it possible to avoid having to do any configuration of the s3-db module before you use it.

| Name |        Description      | default |
| ------ | ------------------------------------------- | ----- |
| db | Used in naming to keep your allocated buckets uniquely grouped to different application spaces. | process.env.S3DB_NAME or 's3-db' |
| environment | Keeps different application environments unique from one another. | process.env.AWS_LAMBDA_FUNCTION_VERSION or 'dev' |
| pageSize | Determines how many results will be returned when calling on a collection find(). A value larger than 1000 will be ignored and likely result in a cap of 1000, since AWS imposes that limit. | 100 |
| allowDrop | A code restriction keeping Database.deleteCollection(). You will also need to make sure that your user has the S3 permission "s3:DeleteBucket". | false |
| errorOnNotFound | Allows you to receive a Promise.reject instead of empty Promise.resolve when a document is not found. | false |
| onlyUpdateOnMD5Change | By default, a requested update to a document, such as a call to document.save() will only invoke a call to S3 if a change to the document is detected. Setting this value to false, will ensure an update is sent to S3 even if the document itself was not modified.| true |
| collideOnMissmatch |  Some primitive missmatch detection using the eTag on the document and MD5 value matching. This makes a call to S3 for the 'header' information of a document during update to do this verification. Each time a document is updated in S3 the MD5 is stored under a tag so that a fetch of the  entire document is not necessary to do this detection. <br> If you want to be optimistic about the sanitation of your transactions or don't care about background updates being overwritten, you can set this value to false and gain a slight performance boost on updates/creates of documents. | false |
| encryption | If you want to enable AES256 encryption for at rest storage of your docs | false |

## Provider Configurations (AWS)
Generally you don't need to make any changes to this section. The defaults will suffice, the one exception is that you will have to make sure you are using the right region, though

| Name | Description | default |
| ------ | ------------------------------- | -------------------------------- |
| provider.region | Defines where to locate the AWS S3 buckets.<br> **Note: Previously defaulted to us-west-2.** | process.env.AWS\_DEFAULT_REGION or 'us-east-1' |
| provider.name | The name of the provider. No need to change this. Eventually want to provide a local provider to help with local development speeds. | 'aws-s3' |
| provider.accessKeyId | Not needed for [Lambda](3) or [serverless.com](2). Not needed if [AWS CLI](1) has been configured. | null |
| provider.secretAccessKey | Not needed for [Lambda](3) or [serverless.com](2). Not needed if [AWS CLI](1) has been configured. | null |

## ID's (advanced)
This section defines what key will be used when storing each document. In cases where no ID is found on the document being saved, it also contains the logic for how the ID will be generated.

| Name | Description | Default |
| ------ | ------------------------------- | -------------------------------- |
| id.propertyName | The value on the document to use as the key for the S3 Object. | 'id' |
| id.generator | A generator to ensure that the keys are always unique, when an id is not provided. Generally an external library should be used to create a [UUID](4) rather than fall back on this. However I did not want to bundle another library so this primitive implementation stands as a place holder. | ``` ${configuration.db}-${configuration.environment}-${new Date().getTime()} ``` |


### Attirbute name.
You can change then name of the id attribute from the default of 'id' by setting the name attribute of the id configuration. The name must be JavaScript attribute friendly. The below changes the default to \_id from id.
```javascript
{  id : {  propertyName: '_id' } }
```

### Generation
By default it uses a small UUID snippet taken from https://gist.github.com/jed/982883 to create a unique ID that has a low chance of collision. You can change this to another function within the configuration. Currently this is a global configuration. Will change to a Collection specific one in the near future.

```javascript
{  id: { generator: require('shortid').generate } }
```

## Collection (advanced)

| Name | Description |
| ------ | ------------------------------- | -------------------------------- |
| collection.name | Pattern dictating the naming convention for each bucket. |
| collection.isOwned | Function determining if the full bucket name qualifies as being owned by the current database configuration. |
| collection.parseName | Parses out the original collection name from the full bucket name. |

To keep bucket names unique, the name for each bucket created will have the appname environment and s3-db all prefixed to it. The default configuration creates a string using the following.

configuration.db + . + configuration.environment + . + collectionName

```javascript
{ collection : {
  /*
   * How each S3 collection will be named.
   */
  name: name  => `${configuration.db}.${configuration.environment}.${name}`,
  /*
   * Used to determine if the current database and environment owns the
   *  s3 collection.
   */
  isOwned: fqn => fq.startsWith(configuration.collection.name('')),
  /*
   * Parses the s3 collection fqn to get the name familiar to the application.
   */
  parseName: fqn => fqn.substring(configuration.collection.name('').length)
} }
```

[1](https://aws.amazon.com/cli/)
[2](https://serverless.com/)
[3](https://aws.amazon.com/lambda/)
[4](https://www.npmjs.com/package/uuid)
