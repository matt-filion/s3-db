const chai           = require('chai');
const chaiAsPromised = require('chai-as-promised');
const expect         = chai.expect;

chai.should()
chai.use(chaiAsPromised)

const Collection = require('../src/Collection.js');

// const Document = require('../src/Document');
// console.log("Document",Document.getDocumentId)
// console.log("Document",typeof Document)

describe('Collection', () => {
  const testProvider = {
    findDocuments: () => Promise.resolve(['x','y']),
    getDocument: (name,id) => Promise.resolve({id:id}),
    deleteDocument: (name,id) => Promise.resolve(),
    putDocument: document => Promise.resolve(document),
    setCollectionTags: () => Promise.resolve(),
    getCollectionTags: () => Promise.resolve(),
    buildListMetaData: () => {return {}}
  };

  const TestDocument = {
    getDocumentId: () => 'x',
    isModified: () => true,
    signature: () =>'x',
    serialize: document => JSON.stringify(document),
    new: (data,provider,collection) =>{ return data }
  }

  describe('Invalid Configurations', () => {
    it('to throw an exception for no configuration',() => expect(Collection)
      .to.throw("A name must be supplied."));

    // it('to throw an exception for no configuration',() => expect(new Collection('Test'))
    //   .to.throw("A configuration must be supplied."));

    it('to throw an exception for a missing collection in configuration.',() => expect(() => new Collection('test',{}))
      .to.throw("A configuration must have an object for the 'collection' attribute."));

    it('to throw an exception for missing collection.name in configuration.',() => expect(() => new Collection('test',{collection: {}}))
      .to.throw("A configuration must have a function for the 'collection.name' attribute."));

    it('to throw an exception for missing collection.name in configuration.',() => expect(() => new Collection('test',{collection: {name:''}}))
      .to.throw("A configuration must have a function for the 'collection.name' attribute."));

    it('to throw an exception for missing id object in configuration.',() => expect(() => new Collection('test',{collection: {name:()=>{}}}))
      .to.throw("A configuration must have an object for the 'id' attribute."));

    it('to throw an exception for missing id.propertyname object in configuration.',() => expect(() => new Collection('test',{collection: {name:()=>{}},id:{}}))
      .to.throw("A configuration must have a value for the 'id.propertyName' attribute."));

    it('to throw an exception for missing id.generator in configuration.',() => expect(() => new Collection('test',{collection: {name:()=>{}},id:{propertyName:'id'}}))
      .to.throw("A configuration must have a function for the 'id.generator' attribute."));

    it('to throw an exception for id.generator in configuration being wrong type.',() => expect(() => new Collection('test',{collection: {name:()=>{}},id:{propertyName:'id',generator:'x'}}))
      .to.throw("A configuration must have a function for the 'id.generator' attribute."));

    it('to throw an exception for missing the provider.',() => expect(() => new Collection('test',{collection: {name:()=>{}},id:{propertyName:'id',generator:()=>{}}}))
      .to.throw("No provider was supplied, this object will have nothing to act upon."));

    it('to throw an exception for the provider being invalid.',() => expect(() => new Collection('test',{collection: {name:()=>{}},id:{propertyName:'id',generator:()=>{}}},{}))
      .to.throw("Provider does not have the required functions."));

    it('to throw an exception for missing the Document class.',() => expect(() => new Collection('test',{collection: {name:()=>{}},id:{propertyName:'id',generator:()=>{}}},testProvider))
      .to.throw("The Document class is required."));

    const InvalidTestDocument = {};
    it('to throw an exception for Document class being invalid.',() => expect(() => new Collection('test',{collection: {name:()=>{}},id:{propertyName:'id',generator:()=>{}}},testProvider,InvalidTestDocument))
      .to.throw("The Document class does not have the required functions."));
  })

  describe('Positive Tests', () => {
    const collection = new Collection('test',{collection: {name:()=>{}},id:{propertyName:'id',generator:()=>{}}}, testProvider, TestDocument);

    it('to be a valid configuration and return a collection.',() => expect(collection)
      .to.have.all.keys('getName','getDocument','deleteDocument','find','saveDocument'));

    it('to be a valid configuration and return a collection.',() => expect(collection.getName())
      .to.equal('test'));

    it('to be able to find documents',() => expect(collection.find())
      .to.eventually.be.an('array')
      .with.deep.property('[0]')
      .with.deep.property('id')
      .that.equals('x'));

    it('to be able to load a document',() => expect(collection.getDocument('x'))
      .to.eventually.be.an('object')
      .with.deep.property('id')
      .that.equals('x'));

    it('to be able to delete a document',() => expect(collection.deleteDocument('x'))
      .to.eventually.be.undefined);

    it('to be able to save a document',() => expect(collection.saveDocument({id:'x'}))
      .to.eventually.be.an('object')
      .with.deep.property('id')
      .that.equals('x'));

  })
})
