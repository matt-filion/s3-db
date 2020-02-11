import 'mocha'
import * as sinon from 'sinon'
import { expect, use } from 'chai'
import 'chai-as-promised'
import { collection, CollectionConfiguration } from '../../src'
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
})
