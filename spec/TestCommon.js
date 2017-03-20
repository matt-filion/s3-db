'use strict';

const chai           = require('chai');
const chaiAsPromised = require('chai-as-promised');
const expect         = chai.expect;

chai.should()
chai.use(chaiAsPromised)

const Common = require('../src/lib/Common')

describe('uuid', () => {
  it('to not be null',() => expect(Common.uuid()).to.not.be.null);
  it('to not be undefined',() => expect(Common.uuid()).to.not.be.undefined);
  it('to be 36 characters',() => expect(Common.uuid()).to.have.lengthOf(36));
})

describe('Utils', () => {
  const Utils = Common.Utils;

  describe('#setMetaData()',()=>{
    const value = {};
    Utils.setMetaData(value,{name:'matt'})
    it('should add attribute',() => expect(value).to.have.property(Common.METANAME))
    it('attribute should be a function that returns expected value',() => expect(value[Common.METANAME]()).to.have.property('name').that.equals('matt'))
  })

  describe('#dotNotation()', () => {
    const object = {
      deep : {
        value: {
          child: 'x'
        }
      }
    };
    it('should get the deep value', () => expect( Utils.dotNotation('deep.value.child',object) ).to.equal('x'))
  })

  describe('#render()', () => {
    const data = {name:'matt',title:'beast'};
    it('should replace values', () => {
      expect(Utils.render('Hello ${name}, you sexy ${title}',data)).to.equal('Hello matt, you sexy beast')
    })
  })

  describe('#signature()',()=>{
    it('should create expected md5 hash', () => expect(Utils.signature('XYZ1234')).to.equal('K4gHhP85mat1opf5oR1LKQ=='))
    it('should create expected md5 hash', () => expect(Utils.signature()).to.equal(''))
  })
})

describe('Check', () => {
  const Check = Common.Check;
  describe('exists()', () => {
    it('undefined to be false',() => expect(Check.exist(undefined)).to.equal(false));
    it('null to be false',() => expect(Check.exist(null)).to.equal(false));
    it('\'\' to be true',() => expect(Check.exist('')).to.equal(true));
    it('\'false\' to be true',() => expect(Check.exist('false')).to.equal(true));
    it('\'true\' to be true',() => expect(Check.exist('true')).to.equal(true));
    it('\'undefined\' to be true',() => expect(Check.exist('undefined')).to.equal(true));
    it('\'null\' to be true',() => expect(Check.exist('null')).to.equal(true));
    it('{} to be true',() => expect(Check.exist({})).to.equal(true));
    it('false to be true',() => expect(Check.exist(false)).to.equal(true));
    it('true to be true',() => expect(Check.exist(true)).to.equal(true));
    it('1 to be true',() => expect(Check.exist(1)).to.equal(true));
    it('0 to be true',() => expect(Check.exist(-1)).to.equal(true));
    it('-1 to be true',() => expect(Check.exist(0)).to.equal(true));
  });

  describe('isFunction()', () => {
    it('null to be false',() => expect(Check.isFunction(null)).to.equal(false));
    it('undefined to be false',() => expect(Check.isFunction(undefined)).to.equal(false));
    it('{} to be false',() => expect(Check.isFunction({})).to.equal(false));
    it('\'\' to be false',() => expect(Check.isFunction('')).to.equal(false));
    it('false to be false',() => expect(Check.isFunction(false)).to.equal(false));
    it('1 to be false',() => expect(Check.isFunction(1)).to.equal(false));
    it('new Date() to be false',() => expect(Check.isFunction(new Date())).to.equal(false));

    it('() => {} to be true',() => expect(Check.isFunction(() => {})).to.equal(true));
    it('function() {} to be true',() => expect(Check.isFunction(function() {})).to.equal(true));
  })

  describe('isObject()', () => {
    it('null to be false',() => expect(Check.isObject(null)).to.equal(false));
    it('undefined to be false',() => expect(Check.isObject(undefined)).to.equal(false));
    it('\'\' to be false',() => expect(Check.isObject('')).to.equal(false));
    it('false to be false',() => expect(Check.isObject(false)).to.equal(false));
    it('1 to be false',() => expect(Check.isObject(1)).to.equal(false));
    it('() => {} to be false',() => expect(Check.isObject(() => {})).to.equal(false));
    it('function() {} to be false',() => expect(Check.isObject(function() {})).to.equal(false));

    it('{} to be true',() => expect(Check.isObject({})).to.equal(true));
    it('new Date() to be true',() => expect(Check.isObject(new Date())).to.equal(true));
  })
});