import 'mocha'
import * as sinon from 'sinon'
import { expect, use } from 'chai'
import 'chai-as-promised'
import { collection, CollectionConfiguration, S3DB } from '../../src'
import { CollectionRegistry } from '../../src/collection/CollectionRegistry'

use(require('chai-as-promised'))

describe('decorators', () => {
  let sandbox: sinon.SinonSandbox

  beforeEach(() => {
    sandbox = sinon.createSandbox()
  })

  afterEach(() => {
    sandbox.restore()
  })

  it('should create new configuration when called', () => {
    const expectedConfig: CollectionConfiguration = new CollectionConfiguration()
    expectedConfig.name = 'test'
    expectedConfig.id = expectedConfig.name

    collection(expectedConfig)

    const config: CollectionConfiguration | undefined = CollectionRegistry.instance().resolve('test')

    expect(config).to.not.be.undefined
    expect(config).to.eql(expectedConfig)
  })

  it('should register a configuration', () => {
    @collection()
    class TestX {}

    const config: CollectionConfiguration | undefined = CollectionRegistry.instance().resolve('testx')

    expect(config).to.not.be.undefined
    expect(config.name).to.equal('testx')
  })

  it('should register a configuration with different name.', () => {
    @collection({ name: 'hello' })
    class TestX {}

    const config: CollectionConfiguration | undefined = CollectionRegistry.instance().resolve('testx')

    expect(config).to.not.be.undefined
    expect(config.name).to.equal('hello')
  })
})
