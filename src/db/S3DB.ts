import { S3DBConfiguration } from './Configuration';

/**
 * All configurations are referenced from here. It is the record of truth for
 * the current state of the s3db Configuration.
 */
export class S3DB {
  private static configuration: S3DBConfiguration = new S3DBConfiguration();

  private constructor() {}

  /**
   *
   * @param configuration to update he default values with.
   */
  public static update(configuration: {
    baseName?: string;
    stage?: string;
    bucketPattern?: string;
    region?: string;
  }): void {
    Object.assign(S3DB.configuration, configuration);
  }

  /**
   *
   * @param name Of the collection to generate the FQN (Bucket name) for.
   */
  public static getCollectionFQN(name: string): string {
    return this.configuration.bucketPattern
      .replace('{{stage}}', this.configuration.stage)
      .replace('{{region}}', this.getRegion())
      .replace('{{baseName}}', this.configuration.baseName)
      .replace('{{bucketName}}', name);
  }

  /**
   * The currently configured region.
   */
  public static getRegion(): string {
    return S3DB.configuration.region || 'us-west-2';
  }
}
