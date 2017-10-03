'use strict';

const chai           = require('chai');
const chaiAsPromised = require('chai-as-promised');
const expect         = chai.expect;

chai.should()
chai.use(chaiAsPromised)

const Collection = require('../src/Collection.js');
const Common     = require('../src/lib/Common');
const Utils      = Common.Utils;

const Config   = function(config) {
  const instance = {
    get: (name,inlineDefault) => config[name] || inlineDefault
  }
  return instance;
}


const goodConfig = new Config({});

const fqn = {name:'test',prefix:'test.dev-'}

describe('Collection', () => {

  const findDocumentsResponse = {
    Contents:[],
    Name: 'test.dev-test',
    Prefix: '',
    MaxKeys: 100,
    CommonPrefixes: [],
    KeyCount: 100,
    ContinuationToken: '135ipUQ/7EDv+SyiVx753bm/eUa/dNOEGML+XqmdRmq8sJhAYsnQ5KIE0mMnCX46rzvdgQ7iwkMG6kh70j9eqcQjx00aa+QxWM+ekP6wy71MXMN0Xg7toeA==',
    NextContinuationToken: '1uVBr1bO2L5yAGuDXA5q9wZg1U/SjLP8je9V4QeAOgsZgssgB4NT88Mio1kxIjdjMqAxmktzej+y5mkddWTUd+SaA6ezF+JZRMPN78hMmeKgTOwtPoTLogw==' 
  };
  const testSerializer        = {
    serialize: toSerialize => JSON.stringify(toSerialize),
    deserialize: toDeserialize => JSON.parse(toDeserialize),
  }

  const testProvider = {
    collection: {
      getDocumentHead: (fqn,docId) => Promise.resolve({md5:'1234567890'}),
      findDocuments: () => Promise.resolve(findDocumentsResponse),
      getDocument: (name,id) => Promise.resolve({id:id}),
      deleteDocument: (name,id) => Promise.resolve(),
      putDocument: request => Promise.resolve({
        ETag: "'asdfasdfasdf'",
        MetaData: request.metadata,
        Body: request.body
      }),
      copyDocument: (source,newId) => {
        return Promise.resolve({
          CopyObjectResult: {
            ETag: '12345678990',
            LastModified: ''
          }
        });
      },
      buildDocumentMetaData: document => {
       const metadata = document.Metadata || {};
        
        Object.keys(metadata).forEach( key => metadata[key] = JSON.parse(metadata[key]) );
        metadata['ETag']  = "'1234567890'";

        return metadata;
      },
      buildListMetaData: () => {return {}}
    }
  };

  const testDocumentFactory = function() { return {
    build: data => {

      const document = data.Body ? JSON.parse(data.Body) : data;
    
      document.getId       = () => 'x';
      document.isModified  = () => true;
      document.getMetadata = () => Utils.getMetaData(document);
      document.save        = () => document;
      document.refresh     = () => document;
      document.copyTo      = (collection,id) => document;

      Utils.setMetaData(document,Object.assign(data.MetaData || {}, {eTag:'1234567890',collectionFQN:'x'}));

      return document;
    }
  } }

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
      .to.throw("No provider was supplied, this object will have nothing to act upon."));

    it('to throw an exception for the provider being invalid.',() => expect(() => new Collection(fqn,goodConfig,{collection:{}}))
      .to.throw("Provider does not have the required functions."));

    it('to throw an exception for missing the Document class.',() => expect(() => new Collection(fqn,goodConfig,testProvider))
      .to.throw("A serializer is required."));

    it('to throw an exception for missing the Document class.',() => expect(() => new Collection(fqn,goodConfig,testProvider,testSerializer))
      .to.throw("The DocumentFactory Class is required."));

  })

  describe('#new() Positive', () => {
    const collection = new Collection(fqn, goodConfig, testProvider, testSerializer, testDocumentFactory);

    it('Check signature',() => expect(collection)
      .to.have.all.keys('getName','getFQN','getDocument','deleteDocument','find','saveDocument','subCollection','copy','exists','getHead'));
  })

  describe('#subCollection() Positive', () => {
    const collection    = new Collection(fqn, goodConfig, testProvider, testSerializer, testDocumentFactory);
    const subCollection = collection.subCollection('child');

    it('Check signature',() => expect(subCollection)
      .to.have.all.keys('getName','getFQN','getDocument','deleteDocument','find','saveDocument','subCollection','copy','exists','getHead'));

    it('check Name', () => expect(subCollection.getName()).to.equal('test/child'));
    it('check FQN', () => expect(subCollection.getFQN()).to.have.property('name').that.equals('test/child'));

    /*
     * Provider will take care of translating the name to include 
     *  or exclude the preceeding name segment.
     */
    it('has id',() => expect(subCollection.saveDocument({id:'x'}))
      .to.eventually.be.an('object').with.deep.property('id').that.equals('x'));

  })

  describe('#getName()', () => {
    const collection = new Collection(fqn,goodConfig, testProvider, testSerializer, testDocumentFactory);
    it('Should create successfully and have a name',() => expect(collection.getName()).to.equal('test'));
  });

  describe('#find()', () => {
    const collection = new Collection(fqn,goodConfig, testProvider, testSerializer, testDocumentFactory);

    findDocumentsResponse.Contents.push({Key:'x',LastModified:JSON.stringify(new Date())});

    let found = collection.find();
    it('List ONE document',() => expect(found)
      .to.eventually.be.an('array')
      .with.deep.property('[0]')
      .with.deep.property('id')
      .that.equals('x'));

    findDocumentsResponse.Contents.push({Key:'y',LastModified:JSON.stringify(new Date())});

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

  describe('#deleteDocument()', () => {
    const collection = new Collection(fqn,goodConfig, testProvider, testSerializer, testDocumentFactory);
    it('Delete document named x',() => expect(collection.deleteDocument('x'))
      .to.eventually.be.undefined);
  })

  
  describe('#saveDocument()', () => {

    let collection = new Collection(fqn,goodConfig, testProvider, testSerializer, testDocumentFactory);

    it('invalid object',() => expect(collection.saveDocument(null))
      .to.eventually.be.rejectedWith('Cannot save undefined or null objects.'));

    it('has id',() => expect(collection.saveDocument({id:'x'}))
      .to.eventually.be.an('object').with.deep.property('id').that.equals('x'));

    const noIdSave = collection.saveDocument({name:'poo'});
    it('id populated',() => expect(noIdSave)
      .to.eventually.be.an('object').with.deep.property('id'));

    it('name set',() => expect(noIdSave)
      .to.eventually.be.an('object').with.deep.property('name').that.equals('poo'));

    it('name set',() => expect(noIdSave)
      .to.eventually.be.an('object').with.deep.property('name').that.equals('poo'));

    it('manipulate metadata to item',() => {
      let manipulatorCollection = new Collection(fqn, new Config({
          metadataUpdate:metadata=>{
          metadata.added = true;
          return metadata;
        }
      }), testProvider, testSerializer, testDocumentFactory);
      return manipulatorCollection.saveDocument({name:'poo',id:'100'},{foo:'bar'}).then( result => {
        return expect(result.getMetadata()).to.have.property('added').that.equals(true);
      })
    });

    const trickyId = collection.saveDocument({getId:'x',name:'poo'});

    it('tricky id populated',() => expect(trickyId)
      .to.eventually.be.an('object').with.deep.property('id'));

    it('tricky name set',() => expect(trickyId)
      .to.eventually.be.an('object').with.deep.property('name').that.equals('poo'));

    it('tricky getId set to function',() => expect(trickyId)
      .to.eventually.be.an('object').with.deep.property('getId').that.is.a('function'));

    const config = new Config({
      'id.propertyName': 'x',
      'id.generator': document => {
        return `x_${document.name}-z`;
      }
    })

    collection = new Collection(fqn, config, testProvider, testSerializer, testDocumentFactory);

    it('generate an id for the copied document to a custom attribute',() => expect(collection.saveDocument({name:'y'}))
      .to.eventually.be.an('object').with.deep.property('x').that.equals('x_y-z'));

    it('collisionValidator on item',() => expect(new Collection(fqn, new Config({
        'collideOnMissmatch': true,
        'collisionValidator': (thisMetadata,thatMetadata,document) =>{
          return true;
        }
      }), testProvider, testSerializer, testDocumentFactory).saveDocument({
        getId: () => '123',
        name:'y'
      })) 
      .to.eventually.be.rejectedWith('Collision, the document has been modified.'));

      

    it('add metadata to item',() => {
      return collection.saveDocument({name:'poo',id:'100'},{foo:'bar'}).then( result => {
        return expect(result.getMetadata()).to.have.property('foo').that.equals('bar');
      })
    });
  })

  describe('#copy()', () => {

    const updatedName = new Config({
      'id.propertyName': 'x',
      'id.generator': document => {
        return `x_${document.name}-z`;
      }
    })
    const thatFQN = {name:'other',prefix:'test.dev-'};
    const thatCollection = new Collection(thatFQN, goodConfig, testProvider, testSerializer, testDocumentFactory);
    const thisCollection = new Collection(fqn, updatedName, testProvider, testSerializer, testDocumentFactory);

    /*
     * The ID of the document should be updated based on the configuration of the new
     *  target collection the document is being copied into.
     */
    it('Generated ID ',() => {
      const copiedDocument = thatCollection.saveDocument({name:'y'}).then( newDocument => thisCollection.copy(newDocument) )
      return expect(copiedDocument).to.eventually.be.an('object').with.deep.property('x').that.equals('x_y-z')
    });

    /*
     * The ID of the document should be updated based on the configuration of the new
     *  target collection the document is being copied into.
     */
    it('Provided ID',() => {
      const copiedDocument = thatCollection.saveDocument({name:'y'}).then( newDocument => thisCollection.copy(newDocument,'SuperDoo') )
      return expect(copiedDocument).to.eventually.be.an('object').with.deep.property('x').that.equals('SuperDoo')
    });
  })
})
