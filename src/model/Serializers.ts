/**
 * Interface for serializing an object.
 */
export interface Serialisation {
  serialize(objectToSerialize: any): string;
  deserialize(documentToDeserialize: string): object;
}


export class JSONSerialization implements Serialisation {

  public serialize(objectToSerialize: any): string {
    return JSON.stringify(objectToSerialize)
  }

  public deserialize(documentToDeserialize: string): any {
    return JSON.parse(documentToDeserialize)
  }

}