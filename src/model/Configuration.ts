import { Serialisation } from "./Serializers";
import { Validation } from "./Validation";
import { IsModified } from "./IsModified";

/**
 * Possible points of configuration for the entirety of S3DB.
 */
export interface DBConfiguration {

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

export interface CollectionConfiguration {

  /**
   * The name of the collection.
   */
  name: string;

  /**
   * How many results to return for each page during a find operation.
   * 
   * Default is 100.
   */
  pageSize?: number;

  /**
   * If set to true, then deleting will not be permitted on this bucket.
   * 
   * Default false.
   */
  disableDelete?: boolean;

  /**
   * The fuction to execute on each object before perseistance
   * is attempted.
   * 
   * By default there is no logic executed.
   */
  validator?: Validation;

  /**
   * Disables checking if an object is modified before persisting it.
   * 
   * Defaults to true.
   */
  checkIsModified?: boolean;

  /**
   * The logic to execute to detect if an existing record matches the current
   * record.
   * 
   * Only relavent if checkIsModified is set to true.
   */
  isModified?: IsModified;

  /**
   * How to serialize and de-seraialize objects when persisting them to S3 Buckets.
   */
  serialization?: Serialisation;

}

/**
 * All configurations are referenced from here. It is the record of truth for 
 * the current state of the s3db Configuration.
 */
export abstract class Configurations {

  private static configuration: DBConfiguration = Configurations.getDefault();

  private constructor() { }

  public static update(configuration: DBConfiguration): void {
    Object.assign(Configurations.configuration, configuration);
  }

  /**
   * Default configurations when no configuration is provided. 
   * 
   * Values are pulled from the environment if they are available.
   */
  public static getDefault(): DBConfiguration {
    return {
      baseName: process.env['S3DB_ROOTNAME'] || 's3db',
      stage: process.env['S3DB_STAGE'] || 'dev',
      bucketPattern: process.env['S3DB_BUCKETPATTERN'] || '${stage}.${region}.${baseName}-${bucketName}',
      region: process.env['S3DB_REGION'] || process.env['AWS_DEFAULT_REGION'] || 'us-west-2'
    }
  }
}