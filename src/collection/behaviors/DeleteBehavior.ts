import { CollectionBehavior } from '../Behavior';
import { DeleteObjectRequest, DeleteObjectOutput } from 'aws-sdk/clients/s3';

export class DeleteBehavior<Of> extends CollectionBehavior<Of> {
  /**
   * Removes an object from the collection.
   *
   * Usage: collection.remove('some_id');
   *
   * @param id of document to delete
   * @param type of document to delete
   */
  public async delete(id: string): Promise<boolean> {
    try {
      const parameters: DeleteObjectRequest = {
        Bucket: this.fullBucketName,
        Key: this.adjustId(id),
      };

      this.logger.debug(`delete() ${id}`, parameters);
      this.logger.startTimer('deleteObject');

      const response: DeleteObjectOutput = await this.s3Client.s3.deleteObject(parameters).promise();

      this.logger.endTimer('deleteObject');
      this.logger.resetTimer('deleteObject');
      this.logger.debug('delete() response from s3', response);

      return !!response;
    } catch (error) {
      this.logger.error(`delete() error while trying to delete ${id}`, error);
      throw this.s3Client.handleError(error, this.fullBucketName, id);
    }
  }
}
