import { CollectionConfiguration } from './'
import { IDGenerator } from '../exposed'
import { defaultIDGenerator } from '../defaults'
import { Logger, LoggerService } from '@mu-ts/logger'
import { CollectionRegistry } from './CollectionRegistry'
import { CollectionConfigurationOptions } from './CollectionConfigurationOptions'

const collectionRegistry: CollectionRegistry = CollectionRegistry.instance()
const collectionLogger: Logger = LoggerService.named('S3DB.collection')
const idLogger: Logger = LoggerService.named('S3DB.id')

/**
 * @collection('name') will map a specific entity to a bucket (for the appropriate
 * naming convention.)
 *
 * @param configuration for the collection.
 */
export function collection(configuration?: CollectionConfigurationOptions): any {
  return (target: typeof Function): typeof Function | void => {
    const metadata = {
      ...new CollectionConfiguration(),
      ...(configuration || {}),
    }

    collectionLogger.info({ data: { configuration, metadata } }, 'collection configuration')

    if (!metadata.name) metadata.name = target.name.toLowerCase()
    if (!metadata.id) metadata.id = target.name.toLowerCase()

    collectionRegistry.register(metadata)

    collectionLogger.info({ data: { metadata } }, 'collection setting metadata to')

    return target
  }
}

/**
 * Tells the collection what attribute is to be used as the id for the documents.
 *
 * Usage: On an attribute @id() and optionally provide a generator to create the ID's if the default of UUID4 is not desired.
 *
 * @param generator for the ID if nothing is provided.
 */
export function id(generator: IDGenerator = defaultIDGenerator): any {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor): PropertyDescriptor => {
    const name: string = target.constructor.name.toLowerCase()
    const collectionConfiguration: CollectionConfiguration | undefined = collectionRegistry.resolve(name)

    if (collectionConfiguration) {
      collectionConfiguration.keyName = propertyKey
      collectionRegistry.register(collectionConfiguration)
    } else {
      collectionRegistry.register({ keyName: propertyKey, name, idGenerator: generator })
    }

    idLogger.debug({ data: { keyName: propertyKey, generator, name } }, 'id decorator')

    return descriptor
  }
}
