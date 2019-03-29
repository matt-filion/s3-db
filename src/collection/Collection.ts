import { getMetadata } from "../utils/Metadata";
import { S3Client, S3Metadata } from "../s3";
import { S3DB } from "../db";
import { CollectionConfiguration } from "./";
import { SaveBehavior } from "./behaviors/SaveBehavior";
import { HeadBehavior } from "./behaviors/HeadBehavior";
import { ExistsBehavior } from "./behaviors/ExistsBehavior";
import { LoadBehavior } from "./behaviors/LoadBehavior";
import { DeleteBehavior } from "./behaviors/DeleteBehavior";
import { FindBehavior } from "./behaviors/FindBehavior";
import { ReferenceList } from "./ReferenceList";


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

  private saveBheavior: SaveBehavior<Of>;
  private existsBehavior: ExistsBehavior<Of>;
  private loadBehavior: LoadBehavior<Of>;
  private deleteBehavior: DeleteBehavior<Of>;
  private findBehavior: FindBehavior<Of>;
  private headBehavior: HeadBehavior<Of>;

  constructor(type: Of) {
    let metadata: any = getMetadata(type);
    
    const name: string = metadata.name || `${type}`;
    const configuration: CollectionConfiguration = metadata;
    const fullBucketName: string = S3DB.getCollectionFQN(name);
    const s3Client: S3Client = new S3Client(configuration);

    this.headBehavior = new HeadBehavior(type,configuration,s3Client,fullBucketName,name);
    this.existsBehavior = new ExistsBehavior(type,configuration,s3Client,fullBucketName,name);
    this.loadBehavior = new LoadBehavior(type,configuration,s3Client,fullBucketName,name);
    this.saveBheavior = new SaveBehavior(type,configuration,s3Client,fullBucketName,name);
    this.deleteBehavior = new DeleteBehavior(type,configuration,s3Client,fullBucketName,name);
    this.findBehavior = new FindBehavior(type,configuration,s3Client,fullBucketName,name);

  }

  public async head(id: string): Promise<S3Metadata> {
    return this.headBehavior.head(id);
  }

  public async exists(id: string): Promise<boolean> {
    return this.existsBehavior.exists(id);
  }

  public async load(id: string): Promise<Of> {
    return this.loadBehavior.load(id);
  }

  public async save(toSave: Of): Promise<Of> {
    return this.saveBheavior.save(toSave);
  }

  public async delete(id: string): Promise<boolean> {
    return this.deleteBehavior.delete(id);
  }

  public async find(prefix: string, pageSize?: number, continuationToken?: string): Promise<ReferenceList> {
    return this.findBehavior.find(prefix,pageSize,continuationToken);
  }

}
