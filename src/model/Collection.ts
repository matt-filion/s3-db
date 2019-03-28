import { Serialization, JSONSerialization } from "./Serializers";
import { IsModified, MD5IsModified } from "./IsModified";
import { Validation } from "./Validation";
import { getMetadata, updateMetadata, setValue, getValue, BasicObject } from "../utils/Metadata";
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

/**
 * @collection('name') will map a specific entity to a bucket (for the appropriate
 * naming convention.)
 * 
 * @param route for this function.
 */
export function collection(name?: string | CollectionConfiguration): any {
  return function (target: any) {

    let metadata = name || target.name.toLowerCase();

    if (typeof metadata === 'string') {
      metadata = Object.assign(new CollectionConfiguration(), { name: metadata });
    }

    updateMetadata(target, metadata);

    return target;
  }
}

/**
 * Tells the collection what attribute is to be used as the id for the documents.
 * 
 * Usage: On an attribute @id() and optionally provide a generator to create the ID's if the default of UUID4 is not desired.
 * 
 * @param generator for the ID if nothing is provided.
 */
export function id(generator: IDGenerator = defaultIDGenerator): any {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor): PropertyDescriptor {
    updateMetadata(target.constructor, {
      keyName: propertyKey,
      generator: generator
    });
    return descriptor;
  }
}

/**
 * Provides the logical interfaces of a collection and translates it into the 
 * appropriate S3 calls.
 * 
 * Usage: const myCollection: Collection<SomeType> = new Collection(SomeType);
 * 
 * The 'SomeType' definition needs to have [prop: string]: any; on it to avoid
 * a TypeScript collission issue when it interprets the 'two types'.
 */
export class Collection<Of extends any> {

  private type: Of;
  private configuration: CollectionConfiguration;
  private fullBucketName: string;
  private s3Client: S3Client;
  private name: string;

  constructor(type: Of) {
    let metadata: any = getMetadata(type);
    this.type = type;
    this.name = metadata.name || `${type}`;
    this.configuration = metadata;
    this.fullBucketName = S3DB.getCollectionFQN(this.name);
    this.s3Client = new S3Client(this.configuration);
  }

  /**
   * Returns the metadata for a document, without loading the object
   * which is often times much faster and contains enough information
   * to determine if it has been modified.
   * 
   * Usage: collection.head(id)
   * 
   * @param id of the document to get the head from.
   */
  public async head(id: string): Promise<S3Metadata> {
    const metadata: S3Metadata = await this.s3Client.getObjectHead(this.fullBucketName, id);
    return metadata;
  }

  /**
   * Checks if an object exists by seeing if metadata exists for the
   * object.
   * 
   * Usage: collection.exists(id)
   * 
   * @param id of object to check existance of.
   * @param type of document to check existance of.
   */
  public async exists(id: string): Promise<boolean> {
    const metadata: S3Metadata = await this.head(id);
    return metadata ? true : false;
  }

  /**
   * Load an object from the collection.
   * 
   * Usage: collection.load('some_id');
   * 
   * @param id of document to load.
   * @param type of document to load.
   */
  public async load(id: string): Promise<Of> {
    const s3Object: S3Object = await this.s3Client.getObject(this.fullBucketName, id);
    return this.configuration.serialization.deserialize<Of>(s3Object.getBody());
  }

  /**
   * Creates or updates an object in the collection. If the object was loaded by
   * S3, and is not modified, this method will not attempt to Save. See the checkIsModified
   * configuration value for more details.
   * 
   * It is expected that the object provided is the same type of the object that the
   * collection was created with.
   * 
   * Usage: collection.save({some:'object'})
   * 
   * @param toSave to database.
   * @param type of document to save.
   */
  public async save(toSave: Of): Promise<Of> {

    /*
     * Cannot do anything with an undefined document.
     */
    if (!toSave) return Promise.reject(new S3DBError('Attempted to save undefined or null.'));

    //TODO check if the toSave value has metadata, if it does, check the type and make sure it matches this.type

    /*
     * If validation is configured, run it against the object.
     */
    const isValid = this.configuration.validator ? this.configuration.validator.validate(toSave) : true;
    if (!isValid) return Promise.reject(new S3DBError('Object did not pass validation.'));

    /*
     * If the object is not modified and checkIsModified is set to true, then just return
     * the object as is. There is nothing to do.
     */
    const body: string = this.configuration.serialization.serialize(toSave);
    const isModified = this.configuration.checkIsModified ? this.configuration.isModified.isModified(toSave,body) : true;
    if (!isModified) return Promise.resolve(toSave);

    /*
     * If the object does not have an key to be saved as then it must be
     * created.
     */
    const keyName = this.getKeyName(toSave);
    let keyValue = getValue(toSave, keyName);
    if (!keyValue) {
      keyValue = this.generateKey(toSave);
      setValue(toSave, keyName, keyValue);
    } else {
      //TODO head lookup of metadata, make sure eTag matches.
    }

    /*
     * Serialize the object using the configured serialization strategy.
     */
    
    const metadata: S3Metadata = {
      collection: `${this.name}`
    };

    const s3Object: S3Object = await this.s3Client.saveObject(
      this.fullBucketName,
      keyValue,
      body,
      metadata
    );

    updateMetadata(toSave, s3Object.getMetadata());
    
    return toSave;
  }

  /**
   * Removes an object from the collection.
   * 
   * Usage: collection.remove('some_id');
   * 
   * @param id of document to delete
   * @param type of document to delete
   */
  public async delete(id: string): Promise<boolean> {
    return this.s3Client
      .deleteObject(this.fullBucketName, id)
      .then(() => true)
  }

  /**
   * S3 starts to fall on its face a bit for querying documents. This super rudimentary search lest
   * you paginate through documents, which works fine if order does not matter and there are not
   * a lot of results. So basically almost no business situation ever.
   * 
   * Usage: collection.find('prefix/',500);
   * 
   * @param prefix of documents to load.
   * @param pageSize for the number of documetns to return per page (1000 max).
   * @param continuationToken to return results in pages. The continuation token from one 
   *        ReferenceList will allow the next to return the following results.
   */
  public async find(prefix: string, pageSize?: number, continuationToken?: string): Promise<ReferenceList> {
    const list: S3MetadataList = await this.s3Client.listObjects(this.fullBucketName, prefix, pageSize, continuationToken);
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
  }

  /**
   * Generates a new ID/Key for the object being saved.
   * 
   * @param toSave object to find the generator on.
   */
  private generateKey(toSave: Of): IDGenerator {
    let metadata: BasicObject = getMetadata(toSave.constructor);
    return metadata.generator(toSave);
  }

  /**
   * Looks up what the name of the attribute is that will be used
   * to store the key. This is indicated with the @id decorator
   * on the object's class definition being saved.
   * 
   * @param toSave object to generate a key for.
   */
  private getKeyName(toSave: Of): string {
    let metadata: BasicObject = getMetadata(toSave.constructor);
    return metadata.keyName || 'id';
  }
}