import 'reflect-metadata';

const METADATA_KEY = Symbol('__s3db');

/**
 * 
 * @param target to attach metadata to.
 * @param values to attach or update.
 */
export function updateMetadata(toTarget: any, values: any): void {
  let target = toTarget.constructor ? toTarget.constructor : toTarget
  let metadata = Reflect.getMetadata(METADATA_KEY, target) || {};
  metadata = Object.assign(metadata, values);
  Reflect.defineMetadata(METADATA_KEY, metadata, target);
}

/**
 * 
 * @param target instance to return the metadata from.
 */
export function getMetadata(target: any): any {
  return Reflect.getMetadata(METADATA_KEY, target.constructor ? target.constructor : target);
}
