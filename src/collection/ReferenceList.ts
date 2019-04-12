import { S3Metadata } from '../s3';
import { FindBehavior } from './behaviors/FindBehavior';

/**
 *
 */
export class ReferenceList {
  private findBehavior: FindBehavior<any>;
  private prefix: string;
  private continuationToken?: string;
  private hasMore: boolean;
  private pageSize: number;
  private totalCount: number;
  private references?: Array<S3Metadata>;
  constructor(
    findBehavior: FindBehavior<any>,
    prefix: string,
    continuationToken?: string,
    hasMore?: boolean,
    pageSize?: number,
    totalCount?: number
  ) {
    this.findBehavior = findBehavior;
    this.continuationToken = continuationToken;
    this.prefix = prefix;
    this.hasMore = hasMore || false;
    this.pageSize = pageSize || 100;
    this.totalCount = totalCount || 0;
  }

  public async *iterator(): AsyncIterableIterator<S3Metadata> {
    let hasMoreNow: boolean = !!this.references && this.references.length !== 0;

    while (hasMoreNow) {
      /* Return each value in the references */
      if (this.references) this.references.forEach((s3Metadata: S3Metadata) => yield s3Metadata);
      else return;

      /*
       * If there are more in the bucket to return, then refresh the reference list using
       * The continuation token.
       */
      if (this.hasMore) {
        const referenceList: ReferenceList = await this.findBehavior.find(
          this.prefix,
          this.pageSize,
          this.continuationToken
        );
        this.hasMore = referenceList.hasMore;
        this.continuationToken = referenceList.continuationToken;
      } else {
        hasMoreNow = false;
      }
    }
    return;
  }
  public getConinuationToken(): string | undefined {
    return this.continuationToken;
  }
  public getHasMore(): boolean {
    return this.hasMore;
  }
  public getPageSize(): number {
    return this.pageSize;
  }
  public getTotalCount(): number {
    return this.totalCount;
  }
  public getReferences(): Array<S3Metadata> {
    return this.references || [];
  }
  public addReference(reference: S3Metadata): void {
    if (!this.references) this.references = [];
    this.references.push(reference);
  }
}
