'use strict';

module.exports.Check = {
  exist: value => value !== undefined && value !== null,
  isFunction: value => typeof value === 'function',
  isObject: value => null !== value && typeof value === 'object',
}

module.exports.METANAME = '__s3db'

/* @see https://gist.github.com/jed/982883 */
module.exports.uuid = a =>a?(a^Math.random()*16>>a/4).toString(16):([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g,module.exports.uuid);

module.exports.Utils = {
  getCollectionConfig: (fqn,config,overrides) => {
    const prefix  = `collections.${fqn.name}`;
    const configs = config.get(prefix);
    let thisCfg;
    if(configs) thisCfg = config.childOf(prefix);
    else thisCfg = config.childOf('collections.default');
    if(overrides) thisCfg.update(overrides);
    return thisCfg;
  },
  setMetaData:   (target,metadata) => {
    target[module.exports.METANAME] = () => metadata
  },
  dotNotation: (path,from) => path.split('.').reduce((res, key) => res[key] || '', from),
  render:      (template, values) => template.replace(/\$\{.+?}/g, match => module.exports.Utils.dotNotation(match.replace(/[\${}]/g,''),values)),
  getMetaData: target => target[module.exports.METANAME] ? target[module.exports.METANAME]() : null,
  signature:   toWrite => toWrite ? require('crypto').createHash('md5').update(typeof toWrite === 'string' ? toWrite : JSON.stringify(toWrite)).digest('base64') : ''
}