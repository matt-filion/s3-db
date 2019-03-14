export interface IsModified {
  /**
   * 
   * @param head metadata of the persisted record.
   * @param documentToCheck if the difference is different from the head metadata.
   */
  isModified(head: any, documentToCheck: any): boolean;
}

/**
 * Checks MD5 and eTags on the head of the currently persisted document, if it
 * exists. If they match, modified returns false. If they dont, it returns true.
 */
export class DefaultIsModified implements IsModified {
  constructor() {

  }

  public isModified(head: any, documentToCheck: any): boolean {
    //TODO IMPLEMENT CHECKS
    return false;
  }
}