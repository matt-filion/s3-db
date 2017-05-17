'use strict';

/*
 * When creating an MD5 hash, S3 seems to do things a touch different with escaping quotes
 *  this keeps quotes from showing up at all.
 */
const to = (key, value) => typeof value == "string" ? escape(value) : value;
const from = (key, value) => typeof value == "string" ? unescape(value) : value;

module.exports = function(config){

  const serializeToJSON = data => typeof data === 'string' ? data : JSON.stringify(data,to);
  const deserializeFromJSON = data => typeof data === 'string' ? JSON.parse(data,from) : data;

  return {
    serialize: config.get('serializer.serialize',serializeToJSON),
    deserialize: config.get('serializer.deserialize',deserializeFromJSON)
  }
}