'use strict'
/**
 * Wraps around each record returned to add on 
 *  syntantcial sugar and s3db properties.
 */
module.exports = {

  METANAME : '__s3db',
  
  serialize : (record) => JSON.stringify(record),
  
  deserialize : (serialized) => JSON.parse(serialized),
  
  signature : (toWrite) => require('crypto').createHash('md5').update(toWrite).digest('base64'),
  
  isS3DBRecord : (record) => record[module.exports.METANAME] && record[module.exports.METANAME].metadata,
  
  hasSourceChanged : (record, head) => {
    var targetMetaData = module.exports.parseMeta(head);

    /*
     * The targetMetaData comes from a headCheck on the object being
     *  overwritten. So if the MD5 on the __meta of the current record
     *  matches the target MD5, the underlying object is likely not
     *  modified.
     *  
     * Md5 does not always get returned.
     */
    if(targetMetaData.md5 && targetMetaData.md5 !== record[module.exports.METANAME].metadata.md5){
      return true;
    }
    
    if(targetMetaData.eTag !== record[module.exports.METANAME].metadata.eTag){
      return true;
    }
    return false;
  },
  
  isModified : (record) => {
    var toWrite  = module.exports.serialize(record);
    var md5      = module.exports.signature(toWrite);
    return record[module.exports.METANAME] && record[module.exports.METANAME].metadata && record[module.exports.METANAME].metadata.md5 === md5
  },
  
  newRecord : (data) => {
    var record = module.exports.deserialize(data.Body.toString());
    return module.exports.decorate(record,data);
  },
  
  parseMeta: (data) => {

    var meta = {}

    if(data.Metadata) meta = data.Metadata
    if(data.Size) meta.size = data.Size
    if(data.StorageClass) meta.storageClass = data.StorageClass
    if(data.ContentLength) meta.size = data.ContentLength;
    if(data.ServerSideEncryption) meta.encryption = data.ServerSideEncryption
    if(data.LastModified) meta.lastModified = new Date(data.LastModified)
    if(data.ETag) meta.eTag = data.ETag.replace(/"/g,'') /* Fix the stupid AWS eTag. */
    if(data.Body) meta.md5 = module.exports.signature(data.Body.toString())
    
    return meta;
  },
  decorate : (record,data) => {

    var metadataToApply = module.exports.parseMeta(data);
    var metadata        = {};
    
    if(record[module.exports.METANAME] && record[module.exports.METANAME].metadata) {
      metadata = record[module.exports.METANAME].metadata;
      
      /*
       * Overwrite existing metadata information
       *  with new values.
       */
      Object.keys(metadataToApply).forEach(name => {
        metadata[name] = metadataToApply[name];
      })

    } else {
      metadata = metadataToApply;
    }
    
    Object.defineProperty(record, module.exports.METANAME, {value:{metadata:metadata},writable:true});

    return record;
  }
}