import { CollectionBehavior } from '../Behavior'
import { ListObjectsV2Request, ListObjectsV2Output } from 'aws-sdk/clients/s3'
import { S3Metadata } from '../../s3'
import { ReferenceList } from '../ReferenceList'

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
      }

      this.logger.debug({ parameters }, 'find()', `with prefix ${prefix} -->`)

      const response: ListObjectsV2Output = await this.s3Client.s3.listObjectsV2(parameters).promise()

      this.logger.debug({ response }, 'find()', 'response from s3')

      const referenceList: ReferenceList = new ReferenceList(
        this,
        prefix,
        response.NextContinuationToken,
        response.IsTruncated,
        response.MaxKeys,
        response.KeyCount
      )

      if (response.Contents) {
        response.Contents.forEach((object: object) => {
          const s3Metadata: S3Metadata = object as S3Metadata
          referenceList.addReference(s3Metadata)
        })
      }

      this.logger.debug({ referenceList }, 'find()', 'referenceList')

      return referenceList
    } catch (error) {
      this.logger.error(error, 'find()', `error for prefix ${prefix}`)
      throw this.s3Client.handleError(error, this.fullBucketName)
    }
  }
}
