import { GetObjectOutput, GetObjectRequest } from 'aws-sdk/clients/s3'
import { CollectionBehavior } from '../Behavior'
import { S3DBError } from '../../db'
import { S3Object } from '../../s3'

export class LoadBehavior<Of> extends CollectionBehavior<Of> {
  /**
   * Load an object from the collection.
   *
   * Usage: collection.load('some_id');
   *
   * @param id of document to load.
   * @param type of document to load.
   */
  public async load(id: string): Promise<Of | undefined> {
    try {
      const parameters: GetObjectRequest = {
        Bucket: this.fullBucketName,
        Key: this.adjustId(id),
      }

      this.logger.debug({ parameters }, 'load()', `for ${id} -->`)

      const response: GetObjectOutput = await this.s3.getObject(parameters).promise()

      this.logger.debug({ response }, 'load()', `response from s3 for ${id} -->`)

      if (!response.Body) {
        if (this.configuration.noExceptionOnNotFound) return undefined
        else throw new S3DBError('not-found')
      }

      const s3Object: S3Object = new S3Object(response.Body.toString('utf8'), this.s3Client.buildS3Metadata(response))

      return this.configuration.serialization.deserialize<Of>(s3Object.getBody())
    } catch (error) {
      this.logger.error(`error loading ${id}`, error, { noExceptionOnNotFound: this.configuration.noExceptionOnNotFound }, 'load()')
      if (error.code === 'NoSuchKey' && this.configuration.noExceptionOnNotFound) return undefined
      throw this.s3Client.handleError(error, this.fullBucketName, id)
    }
  }
}
