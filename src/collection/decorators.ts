import { CollectionConfiguration } from './';
import { IDGenerator, Serialization, IsModified, Validation } from '../exposed';
import { updateMetadata } from '../utils/Metadata';
import { defaultIDGenerator } from '../defaults';
import { S3DB } from '../db';
import { Logger } from '@mu-ts/logger';

const exportLogger: Logger = S3DB.getRootLogger().child(`collection`);
const idLogger: Logger = S3DB.getRootLogger().child('id');

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
  return function<TFunction extends Function>(target: TFunction): TFunction | void {
    let metadata: string | any = name;

    if (typeof metadata === 'string') {
      exportLogger.debug('collection metadata is a string, converting to an object.', { metadata });
      metadata = Object.assign(new CollectionConfiguration(), { name: metadata });
    } else {
      metadata = Object.assign(new CollectionConfiguration(), metadata);
    }

    if (!metadata.name) metadata.name = target.name.toLowerCase();

    updateMetadata(target, metadata);

    exportLogger.debug('collection setting metadata to', { metadata });

    return target;
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
  return function(target: any, propertyKey: string, descriptor: PropertyDescriptor): PropertyDescriptor {
    updateMetadata(target.constructor, {
      keyName: propertyKey,
      generator: generator,
    });
    idLogger.debug('id decorator', { keyName: propertyKey, generator });
    return descriptor;
  };
}
