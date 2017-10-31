declare module "s3-db" {
  class Database {
    constructor(dbName?: string)
    constructor(config?: Database.Config)
    getName(): string;
    getCollectionNames(): Promise<string[]>
    getCollection(collectionName: string, config?: any): Promise<Database.Collection>
    createCollection(collectionName: string): Promise<Database.Collection>
    dropCollection(collectionName: string): Promise<void>
  }

  namespace Database {
    interface Metadata {
      [key: string]: string;
    }

    interface Config {
      db?: ConfigDb;
      provider?: ConfigProvider;
      collections?: ConfigCollections;
      serializer?: ConfigSerializer;
    }

    interface ConfigDb {
      name?: string;
      environment?: string;
      namePattern?: string;
      allowDrop?: boolean;
    }

    interface ConfigProvider {
      // Name is always aws-s3
      // name?: string;
      region?: string;
      accessKeyId?: string;
      secretAccessKey?: string;
    }

    interface ConfigCollections {
      default?: ConfigCollection;
      [key: string]: ConfigCollection;
    }

    interface ConfigCollection {
      validator?: (document: Document) => Promise<Document>;
      id?: ConfigCollectionId;
      onlyUpdateOnMD5Change?: boolean;
      collideOnMissmatch?: boolean;
      encryption?: boolean;
      pageSize?: number;
    }

    interface ConfigCollectionId {
      propertyName: string;
      generator: (document: Document) => string;
    }

    interface ConfigSerializer {
      serialize: (data: any) => any,
      deserialize: (data: any) => any,
    }

    class Document {
      save(): Promise<Document>
      refresh(): Promise<Document>
      delete(): Promise<void>
      copyTo(collection: Collection, newId?: string): Promise<Document>
      rename(): Promise<Document>
      getHead(): Promise<Metadata>
      getMetadata(): Metadata
    }

    class documentRef {
      id: string
      getDocument<T>(): Promise<Document & T>
    }

    class DocumentList extends Array<documentRef> {
      next(): Promise<DocumentList>
      hasMore(): boolean
    }

    class Collection {
      getName(): string;
      find(prefix?: string): Promise<DocumentList>
      getDocument<T>(documentId: string): Promise<Document & T>
      deleteDocument(documentId: string): Promise<void>
      saveDocument<T>(document: (Document & T) | T, metadata?: Metadata): Promise<Document & T>
      copy<T>(document: Document & T, newId: string): Promise<Document & T>
      subCollection(collectionName: string): Promise<Collection>
      getHead(documentId: string): Promise<Metadata>
      exists(documentId: string): Promise<boolean>
    }
  }
  export = Database;
}