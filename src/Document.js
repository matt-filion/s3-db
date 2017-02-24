'use strict'

const Utils = require('./lib/Common').Utils;

module.exports.getDocumentId = (document,configuration) => document[configuration.id.propertyName] || configuration.id.generator();
module.exports.signature = toWrite => require('crypto').createHash('md5').update(typeof toWrite === 'string' ? toWrite : JSON.stringify(toWrite)).digest('base64');
module.exports.serialize = body => typeof body === 'string' ? body : JSON.stringify(body);
module.exports.deserialize = serialized => typeof serialized === 'string' ? JSON.parse(serialized) : serialized;
module.exports.isModified = document => {
  const metadata = Utils.getMetaData(document);
  const currentMD5 = module.exports.signature(document);
  return !metadata || metadata.md5 !== currentMD5;
}
module.exports.isCollided = (document,configuration,provider) => {
  if(document.getId){
    return provider.getDocumentHead(metadata.collection,document.getId())
      .then( head => {

        const targetMetaData = provider.buildDocumentMetaData(head);
        let   hasChanged     = false;

        /*
         * The targetMetaData comes from a headCheck on the object being
         *  overwritten. So if the MD5 on the __meta of the current record
         *  matches the target MD5, the underlying object is likely not
         *  modified.
         *
         * Md5 does not always get returned.
         */
        if(targetMetaData.md5 && targetMetaData.md5 !== metadata.md5){
          hasChanged = true;
        }

        if(targetMetaData.eTag !== metadata.eTag){
          hasChanged = true;
        }

        if(hasChanged){
          return Promise.reject('Collision, the document has been modified.');
        }

        return document;
      })
  }
  return Promise.resolve(document);
},

/*
 * Extracts the data from the file, deserailizes it and decorates
 *  the returned object with convenience objects and metadata.
 * @param file
 */
module.exports.new = function(file,configuration,provider,collection){

  const body     = provider.getDocumentBody(file);
  const document = module.exports.deserialize(body);
  const metadata = provider.buildDocumentMetaData(file);

  if(document) metadata.md5 = module.exports.signature(body);

  metadata.collection = collection.getName();

  Utils.setMetaData(document,metadata);

  /*
   * Decorate with the isModified function for the save logic.
   */
  document.getId      = () => module.exports.getDocumentId(document,configuration);
  document.isModified = () => module.exports.isModified(document);
  document.isCollided = () => module.exports.isCollided(document,configuration,provider);
  document.save       = () => collection.saveDocument(document);
  document.delete     = () => collection.deleteDocument(document.getId());
  document.refresh    = () => collection.getDocument(document.getId());

  return document;
}
