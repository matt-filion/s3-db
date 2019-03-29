import { S3Metadata } from "./S3Metadata";

/**
 * Wrapper around an object stored in S3.
 */
export class S3Object {
  private metadata: S3Metadata;
  private body: string;
  constructor(body: string, metadata: S3Metadata) {
    this.metadata = metadata;
    this.body = body;
  }

  public getMetadata(): S3Metadata {
    return this.metadata;
  }

  public getBody(): string {
    return this.body;
  }
}