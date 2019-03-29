import { getMetadata } from "../utils/Metadata";
import { IDGenerator } from "../exposed/IDGenerator";
import { CollectionConfiguration } from "./Configuration";
import { S3Client } from "../s3";
import { BasicObject } from "../db";

export abstract class CollectionBehavior<Of>{

  protected type: Of;
  protected configuration: CollectionConfiguration;
  protected fullBucketName: string;
  protected name: string;
  protected s3Client: S3Client;
  
  constructor(type: Of, configuration: CollectionConfiguration, s3Client: S3Client, fullBucketName: string, name:string){
    this.type = type;
    this.configuration = configuration;
    this.fullBucketName = fullBucketName;
    this.s3Client = s3Client;
    this.name = name;
  }

  /**
   * Generates a new ID/Key for the object being saved.
   * 
   * @param toSave object to find the generator on.
   */
  protected generateKey(toSave: Of): IDGenerator {
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
  protected getKeyName(toSave: Of): string {
    let metadata: BasicObject = getMetadata(toSave.constructor);
    return metadata.keyName || 'id';
  }
}