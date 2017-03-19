'use strict';

/**
 * Implementation of all the database behaviors.
 * @param configurations for the Database behavior.
 * @param provider instance for the underlying data store.
 * @param Collection class to instantiate each time a collection is requested.
 * @param Document class to pass into the Collection instances that are created.
 */
module.exports = function(config, provider, Collection, Document) {

  const Config = require('lamcfg');
  const Common = require('./lib/Common');
  const Check  = Common.Check;
  const Utils  = Common.Utils;

  if(!Check.exist(config) || !Check.exist(config.get)) throw new Error("A valid configuration must be supplied.");
  if(!Check.exist(config.get('db.name'))) throw new Error("db.name is required, and cannot be undefined, null or ''.");
  if(!Check.exist(config.get('db.namePattern'))) throw new Error("db.namePattern is required, and cannot be undefined, null or ''.");
  if(!Check.exist(provider)) throw new Error("No provider was supplied, this object will have nothing to act upon.");
  if(!Check.isFunction(provider.listCollections) ||
     !Check.isFunction(provider.dropCollection) ||
     !Check.isFunction(provider.createCollection) ) throw new Error("Provider does not have the required functions.");
  if(!Check.isFunction(Collection)) throw new Error("The Collection class is required.");

  const collectionCache = [];
  const prefix = Utils.render(config.get('db.namePattern'),{db:config.get('db')});

  const isOwned = collection => collection.startsWith(prefix);
  const nameFromFQN = fqn => fqn.substring(prefix.length,fqn.length);
  const getCollectionConfig = name => {
    let prefix  = `collections.${name}`;
    let configs = config.get(prefix);
    if(configs) {
      return config.childOf(prefix);
    }
    return config.childOf('collections.default');
  };

  return {
    getName: () => config.get('db.name'),
    getCollectionNames: () => provider.listCollections()
      .then( results => results
        .filter( fqn => isOwned( fqn ) )
        .map( collection => nameFromFQN( collection ) )
      ),
    createCollection: name => provider.createCollection({name,prefix})
      .then( results => new Collection(name, getCollectionConfig(name), provider, Document) ),
    getCollection: name => Promise.resolve( collectionCache.find( collection => collection.name === name) ) 
      .then( collection => {
        if(collection) return collection;
        collection = new Collection(name, getCollectionConfig({name,prefix}), provider, Document);
        collectionCache.push( collection );
        return collection;
      }),
    dropCollection: name => config.get('db.allowDrop',false) ? provider.dropCollection(name) : Promise.reject("Configuration does not allow collections to be dropped.")
  }
}