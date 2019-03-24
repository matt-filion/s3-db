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

interface BasicObject {
  [key: string]: any;
}

/**
 * Helper for getting a value on a target object.
 */
export function getValue(target: any, propertyName: string): any {
  return (<BasicObject>target)[propertyName];
}

/**
 * 
 * @param target object containing the property.
 * @param propertyName to set the value on.
 * @param value to set.
 */
export function setValue(target: any, propertyName: string, value: any): void {
  (<BasicObject>target)[propertyName] = value;
}