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
