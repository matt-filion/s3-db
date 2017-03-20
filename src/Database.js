'use strict';

const Common = require('./lib/Common');
const Check  = Common.Check;
const Utils  = Common.Utils;

/**
 * Implementation of all the database behaviors.
 * @param configurations for the Database behavior.
 * @param provider instance for the underlying data store.
 * @param Collection class to instantiate each time a collection is requested.
 * @param Document class to pass into the Collection instances that are created.
 */
module.exports = function(config, provider, serializer, Collection, DocumentFactory ) {
  
  if(!Check.exist(config) || !Check.exist(config.get)) throw new Error("A valid configuration must be supplied.");
  if(!Check.exist(config.get('db.name'))) throw new Error("db.name is required, and cannot be undefined, null or ''.");
  if(!Check.exist(config.get('db.namePattern'))) throw new Error("db.namePattern is required, and cannot be undefined, null or ''.");
  if(!Check.exist(provider) || !Check.exist(provider.database)) throw new Error("A valid provider must be supplied.");

  const dbProvider = provider.database;
  
  if(!Check.isFunction(dbProvider.listCollections) ||
     !Check.isFunction(dbProvider.dropCollection) ||
     !Check.isFunction(dbProvider.createCollection) ) throw new Error("Provider does not have the required functions.");
  if(!Check.isObject(serializer)) throw new Error("A serializer is required.");
  if(!Check.isFunction(Collection)) throw new Error("The Collection class is required.");
  if(!Check.isFunction(DocumentFactory)) throw new Error("The DocumentFactory class is required.");

  const collectionCache = [];
  const prefix = Utils.render(config.get('db.namePattern'),{db:config.get('db')});

  const isOwned = collection => collection.startsWith(prefix);
  const nameFromFQN = fqn => fqn.substring(prefix.length,fqn.length);
  const buildCollection = name => {
    const fqn = {name,prefix};
    return new Collection(fqn, Utils.getCollectionConfig(fqn,config), dbProvider.collection, serializer, new DocumentFactory(fqn,provider,serializer), Common);
  }

  return {
    getName: () => config.get('db.name'),
    getCollectionNames: () => dbProvider.listCollections()
      .then( results => results
        .filter( fqn => isOwned( fqn ) )
        .map( collection => nameFromFQN( collection ) )
      ),
    createCollection: name => dbProvider.createCollection({name,prefix})
      .then( results => buildCollection(name) ),
    getCollection: name => Promise.resolve( collectionCache.find( collection => collection.name === name) ) 
      .then( collection => {
        if(collection) return collection;
        collection = buildCollection(name);
        collectionCache.push( collection );
        return collection;
      }),
    dropCollection: name => config.get('db.allowDrop',false) ? dbProvider.dropCollection({name,prefix}) : Promise.reject("Configuration does not allow collections to be dropped.")
  }
}