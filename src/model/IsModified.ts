import * as crypto from 'crypto';
import { BasicObject, getMetadata } from '../utils/Metadata';

export interface IsModified {
  /**
   * 
   * @param documentToCheck if the difference is different from the head metadata.
   */
  isModified(documentToCheck: BasicObject, body: string): boolean {
}

/**
 * Checks MD5 and eTags on the head of the currently persisted document, if it
 * exists. If they match, modified returns false. If they dont, it returns true.
 */
export class MD5IsModified implements IsModified {
  constructor() {

  }

  /**
   * 
   * @param documentToCheck The document that will be saved.
   * @param body serialization of the documentToCheck.
   */
  public isModified(documentToCheck: BasicObject, body: string): boolean {
    const md5ToCheck:string = MD5IsModified.md5Hash(body);
    const md5Before:string = getMetadata(documentToCheck).ContentMD5;
    return md5ToCheck !== md5Before;
  }

  /**
   * 
   * @param body to create an MD5 for.
   */
  public static md5Hash(body: string): string {
    return crypto.createHash('md5').update(body).digest('base64');
  }
}