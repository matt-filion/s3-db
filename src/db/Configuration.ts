/**
 * Possible points of configuration for the entirety of S3DB.
 */
export class S3DBConfiguration {
  /**
   * Root name, used to distinguish s3db buckets names from other bucket names.
   */
  baseName: string = process.env['S3DB_ROOTNAME'] || 's3db';

  /**
   * Logical stage that the runtime is executing within.
   */
  stage: string = process.env['S3DB_STAGE'] || 'dev';

  /**
   * Pattern used to create or look for the corresponding s3 bucket when
   * persisting an object.
   */
  bucketPattern: string = process.env['S3DB_BUCKETPATTERN'] || '{{stage}}.{{region}}.{{baseName}}-{{bucketName}}';

  /**
   * Region to look for buckets.
   */
  region: string = process.env['S3DB_REGION'] || process.env['AWS_DEFAULT_REGION'] || 'us-west-2';
}
