'use strict';

const chai           = require('chai');
const chaiAsPromised = require('chai-as-promised');
const expect         = chai.expect;

chai.should()
chai.use(chaiAsPromised)

const Serializer = require('../src/lib/Serializer')

const Config   = function(config) {
  const instance = {
    get: (name,inlineDefault) => config[name] || inlineDefault
  }
  return instance;
}


describe('#new()', () => {

  const config = new Config({
    'serializer.serialize': undefined,
    'serializer.deserialize': undefined
  })

  it('to not be null',() => expect(new Serializer(config)).to.not.be.null);
  it('to have methods',() => expect(new Serializer(config)).to.have.all.keys('serialize','deserialize'));

})

describe('#serialize() json', () => {

  const config = new Config({
    // 'serializer.serialize': undefined,
    // 'serializer.deserialize': undefined
  })

  const serializer = new Serializer(config);
  const test = {'x':'y'};

  it('make json',() => expect(serializer.serialize(test) ).to.equal('{"x":"y"}'));
  it('make object from json',() => expect(serializer.deserialize('{"x":"y"}') ).to.have.property('x').that.equals('y'));

})

describe('#serialize() to base 64', () => {

  const config = new Config({
    'serializer.serialize': data => new Buffer(JSON.stringify(data),'utf8').toString('base64'),
    'serializer.deserialize': data => JSON.parse(new Buffer(data,'base64').toString('utf8'))
  })

  const serializer = new Serializer(config);
  const test = {'x':'y'};

  it('make json',() => expect(serializer.serialize(test) ).to.equal('eyJ4IjoieSJ9'));
  it('make object from json',() => expect(serializer.deserialize('eyJ4IjoieSJ9') ).to.have.property('x').that.equals('y'));

})

describe('#serialize() encrypted', () => {

  const algorithm = 'aes-256-ctr';
  const secret    = "supers3cret";
  const crypto    = require('crypto');

  const config    = new Config({
    'serializer.serialize': data => {
      const cipher    = crypto.createCipher(algorithm,secret);
      let crypted = cipher.update(JSON.stringify(data),'utf8','hex');
      crypted += cipher.final('hex')
      return crypted;
    },
    'serializer.deserialize': data => {
      const decipher  = crypto.createDecipher(algorithm,secret)
      let dec = decipher.update(data,'hex','utf8')
      dec += decipher.final('utf8');
      return JSON.parse(dec);
    }
  })

  const serializer = new Serializer(config);
  const test = {'x':'y'};

  it('make json',() => expect(serializer.serialize(test) ).to.equal('0a58239574c3d7af2c'));
  it('make object from json',() => expect(serializer.deserialize('0a58239574c3d7af2c') ).to.have.property('x').that.equals('y'));

})