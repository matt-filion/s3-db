
const chai           = require('chai');
const chaiAsPromised = require('chai-as-promised');
const expect         = chai.expect;

chai.should()
chai.use(chaiAsPromised)

const Database = require('../src/Database.js');

describe('Database', () => {
  const testProvider = {
    listCollections: () => Promise.resolve(['test.dev-x','y']),
    dropCollection: () => Promise.resolve({ok:true}),
    createCollection: () => Promise.resolve({})
  };

  const TestCollection = function(name,configuration,provider,Document){
    return {name:'x'};
  }

  describe('Invalid Configurations', () => {
    it('to throw an exception for no configuration',() => expect(Database)
      .to.throw("A configuration must be supplied."));

    it('to throw an exception for a missing DB in configuration.',() => expect(() => new Database({}))
      .to.throw("A configuration must have a value defined for 'db'."));

    it('to throw an exception for missing collection in configuration.',() => expect(() => new Database({db:'test'}))
      .to.throw("A configuration must have an object for the 'collection' attribute."));

    it('to throw an exception for missing collection.isOwned in configuration',() => expect(() => new Database({db:'test',collection:{}}))
      .to.throw("A configuration must have a function for the 'collection.isOwned' attribute."));

    it('to throw an exception for collection.isOwned in configuration being a function',() => expect(() => new Database({db:'test',collection:{isOwned:'string'}}))
      .to.throw("A configuration must have a function for the 'collection.isOwned' attribute."));

    it('to throw an exception for missing collection.parseName in configuration',() => expect(() => new Database({db:'test',collection:{isOwned:()=>{}}}))
      .to.throw("A configuration must have a function for the 'collection.parseName' attribute."));

    it('to throw an exception for collection.parseName in configuration being a function',() => expect(() => new Database({db:'test',collection:{isOwned:()=>{},parseName:'string'}}))
      .to.throw("A configuration must have a function for the 'collection.parseName' attribute."));

    it('to throw an exception for provider missing from constructor.',() => expect(() => new Database({db:'test',collection:{isOwned:()=>{},parseName:()=>{}}} ) )
      .to.throw("No provider was supplied, this object will have nothing to act upon."));

    it('to throw an exception for provider not having the required functions.',() => expect(() => new Database({db:'test',collection:{isOwned:()=>{},parseName:()=>{}}}, {} ) )
      .to.throw("Provider does not have the required functions."));

    it('to throw an exception for Colection class missing from constructor.',() => expect(() => new Database({db:'test',collection:{isOwned:()=>{},parseName:()=>{}}}, testProvider ) )
      .to.throw("The Collection class is required."));
  })

  describe('Good Configuration', () => {
    const database = new Database({
      db:'test',
      // allowDrop: false,
      provider: {
        name:'aws-s3',
        region: 'us-west-2'
      },
      collection: {
        name: name  => `test.dev-${name}`,
        isOwned: fqn => fqn.startsWith('test.dev-'),
        parseName: fqn => fqn.substring('test.dev-'.length)
      }
    }, testProvider, TestCollection);
    it('should have the expected methods',() => expect(database).to.have.all.keys(['getName','getCollectionNames','getCollection','dropCollection','createCollection']) );
    it('should have the defined database name.',() => expect(database.getName()).to.equal('test') );
    it('to return a collection.',() => expect(database.getCollection('test')).to.eventually.have.property('name').that.equals('x') );
    it('to create a new collection.',() => expect(database.createCollection('test')).to.eventually.have.property('name') );
    it('to not allow a collection to be dropped by default.',() => expect(database.dropCollection('test')).to.be.rejectedWith("Configuration does not allow collections to be dropped.") );
    it('to list the collection.',() => expect(database.getCollectionNames()).to.eventually.be.an('array').with.deep.property('[0]').that.equals('x') );
  })
})
