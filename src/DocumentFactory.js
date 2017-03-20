'use strict'

const Common = require('./lib/Common');
const Check  = Common.Check;
const Utils  = Common.Utils;

const isModified = document => {
  const metadata = Utils.getMetaData(document);
  const currentMD5 = Utils.signature(document);
  return !metadata || metadata.md5 !== currentMD5;
}

/*
 * Extracts the data from the file, deserailizes it and decorates
 *  the returned object with convenience objects and metadata.
 * @param file
 */
const Document = function(document,idPropertyName,collection) {

  document.getId      = () => document[idPropertyName];
  document.isModified = () => isModified(document);
  document.save       = () => collection.saveDocument(document);
  document.delete     = () => collection.deleteDocument(document.getId());
  document.refresh    = () => collection.getDocument(document.getId());

  return document;
}

const DocumentFactory = function(collectionFQN,provider,serializer){
  
  if(!Check.exist(collectionFQN) || !Check.exist(collectionFQN.name) || !Check.exist(collectionFQN.prefix)) throw new Error("A valid collectionFQN must be supplied, which should contain a name and prefix attribute.");
  if(!Check.exist(provider) || !Check.isFunction(provider.getDocumentBody) || !Check.isFunction(provider.buildDocumentMetaData)) throw new Error("A valid provider must be supplied.");
  if(!Check.isObject(serializer)) throw new Error("A serializer is required.");

  return {
    build: (data,idPropertyName,colletion) => {
      const body      = provider.getDocumentBody(data);
      const metadata  = provider.buildDocumentMetaData(data);
      const document  = serializer.deserialize(body);

      metadata.md5           = Utils.signature(body);
      metadata.collection    = collectionFQN.name;
      metadata.collectionFQN = collectionFQN;

      Utils.setMetaData(document,metadata);

      return new Document(document,idPropertyName,colletion); 
    }
  };
}

module.exports = DocumentFactory;