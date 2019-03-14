import { updateMetadata } from "../utils/Metadata";
import { CollectionConfiguration } from "../model/Configuration";

/**
 * 
 * @param route for this function.
 */
export function document(name?: string | CollectionConfiguration): any {
  return function (target: any, constructor: Function) {

    let metadata = name || target.name.toLowerCase();

    if (typeof metadata === 'string') {
      metadata = { name: metadata };
    }

    updateMetadata(target, metadata);

    return target;
  }
}

/**
 * 
 * @param route for this function.
 */
export function id(generator?: Function): any {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    updateMetadata(target, {
      idName: propertyKey,
      generator: generator
    });
    return target[propertyKey];
  }
}