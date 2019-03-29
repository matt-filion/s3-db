
/**
 * S3 object metadata to be attached to each object.
 */
export class S3Metadata {
  collection?: string;
  VersionId?: string;
  StorageClass?: string;
  ContentMD5?: string;
  ContentType?: string;
  ServerSideEncryption?: string;
  ContentLength?: number;
  LastModified?: Date;
  ETag?: string;
  Key?: string;
  [key: string]: number | string | Date | undefined;
}
