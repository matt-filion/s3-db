import { CollectionConfiguration } from './';
import { IDGenerator, Serialization, IsModified, Validation } from '../exposed';
import { updateMetadata } from '../utils/Metadata';
import { defaultIDGenerator } from '../defaults';
import { S3DB } from '../db';
import { Logger } from '@mu-ts/logger';
import { Collection } from './Collection';

/**
 * @collection('name') will map a specific entity to a bucket (for the appropriate
 * naming convention.)
 *
 * @param route for this function.
 */
export function collection(
  name?:
    | string
    | {
        name?: string;
        keyName?: string;
        checkIsModified?: boolean;
        serversideEncryption?: boolean;
        idGenerator?: IDGenerator;
        serialization?: Serialization;
        isModified?: IsModified;
        validator?: Validation;
        pageSize?: number;
      }
): Function {
  const logger: Logger = S3DB.getRootLogger().child(`collection(${name})`);
  return function<TFunction extends Function>(target: TFunction): TFunction | void {
    let metadata = name || target.name.toLowerCase();
    const original: TFunction = target;

    if (typeof metadata === 'string') {
      logger.debug('collection metadata is a string, converting to an object.', { metadata });
      metadata = Object.assign(new CollectionConfiguration(), { name: metadata });
    } else {
      metadata = Object.assign(new CollectionConfiguration(), metadata);
    }

    if (!metadata.name) metadata.name = target.name.toLowerCase();

    updateMetadata(original, metadata);

    logger.debug('collection setting metadata to', { metadata });

    return original;
  };
}

/**
 * Tells the collection what attribute is to be used as the id for the documents.
 *
 * Usage: On an attribute @id() and optionally provide a generator to create the ID's if the default of UUID4 is not desired.
 *
 * @param generator for the ID if nothing is provided.
 */
export function id(generator: IDGenerator = defaultIDGenerator): any {
  const logger: Logger = S3DB.getRootLogger().child('id');
  return function(target: any, propertyKey: string, descriptor: PropertyDescriptor): PropertyDescriptor {
    updateMetadata(target.constructor, {
      keyName: propertyKey,
      generator: generator,
    });
    logger.debug('id decorator', { keyName: propertyKey, generator });
    return descriptor;
  };
}
