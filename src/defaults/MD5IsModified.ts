import * as crypto from 'crypto';
import { getMetadata } from '../utils/Metadata';
import { IsModified } from '../exposed';
import { BasicObject } from '../db';

/**
 * Checks MD5 and eTags on the head of the currently persisted document, if it
 * exists. If they match, modified returns false. If they dont, it returns true.
 */
export class MD5IsModified implements IsModified {
  /**
   *
   * @param documentToCheck The document that will be saved.
   * @param body serialization of the documentToCheck.
   */
  public isModified(documentToCheck: BasicObject, body: string): boolean {
    const metadata: BasicObject | undefined = getMetadata(documentToCheck);
    if (metadata) {
      const md5ToCheck: string = MD5IsModified.md5Hash(body);
      const md5Before: string = metadata.ContentMD5;
      return md5ToCheck !== md5Before;
    } else {
      return true;
    }
  }

  /**
   *
   * @param body to create an MD5 for.
   */
  public static md5Hash(body: string): string {
    return crypto
      .createHash('md5')
      .update(body)
      .digest('base64');
  }
}
