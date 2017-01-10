'use strict'

/**
 * Wraps around the logical file collection.
 * @param name of the Collection
 * @param configuration for this colleciton
 * @param the provider for the underlying files.
 * @param Document class for wrapping around the files returned form the provider.
 */
module.exports = function(name,configuration,provider,Document) {

  const Common = require('./lib/Common');
  const Check  = Common.Check;
  const Utils  = Common.Utils;

  if(!Check.exist(name)) throw new Error("A name must be supplied.");

  /* No clue why its not working. */
  // if(!Check.exist(configuration)) throw new Error("A configuration must be supplied.");
  if(!Check.exist(configuration.collection)) throw new Error("A configuration must have an object for the 'collection' attribute.");
  if(!Check.isFunction(configuration.collection.name)) throw new Error("A configuration must have a function for the 'collection.name' attribute.");
  if(!Check.exist(configuration.id)) throw new Error("A configuration must have an object for the 'id' attribute.");
  if(!Check.exist(configuration.id.propertyName)) throw new Error("A configuration must have a value for the 'id.propertyName' attribute.");
  if(!Check.isFunction(configuration.id.generator)) throw new Error("A configuration must have a function for the 'id.generator' attribute.");

  if(!Check.exist(provider)) throw new Error("No provider was supplied, this object will have nothing to act upon.");
  if(!Check.isFunction(provider.findDocuments) ||
     !Check.isFunction(provider.getDocument) ||
     !Check.isFunction(provider.buildListMetaData) ||
     !Check.isFunction(provider.deleteDocument) ||
     !Check.isFunction(provider.putDocument) ||
     !Check.isFunction(provider.setCollectionTags) ||
     !Check.isFunction(provider.getCollectionTags) ) throw new Error("Provider does not have the required functions.");

  if(!Check.isObject(Document)) throw new Error("The Document class is required.");
  if(!Check.isFunction(Document.getDocumentId) ||
     !Check.isFunction(Document.isModified) ||
     !Check.isFunction(Document.new) ||
     !Check.isFunction(Document.serialize) ||
     !Check.isFunction(Document.signature) ) throw new Error("The Document class does not have the required functions.");

  /*
   * Handling of common error scenarios for friendlier messages.
   */
  const handleError = error => {
    switch (error.code) {
      case 'NoSuchBucket':
        return Promise.reject(`${configuration.collection.name(instance.bucket)} is not a valid bucket or is not visible/accssible.`);
      case 'NoSuchKey':
        if(!configuration.errorOnNotFound) {
          return Promise.resolve();
        }
      default:
        return Promise.reject(error);
    }
  }

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
        .then( metadata => provider.listDocuments(name, metadata.startsWith, metadata.continuationToken) )
        .then( listResponse )
    }

    return documents;
  }

  const collection = {
    getName: () => name,
    // getTags: instance.getTags,
    // setTags: instance.setTags,


    /**
     * Loads a specific document.
     * @param document id
     */
    getDocument: id => provider.getDocument(name,id)
      .then( data => Document.new(data,provider,collection))
      .catch( handleError ),

    /**
     * Removes a document from the document store.
     * @param document id
     */
    deleteDocument: id => provider.deleteDocument(name,id).catch( handleError ),

    /**
     * Replaces or creates current document identified by the id on the
     *  document object in the data store.
     * @param document or file to be saved (id will be created)
     */
    replaceDocument: document => Promise.resolve(document)
      .then( document => !document ? Promise.reject("Cannot save undefined or null objects.") : document)
      .then( document => configuration.onlyUpdateOnMD5Change && document.isModified ? document.isModified() : document)
      .then( document => {
        const toWrite = Document.serialize(document);
        return {
          collection: name,
          id: Document.getDocumentId(document,configuration),
          body: toWrite,
          metaData:{
            md5 : Document.signature(toWrite)
          }
        }
      })
      .then( provider.putDocument )
      .then( data => Document.new(data,provider,collection) )
      .catch( handleError ),


      /**
       * Looks for any documents that start with the provided string.
       * @param startsWith optional string to filter documents by.
       */
      findSomeStartingWith: startsWith => provider.findDocuments(name,startsWith)
        .then( listResponse )
        .catch( handleError ),
  }

  return collection;
}
