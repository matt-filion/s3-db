import { CollectionBehavior } from '../Behavior'
import { updateMetadata, setValue, getValue } from '../../utils/Metadata'
import { S3DBError } from '../../db'
import { PutObjectRequest, PutObjectOutput } from 'aws-sdk/clients/s3'
import { MD5IsModified } from '../../defaults'
import { S3Metadata, S3Object } from '../../s3'

export class SaveBehavior<Of> extends CollectionBehavior<Of> {
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
    if (!toSave) return Promise.reject(new S3DBError('Attempted to save undefined or null.'))

    // TODO check if the toSave value has metadata, if it does, check the type and make sure it matches this.type

    /*
     * If validation is configured, run it against the object.
     */
    const isValid = this.configuration.validator ? this.configuration.validator.validate(toSave) : true
    this.logger.debug({ isValid }, 'save()')
    if (!isValid) return Promise.reject(new S3DBError('Object did not pass validation.'))

    /*
     * If the object does not have an key to be saved as then it must be
     * created.
     *
     * Must be done before serialization so that we do not persist the body
     * of a newly created object without the ID that is attached to it.
     */
    const keyName = this.getKeyName()
    let keyValue = getValue(toSave, keyName)

    this.logger.debug({ keyName, keyValue }, 'save() key (id)')

    if (!keyValue) {
      this.logger.debug('save() generating key (id)')
      keyValue = this.generateKey(toSave)
      keyValue = this.adjustId(keyValue)
      setValue(toSave, keyName, keyValue)
    } else {
      /**
       * If and ID is provided on the object being saved and it does not begin
       * with the prefix, add it.
       */
      if (this.idPrefix && !keyValue.startsWith(this, this.idPrefix)) {
        this.logger.debug({ idPrefix: this.idPrefix }, 'save() adding prefix to key')
        keyValue = this.adjustId(keyValue)
      }
    }

    /*
     * If the object is not modified and checkIsModified is set to true, then just return
     * the object as is. There is nothing to do.
     */
    const body: string = this.configuration.serialization.serialize(toSave)

    this.logger.debug({ body }, 'save() serializing body to')

    const isModified = this.configuration.checkIsModified ? this.configuration.isModified.isModified(toSave, body) : true
    if (!isModified) {
      this.logger.debug('save() Object was not modified, so returning object as is.')
      return Promise.resolve(toSave)
    }

    /*
     * Serialize the object using the configured serialization strategy.
     */

    const metadata: S3Metadata = {
      type: `${this.configuration.name}`,
      collection: `${this.fullBucketName}`,
    }

    const s3Object: S3Object = await this.putObject(keyValue, body, metadata)

    updateMetadata(toSave, s3Object.getMetadata())

    this.logger.debug({ s3Object }, 'save()', 'attach, or update, metadata on object.')

    return toSave
  }

  private async putObject(id: string, body: string, metadata: S3Metadata) {
    try {
      const conentLength: number = Buffer.byteLength(body, 'utf8')
      const contentType: string = metadata.ContentType ? '' + metadata.ContentType : 'application/json'
      const params: PutObjectRequest = {
        Bucket: this.fullBucketName,
        Key: id,
        StorageClass: metadata.StorageClass,
        ContentType: contentType,
        ContentLength: conentLength,
        ContentMD5: MD5IsModified.md5Hash(body),
        Metadata: this.s3Client.toAWSMetadata(metadata),
        Body: body,
      }

      if (this.configuration.serversideEncryption) params.ServerSideEncryption = 'AES256'

      this.logger.debug({ params }, 'save()', 'request to send to S3')

      const response: PutObjectOutput = await this.s3Client.s3.putObject(params).promise()

      this.logger.debug({ response }, 'save()', 'response from s3')

      if (!response) throw this.s3Client.handleError(response, this.fullBucketName, id)

      const responseMetadata: S3Metadata = Object.assign(this.s3Client.buildS3Metadata(response), this.s3Client.toAWSMetadata(metadata))

      responseMetadata.StorageClass = params.StorageClass
      responseMetadata.ETag = JSON.parse(response.ETag || '')
      responseMetadata.ContentMD5 = MD5IsModified.md5Hash(body)
      responseMetadata.ContentLength = conentLength

      return new S3Object(body, responseMetadata)
    } catch (error) {
      throw this.s3Client.handleError(error, this.fullBucketName, id)
    }
  }
}
