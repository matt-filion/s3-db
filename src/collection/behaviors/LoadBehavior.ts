import { GetObjectOutput, GetObjectRequest } from 'aws-sdk/clients/s3';
import { CollectionBehavior } from '../Behavior';
import { S3DBError } from '../../db';
import { S3Object } from '../../s3';

export class LoadBehavior<Of> extends CollectionBehavior<Of> {
  /**
   * Load an object from the collection.
   *
   * Usage: collection.load('some_id');
   *
   * @param id of document to load.
   * @param type of document to load.
   */
  public async load(id: string): Promise<Of> {
    try {
      const parameters: GetObjectRequest = {
        Bucket: this.fullBucketName,
        Key: this.adjustId(id),
      };

      this.logger.debug(`load() for ${id} -->`, parameters);
      this.logger.startTimer('load');

      const response: GetObjectOutput = await this.s3Client.s3.getObject(parameters).promise();

      this.logger.endTimer('load');
      this.logger.resetTimer('load');
      this.logger.debug(`load() response from s3 for ${id} -->`, response);

      if (!response.Body) throw new S3DBError('not-found');

      const s3Object: S3Object = new S3Object(response.Body.toString('utf-8'), this.s3Client.buildS3Metadata(response));

      return this.configuration.serialization.deserialize<Of>(s3Object.getBody());
    } catch (error) {
      this.logger.error('load() error loading ${id}', error);
      throw this.s3Client.handleError(error, this.fullBucketName, id);
    }
  }
}
