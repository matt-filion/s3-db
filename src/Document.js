'use strict'

const Common = require('./lib/Common');
const Utils = Common.Utils;

const getDocumentId = (document,configuration) => document[configuration.id.propertyName] || configuration.id.generator();

const isModified = document => {
  const metadata = Utils.getMetaData(document);
  const currentMD5 = Common.signature(document);
  return !metadata || metadata.md5 !== currentMD5;
}

const isCollided = (document,configuration,provider) => {
  if(document.getId){
    const metadata = Utils.getMetaData(document);
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
}

/*
 * Extracts the data from the file, deserailizes it and decorates
 *  the returned object with convenience objects and metadata.
 * @param file
 */
module.exports = function(file,configuration,provider,collection){

  const body     = provider.getDocumentBody(file);
  const document = Common.deserialize(body);
  const metadata = provider.buildDocumentMetaData(file);

  if(document) metadata.md5 = Common.signature(body);

  metadata.collection = collection.getName();

  Utils.setMetaData(document,metadata);

  /*
   * Decorate with the isModified function for the save logic.
   */
  document.getId      = () => Common.getDocumentId(this,configuration);
  document.isModified = () => isModified(this);
  document.isCollided = () => isCollided(this,configuration,provider);
  document.save       = () => collection.saveDocument(this);
  document.delete     = () => collection.deleteDocument(this.getId());
  document.refresh    = () => collection.getDocument(this.getId());

  document.getId.bind(document);
  document.isModified.bind(document);
  document.isCollided.bind(document);
  document.save.bind(document);
  document.delete.bind(document);
  document.refresh.bind(document);

  return document;
}
