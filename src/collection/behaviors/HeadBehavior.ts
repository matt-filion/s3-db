import { HeadObjectRequest, HeadObjectOutput } from 'aws-sdk/clients/s3'
import { CollectionBehavior } from '../Behavior'
import { S3Metadata } from '../../s3'

export class HeadBehavior<Of> extends CollectionBehavior<Of> {
  /**
   * Returns the metadata for a document, without loading the object
   * which is often times much faster and contains enough information
   * to determine if it has been modified.
   *
   * Usage: collection.head(id)
   *
   * @param id of the document to get the head from.
   */
  public async head(id: string): Promise<S3Metadata | undefined> {
    try {
      const parameters: HeadObjectRequest = {
        Bucket: this.fullBucketName,
        Key: this.adjustId(id),
      }

      this.logger.debug({ parameters }, 'head()', `check for ${id}`)

      const response: HeadObjectOutput = await this.s3Client.s3.headObject(parameters).promise()

      this.logger.debug({ response }, 'head()', 'response')

      return this.s3Client.buildS3Metadata(response)
    } catch (error) {
      if (error.code && error.code === 'NotFound') {
        this.logger.debug('head()', 'response from s3 was NotFound', error)
        return undefined
      } else {
        this.logger.error('head()', `error response from s3 for ${id}`, error)
        throw this.s3Client.handleError(error, this.fullBucketName, id)
      }
    }
  }
}
