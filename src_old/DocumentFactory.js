'use strict'

const Common = require('./lib/Common');
const Check  = Common.Check;
const Utils  = Common.Utils;

const isModified = document => {
  const metadata = document.getMetadata(document);
  const currentMD5 = Utils.signature(document);
  return !metadata || metadata.md5 !== currentMD5;
}

/*
 * Extracts the data from the file, deserailizes it and decorates
 *  the returned object with convenience objects and metadata.
 * @param file
 */
const Document = function(document,idPropertyName,collection) {

  document.getId       = () => document[idPropertyName];
  document.isModified  = () => isModified(document);
  document.getMetadata = () => Utils.getMetaData(document);
  document.save        = metadata => collection.saveDocument(document,metadata || document.getMetadata ? document.getMetadata() : null );
  document.delete      = () => collection.deleteDocument(document.getId());
  document.refresh     = () => collection.getDocument(document.getId());
  document.rename      = (newName) => collection.copy(document,newName).then( newDocument => collection.deleteDocument(document.getId()).then( () => newDocument ) )
  document.copyTo      = (targetCollection,newId) => targetCollection.copy(document,newId);
  document.getHead     = () => collection.getHead(document.getId());

  return document;
}

const DocumentFactory = function(collectionFQN,provider,serializer){
  
  if(!Check.exist(collectionFQN) || !Check.exist(collectionFQN.name) || !Check.exist(collectionFQN.prefix)) throw new Error("A valid collectionFQN must be supplied, which should contain a name and prefix attribute.");
  if(!Check.exist(provider) || !Check.exist(provider.document)) throw new Error("No provider was supplied, this object will have nothing to act upon.");

  const documentProvider = provider.document;
  
  if(!Check.isFunction(documentProvider.getDocumentBody) || 
    !Check.isFunction(documentProvider.buildDocumentMetaData)) throw new Error("A valid provider must be supplied.");
  if(!Check.isObject(serializer)) throw new Error("A serializer is required.");

  return {
    build: (data,idPropertyName,colletion) => {

      const body      = documentProvider.getDocumentBody(data);
      const metadata  = documentProvider.buildDocumentMetaData(data);
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