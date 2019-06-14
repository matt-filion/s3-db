import { S3DBConfiguration } from './Configuration'
import { Logger, LoggerService, LogLevelString } from '@mu-ts/logger'

/**
 * All configurations are referenced from here. It is the record of truth for
 * the current state of the s3db Configuration.
 */
export class S3DB {
  /**
   *
   * @param configuration to update he default values with.
   */
  public static update(configuration: { baseName?: string; stage?: string; bucketPattern?: string; region?: string }): void {
    this.logger.info({ data: { configuration } }, 'update() configuration with -->')
    Object.assign(this.configuration, configuration)
    this.logger.info({ data: { configuration: this.configuration } }, 'update() updated configuration is <--')
  }

  /**
   * Returns the root logger, namespaced with 'S3DB'.
   */
  public static getRootLogger(): Logger {
    return this.logger
  }

  /**
   *
   * @param level to set the default log level for all logging instances.
   */
  public static setLogLevel(level: LogLevelString): void {
    this.logger.level(level)
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
      .replace('{{bucketName}}', name)
  }

  /**
   * The currently configured region.
   */
  public static getRegion(): string {
    return this.configuration.region || 'us-west-2'
  }

  private static configuration: S3DBConfiguration = new S3DBConfiguration()
  private static logger: Logger = LoggerService.named('S3DB')

  private constructor() {}
}
