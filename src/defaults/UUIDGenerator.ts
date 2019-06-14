import * as uuid4 from 'uuid/v4'
import { BasicObject } from '../db'

/**
 * UUID v4.
 */
export function defaultIDGenerator(object: BasicObject): string {
  return uuid4()
}
