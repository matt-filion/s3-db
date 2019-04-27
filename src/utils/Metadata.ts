import 'reflect-metadata';
import { BasicObject } from '../db';

const METADATA_KEY = Symbol('__s3db');

/**
 *
 * @param target to attach metadata to.
 * @param values to attach or update.
 */
export function updateMetadata(toTarget: any, values: any): void {
  let target = toTarget.constructor || toTarget;
  let keyName: string = target.name.toLowerCase();
  let metadata = Reflect.getMetadata(METADATA_KEY, target) || {};
  metadata = Object.assign(metadata, { [keyName]: values });
  Reflect.defineMetadata(METADATA_KEY, metadata, target);
}

/**
 *
 * @param target instance to return the metadata from.
 */
export function getMetadata(target: any, _name?: string): BasicObject | undefined {
  let name: string = (target.constructor ? target.constructor.name : target.name) || _name;
  let keyName: string = name.toLowerCase();
  let metadata = Reflect.getOwnMetadata(METADATA_KEY, target.constructor ? target.constructor : target);
  return metadata ? metadata[keyName] : undefined;
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
