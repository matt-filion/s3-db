import { BasicObject } from '../db'

export interface IsModified {
  /**
   *
   * @param documentToCheck if the difference is different from the head metadata.
   */
  isModified(documentToCheck: BasicObject, body: string): boolean
}
