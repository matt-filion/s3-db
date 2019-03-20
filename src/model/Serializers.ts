/**
 * Interface for serializing an object.
 */
export interface Serialization {
  serialize(objectToSerialize: any): string;
  deserialize(documentToDeserialize: string): object;
}

/**
 * Out of the box JSON Serialization of objects.
 */
export class JSONSerialization implements Serialization {

  public serialize(objectToSerialize: any): string {
    return JSON.stringify(objectToSerialize)
  }

  public deserialize(documentToDeserialize: string): any {
    return JSON.parse(documentToDeserialize)
  }
}