'use strict';

const chai           = require('chai');
const chaiAsPromised = require('chai-as-promised');
const expect         = chai.expect;

chai.should()
chai.use(chaiAsPromised)

const Collection = require('../src/Collection.js');

const Config   = function(config) {
  const instance = {
    get: (name,inlineDefault) => config[name] || inlineDefault
  }
  return instance;
}


const goodConfig = new Config({});

const fqn = {name:'test',prefix:'test.dev-'}

describe('Collection', () => {
  const findDocumentsResponse = [];
  const testSerializer = {
    serialize: toSerialize => JSON.stringify(toSerialize),
    deserialize: toDeserialize => JSON.parse(toDeserialize),
  }

  const testProvider = {
    findDocuments: () => Promise.resolve(findDocumentsResponse),
    getDocument: (name,id) => Promise.resolve({id:id}),
    deleteDocument: (name,id) => Promise.resolve(),
    putDocument: request => {
      return Promise.resolve({
        ETag:"'asdfasdfasdf'",
        Body: request.body
      })
    },
    setCollectionTags: () => Promise.resolve(),
    getCollectionTags: () => Promise.resolve(),
    buildListMetaData: () => {return {}}
  };

  const testDocumentFactory = {
    build: data => {

      const document = data.Body ? JSON.parse(data.Body) : data;
    
      document.getDocumentId = () => 'x';
      document.isModified = () => true;
      document.isCollided = () => false;
      document.signature = () =>'x';
      document.serialize = document => JSON.stringify(document);

      return document;
    }
  }

  describe('#new() Negative Tests', () => {
    it('to throw an exception for a bad fqn',() => expect(Collection)
      .to.throw("A valid fqn must be supplied, which should contain a name and prefix attribute."));

    it('to throw an exception for no configuration',() => {
      expect( () => new Collection(fqn) ).to.throw("A valid configuration must be supplied.")
      expect( () => new Collection(fqn,{}) ).to.throw("A valid configuration must be supplied.")
      expect( () => new Collection(fqn,{x:1}) ).to.throw("A valid configuration must be supplied.")
    });

    it('to throw an exception for missing the provider.',() => expect(() => new Collection(fqn,goodConfig))
      .to.throw("No provider was supplied, this object will have nothing to act upon."));

    it('to throw an exception for the provider being invalid.',() => expect(() => new Collection(fqn,goodConfig,{}))
      .to.throw("Provider does not have the required functions."));

    it('to throw an exception for missing the Document class.',() => expect(() => new Collection(fqn,goodConfig,testProvider))
      .to.throw("A serializer is required."));

    it('to throw an exception for missing the Document class.',() => expect(() => new Collection(fqn,goodConfig,testProvider,testSerializer))
      .to.throw("The DocumentFactory Class is required."));

  })

  describe('#new() Positive', () => {
    const collection = new Collection(fqn, goodConfig, testProvider, testSerializer, testDocumentFactory);

    it('Check signature',() => expect(collection)
      .to.have.all.keys('getName','getDocument','deleteDocument','find','saveDocument'));
  })

  describe('#getName()', () => {
    const collection = new Collection(fqn,goodConfig, testProvider, testSerializer, testDocumentFactory);
    it('Should create successfully and have a name',() => expect(collection.getName()).to.equal('test'));
  });

  describe('#find()', () => {
    const collection = new Collection(fqn,goodConfig, testProvider, testSerializer, testDocumentFactory);
    findDocumentsResponse.push('x');

    let found = collection.find();
    it('List ONE document',() => expect(found)
      .to.eventually.be.an('array')
      .with.deep.property('[0]')
      .with.deep.property('id')
      .that.equals('x'));

    findDocumentsResponse.push('y');

    found = collection.find();
    it('List TWO documents, x',() => expect(found)
      .to.eventually.be.an('array')
      .with.deep.property('[0]')
      .with.deep.property('id')
      .that.equals('x'));
    it('List TWO documents, y',() => expect(found)
      .to.eventually.be.an('array')
      .with.deep.property('[1]')
      .with.deep.property('id')
      .that.equals('y'));
  });

  describe('#getDocument()', () => {
    const collection = new Collection(fqn,goodConfig, testProvider, testSerializer, testDocumentFactory);
    it('Load document named x',() => expect(collection.getDocument('x'))
      .to.eventually.be.an('object').with.property('id').that.equals('x'));
  });

  describe('#getDocument()', () => {
    const collection = new Collection(fqn,goodConfig, testProvider, testSerializer, testDocumentFactory);
    it('Delete document named x',() => expect(collection.deleteDocument('x'))
      .to.eventually.be.undefined);
  })

  describe('#saveDocument() with ID.', () => {
    const collection = new Collection(fqn,goodConfig, testProvider, testSerializer, testDocumentFactory);

    it('invalid object',() => expect(collection.saveDocument(null))
      .to.eventually.be.rejectedWith('Cannot save undefined or null objects.'));

    it('has id',() => expect(collection.saveDocument({id:'x'}))
      .to.eventually.be.an('object').with.deep.property('id').that.equals('x'));
  })
  
  describe('#saveDocument() with no id', () => {

    const collection = new Collection(fqn,goodConfig, testProvider, testSerializer, testDocumentFactory);
    const noIdSave = collection.saveDocument({name:'poo'});
    it('id populated',() => expect(noIdSave)
      .to.eventually.be.an('object').with.deep.property('id'));

    it('name set',() => expect(noIdSave)
      .to.eventually.be.an('object').with.deep.property('name').that.equals('poo'));

  })
  
  describe('#saveDocument() with tricky id', () => {

    const collection = new Collection(fqn,goodConfig, testProvider, testSerializer, testDocumentFactory);
    const trickyId = collection.saveDocument({getId:'x',name:'poo'});
    it('id populated',() => expect(trickyId)
      .to.eventually.be.an('object').with.deep.property('id'));

    it('name set',() => expect(trickyId)
      .to.eventually.be.an('object').with.deep.property('name').that.equals('poo'));

    it('getId still set',() => expect(trickyId)
      .to.eventually.be.an('object').with.deep.property('getId').that.equals('x'));
  })
})
