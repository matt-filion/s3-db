import * as uuid4 from 'uuid/v4';

/**
 * Interface to be implemented to specify the generator pattern for
 * a collection.
 */
export interface IDGenerator<Of> {
  <Of>(object: Of): string;
}

/**
 * UUID v4.
 */
export function defaultIDGenerator<Of>(object: Of): string {
  return uuid4();
}

