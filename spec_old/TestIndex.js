'use strict';

const chai           = require('chai');
const chaiAsPromised = require('chai-as-promised');
const expect         = chai.expect;

chai.should()
chai.use(chaiAsPromised)

const Database = require('../src/index.js');

describe('Index.js', () => {

  describe('Default Configuration', () => {
    const db = new Database();
    it('Should have the expected methods',() => expect(db).to.have.all.keys(['getName','getCollectionNames','getCollection','dropCollection','createCollection']) );
    it('Should have the default database name.',() => expect(db.getName()).to.equal('s3-db') );
  })

  describe('process.env Configuration', () => {
    process.env.S3DB_NAME = '1234321'
    const db = new Database();
    it('Should have the expected methods',() => expect(db).to.have.all.keys(['getName','getCollectionNames','getCollection','dropCollection','createCollection']) );
    it('Should have the default database name.',() => expect(db.getName()).to.equal('1234321') );
    delete process.env.S3DB_NAME;
  })

  describe('Override Everything', () => {
    const configuration = {
      db: {
        name: 's3-db2',
        environment: 'labratory',
        pageSize : 10,
        allowDrop: true
      },
      provider: {
        name: 'azure-drive',
        region: 'us-east-1'
      },
      collections: {
        default: {
          onlyUpdateOnMD5Change: false,
          collideOnMissmatch: false,
          pageSize: 1000,
          encryption: false,
          id: {
            propertyName: 'id',
            generator: document => `${configuration.db.name}-${document.name}-${new Date().getTime()}`
          }
        }
      }
    };
    const db = new Database(configuration);
    it('Should have the expected methods',() => expect(db).to.have.all.keys(['getName','getCollectionNames','getCollection','dropCollection','createCollection']) );
    it('Should have the default database name.',() => expect(db.getName()).to.equal('s3-db2') );
  })
})
