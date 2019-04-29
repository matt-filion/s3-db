import { CollectionConfiguration, CollectionConfigurationOptions } from './Configuration';
import { Logger, ConsoleLogger } from '@mu-ts/logger';
import { ConfigurationOptions } from 'aws-sdk/lib/config';

export class CollectionRegistry {
  private static _instance: CollectionRegistry;

  private logger: Logger;
  private registry: Map<string, CollectionConfiguration>;

  private constructor() {
    this.registry = new Map();
    this.logger = new ConsoleLogger('CollectionRegistry');
    this.logger.debug('init()');
  }

  /**
   * Returns an instance of this object.
   */
  public static instance(): CollectionRegistry {
    if (!this._instance) this._instance = new CollectionRegistry();
    return this._instance;
  }

  /**
   *
   * @param type to register the configuration under.
   * @param configuraiton to register.
   */
  public register(configuraiton: CollectionConfigurationOptions): void {
    this.logger.info(`register(${configuraiton.name}) -->`, configuraiton);
    let existingConfiguration: CollectionConfiguration | undefined = this.registry.get(`${configuraiton.name}`);
    if (!existingConfiguration) {
      existingConfiguration = new CollectionConfiguration();
    }
    const configurationToUse: CollectionConfiguration = Object.assign(existingConfiguration, configuraiton);
    this.registry.set(`${configuraiton.name}`, configurationToUse);
    this.logger.info(`register(${configuraiton.name}) <-- `, configurationToUse);
  }

  /**
   *
   * @param type to lookup the configuraiton for.
   */
  public resolve(type: string): CollectionConfiguration | undefined {
    this.logger.info(`resolve(${type}) -->`);
    const configuration: CollectionConfiguration | undefined = this.registry.get(`${type}`);
    this.logger.info(`resolve(${type}) <--`, configuration);
    return configuration;
  }
}
