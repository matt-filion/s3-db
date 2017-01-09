module.exports.Check = {
  exist: value => value !== undefined && value !== null,
  isFunction: value => typeof value === 'function',
  isObject: value => typeof value === 'object',
}
