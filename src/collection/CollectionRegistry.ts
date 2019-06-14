import { Logger } from '@mu-ts/logger'
import { S3DB } from '../db'
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
    this.logger = S3DB.getRootLogger().child({ child: 'CollectionRegistry' })
    this.logger.debug('init()')
  }

  /**
   *
   * @param type to register the configuration under.
   * @param configuraiton to register.
   */
  public register(configuraiton: CollectionConfigurationOptions): void {
    this.logger.debug({ data: { configuraiton } }, `register(${configuraiton.name}) -->`)

    let existingConfiguration: CollectionConfiguration | undefined = this.registry.get(`${configuraiton.name}`)
    if (!existingConfiguration) {
      existingConfiguration = new CollectionConfiguration()
    }

    const configurationToUse: CollectionConfiguration = {
      ...existingConfiguration,
      ...configuraiton,
    }

    this.registry.set(`${configuraiton.name}`, configurationToUse)

    this.logger.debug({ data: { configurationToUse } }, `register(${configuraiton.name}) <-- `)
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
