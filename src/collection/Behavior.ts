import { CollectionConfiguration } from './CollectionConfiguration'
import { S3Client } from '../s3'
import { Logger } from '@mu-ts/logger'

export abstract class CollectionBehavior<Of> {
  protected configuration: CollectionConfiguration
  protected fullBucketName: string
  protected s3Client: S3Client
  protected logger: Logger
  protected idPrefix?: string

  constructor(configuration: CollectionConfiguration, s3Client: S3Client, fullBucketName: string, parentLogger: Logger, idPrefix?: string) {
    this.configuration = configuration
    this.fullBucketName = fullBucketName
    this.s3Client = s3Client
    this.idPrefix = idPrefix
    this.logger = parentLogger.child({ child: this.toString() })
  }

  /**
   * Generates a new ID/Key for the object being saved.
   *
   * @param toSave object to find the generator on.
   */
  protected generateKey(toSave: Of): string {
    return this.configuration.idGenerator(toSave)
  }

  /**
   * If the current collection is a sub collection, then this will adjust the
   * id to be 'within' that sub collections prefix.
   *
   * @param id to adjust.
   */
  protected adjustId(id: string): string {
    return `${this.idPrefix || ''}${id}`
  }

  /**
   * Looks up what the name of the attribute is that will be used
   * to store the key. This is indicated with the @id decorator
   * on the object's class definition being saved.
   *
   * @param toSave object to generate a key for.
   */
  protected getKeyName(toSave: Of): string {
    return this.configuration.keyName || 'id'
  }
}
