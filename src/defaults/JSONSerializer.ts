import { Serialization } from "../exposed";

/**
 * Out of the box JSON Serialization of objects.
 */
export class JSONSerialization<T> implements Serialization {

  public serialize(objectToSerialize: any): string {
    return JSON.stringify(objectToSerialize)
  }

  public deserialize<T>(documentToDeserialize: string): T {
    return JSON.parse(documentToDeserialize)
  }
}