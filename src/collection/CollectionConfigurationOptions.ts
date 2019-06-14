import { IDGenerator, Serialization, IsModified, Validation } from '../exposed'

export class CollectionConfigurationOptions {
  public name?: string
  public keyName?: string
  public checkIsModified?: boolean
  public serversideEncryption?: boolean
  public idGenerator?: IDGenerator
  public serialization?: Serialization
  public isModified?: IsModified
  public validator?: Validation
  public pageSize?: number
}
