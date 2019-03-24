import * as crypto from 'crypto';

export interface IsModified {
  /**
   * 
   * @param documentToCheck if the difference is different from the head metadata.
   */
  isModified(documentToCheck: any): boolean;
}

/**
 * Checks MD5 and eTags on the head of the currently persisted document, if it
 * exists. If they match, modified returns false. If they dont, it returns true.
 */
export class MD5IsModified implements IsModified {
  constructor() {

  }

  public isModified(documentToCheck: any): boolean {
    //TODO IMPLEMENT CHECKS
    //TODO Get metadata vai reflection.
    return false;
  }

  /**
   * 
   * @param body to create an MD5 for.
   */
  public static md5Hash(body: string): string {
    return crypto.createHash('md5').update(body).digest('base64');
  }
}