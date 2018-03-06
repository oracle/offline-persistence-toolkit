// Type definitions for Oracle Offline Persistence Toolkit
// Project: Oracle Offline Toolkit
// Definitions by: Jing Wu, Kentaro Kinebuchi, Naizam Olakara
// TypeScript Version: 2.3
// Documentation: https://oracle.github.io/offline-persistence-toolkit/index.html

export {persistenceManager, defaultResponseProxy,
        persistenceStoreManager, PersistenceStore,
        pouchDBPersistenceStoreFactory, 
        localPersistenceStoreFactory,
        persistenceUtils, queryHandlers, 
        fetchStrategies, cacheStrategies,
        simpleJsonShredding, oracleRestJsonShredding
       };

declare var persistenceManager: PersistenceManager;
declare var defaultResponseProxy: DefaultResponseProxy;
declare var persistenceStoreManager: PersistenceStoreManager;
declare var pouchDBPersistenceStoreFactory: PouchDBPersistenceStoreFactory;
declare var localPersistenceStoreFactory: LocalPersistenceStoreFactory;

declare class PersistenceManager {
  /** 
   * Initialize persistence manager.
   */
  init(): Promise<undefined>; 

  /**
   * Force the PersistenceManager offline.
   */
  forceOffline(offline: boolean): undefined;

  /**
   * returns the cache store for the Persistence Framework. Implements the Cache API.
   */
  getCache(): OfflineCache | null;

  /**
   * Checks if online.
   */
  isOnline(): boolean;

  /**
   * Registers a URL for persistence
   */
  register(options?: {scope: string}): Promise<PersistenceRegistration>;

  /**
   * Return the registration object for the URL
   */
  getRegistration(url: string): Promise<PersistenceRegistration|undefined>;

  /**
   * Return an array of Registration objects
   */
  getRegistrations(): Promise<Array<PersistenceRegistration>>;

  /**
   * Return the Sync Manager
   */
  getSyncManager(): PersistenceSyncManager;
    
  /**
   * Call fetch without going through the persistence framework. This is the
   * unproxied browser provided fetch API.
   */
  browserFetch(request: string| Request): Promise<Response>;
}

declare class PersistenceRegistration {

  constructor(scope: string, persistenceManager: PersistenceManager);

  /**
   * Add an event listener for an event type
   */
  addEventListener(type: 'fetch', listener: (Event)=>Promise<Response>)

  /**
   * Unregister the registration. Will finish any ongoing operations before it is unregistered.
   */
  unregister(): Promise<boolean>;
}

declare class PersistenceSyncManager {
  /**
   * Add an event listener.
   */ 
  addEventListener<K extends keyof SyncEventTypeToListenerMap>(type: K, listener: SyncEventTypeToListenerMap[K], scope?: string): void;

  /**
   * Remove the event listener.
   */
  removeEventListener<K extends keyof SyncEventTypeToListenerMap>(type: K, listener: SyncEventTypeToListenerMap[K], scope?: string): boolean;

  /**
   * Returns a Promise which resolves to all the Requests in the Sync Log returned as an Array
   * sorted by the created date of the Request
   */
  getSyncLog(): Promise<Array<SyncLog>>;

  /**
   * Insert a Request into the Sync Log. 
   */
  insertRequest(request: Request, options?: {undoRedoDataArray: Array<UndoRedoStructure>}): Promise<undefined>;

  /**
   * Delete a Request from the Sync Log
   */
  removeRequest(requestId: string): Promise<Request>;
    
  /**
   * Update a Request from the Sync Log. 
   */
  updateRequest(requestId: string, request: Request): Promise<Response>;
    
  /**
   * Synchronize the log with the server
   */
  sync(options?: {preflightOptionsRequest?: 'enabled' | 'disabled' | string, preflightOptionsRequestTimeout?: number}): Promise<undefined>;
}

interface SyncEventTypeToListenerMap {
  "beforeSyncRequest": (Event) => Promise<BeforeSyncListenerReturnType>;
  "syncRequest": (Event) => Promise<SyncListenerReturnType>;
}

type BeforeSyncListenerReturnType = null | {action: 'replay', request: Request} | 
                                    {action: 'skip'} | {action: 'stop'} | {action: 'continue'};

type SyncListenerReturnType = null | {action: 'stop'} | {action; 'continue'};

type SyncLog = {
  requestId: string;
  request: Request;
  undo: () => Promise<boolean>;
  redo: () => Promise<boolean>;
};

type UndoRedoStructure = {
  operation: 'upsert' | 'remove', 
  storename: string, 
  undoRedoData: Array<{key: string, undo: object, redo: object}>
};

declare class fetchStrategies {
  /**
   * Returns the Cache First fetch strategy
   */
  static getCacheFirstStrategy(options?: {serverResponseCallback: (Request, Response) => Promise<Response>}): FetchStrategyFunction;

