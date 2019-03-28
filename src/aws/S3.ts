import * as AWS from 'aws-sdk';
import { Diacritics } from '../utils/Diacritics';
import { HeadObjectOutput, HeadObjectRequest, GetObjectRequest, GetObjectOutput, PutObjectRequest, ListObjectsV2Request, ListObjectsV2Output, Object } from 'aws-sdk/clients/s3';
import { Metadata } from 'aws-sdk/clients/appstream';
import { S3DBError, S3DB } from '../model/S3DB';
import { DeleteObjectResponse, PutObjectResponse } from 'aws-sdk/clients/mediastoredata';
import { CollectionConfiguration } from '../model/Collection';
import { MD5IsModified } from '../model/IsModified';
import { AWSError } from 'aws-sdk';

/**
 * S3 object metadata to be attached to each object.
 */
export class S3Metadata {
  collection?: string;
  VersionId?: string;
  StorageClass?: string;
  ContentMD5?: string;
  ContentType?: string;
  ServerSideEncryption?: string;
  ContentLength?: number;
  LastModified?: Date;
  ETag?: string;
  Key?: string;
  [key: string]: number | string | Date | undefined;
}

/**
 * Wrapper around a list of object metadata.
 */
export class S3MetadataList extends Array<S3Metadata> {
  private continuationToken?: string;
  private hasMore: boolean;
  private pageSize: number;
  private totalCount: number;
  constructor(continuationToken?: string, hasMore?: boolean, pageSize?: number, totalCount?: number) {
    super();
    this.continuationToken = continuationToken;
    this.hasMore = hasMore || false;
    this.pageSize = pageSize || 100;
    this.totalCount = totalCount || 0;
  }
  public getConinuationToken(): string | undefined {
    return this.continuationToken;
  }
  public getHasMore(): boolean {
    return this.hasMore;
  }
  public getPageSize(): number {
    return this.pageSize;
  }
  public getTotalCount(): number {
    return this.totalCount;
  }
}

/**
 * Wrapper around an object stored in S3.
 */
export class S3Object {
  private metadata: S3Metadata;
  private body: string;
  constructor(body: string, metadata: S3Metadata) {
    this.metadata = metadata;
    this.body = body;
  }

  public getMetadata(): S3Metadata {
    return this.metadata;
  }

  public getBody(): string {
    return this.body;
  }
}

/**
 * Facade to AWS S3 APi's.
 */
export class S3Client {

  private s3: AWS.S3;
  private configuration: CollectionConfiguration;

  constructor(configuration: CollectionConfiguration) {
    this.s3 = new AWS.S3({ apiVersion: '2006-03-01' });
    this.configuration = configuration;

    AWS.config.update({
      region: S3DB.getRegion()
    });
  }

  /**
   * 
   * @param bucket to load the object head from.
   * @param key to of the object to load t he head of.
   */
  public async getObjectHead(bucket: string, key: string): Promise<S3Metadata> {
    try {
      
      const parameters: HeadObjectRequest = {
        Bucket: bucket,
        Key: key
      };
      const response: HeadObjectOutput = await this.s3.headObject(parameters).promise();
      return this.buildS3Metadata(response);

    } catch(error) {
      throw this.handleError(error, bucket, key);
    }
  }

  /**
   * Listing documents is where S3 begins to fall on its face for this implementation. This
   * is a lazy but good enough solution for small collections of documents.
   * 
   * @param bucket to list objects
   * @param prefix of the objects to list.
   * @param pageSize for each page of documents.
   * @param continuationToken to continue from, if this is not the first page of documents.
   */
  public async listObjects(bucket: string, prefix?: string, pageSize?: number, continuationToken?: string): Promise<S3MetadataList> {
    try {

      const parameters: ListObjectsV2Request = {
        Bucket: bucket,
        Prefix: prefix,
        MaxKeys: pageSize || 100,
        FetchOwner: false,
        ContinuationToken: continuationToken
      };
      const response: ListObjectsV2Output = await this.s3.listObjectsV2(parameters).promise();
      const list: S3MetadataList = new S3MetadataList(
        response.NextContinuationToken, 
        response.IsTruncated, 
        response.MaxKeys, 
        response.KeyCount
      );

      if (response.Contents) response.Contents.forEach((s3Object: Object) => list.push(<S3Metadata>{
        Key: s3Object.Key,
        LastModified: s3Object.LastModified,
        ETag: s3Object.ETag,
        ContentLength: s3Object.Size
      }));

      return list;

    } catch(error) {
      throw this.handleError(error, bucket);
    }
  }

