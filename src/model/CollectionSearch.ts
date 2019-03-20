import { Collection } from "./Collection";

/**
 * Reference to a document.
 */
export class DocumentReference<Of> {

}

export class CollectionSearch<Of> extends Collection<Of> {

  constructor(type: Of) {
    super(type);
  }

  /**
   * 
   * @param type of collection to create.
   */
  public static of<Of>(type: Of): CollectionSearch<Of> {
    return new this(type);
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
}
