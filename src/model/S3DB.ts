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
  bucketPattern: string = process.env['S3DB_BUCKETPATTERN'] || '${stage}.${region}.${baseName}-${bucketName}';

  /**
   * Region to look for buckets.
   */
  region: string = process.env['S3DB_REGION'] || process.env['AWS_DEFAULT_REGION'] || 'us-west-2';
}

/**
 * All exceptions thrown by this library are reported under this type.
 */
export class S3DBError extends Error {
}

/**
 * All configurations are referenced from here. It is the record of truth for 
 * the current state of the s3db Configuration.
 */
export class S3DB {

  private static configuration: S3DBConfiguration = new S3DBConfiguration();

  private constructor() { }

  /**
   * 
   * @param configuration to update he default values with.
   */
  public static update(configuration: S3DBConfiguration): void {
    Object.assign(S3DB.configuration, configuration);
  }

  /**
   * 
   * @param name Of the collection to generate the FQN (Bucket name) for.
   */
  public static getCollectionFQN(name: string): string {
    return this.configuration.bucketPattern
      .replace('${stage}', this.configuration.stage)
      .replace('${region}', this.getRegion())
      .replace('${baseName}', this.configuration.baseName)
      .replace('${bucketName}', name)
  }

  /**
   * The currently configured region.
   */
  public static getRegion(): string {
    return S3DB.configuration.region || 'us-west-2';
  }
}