  /**
   * 
   * @param bucket to load the object from.
   * @param key of the object to load, within the bucket.
   */
  public async getObject(bucket: string, key: string): Promise<S3Object> {
    try {
      const parameters: GetObjectRequest = {
        Bucket: bucket,
        Key: key
      };
      const response: GetObjectOutput = await this.s3.getObject(parameters).promise();

      if (!response.Body) throw new S3DBError('not-found');
      
      return new S3Object(response.Body.toString('utf-8'), this.buildS3Metadata(response));

    } catch(error ) {
      throw this.handleError(error, bucket, key);
    };
  }

  /**
   * 
   * @param bucket to delete the object from.
   * @param key of the object to delete.
   */
  public async deleteObject(bucket: string, key: string): Promise<undefined> {
    try {

      const parameters: GetObjectRequest = {
        Bucket: bucket,
        Key: key
      };
      const response: DeleteObjectResponse = await this.s3.deleteObject(parameters).promise();

      return undefined;

    } catch(error) {
      throw this.handleError(error, bucket, key);
    };
  }

  /**
   * 
   * @param bucket to save the document into.
   * @param key that the document will recieve.
   * @param body of the document to save.
   * @param metadata of the document.
   */
  public async saveObject(bucket: string, key: string, body: string, metadata: S3Metadata): Promise<S3Object> {
    try {
      const conentLength: number = Buffer.byteLength(body, 'utf8');
      const contentType: string = metadata.ContentType ? '' + metadata.ContentType : 'application/json';
      const params: PutObjectRequest = {
        Bucket: bucket,
        Key: key,
        StorageClass: metadata.StorageClass,
        ContentType: contentType,
        ContentLength: conentLength,
        ContentMD5: MD5IsModified.md5Hash(body),
        Metadata: this.toAWSMetadata(metadata),
        Body: body
      };

      if (this.configuration.serversideEncryption) params.ServerSideEncryption = 'AES256';

      const response: PutObjectResponse = await this.s3.putObject(params).promise();
      
      if (!response) throw this.handleError(response, bucket, key);

      const responseMetadata: S3Metadata = Object.assign(this.buildS3Metadata(response),this.toAWSMetadata(metadata));
      
      responseMetadata.ContentMD5 = response.ContentSHA256;
      responseMetadata.StorageClass = response.StorageClass;
      responseMetadata.ETag = JSON.parse(response.ETag || '');
      responseMetadata.ContentMD5 = MD5IsModified.md5Hash(body);
      responseMetadata.ContentLength = conentLength;

      return new S3Object(body, responseMetadata);

    } catch( error ) {
      throw this.handleError(error, bucket, key);
    };
  }

  /**
   * 
   * Removes bad data from S3Metadata
   * 
   * @param metadata to clean.
   */
  private toAWSMetadata(metadata: S3Metadata): Metadata {
    if(!metadata) return {};
    return Object.keys(metadata)
      .filter((key: string) => metadata[key] !== undefined)
      .reduce((newMetadata: Metadata, key: string) => {
        newMetadata[key] = Diacritics.remove(''+metadata[key]);
        return newMetadata;
      }, {});
  }

  /**
   * Builds out the metadata used by S3DB to wrap a collection and behave
   * expectedly.
   * 
   * @param source of metadata.
   */
  private buildS3Metadata(source: HeadObjectOutput): S3Metadata {

    const metadata: S3Metadata = {
      StorageClass: source.StorageClass,
      ContentLength: source.ContentLength,
      LastModified: source.LastModified,
      ETag: JSON.parse(source.ETag || ''),
      ServerSideEncryption: source.ServerSideEncryption,
      VersionId: source.VersionId
    };

    const headMetadata: Metadata = source.Metadata || {};

    metadata.ContentMD5 = headMetadata['ContentMD5'];
    metadata.collection = headMetadata['collection'];

    return metadata;
  }

  //TODO Implement COPY
  // copyDocument: (sourceFQN,sourceId,sourceETag,destinationFQN,destinationId) => {
  //   const params = {
  //     Bucket: bucketName(destinationFQN),
  //     Key: getId(destinationFQN,destinationId),
  //     CopySource:`${bucketName(sourceFQN)}${getId(sourceFQN,sourceId)}`,
  //     MetadataDirective: 'COPY'
  //   };
  //   if(getCollectionConfig(request.fqn).get('encryption',true)) params.ServerSideEncryption = 'AES256';
  //   if(sourceETag) params.CopySourceIfMatch = sourceETag;
  //   return s3.copyObject(params).promise();
  // },

  /**
   * 
   * @param error thrown by AWS
   * @param bucket Being interacted with when the error was thrown.
   * @param key of the object being interacted with when the error was thrown.
   */
  private handleError(error: AWSError, bucket: string, key?: string): S3DBError {
    switch (error.code) {

      case 'NoSuchBucket':
        return new S3DBError(`${bucket} is not a valid bucket or is not visible/accssible.`);

      case 'NoSuchKey':
        return new S3DBError(`not-found`);

      default:
        return new S3DBError(error.message);
    }
  }
}