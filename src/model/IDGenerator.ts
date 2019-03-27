import * as uuid4 from 'uuid/v4';
import { BasicObject } from '../utils/Metadata';

/**
 * Interface to be implemented to specify the generator pattern for
 * a collection.
 */
export interface IDGenerator {
  (object: BasicObject): string;
}

/**
 * UUID v4.
 */
export function defaultIDGenerator(object: BasicObject): string {
  return uuid4();
}

