import { document } from "../decorators/document";
import { getMetadata } from "../utils/Metadata";

/**
 * Reference to a document.
 */
export class DocumentReference<Of> {

}

/**
 * Metadata for a document.
 */
export class DocumentHead<Of> {

}

/**
 * Provides the logical interfaces of a collection and translates it into the 
 * appropriate S3 calls.
 */
export class Collection<Of> {

  private type: Of;

  constructor(type: Of) {
    this.type = type;
  }

  /**
   * 
   * @param type of collection to create.
   */
  public static of<Of>(type: Of): Collection<Of> {
    return new this(type);
  }

  public head(id: string): Promise<DocumentHead<Of>> {
    const loaded: Of = <Of>{};
    /**
     * Load head
     * Serialize to JSON.
     */
    return Promise.resolve({});
  }

  /**
   * 
   * @param id of object to check existance of.
   * @param type of document to check existance of.
   */
  public exists(id: string): Promise<boolean> {
    const loaded: Of = <Of>{};
    /**
     * is ID null, reject.
     * Load head
     * No head, return false.
     */
    return Promise.resolve(false);
  }

  /**
   * 
   * @param id of document to load.
   * @param type of document to load.
   */
  public load(id: string): Promise<Of> {
    const loaded: Of = <Of>{};
    /**
     * is ID null, reject.
     * Load from S3
     * Update medatadata
     */
    return Promise.resolve(loaded);
  }

  /**
   * 
   * @param toSave to database.
   * @param type of document to save.
   */
  public save<Of>(toSave: Of): Promise<Of> {
    console.log("name", this.getBucketName());
    /**
     * Is null reject
     * Has validator configured, validate
     * Is modified check enabled, load head, check is modified.
     * If no ID, generate
     * Serialize
     * Send to AWS
     * Update metadata.
     */

    return Promise.resolve(toSave);
  }

  /**
   * 
   * @param id of document to delete
   * @param type of document to delete
   */
  public delete<Of>(id: string): Promise<boolean> {
    /**
     * Is id null, reject.
     * Is delete disabled, if so reject.
     * Send delete to AWS.
     */
    return Promise.resolve(true);
  }

  /**
   * 
   * @param prefix of documents to load.
   * @param type of document to load.
   */
  public find<Of>(prefix: string): Promise<Array<DocumentReference<Of>>> {
    /**
     * Get max keys for request.
     * Send request to AWS.
     * Serialize into a list.
     * 
     */
    return Promise.resolve(new Array<Of>());
  }

  private getBucketName(): string {
    return getMetadata(this.type);
  }

}