/**
 * S3 object metadata to be attached to each object.
 */
export class S3Metadata {
  public collection?: string
  public VersionId?: string
  public StorageClass?: string
  public ContentMD5?: string
  public ContentType?: string
  public ServerSideEncryption?: string
  public ContentLength?: number
  public LastModified?: Date
  public ETag?: string
  public Key?: string
  [key: string]: number | string | Date | undefined
}
