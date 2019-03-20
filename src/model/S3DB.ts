/**
 * Possible points of configuration for the entirety of S3DB.
 */
export interface S3DBConfiguration {

  /**
   * Root name, used to distinguish s3db buckets names from other bucket names.
   */
  baseName?: string;

  /**
   * Logical stage that the runtime is executing within.
   */
  stage?: string;

  /**
   * Pattern used to create or look for the corresponding s3 bucket when
   * persisting an object.
   */
  bucketPattern?: string;

  /**
   * Region to look for buckets.
   */
  region?: string;
}

export class S3DBError extends Error {
}

/**
 * Simple decorator for feeding in a non default S3DB configuration.
 * 
 * Example:
 *    s3db({
 *       baseName: 'HappyCompanyDB',
 *       region: 'us-west-1',
 *       bucketPattern: '${stage}.${region}.${baseName}--${bucketName}'
 *    })
 * 
 * @param route for this function.
 */
export function s3db(configuration: S3DBConfiguration) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    return S3DB.update(configuration);
  }
}

/**
 * All configurations are referenced from here. It is the record of truth for 
 * the current state of the s3db Configuration.
 */
export class S3DB {

  private static configuration: S3DBConfiguration = S3DB.getDefault();

  private constructor() { }

  public static update(configuration: S3DBConfiguration): void {
    Object.assign(S3DB.configuration, configuration);
  }

  public static getCollectionFQN(name: string): string {
    //TODO Fill guts
  }

  /**
   * Default configurations when no configuration is provided. 
   * 
   * Values are pulled from the environment if they are available.
   */
  public static getDefault(): S3DBConfiguration {
    return {
      baseName: process.env['S3DB_ROOTNAME'] || 's3db',
      stage: process.env['S3DB_STAGE'] || 'dev',
      bucketPattern: process.env['S3DB_BUCKETPATTERN'] || '${stage}.${region}.${baseName}-${bucketName}',
      region: process.env['S3DB_REGION'] || process.env['AWS_DEFAULT_REGION'] || 'us-west-2'
    }
  }
}