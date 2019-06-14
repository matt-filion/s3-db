import 'mocha'
import * as sinon from 'sinon'
import { expect, use } from 'chai'
import 'chai-as-promised'
import { Collection } from '../../src'
import { CollectionRegistry } from '../../src/collection/CollectionRegistry'

use(require('chai-as-promised'))

describe('Version Endpoint', () => {
  let sandbox: sinon.SinonSandbox

  beforeEach(() => {
    sandbox = sinon.createSandbox()
  })

  afterEach(() => {
    sandbox.restore()
  })

  it('should create with type as string value', () => {
    CollectionRegistry.instance().register({
      name: 'test',
    })
    expect(() => new Collection('test')).to.not.throw(Error)
  })

  it('should create with type as object value', () => {
    CollectionRegistry.instance().register({
      name: 'test',
    })
    class Test {}
    expect(() => new Collection(Test)).to.not.throw(Error)
  })

  it('should create with type as string value and prefix', () => {
    CollectionRegistry.instance().register({
      name: 'test',
    })
    expect(() => new Collection('test', '/xprefix')).to.not.throw(Error)
  })

  it('should create with type as object value', () => {
    CollectionRegistry.instance().register({
      name: 'test',
    })
    class Test {}
    expect(() => new Collection(Test, '/xprefix')).to.not.throw(Error)
  })

  it('should create sub collection, and have prefix', () => {
    CollectionRegistry.instance().register({
      name: 'test',
    })
    CollectionRegistry.instance().register({
      name: 'testchild',
    })
    class Test {}
    class TestChild {}
    const collection: Collection<Test> = new Collection(Test)
    const subCollection: Collection<TestChild> = collection.subCollection('/xprefix', TestChild)

    expect(subCollection).to.not.be.undefined
  })
})
