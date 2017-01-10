'use strict'

const Class = require('./lib/Common').Class;

/**
 * Convenience method for getting the ID from a document. If there is no ID then
 *  one is generated using the configuraiton.id.generator function.
 *
 * @param the document with the id
 * @param the current configuration containing the id mapping.
 */
module.exports.getDocumentId = (document,configuration) => document[configuration.id.propertyName] || configuration.id.generator();

/*
* Creates a unique signature from the contents of the
*/
module.exports.signature = toWrite => require('crypto').createHash('md5').update(toWrite).digest('base64');

/*
* Common method for serializing the body before it is saved as a document
*/
module.exports.serialize = body => JSON.stringify(body),

/*
* Common method for deserializing data serialized by this Document class.
*/
module.exports.deserialize = serialized => JSON.parse(serialized),

/*
* Checks to see if the object is owned by S3DB process.
*/
// module.exports.isS3DBRecord = document => Class.getMetaData(document),

/*
 * Checks if the record has been modified.
 */
module.exports.isModified = (document,provider) => {
  const toWrite  = module.exports.serialize(document);
  const md5      = module.exports.signature(toWrite);
  return document[module.exports.METANAME] && document[module.exports.METANAME].metadata && document[module.exports.METANAME].metadata.md5 === md5
}

/**
 * Removes the file at the specified location.
 */
module.exports.isModified = (document,configuration,provider) => {

  if(document.getId && configuration.collideOnMissmatch){
    return provider.getDocumentHead(instance.bucket,document.getId())
      .then( head => {
        const targetMetaData = provider.buildDocumentMetaData(head);
        let   hasChanged     = false;

        /*
         * The targetMetaData comes from a headCheck on the object being
         *  overwritten. So if the MD5 on the __meta of the current record
         *  matches the target MD5, the underlying object is likely not
         *  modified.
         *
         * Md5 does not always get returned.
         */
        if(targetMetaData.md5 && targetMetaData.md5 !== record[module.exports.METANAME].metadata.md5){
          hasChanged = true;
        }

        if(targetMetaData.eTag !== record[module.exports.METANAME].metadata.eTag){
          hasChanged = true;
        }

        if(hasChanged){
          return Promise.reject('Collision, the document has been modified.');
        }

        return document;
      })
    }
  return Promise.resolve(document);
},

/*
 * Extracts the data from the file, deserailizes it and decorates
 *  the returned object with convenience objects and metadata.
 * @param file
 */
module.exports.new = function(file,provider,collection){

  const body     = file.toString();
  const document = module.exports.deserialize(body);
  const metadata = provider.buildMetaData(file);

  if(document) metadata.md5 = module.exports.signature(body);

  Utils.setMetaData(results,metadata);

  /*
   * Decorate with the isModified function for the save logic.
   */
  document.getId      = () => Document.getDocumentId(document,configuration);
  document.isModified = () => Document.isModified(document,configuration,provider);
  document.save       = () => collection.replaceDocument(document);
  document.delete     = () => collection.deleteDocument(document.getId());
  document.refresh    = () => collection.getDocument(document.getId());

  return document;
}
