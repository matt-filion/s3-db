import { S3DBConfiguration } from './Configuration';
import { Logger, ConsoleLogger, LogLevel } from '@mu-ts/logger';

/**
 * All configurations are referenced from here. It is the record of truth for
 * the current state of the s3db Configuration.
 */
export class S3DB {
  private static configuration: S3DBConfiguration = new S3DBConfiguration();
  private static logger: Logger = new ConsoleLogger('S3DB');
  private constructor() {}

  /**
   *
   * @param configuration to update he default values with.
   */
  public static update(configuration: { baseName?: string; stage?: string; bucketPattern?: string; region?: string }): void {
    S3DB.logger.info('update() configuration with -->', configuration);
    Object.assign(S3DB.configuration, configuration);
    S3DB.logger.info('update()ed configuration is-->', S3DB.configuration);
  }

  /**
   * Returns the root logger, namespaced with 'S3DB'.
   */
  public static getRootLogger(): Logger {
    return S3DB.logger;
  }

  /**
   *
   * @param level to set the default log level for all logging instances.
   */
  public setLogLevel(level: LogLevel): void {
    S3DB.logger.setLevel(level);
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

  /**
   *
   * @param level to set logging to.
   */
  public static setLogLevel(level: LogLevel) {
    S3DB.logger.setLevel(level);
  }
}
