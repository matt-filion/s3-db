import { Serialization, JSONSerialization } from "./Serializers";
import { IsModified, MD5AndETagIsModified } from "./IsModified";
import { Validation } from "./Validation";
import { getMetadata, updateMetadata } from "../utils/Metadata";
import { S3Client, S3Metadata, S3Object } from "../aws/S3";
import { S3DB, S3DBError } from "./S3DB";

export interface IDGenerator<Of> {
  (object: Of): string;
}

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
  serversideencryption: boolean = true;

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
  isModified: IsModified = new MD5AndETagIsModified();

  /**
   * How to serialize and de-seraialize objects when persisting them to S3 Buckets.
   */
  serialization: Serialization = new JSONSerialization();

}

/**
 * @collection('name') will map a specific entity to a bucket (for the appropriate
 * naming convention.)
 * 
 * @param route for this function.
 */
export function collection(name?: string | CollectionConfiguration): any {
  return function (target: any, constructor: Function) {

    let metadata = name || target.name.toLowerCase();

    if (typeof metadata === 'string') {
      metadata = { name: metadata };
    }

    updateMetadata(target, metadata);

    return target;
  }
}

/**
 * Tells the collection what attribute is to be used as the id for the documents.
 * 
 * @param route for this function.
 */
export function id<Type>(generator?: IDGenerator<Type>) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    updateMetadata(target, {
      keyName: propertyKey,
      generator: generator
    });
    return descriptor;
  }
}

/**
 * Provides the logical interfaces of a collection and translates it into the 
 * appropriate S3 calls.
 */
export class Collection<Of> {

  private type: Of;
  private configuration: CollectionConfiguration;
  private keyName: string;
  private fullBucketName: string;
  private generator: IDGenerator<Of>;
  private s3Client: S3Client;

  constructor(type: Of) {
    let metadata: any = getMetadata(type);

    this.type = type;
    this.configuration = metadata;
    this.keyName = metadata.keyName;
    this.generator = metadata.generator;
    this.fullBucketName = S3DB.getCollectionFQN(this.getBucketName());

    this.s3Client = new S3Client(this.configuration);
  }

  /**
   * 
   * @param type of collection to create.
   */
  public static of<Of>(type: Of): Collection<Of> {
    return new Collection(type);
  }

  /**
   * Returns the metadata for a document, without loading the object
   * which is often times much faster and contains enough information
   * to determine if it has been modified.
   * 
   * @param id of the document to get the head from.
   */
  public head(id: string): Promise<S3Metadata | S3DBError> {
    return this
      .s3Client
      .getObjectHead(this.fullBucketName, id);
  }

  /**
   * 
   * @param id of object to check existance of.
   * @param type of document to check existance of.
   */
  public exists(id: string): Promise<boolean | S3DBError> {
    return this
      .head(id)
      .then((metadata: S3Metadata | S3DBError) => metadata ? true : false);
  }

  /**
   * 
   * @param id of document to load.
   * @param type of document to load.
   */
  public load(id: string): Promise<Of> {
    return this
      .s3Client
      .getObject(this.fullBucketName, id)
      .then((s3Object: S3Object | S3DBError) => {
        if (!s3Object instanceof S3DBError) return Promise.reject(s3Object);
        const object: Of = this.configuration.serialization.deserialize(s3Object.getBody())
        /**
         * is ID null, reject.
         * Load from S3
         * Update medatadata
         */
        //TODO deserialize.
        return object;
      })
      // .catch( (error:S3DBError) => {
        
      // })
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

  private getBucketName(): string {
    return getMetadata(this.type);
  }

}