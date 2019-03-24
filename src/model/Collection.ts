import { Serialization, JSONSerialization } from "./Serializers";
import { IsModified, MD5IsModified } from "./IsModified";
import { Validation } from "./Validation";
import { getMetadata, updateMetadata, setValue, getValue } from "../utils/Metadata";
import { S3Client, S3Metadata, S3Object, S3MetadataList } from "../aws/S3";
import { S3DB, S3DBError } from "./S3DB";
import { IDGenerator, defaultIDGenerator } from "./IDGenerator";

/**
 * 
 */
export class ReferenceList {
  private continuationToken?: string;
  private hasMore: boolean;
  private pageSize: number;
  private totalCount: number;
  private references?: Array<Reference>;
  constructor(continuationToken?: string, hasMore?: boolean, pageSize?: number, totalCount?: number) {
    this.continuationToken = continuationToken;
    this.hasMore = hasMore || false;
    this.pageSize = pageSize || 100;
    this.totalCount = totalCount || 0;
  }
  public getConinuationToken(): string | undefined {
    return this.continuationToken;
  }
  public getHasMore(): boolean {
    return this.hasMore;
  }
  public getPageSize(): number {
    return this.pageSize;
  }
  public getTotalCount(): number {
    return this.totalCount;
  }
  public getReferences(): Array<Reference> {
    return this.references || [];
  }
  public addReference(reference: Reference): void {
    if (!this.references) this.references = [];
    this.references.push(reference);
  }
}

/**
 * Reference to a document.
 */
export class Reference {
  public type?: string;
  public key?: string;
  public lastUpdated?: Date;
  public eTag?: string;
  public contentLength?: number;
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
  isModified: IsModified = new MD5IsModified();

  /**
   * How to serialize and de-seraialize objects when persisting them to S3 Buckets.
   */
  serialization: Serialization = new JSONSerialization();

  /**
   * Default ID generator, if its not defined on the decorator.
   */
  defaultIdGenerator: IDGenerator<any> = defaultIDGenerator;

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
  private name: string;

  constructor(type: Of) {
    let metadata: any = getMetadata(type);

    this.type = type;
    this.name = metadata.name || `${type}`;
    this.configuration = metadata;
    this.keyName = metadata.keyName;
    this.generator = metadata.generator;
    this.fullBucketName = S3DB.getCollectionFQN(this.name);

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
  public head(id: string): Promise<S3Metadata> {
    return this
      .s3Client
      .getObjectHead(this.fullBucketName, id);
  }

  /**
   * 
   * @param id of object to check existance of.
   * @param type of document to check existance of.
   */
  public exists(id: string): Promise<boolean> {
    return this
      .head(id)
      .then((metadata: S3Metadata) => metadata ? true : false);
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
      .then((s3Object: S3Object) => ((this.configuration.serialization.deserialize(s3Object.getBody()) as any) as Of));
  }

  /**
   * 
   * @param toSave to database.
   * @param type of document to save.
   */
  public save<Of>(toSave: Of): Promise<Of> {

    /*
     * Cannot do anything with an undefined document.
     */
    if (!toSave) return Promise.reject(new S3DBError('Attempted to save undefined or null.'));

    /*
     * If validation is configured, run it against the object.
     */
    const isValid = this.configuration.validator ? this.configuration.validator.validate(toSave) : true;
    if (!isValid) return Promise.reject(new S3DBError('Object did not pass validation.'));

    /*
     * If the object is not modified and checkIsModified is set to true, then just return
     * the object as is. There is nothing to do.
     */
    const isModified = this.configuration.checkIsModified ? this.configuration.isModified.isModified(toSave) : true;
    if (!isModified) return Promise.resolve(toSave);

    /*
     * If the object does not have an key to be saved as then it must be
     * created.
     */
    let keyValue = getValue(toSave, this.keyName);
    if (!keyValue) {
      keyValue = this.generator ? this.generator(toSave) : this.configuration.defaultIdGenerator(toSave);
      setValue(toSave, this.keyName, keyValue);
    }

    /*
     * Serialize the object using the configured serialization strategy.
     */
    const body: string = this.configuration.serialization.serialize(toSave);
    const metadata: S3Metadata = {
      collection: `${this.name}`
    }

    return this.s3Client
      .saveObject(
        this.fullBucketName,
        keyValue,
        body,
        metadata
      )
      .then((s3Object: S3Object) => {
        updateMetadata(toSave, s3Object.getMetadata());
        return toSave;
      })
  }

  /**
   * 
   * @param id of document to delete
   * @param type of document to delete
   */
  public delete(id: string): Promise<boolean> {
    return this.s3Client
      .deleteObject(this.fullBucketName, id)
      .then(() => true)
  }

  /**
   * S3 starts to fall on its face a bit for querying documents. This super rudimentary search lest
   * you paginate through documents, which works fine if order does not matter and there are not
   * a lot of results. So basically almost no business situation ever.
   * 
   * @param prefix of documents to load.
   * @param pageSize for the number of documetns to return per page (1000 max).
   * @param continuationToken to return results in pages. The continuation token from one 
   *        ReferenceList will allow the next to return the following results.
   */
  public find(prefix: string, pageSize?: number, continuationToken?: string): Promise<ReferenceList> {
    return this.s3Client
      .listObjects(this.fullBucketName, prefix, pageSize, continuationToken)
      .then((list: S3MetadataList) => {

        const referenceList: ReferenceList = new ReferenceList(
          list.getConinuationToken(),
          list.getHasMore(),
          list.getPageSize(),
          list.getTotalCount()
        );

        list.forEach((object: S3Metadata) => referenceList.addReference(<Reference>{
          type: `${this.type}`,
          key: object.Key,
          lastUpdated: object.LastModified,
          eTag: object.ETag,
          contentLength: object.ContentLength
        }));

        return referenceList;
      })
  }
}