module.exports.Check = {
  exist: value => value !== undefined && value !== null,
  isFunction: value => typeof value === 'function',
  isObject: value => typeof value === 'object',
}

module.exports.METANAME = '__s3db'

module.exports.Utils = {
  setMetaData: (target,metadata) => Object.defineProperty(target, module.exports.METANAME, {value:{metadata:metadata}}),
  getMetaData: (target) => Object.getOwnPropertyDescriptor(target,module.exports.METANAME) ? Object.getOwnPropertyDescriptor(target,module.exports.METANAME).metadata : {},
}
