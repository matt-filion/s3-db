import { HeadBehavior } from './HeadBehavior';
import { S3Metadata } from '../../s3';

export class ExistsBehavior<Of> extends HeadBehavior<Of> {
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
    const metadata: S3Metadata | undefined = await this.head(id);
    this.logger.debug(`exists() response for ${id}`, metadata);
    return metadata ? true : false;
  }
}
