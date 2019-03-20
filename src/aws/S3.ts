import * as AWS from 'aws-sdk'
import { Diacritics } from '../utils/Diacritics';
import { AWSError } from 'aws-sdk';
import { HeadObjectOutput, HeadObjectRequest, GetObjectRequest, GetObjectOutput } from 'aws-sdk/clients/s3';
import { Metadata } from 'aws-sdk/clients/appstream';
import { S3DBError } from '../model/S3DB';

/**
 * S3 object metadata to be attached to each object.
 */
export class S3Metadata {
  md5?: string;
  contentmd5?: string;
  collectionfqn?: string;
  collection?: string;
  size?: string;
  storageclass?: string;
  contentlength?: string;
  serversideencryption?: string;
  lastmodified?: Date;
  etag?: string;
  encryption?: string;
  version?: string;
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


export class S3Client {

  private s3: AWS.S3;

  constructor(region?: string, accessKeyId?: string, secretAccessKey?: string) {
    this.s3 = new AWS.S3({ apiVersion: '2006-03-01' });

    AWS.config.update({
      region: region,
      accessKeyId: accessKeyId,
      secretAccessKey: secretAccessKey
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
      .catch((error: AWSError) => new S3DBError(error.message));
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
    }
    return this.s3.getObject(parameters)
      .promise()
      .then((response: GetObjectOutput) => {
        if (response.Body) return new S3Object(response.Body.toString('utf-8'), this.buildS3Metadata(response))
        else return new S3DBError('not-found');
      })
      .catch((error: AWSError) => new S3DBError(error.message));
  }

  /**
   * Builds out the metadata used by S3DB to wrap a collection and behave
   * expectedly.
   * 
   * @param source of metadata.
   */
  private buildS3Metadata(source: HeadObjectOutput): S3Metadata {

    const metadata: S3Metadata = {
      storageclass: source.StorageClass,
      size: "" + source.ContentLength,
      contentlength: "" + source.ContentLength,
      lastmodified: source.LastModified,
      etag: source.ETag,
      encryption: source.ServerSideEncryption,
      serversideencryption: source.ServerSideEncryption,
      version: source.VersionId
    };

    const headMetadata: Metadata = source.Metadata || {};

    metadata.md5 = headMetadata['md5'];
    metadata.contentmd5 = headMetadata['contentmd5'];
    metadata.collectionfqn = headMetadata['collectionfqn'];
    metadata.collection = headMetadata['collection'];

    return metadata;
  }

  /**
   * 
   * Removes bad data from S3Metadata
   * 
   * @param metadata to clean.
   */
  private cleanObjectMetadata(metadata: S3Metadata): S3Metadata {
    return Object.keys(metadata)
      .filter((key: string) => metadata[key] !== undefined)
      .reduce((newMetadata: S3Metadata, key: string) => {
        if (newMetadata[key] !== undefined) {
          newMetadata[key] = Diacritics.remove('' + newMetadata[key]);
        }
        return newMetadata;
      }, {})
  }
}

new S3Client();