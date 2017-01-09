'use strict';

const Check = require('./lib/Check').Check;

/**
 * Implementation of all the database behaviors.
 * @param configurations for the Database behavior.
 * @param provider instance for the underlying data store.
 * @param Collection class to instantiate each time a collection is requested.
 */
module.exports = function(configuration,provider,Collection,Document) {

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

  return {
    /*
     * Returns the name of the database
     */
    getName: () => configuration.db,

    /*
     * Lists out all of the names in the 'database'
     */
    getCollectionNames: () => provider.listCollections()
      .then( results => results.Buckets
        .filter( collection => configuration.collection.isOwned( collection.Name ) )
        .map( collection => configuration.collection.parseName( collection.Name ) )
      ),

    /*
     * Removes a collection, as long as AWS permits it for the current user.
     */
    dropCollection: name => configuration.allowDrop ? provider.dropCollection(name) : Promise.reject("Configuration does not allow collections to be dropped."),

    /*
     * Does not verify the collection, assumes it is valid and Returns
     *  a wrapper around the possible collection back to the caller.
     */
    getCollection: name => new Collection(name, configuration, provider, Document),

    /*
     * Creates a new s3 collection that will 'live' within the configured database
     */
    createCollection: name => provider.createCollection(name)
      .then( results => new Collection(name, configuration, provider, Document) )
  }
}
