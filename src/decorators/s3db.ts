import 'reflect-metadata';

import { Configuration, Configurations } from '../model/Configuration';

/**
 * Simple decorator for feeding in a non default S3DB configuration.
 * 
 * Example:
 *    s3db({
 *       baseName: 'HappyCompanyDB',
 *       region: 'us-west-1',
 *       bucketPattern: '${stage}.${region}.${baseName}--${bucketName}'
 *    })
 * 
 * @param route for this function.
 */
export function s3db(configuration: Configuration) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    return Configurations.update(configuration);
  }
}
