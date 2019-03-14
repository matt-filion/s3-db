/**
 * Interface to implement when providing a validator to
 * a collection.
 */
export interface Validation {
  validate(objectToValidate: any): boolean;
}