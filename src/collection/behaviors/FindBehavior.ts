import { CollectionBehavior } from '../Behavior';
import { ReferenceList } from '../';
import { ListObjectsV2Request, ListObjectsV2Output } from 'aws-sdk/clients/s3';
import { S3Metadata } from '../../s3';

export class FindBehavior<Of> extends CollectionBehavior<Of> {
  /**
   * S3 starts to fall on its face a bit for querying documents. This super rudimentary search lest
   * you paginate through documents, which works fine if order does not matter and there are not
   * a lot of results. So basically almost no business situation ever.
   *
   * Usage: collection.find('prefix/',500);
   *
   * @param prefix of documents to load.
   * @param pageSize for the number of documetns to return per page (1000 max).
   * @param continuationToken to return results in pages. The continuation token from one
   *        ReferenceList will allow the next to return the following results.
   */
  public async find(prefix: string, pageSize?: number, continuationToken?: string): Promise<ReferenceList> {
    try {
      const parameters: ListObjectsV2Request = {
        Bucket: this.fullBucketName,
        Prefix: this.adjustId(prefix),
        MaxKeys: pageSize || 100,
        FetchOwner: false,
        ContinuationToken: continuationToken,
      };

      this.logger.debug(`find() with prefix ${prefix} -->`, parameters);
      this.logger.startTimer('listObjects');

      const response: ListObjectsV2Output = await this.s3Client.s3.listObjectsV2(parameters).promise();

      this.logger.endTimer('listObjects');
      this.logger.debug(`find() response from s3`, response);

      const referenceList: ReferenceList = new ReferenceList(
        this,
        prefix,
        response.NextContinuationToken,
        response.IsTruncated,
        response.MaxKeys,
        response.KeyCount
      );

      if (response.Contents) {
        response.Contents.forEach((object: Object) => {
          const s3Metadata: S3Metadata = <S3Metadata>object;
          referenceList.addReference(s3Metadata);
        });
      }

      this.logger.debug(`find() referenceList`, referenceList);
      this.logger.endTimer('listObjects');
      this.logger.resetTimer('listObjects');

      return referenceList;
    } catch (error) {
      this.logger.error(`find() error for prefix ${prefix}`, error);
      throw this.s3Client.handleError(error, this.fullBucketName);
    }
  }
}
