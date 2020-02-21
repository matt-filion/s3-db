import { v4 } from 'uuid'
import { CollectionConfiguration } from './CollectionConfiguration'
import { S3Client } from '../s3'
import { Logger } from '@mu-ts/logger'
import { S3DB } from '../db'

export abstract class CollectionBehavior<Of> {
  private readonly _logger: Logger
  private readonly _configuration: CollectionConfiguration
  private readonly _fullBucketName: string
  private readonly _s3Client: S3Client
  private readonly _idPrefix?: string

  constructor(configuration: CollectionConfiguration, s3Client: S3Client, fullBucketName: string, idPrefix?: string) {
    this._logger = S3DB.getRootLogger().child(this.constructor.name)
    this._configuration = configuration
    this._fullBucketName = fullBucketName
    this._s3Client = s3Client
    this._idPrefix = idPrefix
    this._logger.info('init()', { idPrefix })
  }

  protected get logger() {
    return this._logger
  }

  protected get configuration() {
    return this._configuration
  }

  protected get fullBucketName() {
    return this._fullBucketName
  }

  protected get s3Client() {
    return this._s3Client
  }
  protected get s3() {
    return this._s3Client.s3
  }

  protected get idPrefix() {
    return this._idPrefix
  }

  /**
   * Generates a new ID/Key for the object being saved.
   *
   * @param toSave object to find the generator on.
   */
  protected generateKey(toSave: Of): string {
    return this.configuration.idGenerator(toSave, v4())
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
  protected getKeyName(): string {
    return this.configuration.keyName || 'id'
  }
}
