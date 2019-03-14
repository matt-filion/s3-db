'use strict'

const Common = require('./lib/Common');
const Check  = Common.Check;
const Utils  = Common.Utils;

/**
 * Wraps around the logical file collection.
 * @param name of the Collection
 * @param configuration for this colleciton
 * @param the provider for the underlying files.
 * @param Document class for wrapping around the files returned form the provider.
 */
const Collection = function(fqn,config,provider,serializer,DocumentFactory) {

  if(!Check.exist(fqn) || !Check.exist(fqn.name) || !Check.exist(fqn.prefix)) throw new Error("A valid fqn must be supplied, which should contain a name and prefix attribute.");
  if(!Check.exist(config) || !Check.exist(config.get)) throw new Error("A valid configuration must be supplied.");

  if(!Check.exist(provider) || !Check.exist(provider.collection)) throw new Error("No provider was supplied, this object will have nothing to act upon.");

  const collectionProvider = provider.collection;

  if(!Check.isFunction(collectionProvider.findDocuments) ||
     !Check.isFunction(collectionProvider.getDocument) ||
     !Check.isFunction(collectionProvider.buildListMetaData) ||
     !Check.isFunction(collectionProvider.deleteDocument) ||
     !Check.isFunction(collectionProvider.putDocument) ) throw new Error("Provider does not have the required functions.");
  if(!Check.isObject(serializer)) throw new Error("A serializer is required.");
  if(!Check.isFunction(DocumentFactory)) throw new Error("The DocumentFactory Class is required.");

  const documentFactory = new DocumentFactory(fqn,provider,serializer);

  /*
   * Handling of common error scenarios for friendlier messages.
   */
  const handleError = error => {
    switch (error.code) {

      case 'NoSuchBucket':
        return Promise.reject(`${fqn.prefix}${fqn.name} is not a valid bucket or is not visible/accssible.`);

      case 'NoSuchKey':
        if(!config.get('errorOnNotFound',false)) {
          return Promise.resolve();
        }

      default:
        return Promise.reject(error);
    }
  }

  const idGenerator        = config.get('id.generator',() => Common.uuid());
  const idPropertyName     = config.get('id.propertyName','id');
  const documentValidator  = config.get('validator', document => Promise.resolve(document) );
  const collisionValidator = config.get('collisionValidator');
  const updateMetadata     = config.get('metadataUpdate', metadata => metadata);

  /*
   * Decorates a list of results with some convenience methods.
   *  to easily lod specific documents as well as helper methods
   *  for pagination through the results.
   */
  const listResponse = results => {


    const documents = results.Contents
      .map( ref => {
        return {
          id: ref.Key,
          lastUpdated: new Date(ref.LastModified),
          eTag: ref.ETag,
          size: ref.Size
        }
      })
      .map( record => { record.getDocument = () => collection.getDocument(record.id); return record} );

    const metadata = collectionProvider.buildListMetaData(results);

    Utils.setMetaData(documents,metadata);

    if(metadata.hasMore){
      documents.hasMore = metadata.hasMore;
      documents.next    = () => {
        const metadata = Utils.getMetaData(documents);
        return collectionProvider.findDocuments(fqn, metadata.startsWith, metadata.continuationToken).then( listResponse )
      }
    }

    return documents;
  }

  const isCollided = (document) => {

    if(document.getId || document[idPropertyName]){

      const id       = document.getId ? document.getId() : document[idPropertyName];
      const metadata = Utils.getMetaData(document);

      return collectionProvider.getDocumentHead(fqn,id)
        .then( head => {

          const targetMetaData = head ? collectionProvider.buildDocumentMetaData(head) : null;
          let   hasChanged     = false;

          /*
          * Extension point that allows additional checking on the metadata of the document
          *  and the corresponding documentHeader.
          **/
          if(collisionValidator){
            hasChanged = collisionValidator(metadata,targetMetaData,document);
          }

          /*
          * The targetMetaData comes from a headCheck on the object being
          *  overwritten. So if the MD5 on the __meta of the current record
          *  matches the target MD5, the underlying object is likely not
          *  modified.
          *
          * Md5 does not always get returned.
          */
          if(!hasChanged && targetMetaData && targetMetaData.md5 && targetMetaData.md5 !== metadata.md5){
            hasChanged = true;
          }

          if(!hasChanged && targetMetaData && targetMetaData.eTag !== metadata.eTag){
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

  const collection = {
    getName: () => fqn.name,
    getFQN: () => fqn,
    subCollection: name => {
      const subFQN = {name: `${fqn.name}/${name}`,prefix:fqn.prefix};
      return new Collection(subFQN, config, provider, serializer, DocumentFactory, Common);
    },
    copy: (sourceDocument,newId) => documentValidator(sourceDocument)
      .then( sourceDocument => {
        const sourceMetadata = Utils.getMetaData(sourceDocument);

        if(!sourceMetadata) return Promise.reject("Cannot copy a document that has not yet been saved.");

        const sourceCollectionFQN = sourceMetadata.collectionFQN;
        const sourceId            = sourceDocument.getId();
        const sourceETag          = sourceMetadata.eTag;
        const targetId            = newId || idGenerator(sourceDocument);

        return collectionProvider.copyDocument(sourceCollectionFQN,sourceId,sourceETag,fqn,targetId)
          .then( results => {
            const copy = Object.assign(sourceDocument,{[idPropertyName]:targetId});
            const data = {Body:JSON.stringify(copy),Metadata:results.CopyObjectResult};
            return documentFactory.build(data,idPropertyName,collection);
          })
      }),
    find: startsWith => collectionProvider.findDocuments(fqn,startsWith)
      .then( listResponse )
      .catch( handleError ),
    exists: id => collectionProvider.getDocumentHead(fqn,id)
      .then( head => head ? true : false ),
    getHead: id => collectionProvider.getDocumentHead(fqn,id)
      .then( head => head ? collectionProvider.buildDocumentMetaData(head) : null ) ,
    getDocument: id => collectionProvider.getDocument(fqn,id)
      .then( data => documentFactory.build(data,idPropertyName,collection))
      .catch( handleError ),
    deleteDocument: id => collectionProvider.deleteDocument(fqn,id).catch( handleError ),
    saveDocument: (documentToSave,argMetadata={}) => Promise.resolve(documentToSave)
      .then( document => !document ? Promise.reject("Cannot save undefined or null objects.") : document )
      .then( document => documentValidator(document) )
      .then( document => {
        if(config.get('onlyUpdateOnMD5Change',true)){
          return !document.isModified || document.isModified() ? document : Promise.reject('not-modified')
        }
        return document;
      })
      .then( document => {
        if(config.get('collideOnMissmatch',false)) {
          return  isCollided(document);
        }
        return document;
      })
      .then( document => {
        if(!Check.isFunction(document.getId) && !document[idPropertyName]){
          document[idPropertyName] = idGenerator(document);
        }
        const toWrite = serializer.serialize(document);
        return {
          fqn,
          id: document[idPropertyName],
          body: toWrite,
          metadata: updateMetadata(argMetadata)
        }
      })
      .then( collectionProvider.putDocument )
      .then( data => documentFactory.build(data,idPropertyName,collection) )
      .catch( error => 'not-modified' === error ? Promise.resolve(documentToSave) : handleError(error) ),
  }

  return collection;
}

module.exports = Collection;