/**
 * Interface for serializing an object.
 */
export interface Serialization {
  serialize(objectToSerialize: any): string;
  deserialize<T>(documentToDeserialize: string): T;
}