  /**
   * Returns the Cache If Offline Fetch Strategy
   */
  static getCacheIfOfflineStrategy(): FetchStrategyFunction;
}

declare class cacheStrategies {
  /**
   * Returns the HTTP Cache Header strategy
   */
  static getHttpCacheHeaderStrategy():  CacheStragegyFunction;
}

interface FetchStrategyFunction {
  (request: Request, options: any) : Promise<Response>;
}

interface CacheStragegyFunction {
  (request: Request, response: Response): Promise<Response>;
}

declare class DefaultResponseProxy {
  constructor(options?: ResponseProxyOptions);

  /**
   * Return an instance of the default response proxy
   */
  static getResponseProxy(options?: ResponseProxyOptions): DefaultResponseProxy;

  /**
   * Returns the Fetch Event listener
   */
  getFetchEventListener(): (Event) => Promise<Response>;

  /**
   * Process the Request.
   */
  processRequest(request: Request): Promise<Response>; 

  /**
   * The default POST request handler.
   */
  handlePost(request: Request): Promise<Response>;

  /**
   * The default GET request handler
   */
  handleGet(request: Request): Promise<Response>;

  /**
   * The default HEAD request handler
   */
  handleHead(request: Request): Promise<Response>;

  /**
   * The default OPTIONS request handler
   */
  handleOptions(request: Request): Promise<Response>;

  /**
   * The default PUT request handler.
   */
  handlePut(request: Request): Promise<Response>;

  /**
   * The default PATCH request handler.
   */
  handlePatch(request: Request): Promise<Response>;

  /**
   * The default DELETE request handler
   */
  handleDelete(request: Request): Promise<Response>; 
}

type ResponseProxyOptions = {
  jsonProcessor?:  {
    shredder?: ShredderFunction;
    unshredder?: UnshredderFunction
  },
  queryHandler?: QueryHandler;
  fetchStrategy?: FetchStrategyFunction;
  cacheStrategy?: CacheStragegyFunction;
  requestHandlerOverride?: {

    // Override the default GET request handler with the supplied function.
    handleGet?: (Request) => Promise<Response>;

    // Override the default POST request handler with the supplied function.
    handlePost?: (Request) => Promise<Response>;

    // Override the default PUT request handler with the supplied function.
    handlePut?: (Request) => Promise<Response>;

    // Override the default PATCH request handler with the supplied function.
    handlePatch?: (Request) => Promise<Response>;

    // Override the default DELETE request handler with the supplied function.
    handleDelete?: (Request) => Promise<Response>;

    // Override the default HEAD request handler with the supplied function.
    handleHead?: (Request) => Promise<Response>;

    // Override the default OPTIONS request handler with the supplied function.
    handleOptions?: (Response) => Promise<Response>;
  }
}

declare class OfflineCache {
  constructor(name: string, persistencestore: PersistenceStore);

  /**
   * Retrieve the name of the cache object.
   */
  getName(): string;

  /**
   * Takes a request, retrieves it and adds the resulting response
   * object to the cache.
   */
  add(request: Request): Promise<Response>; 

  /**
   * Bulk operation of add.
   */
  addAll(requests: Array<Request>): Promise<Array<Response>>;

  /**
   * Find the first response in this Cache object that match the request with the options.
   */
  match(request:Request, option?: CacheMatchOptions): Promise<Response>;

  /**
   * Finds all responses whose request matches the passed-in request with the specified
   * options.
   */
  matchAll(request:Request, option?: CacheMatchOptions): Promise<Array<Response>>

  /**
   *  Add the request/response pair into the cache.
   */
  put(request: Request, response: Response): Promise<any>;

  /**
   * Delete the all the entries in the cache that matches the passed-in request with
   * the specified options.
   */
  delete(request?: Request, options?: CacheMatchOptions): Promise<boolean>;

  /**
   * Retrieves all the keys in this cache.
   */
  keys(request?: Request, options?: CacheMatchOptions): Promise<string>;

  /**
   * Checks if a match to this request with the specified options exist in the
   * cache or not. 
   */
  hasMatch(request: Request, options?: CacheMatchOptions): Promise<boolean>;
}

type CacheMatchOptions = {ignoreSearch?: boolean, ignoreMethod?: boolean, ignoreVary?: boolean};

declare class PersistenceStoreManager {
  /**
   * Register a PersistenceStoreFactory to create PersistenceStore for the
   * specified name
   */
  registerStoreFactory(name: string, factory: PersistenceStoreFactory): void;

  /**
   * Register the default PersistenceStoreFactory to create PersistenceStore
   * for stores that don't have any factory registered under
   */
  registerDefaultStoreFactory(factory: PersistenceStoreFactory): void;

  /**
   * Get hold of a store for a collection of records of the same type.
   */
  openStore(name: string, options?: {index?: Array<string>, version?: string}): Promise<PersistenceStore>;

