import * as AWS from 'aws-sdk';
import { Metadata, HeadObjectOutput } from 'aws-sdk/clients/s3';
import { AWSError } from 'aws-sdk';
import { Diacritics } from '../utils/Diacritics';
import { CollectionConfiguration } from '../collection';
import { S3DB, S3DBError } from '../';
import { S3Metadata } from './S3Metadata';
import { Logger } from '@mu-ts/logger';

/**
 * Facade to AWS S3 APi's.
 */
export class S3Client {
  private logger: Logger;
  public s3: AWS.S3;

  constructor(parentLogger: Logger) {
    this.s3 = new AWS.S3({ apiVersion: '2006-03-01' });
    this.logger = parentLogger.child('S3Client');

    AWS.config.update({
      region: S3DB.getRegion(),
    });
  }

  /**
   * Builds out the metadata used by S3DB to wrap a collection and behave
   * expectedly.
   *
   * @param source of metadata.
   */
  public buildS3Metadata(source: HeadObjectOutput): S3Metadata {
    const metadata: S3Metadata = {
      StorageClass: source.StorageClass,
      ContentLength: source.ContentLength,
      LastModified: source.LastModified,
      ETag: JSON.parse(source.ETag || ''),
      ServerSideEncryption: source.ServerSideEncryption,
      VersionId: source.VersionId,
    };

    const headMetadata: Metadata = source.Metadata || {};

    metadata.ContentMD5 = headMetadata['ContentMD5'];
    metadata.collection = headMetadata['collection'];

    return metadata;
  }

  /**
   *
   * Removes bad data from S3Metadata
   *
   * @param metadata to clean.
   */
  public toAWSMetadata(metadata: S3Metadata): Metadata {
    if (!metadata) return {};
    return Object.keys(metadata)
      .filter((key: string) => metadata[key] !== undefined)
      .reduce((newMetadata: Metadata, key: string) => {
        newMetadata[key] = Diacritics.remove('' + metadata[key]);
        return newMetadata;
      }, {});
  }

  /**
   *
   * @param error thrown by AWS
   * @param bucket Being interacted with when the error was thrown.
   * @param key of the object being interacted with when the error was thrown.
   */
  public handleError(error: AWSError, bucket: string, key?: string): S3DBError {
    this.logger.debug(`handleError() for bucket:${bucket} key:${key}`, error);
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
