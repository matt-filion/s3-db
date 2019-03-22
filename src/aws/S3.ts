import * as AWS from 'aws-sdk'
import * as crypto from 'crypto';
import { Diacritics } from '../utils/Diacritics';
import { AWSError } from 'aws-sdk';
import { HeadObjectOutput, HeadObjectRequest, GetObjectRequest, GetObjectOutput, PutObjectRequest } from 'aws-sdk/clients/s3';
import { Metadata } from 'aws-sdk/clients/appstream';
import { S3DBError, S3DB } from '../model/S3DB';
import { DeleteObjectResponse, PutObjectResponse } from 'aws-sdk/clients/mediastoredata';
import { CollectionConfiguration } from '../model/Collection';

/**
 * S3 object metadata to be attached to each object.
 */
export class S3Metadata {
  collection?: string;
  VersionId?: string;
  LastModified?: Date;
  StorageClass?: string;
  ContentLength?: string;
  ContentMD5?: string;
  ContentType?:string;
  ServerSideEncryption?: string;
  ETag?: string;
  [key: string]: string | Date | undefined;
}

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
  private configuration:CollectionConfiguration;

  constructor(configuration:CollectionConfiguration) {
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
  public getObjectHead(bucket: string, key: string): Promise<S3Metadata | S3DBError> {
    const parameters: HeadObjectRequest = {
      Bucket: bucket,
      Key: key
    }
    return this.s3.headObject(parameters)
      .promise()
      .then((response: HeadObjectOutput) => this.buildS3Metadata(response))
      .catch((error: AWSError) => this.handleError(error, bucket, key));
  }

  /**
   * 
   * @param bucket to load the object from.
   * @param key of the object to load, within the bucket.
   */
  public getObject(bucket: string, key: string): Promise<S3Object | S3DBError> {
    const parameters: GetObjectRequest = {
      Bucket: bucket,
      Key: key
    };
    return this.s3.getObject(parameters)
      .promise()
      .then((response: GetObjectOutput) => {
        if (response.Body) return new S3Object(response.Body.toString('utf-8'), this.buildS3Metadata(response));
        else return new S3DBError('not-found');
      });
  }

  /**
   * 
   * @param bucket to delete the object from.
   * @param key of the object to delete.
   */
  public deleteObject(bucket:string, key:string): Promise<undefined | S3DBError> {
    const parameters: GetObjectRequest = {
      Bucket: bucket,
      Key: key
    };
    return this.s3.deleteObject(parameters)
      .promise()
      .then( (response: DeleteObjectResponse) =>{
        if (response) return undefined;
        else return this.handleError(response, bucket, key);
      });
  }

  /**
   * 
   * @param bucket to save the document into.
   * @param key that the document will recieve.
   * @param body of the document to save.
   * @param metadata of the document.
   */
  public saveObject(bucket:string, key:string, body:string, metadata:S3Metadata): Promise<S3Object | S3DBError> {
    const conentLength: number = Buffer.byteLength(body, 'utf8');
    const contentType: string = metadata.ContentType ? ''+metadata.ContentType : 'application/json';
    const params: PutObjectRequest = {
      Bucket: bucket,
      Key: key,
      StorageClass: metadata.StorageClass,
      ContentType: contentType,
      ContentLength: conentLength,
      ContentMD5: this.md5Hash(body),
      Body: body
    };
    
    if(metadata){
      params.Metadata = this.toAWSMetadata(metadata);
    }

    if(this.configuration.serversideencryption) params.ServerSideEncryption = 'AES256';

    return this.s3.putObject(params)
      .promise()
      .then((response:PutObjectResponse) => {
        if(response) {
          metadata.ContentMD5 = response.ContentSHA256;
          metadata.StorageClass = response.StorageClass;
          metadata.ETag = response.ETag;
          return new S3Object(body, this.buildS3Metadata(response))
        }
        else return this.handleError(response, bucket, key);
      })
  }

  /**
   * 
   * @param body to create an MD5 for.
   */
  public md5Hash(body:string):string {
    return crypto.createHash('md5').update( body ).digest('base64');
  }

  /**
   * 
   * Removes bad data from S3Metadata
   * 
   * @param metadata to clean.
   */
  private toAWSMetadata(metadata: S3Metadata): Metadata {
    return Object.keys(metadata)
      .filter((key: string) => metadata[key] !== undefined)
      .reduce((newMetadata: Metadata, key: string) => {
        if (newMetadata[key] !== undefined) {
          newMetadata[key] = Diacritics.remove('' + newMetadata[key]);
        }
        return newMetadata;
      }, {})
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
      ContentLength: "" + source.ContentLength,
      LastModified: source.LastModified,
      ETag: source.ETag,
      ServerSideEncryption: source.ServerSideEncryption,
      VersionId: source.VersionId
    };

    const headMetadata: Metadata = source.Metadata || {};

    metadata.ContentMD5 = headMetadata['ContentMD5'];
    metadata.collection = headMetadata['collection'];

    return metadata;
  }

  /**
   * 
   * @param error thrown by AWS
   * @param bucket Being interacted with when the error was thrown.
   * @param key of the object being interacted with when the error was thrown.
   */
  private handleError(error: AWSError, bucket:string, key:string): S3DBError {
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