  /**
   * Check whether a specific version of a specific store exists or not.
   */
  hasStore(name: string, options?: {version: string}): boolean;

  /**
   *  Delete the specific store, including all the content stored in the store.
   */
  deleteStore(name: string, options?: {version: string}): Promise<boolean>;
}

declare abstract class PersistenceStore {
  /* get the name of the store */
  getName(): string;

  /* retrieve the version of this store */
  getVersion(): string;

  /* initialize the store */
  Init(options?: {index?: Array<string>, version?: string}): Promise<undefined>;

  /* Insert an item if it does not already exist, update otherwise. */
  upsert(key: string, metadata: {versionIdentifier?: string}, value: object, expectedVersionIdentifier?: string): Promise<undefined>;

  /* upsert all the items into the store */
  upsertAll(): Promise<[any]>;

  /* retrieve all the items in an array based on the find criteria */
  find(criteria?: FindExpression): Promise<Array<any>>;

  /* retrieve the item based on key value */
  findByKey(key: string): Promise<any>;

  /* delete the items with the specified key in this store */
  removeByKey(key: string): Promise<boolean>;

  /* delete the speficied items from this store. */
  delete(expression?: FindExpression['selector']): Promise<undefined>;

  /* Returns the keys of all the items in this store.*/
  keys(): Promise<Array<string>>;
}

declare abstract class PersistenceStoreFactory {
  static  createPersistenceStore(name: string, options?: any): PersistenceStore
}

declare class LocalPersistenceStoreFactory extends PersistenceStoreFactory{
  static createPersistenceStore(name: string, options?: any): PersistenceStore
}

declare class PouchDBPersistenceStoreFactory extends PersistenceStoreFactory {
  static createPersistenceStore(name: string, options?: any): PersistenceStore
}

declare class queryHandlers {
  /**
   * Returns the Oracle Rest Query Handler which handles the query parameters according
   * to the Oracle Rest Specification.
   */
  static getOracleRestQueryHandler(storeName: string, createQueryExp?: (urlParams: string) => FindExpression): QueryHandler;

  /**
   * Returns the Simple Query Handler which matches the URL query parameter/value pairs 
   * against the store's field/value pairs.
   */
  static getSimpleQueryHandler(storeName: string, ignoreUrlParams?: Array<string>): QueryHandler
}

interface QueryHandler {
  (request: Request, 
    options?: {
      jsonProcessor?: {
        shredder?: ShredderFunction, 
        unshredder?: UnshredderFunction
      }
  }): Promise<Response | undefined>;
}

declare class persistenceUtils {
  /**
   * Return whether the Response is a cached Response
   */
  static isCachedResponse(response: Response): boolean;

  /**
   * Return whether the Response has a generated ETag
   */
  static isGeneratedEtagResponse(response: Response): boolean;

  /**
   * Return a JSON object representing the Request object
   */
  static requestToJSON(request: Request, options?: {_noClone?: boolean}): Promise<any>;

  /**
   * Return a JSON object representing the Response object
   */
  static responseToJSON(response: Response, options?: {excludeBody?: boolean}): Promise<any>; 

  /**
   * Return a Request object constructed from the JSON object returned by requestToJSON
   */
  static requestFromJSON(data: any): Promise<Request>; 

  /**
   * Return a Response object constructed from the JSON object returned by responseToJSON
   */
  static responseFromJSON(data: any): Promise<Response>;

  /**
   * Update the Response object with the provided payload. The existing payload will be replaced
   */
  static setResponsePayload(response: Response, payload: any): Promise<Response>;

  /**
   * Parse multipart form data in the resquest/response body. Any binary data must be base64 encoded.
   */
  static parseMultipartFormData(origbody: string, contentType: string): Array<string>;

  /**
   * Helper function to build endpoint key to register options under.
   */
  static buildEndpointKey(request: Request): string; 
}

declare class simpleJsonShredding {
  /**
   * Return the shredder for simple JSON
   */
  static getShredder(storeName: string, idAttr: string): ShredderFunction;

  /**
   * Return the unshredder for simple JSON
   */
  static getUnshredder(): UnshredderFunction;
}

declare class oracleRestJsonShredding {
  /**
   * Return the shredder for Oracle REST JSON
   */
  static getShredder(storename: string, idAttr: string): ShredderFunction;

  /**
   * Return the unshredder for Oracle REST JSON
   */
  static getUnshredder(): UnshredderFunction;
}

interface ShredderFunction {
  (Response): Promise<Array<ShreddedResult>>;
}

interface UnshredderFunction {
  (data: Array<ShreddedResult>): Promise<Response>;
}

type ShreddedResult = {
  name: string;
  resourceIdentifier: string;
  keys: Array<string>;
  data: Array<any>;
  resourceType: 'single' | 'collection';
}

type FindExpression = {
  selector: any,
  fields: Array<string>,
  sort: Array<string>
}