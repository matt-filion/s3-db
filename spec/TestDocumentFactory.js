'use strict';

const chai           = require('chai');
const chaiAsPromised = require('chai-as-promised');
const expect         = chai.expect;

chai.should()
chai.use(chaiAsPromised)

const DocumentFactory = require('../src/DocumentFactory.js');
const Common = require('../src/lib/Common');
const testProvider = {
  document: {
    getDocumentBody: data => data.Body,
    buildDocumentMetaData: () => {
      return {
        x:'y'
      }
    }
  }
}
const testSerializer = {
  serialize: toSerialize => JSON.stringify(toSerialize),
  deserialize: toDeserialize => toDeserialize,
}
const testCollection = {};

describe('#new()', () => {
  it('No args.',() => expect( () => new DocumentFactory())
    .to.throw("A valid collectionFQN must be supplied, which should contain a name and prefix attribute."));

  it('Valid fqn',() => expect( () => new DocumentFactory({name:'x',prefix:'test.dev'}))
    .to.throw("No provider was supplied, this object will have nothing to act upon."));

  it('Valid fqn, invalid provider',() => expect( () => new DocumentFactory({name:'x',prefix:'test.dev'},{}))
    .to.throw("No provider was supplied, this object will have nothing to act upon."));

  it('Valid fqn, partial provider',() => expect( () => new DocumentFactory({name:'x',prefix:'test.dev'},{buildDocumentMetaData:()=>{}}))
    .to.throw("No provider was supplied, this object will have nothing to act upon."));

  it('Valid fqn, valid provider',() => expect( () => new DocumentFactory({name:'x',prefix:'test.dev'},testProvider))
    .to.throw("A serializer is required."));

  const dbf = new DocumentFactory({name:'x',prefix:'test.dev'},testProvider,testSerializer);
  it('All Valid',() => expect( dbf ).to.have.all.keys('build'));  

})

describe('#build()', () => {
  const dbf = new DocumentFactory({name:'x',prefix:'test.dev'},testProvider,testSerializer);
  const document = dbf.build({Body:{id:'1',abc:'123'}},'id',testCollection);
  it('Make sure all keys exist.',() => expect( document ).to.have.all.keys(Common.METANAME,'abc','rename','delete','getId','id','isModified','refresh','save','copyTo','getMetadata'));
  it('has a refresh()',() => expect( document ).to.have.property('refresh').that.is.an('function'));
  it('has a isModified()',() => expect( document ).to.have.property('isModified').that.is.an('function'));
  it('has a save()',() => expect( document ).to.have.property('save').that.is.an('function'));
  it('has a delete()',() => expect( document ).to.have.property('delete').that.is.an('function'));
  it('has a getId()',() => expect( document ).to.have.property('getId').that.is.an('function'));
  it('has a rename()',() => expect( document ).to.have.property('rename').that.is.an('function'));
  it('has a copyTo()',() => expect( document ).to.have.property('copyTo').that.is.an('function'));
  it('has a metadata function',() => expect( document ).to.have.property('getMetadata').that.is.an('function'));
  it('has a metadata function',() => expect( document ).to.have.property(Common.METANAME).that.is.an('function'));
  it('has property id', () => expect( document ).to.have.property('abc').that.equals('123') )
  it('has property id', () => expect( document ).to.have.property('id').that.equals('1') )
  it('has property id, that equals .getId()', () => expect( document ).to.have.property('id').that.equals(document.getId()) )
  it('has metadata, with x = y', () => expect(document[Common.METANAME]()).to.have.property("x").that.equals('y'));
});