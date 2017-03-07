'use strict';

module.exports.Check = {
  exist: value => value !== undefined && value !== null,
  isFunction: value => typeof value === 'function',
  isObject: value => typeof value === 'object',
}

module.exports.METANAME = '__s3db'

/* @see https://gist.github.com/jed/982883 */
module.exports.uuid = a =>a?(a^Math.random()*16>>a/4).toString(16):([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g,module.exports.uuid);

module.exports.Utils = {
  setMetaData: (target,metadata) => {
    let descriptor = Object.getOwnPropertyDescriptor(target, module.exports.METANAME);
    if(!descriptor) {
      Object.defineProperty(target, module.exports.METANAME, {get: () => this.value, set: newValue => this.value = newValue });
      descriptor = Object.getOwnPropertyDescriptor(target, module.exports.METANAME);
    }
    descriptor.set(metadata);
  },
  getMetaData: (target) => {
    const metadata = Object.getOwnPropertyDescriptor(target, module.exports.METANAME);
    if(metadata) return metadata.get()
  }
}

module.exports.getDocumentId = (document,configuration) => document[configuration.id.propertyName] || configuration.id.generator();
module.exports.signature     = toWrite => require('crypto').createHash('md5').update(typeof toWrite === 'string' ? toWrite : JSON.stringify(toWrite)).digest('base64');
module.exports.serialize     = body => typeof body === 'string' ? body : JSON.stringify(body);
module.exports.deserialize   = serialized => typeof serialized === 'string' ? JSON.parse(serialized) : serialized;