'use strict';

module.exports = function(config){

  const serializeToJSON = data => typeof data === 'string' ? data : JSON.stringify(data);
  const deserializeFromJSON = data => typeof data === 'string' ? JSON.parse(data) : data;

  return {
    serialize: config.get('serializer.serialize',serializeToJSON),
    deserialize: config.get('serializer.deserialize',deserializeFromJSON)
  }
}
  