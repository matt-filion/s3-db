import 'mocha'
import * as sinon from 'sinon'
import { expect, use } from 'chai'
import 'chai-as-promised'

import { CollectionConfiguration } from '../../../src/collection/CollectionConfiguration'
import { LoadBehavior } from '../../../src/collection/behaviors/LoadBehavior'
import { S3Client } from '../../../src/s3'
import { GetObjectOutput } from 'aws-sdk/clients/s3'
import S3 = require('aws-sdk/clients/s3')
import { Request, AWSError } from 'aws-sdk'
import { PromiseResult } from 'aws-sdk/lib/request'

use(require('chai-as-promised'))

process.env.LOG_LEVEL = 'info;S3DB.LoadBehavior debug;'

describe('LoadBehavior', () => {
  let sandbox: sinon.SinonSandbox
  let configuration: CollectionConfiguration
  let s3: S3
  let s3Client: S3Client

  beforeEach(() => {
    sandbox = sinon.createSandbox()
    configuration = sinon.createStubInstance(CollectionConfiguration)
    configuration.serialization = {
      deserialize: (body: string) => JSON.parse(body),
      serialize: (body: any) => JSON.stringify(body),
    }
    s3 = new S3({ endpoint: 'localhost', maxRetries: 1, httpOptions: { timeout: 1 } })
    s3Client = new S3Client(s3)

    sinon.stub(s3Client, 's3').returns(s3)
  })

  afterEach(() => {
    sandbox.restore()
  })

  it('new()', () => {
    expect(() => new LoadBehavior(configuration, s3Client, 'some-bucket')).to.not.throw(Error)
  })

  describe('load()', () => {
    let loadBehavior: LoadBehavior<any>

    beforeEach(() => {
      sandbox = sinon.createSandbox()
      loadBehavior = new LoadBehavior(configuration, s3Client, 'some-bucket')
    })

    afterEach(() => {
      sandbox.restore()
    })

    it('successfully', async () => {
      const response: Request<GetObjectOutput, AWSError> = new Request<GetObjectOutput, AWSError>(s3, 'getObject')
      sinon.stub(response, 'promise').resolves({
        Body: Buffer.from('{"var":"my body"}', 'utf8'),
        StorageClass: 'test',
        ContentLength: 10,
        LastModified: new Date(),
        ETag: '"test"',
        ServerSideEncryption: 'AES256',
        VersionId: '12',
      } as PromiseResult<GetObjectOutput, AWSError>)

      sinon.stub(s3, 'getObject').returns(response)

      const doc: any = await loadBehavior.load('someId')
      expect(doc).to.not.be.undefined
      expect(doc)
        .to.have.property('var')
        .that.equals('my body')
    })

    it('fail on not-found', async () => {
      const response: Request<GetObjectOutput, AWSError> = new Request<GetObjectOutput, AWSError>(s3, 'getObject')
      sinon.stub(response, 'promise').rejects({
        type: 'Error',
        message: 'The specified key does not exist.',
        stack:
          'NoSuchKey: The specified key does not exist.\n    at Request.extractError (/var/runtime/node_modules/aws-sdk/lib/services/s3.js:816:35)\n    at Request.callListeners (/var/runtime/node_modules/aws-sdk/lib/sequential_executor.js:106:20)\n    at Request.emit (/var/runtime/node_modules/aws-sdk/lib/sequential_executor.js:78:10)\n    at Request.emit (/var/runtime/node_modules/aws-sdk/lib/request.js:683:14)\n    at Request.transition (/var/runtime/node_modules/aws-sdk/lib/request.js:22:10)\n    at AcceptorStateMachine.runTo (/var/runtime/node_modules/aws-sdk/lib/state_machine.js:14:12)\n    at /var/runtime/node_modules/aws-sdk/lib/state_machine.js:26:10\n    at Request.<anonymous> (/var/runtime/node_modules/aws-sdk/lib/request.js:38:9)\n    at Request.<anonymous> (/var/runtime/node_modules/aws-sdk/lib/request.js:685:12)\n    at Request.callListeners (/var/runtime/node_modules/aws-sdk/lib/sequential_executor.js:116:18)',
        code: 'NoSuchKey',
        region: null,
        time: '2020-02-21T06:38:32.105Z',
        requestId: '09217AC3594E645E',
        extendedRequestId: '00ESmazKMDQYfZa52XjfX6A+OCVdzRUO/ulArIDj379n6pMBORnQe+9pjDX5+z24FyrXv0BsPRA=',
        statusCode: 404,
        retryable: false,
        retryDelay: 54.901082426991636,
      })

      sinon.stub(s3, 'getObject').returns(response)
      try {
        await loadBehavior.load('someId')
        expect('here', 'to never be here').to.not.equal('here')
      } catch (error) {
        expect(error)
          .to.have.property('message')
          .that.equals('not-found')
      }
    })

    it('undefined on not-found', async () => {
      configuration.noExceptionOnNotFound = true

      const response: Request<GetObjectOutput, AWSError> = new Request<GetObjectOutput, AWSError>(s3, 'getObject')
      sinon.stub(response, 'promise').rejects({
        type: 'Error',
        message: 'The specified key does not exist.',
        stack:
          'NoSuchKey: The specified key does not exist.\n    at Request.extractError (/var/runtime/node_modules/aws-sdk/lib/services/s3.js:816:35)\n    at Request.callListeners (/var/runtime/node_modules/aws-sdk/lib/sequential_executor.js:106:20)\n    at Request.emit (/var/runtime/node_modules/aws-sdk/lib/sequential_executor.js:78:10)\n    at Request.emit (/var/runtime/node_modules/aws-sdk/lib/request.js:683:14)\n    at Request.transition (/var/runtime/node_modules/aws-sdk/lib/request.js:22:10)\n    at AcceptorStateMachine.runTo (/var/runtime/node_modules/aws-sdk/lib/state_machine.js:14:12)\n    at /var/runtime/node_modules/aws-sdk/lib/state_machine.js:26:10\n    at Request.<anonymous> (/var/runtime/node_modules/aws-sdk/lib/request.js:38:9)\n    at Request.<anonymous> (/var/runtime/node_modules/aws-sdk/lib/request.js:685:12)\n    at Request.callListeners (/var/runtime/node_modules/aws-sdk/lib/sequential_executor.js:116:18)',
        code: 'NoSuchKey',
        region: null,
        time: '2020-02-21T06:38:32.105Z',
        requestId: '09217AC3594E645E',
        extendedRequestId: '00ESmazKMDQYfZa52XjfX6A+OCVdzRUO/ulArIDj379n6pMBORnQe+9pjDX5+z24FyrXv0BsPRA=',
        statusCode: 404,
        retryable: false,
        retryDelay: 54.901082426991636,
      })

      sinon.stub(s3, 'getObject').returns(response)
      const doc: any = await loadBehavior.load('someId')
      expect(doc).to.be.undefined
    })
  })
})
