import { Logger, LoggerService } from '@mu-ts/logger'
import { CollectionConfigurationOptions } from './CollectionConfigurationOptions'
import { CollectionConfiguration } from './CollectionConfiguration'

export class CollectionRegistry {
  /**
   * Returns an instance of this object.
   */
  public static instance(): CollectionRegistry {
    if (!this._instance) this._instance = new CollectionRegistry()
    return this._instance
  }

  private static _instance: CollectionRegistry

  private logger: Logger
  private registry: Map<string, CollectionConfiguration>

  private constructor() {
    this.registry = new Map()
    this.logger = LoggerService.named('S3DB.CollectionRegistry')
    this.logger.debug('init()')
  }

  /**
   *
   * @param type to register the configuration under.
   * @param configuraiton to register.
   */
  public register(configuraiton: CollectionConfigurationOptions): void {
    this.logger.debug({ data: { configuraiton } }, `register(${configuraiton.id}) -->`)

    if (!configuraiton.id) configuraiton.id = configuraiton.name

    let existingConfiguration: CollectionConfiguration | undefined = this.registry.get(`${configuraiton.id}`)
    this.logger.debug({ data: { existingConfiguration } }, `register(${configuraiton.id}) -- existingConfiguration`)

    if (!existingConfiguration) {
      existingConfiguration = new CollectionConfiguration()
    }

    const configurationToUse: CollectionConfiguration = {
      ...existingConfiguration,
      ...configuraiton,
    }

    this.registry.set(`${configuraiton.id}`, configurationToUse)

    this.logger.debug({ data: { configurationToUse } }, `register(${configuraiton.id}) <-- `)
  }

  /**
   *
   * @param type to lookup the configuraiton for.
   */
  public resolve(type: string): CollectionConfiguration | undefined {
    this.logger.info(`resolve(${type}) -->`)
    const configuration: CollectionConfiguration | undefined = this.registry.get(`${type}`)
    this.logger.info({ data: { configuration } }, `resolve(${type}) <--`)
    return configuration
  }
}
