import { BasicObject } from '../db'

/**
 * Interface to be implemented to specify the generator pattern for
 * a collection.
 */
export type IDGenerator = (object: BasicObject) => string
