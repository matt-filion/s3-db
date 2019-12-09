import { Logger } from '@mu-ts/logger'
import { CollectionConfigurationOptions } from './CollectionConfigurationOptions'
import { CollectionConfiguration } from './CollectionConfiguration'
import { S3DB } from '../db'

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
    this.logger = S3DB.getRootLogger().child('CollectionRegistry')
    this.logger.debug('init()')
  }

  /**
   *
   * @param type to register the configuration under.
   * @param configuraiton to register.
   */
  public register(configuraiton: CollectionConfigurationOptions): void {
    this.logger.debug({ configuraiton }, `register(${configuraiton.id}) -->`)

    if (!configuraiton.id) configuraiton.id = configuraiton.name

    let existingConfiguration: CollectionConfiguration | undefined = this.registry.get(`${configuraiton.id}`)
    this.logger.debug({ existingConfiguration }, `register(${configuraiton.id}) -- existingConfiguration`)

    if (!existingConfiguration) {
      existingConfiguration = new CollectionConfiguration()
    }

    const configurationToUse: CollectionConfiguration = {
      ...existingConfiguration,
      ...configuraiton,
    }

    this.registry.set(`${configuraiton.id}`, configurationToUse)

    this.logger.debug({ configurationToUse }, `register(${configuraiton.id}) <-- `)
  }

  /**
   *
   * @param type to lookup the configuraiton for.
   */
  public resolve(type: string): CollectionConfiguration | undefined {
    this.logger.info(`resolve(${type}) -->`)
    const configuration: CollectionConfiguration | undefined = this.registry.get(`${type}`)
    this.logger.info({ configuration }, `resolve(${type}) <--`)
    return configuration
  }
}
