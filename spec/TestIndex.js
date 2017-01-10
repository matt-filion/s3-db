
const chai           = require('chai');
const chaiAsPromised = require('chai-as-promised');
const expect         = chai.expect;

chai.should()
chai.use(chaiAsPromised)

const s3db = require('../src/index.js');

describe('Index.js', () => {
  describe('Default Configuration', () => {
    const db = s3db();
    it('Should have the expected methods',() => expect(db).to.have.all.keys(['getName','getCollectionNames','getCollection','dropCollection','createCollection']) );
    it('Should have the default database name.',() => expect(db.getName()).to.equal('s3-db') );
  })

  describe('process.env Configuration', () => {
    process.env.S3DB_NAME = '1234321'
    const db = s3db();
    it('Should have the expected methods',() => expect(db).to.have.all.keys(['getName','getCollectionNames','getCollection','dropCollection','createCollection']) );
    it('Should have the default database name.',() => expect(db.getName()).to.equal('1234321') );
    process.env.S3DB_NAME = null;
  })

  describe('Override Everything', () => {
    const configuration = {
      db: 's3-db2',
      environment: 'labratory',
      region: 'us-east-1',
      onlyUpdateOnMD5Change: false,
      collideOnMissmatch: false,
      pageSize : 10,
      bucket: {
        name: name  => `${configuration.db}--${configuration.environment}-${name}`,
        isOwned: fqn => fq.startsWith(configuration.bucket.name('')),
        parseName: fqn => fqn.substring(configuration.bucket.name('').length+1)
      },
      id: {
        attributeName: 'id',
        generator: collectionName => `${configuration.db}-${collectionName}-${new Date().getTime()}`
      }
    };
    const db = s3db(configuration);
    it('Should have the expected methods',() => expect(db).to.have.all.keys(['getName','getCollectionNames','getCollection','dropCollection','createCollection']) );
    it('Should have the default database name.',() => expect(db.getName()).to.equal('s3-db2') );
  })
})
