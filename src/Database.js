'use strict';


/**
 * Implementation of all the database behaviors.
 * @param configurations for the Database behavior.
 * @param provider instance for the underlying data store.
 * @param Collection class to instantiate each time a collection is requested.
 */
module.exports = function(configuration,provider,Collection,Document) {

  const Check = require('./lib/Common').Check;

  if(!Check.exist(configuration)) throw new Error("A configuration must be supplied.");
  if(!Check.exist(configuration.db)) throw new Error("A configuration must have a value defined for 'db'.");
  if(!Check.exist(configuration.collection)) throw new Error("A configuration must have an object for the 'collection' attribute.");
  if(!Check.isFunction(configuration.collection.isOwned)) throw new Error("A configuration must have a function for the 'collection.isOwned' attribute.");
  if(!Check.isFunction(configuration.collection.parseName)) throw new Error("A configuration must have a function for the 'collection.parseName' attribute.");
  if(!Check.exist(provider)) throw new Error("No provider was supplied, this object will have nothing to act upon.");
  if(!Check.isFunction(provider.listCollections) ||
     !Check.isFunction(provider.dropCollection) ||
     !Check.isFunction(provider.createCollection) ) throw new Error("Provider does not have the required functions.");
  if(!Check.isFunction(Collection)) throw new Error("The Collection class is required.");

  /*
   * Each collection definition will not change as it has no configuration. No need to look it up again and recreate it
   *  for each consecutive call.
   */
  const collectionCache = [];

  return {
    getName: () => configuration.db,
    getCollectionNames: () => provider.listCollections()
      .then( results => results
        .filter( collection => configuration.collection.isOwned( collection ) )
        .map( collection => configuration.collection.parseName( collection ) )
      ),
    dropCollection: name => configuration.allowDrop ? provider.dropCollection(name) : Promise.reject("Configuration does not allow collections to be dropped."),
    getCollection: name => Promise.resolve( collectionCache.find( collection => collection.name === name) ) 
      .then( collection => {
        if(collection) return collection;
        collection = new Collection(name, configuration, provider, Document);
        collectionCache.push( collection );
        return collection;
      }),
    createCollection: name => provider.createCollection(name)
      .then( results => new Collection(name, configuration, provider, Document) )
  }
}