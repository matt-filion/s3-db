import { Serialization } from '../exposed'

/**
 * Out of the box JSON Serialization of objects.
 */
export class JSONSerialization implements Serialization {
  public serialize(objectToSerialize: any): string {
    return JSON.stringify(objectToSerialize)
  }

  public deserialize(documentToDeserialize: string): any {
    console.log('documentToDeserialize', documentToDeserialize)
    return JSON.parse(documentToDeserialize)
  }
}
