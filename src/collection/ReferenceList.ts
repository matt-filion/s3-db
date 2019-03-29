import { S3Metadata } from "../s3";

/**
 * 
 */
export class ReferenceList {
  private continuationToken?: string;
  private hasMore: boolean;
  private pageSize: number;
  private totalCount: number;
  private references?: Array<S3Metadata>;
  constructor(continuationToken?: string, hasMore?: boolean, pageSize?: number, totalCount?: number) {
    this.continuationToken = continuationToken;
    this.hasMore = hasMore || false;
    this.pageSize = pageSize || 100;
    this.totalCount = totalCount || 0;
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
