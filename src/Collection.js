'use strict'

/**
 * Wraps around the logical file collection.
 * @param name of the Collection
 * @param configuration for this colleciton
 * @param the provider for the underlying files.
 * @param Document class for wrapping around the files returned form the provider.
 */
module.exports = function(fqn,config,provider,Document) {

  const Common = require('./lib/Common');
  const Check  = Common.Check;
  const Utils  = Common.Utils;

  if(!Check.exist(fqn) || !Check.exist(fqn.name) || !Check.exist(fqn.prefix)) throw new Error("A valid fqn must be supplied, which should contain a name and prefix attribute.");
  if(!Check.exist(config) || !Check.exist(config.get)) throw new Error("A valid configuration must be supplied.");
  if(!Check.exist(provider)) throw new Error("No provider was supplied, this object will have nothing to act upon.");
  if(!Check.isFunction(provider.findDocuments) ||
     !Check.isFunction(provider.getDocument) ||
     !Check.isFunction(provider.buildListMetaData) ||
     !Check.isFunction(provider.deleteDocument) ||
     !Check.isFunction(provider.putDocument) ||
     !Check.isFunction(provider.setCollectionTags) ||
     !Check.isFunction(provider.getCollectionTags) ) throw new Error("Provider does not have the required functions.");
  if(!Check.isFunction(Document)) throw new Error("The Document class is required.");

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

  const idGenerator    = config.get('id.generator',Common.uuid);
  const idPropertyName = config.get('id.propertyName','id');

  console.log("idGenerator",idGenerator);

  /*
   * Decorates a list of results with some convenience methods.
   *  to easily lod specific documents as well as helper methods
   *  for pagination through the results.
   */
  const listResponse = results => {

    const documents = results
      .map( id => { return { id: id } } )
      .map( record => { record.getDocument = () => collection.getDocument(record.id); return record} );

    const metadata = provider.buildListMetaData(documents);

    Utils.setMetaData(documents,metadata);

    if(metadata.hasMore){
      results.hasMore = metadata.hasMore;
      results.next    = () => Promise.resolve( Utils.getMetaData(documents) )
        .then( metadata => provider.listDocuments(fqn, metadata.startsWith, metadata.continuationToken) )
        .then( listResponse )
    }

    return documents;
  }

  const collection = {
    getName: () => fqn.name,
    // getTags: instance.getTags,
    // setTags: instance.setTags,
    find: startsWith => provider.findDocuments(fqn,startsWith)
      .then( listResponse )
      .catch( handleError ),
    getDocument: id => provider.getDocument(fqn,id)
      .then( data => new Document(data,config,provider,collection))
      .catch( handleError ),
    deleteDocument: id => provider.deleteDocument(fqn,id).catch( handleError ),
    saveDocument: documentToSave => Promise.resolve(documentToSave)
      .then( document => !document ? Promise.reject("Cannot save undefined or null objects.") : document )
      .then( document => {
        if(config.get('onlyUpdateOnMD5Change',true)){
          return !document.isModified || document.isModified() ? document : Promise.reject('not-modified')
        }
        return document;
      })
      .then( document => {
        if(config.get('collideOnMissmatch',false)) {
          return document.isCollided ? document.isCollided() : document 
        }
        return document;
      })
      .then( document => {
        if(!document.getId && !document[idPropertyName]){
          document[idPropertyName] = idGenerator(document);
        }
        const toWrite = Utils.serialize(document);
        return {
          collection: `${fqn.prefix}${fqn.name}`,
          id: document[idPropertyName],
          body: toWrite,
          metaData: {
            md5: Utils.signature(toWrite)
          }
        }
      })
      .then( provider.putDocument )
      .then( provider.buildDocumentMetaData )
      .then( metadata => {
        return {
          Body: Utils.serialize(documentToSave),
          ETag: metadata.eTag
        }
      })
      .then( data => new Document(data,config,provider,collection) )
      .catch( error => 'not-modified' === error ? Promise.resolve(documentToSave) : handleError(error) ),
  }

  return collection;
}
