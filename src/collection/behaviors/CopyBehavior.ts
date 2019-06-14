import { CollectionBehavior } from '../Behavior'

export class CopyBehavior<Of> extends CollectionBehavior<Of> {
  // TODO Implement COPY
  // copyDocument: (sourceFQN,sourceId,sourceETag,destinationFQN,destinationId) => {
  //   const params = {
  //     Bucket: bucketName(destinationFQN),
  //     Key: getId(destinationFQN,destinationId),
  //     CopySource:`${bucketName(sourceFQN)}${getId(sourceFQN,sourceId)}`,
  //     MetadataDirective: 'COPY'
  //   };
  //   if(getCollectionConfig(request.fqn).get('encryption',true)) params.ServerSideEncryption = 'AES256';
  //   if(sourceETag) params.CopySourceIfMatch = sourceETag;
  //   return s3.copyObject(params).promise();
  // },
}
