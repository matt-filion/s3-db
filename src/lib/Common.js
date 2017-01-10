module.exports.Check = {
  exist: value => value !== undefined && value !== null,
  isFunction: value => typeof value === 'function',
  isObject: value => typeof value === 'object',
}

module.exports.METANAME = '__s3db'

module.exports.Utils = {
  setMetaData: (target,metadata) => {
    Object.defineProperty(target, module.exports.METANAME, {get: () => this.value, set: newValue => this.value = newValue });
    Object.getOwnPropertyDescriptor(target, module.exports.METANAME).set(metadata);
  },
  getMetaData: (target) => {
    const metadata = Object.getOwnPropertyDescriptor(target, module.exports.METANAME);
    if(metadata) return metadata.get()
  }
}
