'use strict';

const chai           = require('chai');
const chaiAsPromised = require('chai-as-promised');
const expect         = chai.expect;

chai.should()
chai.use(chaiAsPromised)

const Database = require('../src/Database.js');
const Common = require('../src/lib/Common');

const Config   = function(config) {
  const instance = {
    get: name => config[name],
    update: props => {
      Object.assign(config,props)
      return instance;
    },
    childOf: name => new Config(config[name])
  }
  return instance;
}

const goodConfig = new Config({
  'db.name':'test',
  'db.environment': 'dev',
  'db.namePattern': '${db.name}.${db.environment}-${name}', 
  'db.allowDrop': false,
  // Needed for the scenario where the object is returned from config not just a specific value.
  db: {
    name: 'test',
    environment: 'dev'
  }
});

describe('new Database()', () => {
  const listCollectionResponse = ['test.dev-x','y'];
  const testProvider = {
    database: {
      listCollections: () => Promise.resolve(listCollectionResponse),
      dropCollection: () => Promise.resolve({ok:true}),
      createCollection: name => Promise.resolve({name})
    }
  };
  const testSerializer = {
    serialize: () => {},
    deserialize: () => {},
  }

  const TestCollection = function(name,configuration,provider,Document){
    return {name:'x'};
  }

  const TestDocumentFactory = function(name,configuration,provider,Document){
    return {name:'x'};
  }

  describe('Invalid Configurations', () => {
    it('to throw an exception for no configuration',() => expect(Database)
      .to.throw("A valid configuration must be supplied."));

    it('to throw an exception for a missing db.name in configuration.',() => expect(() => new Database(new Config({})))
      .to.throw("db.name is required, and cannot be undefined, null or ''."));

    it('to throw an exception for a missing db.namePattern in configuration.',() => expect(() => new Database(new Config({'db.name':'x'})))
      .to.throw("db.namePattern is required, and cannot be undefined, null or ''."));

    it('to throw an exception for provider missing from constructor.',() => expect(() => new Database(goodConfig) )
      .to.throw("A valid provider must be supplied."));

    it('to throw an exception for provider missing from constructor.',() => expect(() => new Database(goodConfig, {}) )
      .to.throw("A valid provider must be supplied."));

    it('to throw an exception for provider not having the required functions.',() => expect(() => new Database(goodConfig, {database:{}} ) )
      .to.throw("Provider does not have the required functions."));

    it('to throw an exception for serializer missing from constructor.',() => expect(() => new Database(goodConfig, testProvider ) )
      .to.throw("A serializer is required."));

    it('to throw an exception for Colection class missing from constructor.',() => expect(() => new Database(goodConfig, testProvider, testSerializer ) )
      .to.throw("The Collection class is required."));

    it('to throw an exception for Colection class missing from constructor.',() => expect(() => new Database(goodConfig, testProvider, testSerializer, function Collection(){} ) )
      .to.throw("The DocumentFactory class is required."));
  });

  describe('Check signature', () => {
    const database = new Database(goodConfig, testProvider, testSerializer, TestCollection, TestDocumentFactory);
    it('should have the expected methods',() => expect(database).to.have.all.keys(['getName','getCollectionNames','getCollection','dropCollection','createCollection']) );
  })

  describe('#getName()', () => {
    const database = new Database(goodConfig, testProvider, testSerializer, TestCollection, TestDocumentFactory);
    it('should have the defined database name.',() => expect(database.getName()).to.equal('test') );
  })

  describe('#getCollection()', () => {
    const database = new Database(goodConfig, testProvider, testSerializer, TestCollection, TestDocumentFactory);
    it('to return a collection.',() => expect(database.getCollection('test')).to.eventually.have.property('name').that.equals('x') );
  });

  describe('#getCollection() from cache', () => {
    const database = new Database(goodConfig, testProvider, testSerializer, TestCollection, TestDocumentFactory);
    database.getCollection('test');
    it('to return a collection.',() => expect(database.getCollection('test')).to.eventually.have.property('name').that.equals('x') );
  });

  describe('#createCollection()', () => {
    const database = new Database(goodConfig, testProvider, testSerializer, TestCollection, TestDocumentFactory);
    it('to create a new collection.',() => expect(database.createCollection('test')).to.eventually.have.property('name') );
  });

  describe('#dropCollection()', () => {
    it('to NOT allow a collection to be dropped by default.',() => expect(new Database(goodConfig, testProvider, testSerializer, TestCollection, TestDocumentFactory).dropCollection('test')).to.be.rejectedWith("Configuration does not allow collections to be dropped.") );
    it('to ALLOW a collection to be dropped by default.',() => expect(new Database(goodConfig.update({'db.allowDrop':true}), testProvider, testSerializer, TestCollection, TestDocumentFactory).dropCollection('test')).to.eventually.have.property("ok").that.equals(true) );
  });

  describe('#getCollectionNames()', () => {
    it('to list the collection.',() => {
      goodConfig.update({'db.namePattern': '${db.name}.${db.environment}-${name}'});
      listCollectionResponse.length = 0;
      listCollectionResponse.push('test.dev-x');
      listCollectionResponse.push('y');
      const database = new Database(goodConfig, testProvider, testSerializer, TestCollection, TestDocumentFactory);
      expect(database.getCollectionNames()).to.eventually.be.an('array').with.deep.property('[0]').that.equals('x') 
    });
  });

  describe('#getCollectionNames() using semi-colon pattern', () => {
    it('to list the collection.',() => {
      goodConfig.update({'db.namePattern': '${db.name}:${db.environment}::${name}'});
      listCollectionResponse.length = 0;
      listCollectionResponse.push('test:dev::x');
      listCollectionResponse.push('y');
      const database = new Database(goodConfig, testProvider, testSerializer, TestCollection, TestDocumentFactory);
      expect(database.getCollectionNames()).to.eventually.be.an('array').with.deep.property('[0]').that.equals('x') 
    });
  });

  describe('#getCollectionNames() using semi-colon and different order pattern', () => {
    it('to list the collection.',() => {
      goodConfig.update({'db.namePattern': '${db.environment}.${db.name}::${name}'});
      listCollectionResponse.length = 0;
      listCollectionResponse.push('dev.test::x');
      listCollectionResponse.push('dev:test::y');
      listCollectionResponse.push('dev.test-z');
      listCollectionResponse.push('y');
      const database = new Database(goodConfig, testProvider, testSerializer, TestCollection, TestDocumentFactory);
      const names    = database.getCollectionNames();
      expect(names).to.eventually.be.an('array').with.deep.property('[0]').that.equals('x') 
      expect(names).to.eventually.be.an('array').with.deep.property('length').that.equals(1) 
    });
  });
})
