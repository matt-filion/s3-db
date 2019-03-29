import { MD5IsModified, JSONSerialization, defaultIDGenerator } from "../defaults";
import { Validation, Serialization, IsModified, IDGenerator } from "../exposed";

export class CollectionConfiguration {
  /**
   * How many results to return for each page during a find operation.
   * 
   * Default is 100.
   */
  pageSize: number = 100;

  /**
   * The fuction to execute on each object before perseistance
   * is attempted.
   * 
   * By default there is no logic executed.
   */
  validator?: Validation;

  /**
   * Sets server side ecnryption enabled for saved documents.
   */
  serversideEncryption: boolean = true;

  /**
   * Disables checking if an object is modified before persisting it.
   * 
   * Defaults to true.
   */
  checkIsModified: boolean = true;

  /**
   * The logic to execute to detect if an existing record matches the current
   * record.
   * 
   * Only relavent if checkIsModified is set to true.
   */
  isModified: IsModified = new MD5IsModified();

  /**
   * If MD5 check is true, and isModified is true, then this will also do a 
   * head check and make sure the eTag matches.
   */
  // checkCollision: boolean = true;

  /**
   * How to serialize and de-seraialize objects when persisting them to S3 Buckets.
   */
  serialization: Serialization = new JSONSerialization();

  /**
   * Default ID generator, if its not defined on the decorator.
   */
  defaultIdGenerator: IDGenerator = defaultIDGenerator;

}