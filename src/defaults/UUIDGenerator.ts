import * as uuid4 from 'uuid/v4'

/**
 * UUID v4.
 */
export function defaultIDGenerator(): string {
  return uuid4()
}
