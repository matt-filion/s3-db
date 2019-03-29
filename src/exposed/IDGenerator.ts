import { BasicObject } from "../db";

/**
 * Interface to be implemented to specify the generator pattern for
 * a collection.
 */
export interface IDGenerator {
  (object: BasicObject): string;
}


