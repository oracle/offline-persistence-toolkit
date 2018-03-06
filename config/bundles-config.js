(function(){
  requirejs.config({
    bundles:
    {
      'opt/offline-persistence-toolkit-core-{pkg.version}': [
        'persistenceUtils',
        'impl/logger',
        'impl/PersistenceXMLHttpRequest',
        'persistenceStoreManager',
        'impl/defaultCacheHandler',
        'impl/PersistenceSyncManager',
        'impl/OfflineCache',
        'impl/offlineCacheManager',
        'impl/fetch',
        'persistenceManager'
      ],
      'opt/offline-persistence-toolkit-pouchdbstore-{pkg.version}': [
        'PersistenceStore',
        'impl/storageUtils',
        'pouchdb-browser-6.3.4',
        'impl/pouchDBPersistenceStore',
        'pouchDBPersistenceStoreFactory',
        'persistenceStoreFactory'
      ],
      'opt/offline-persistence-toolkit-localstore-{pkg.version}': [
        'PersistenceStore',
        'impl/storageUtils',
        'impl/keyValuePersistenceStore',
        'impl/localPersistenceStore',
        'localPersistenceStoreFactory',
        'persistenceStoreFactory'
      ],
      'opt/offline-persistence-toolkit-filesystemstore-{pkg.version}': [
        'impl/storageUtils',
        'impl/keyValuePersistenceStore',
        'impl/fileSystemPersistenceStore',
        'fileSystemPersistenceStoreFactory'
      ],
      'opt/offline-persistence-toolkit-responseproxy-{pkg.version}': [
        'fetchStrategies',
        'cacheStrategies',
        'defaultResponseProxy',
        'simpleJsonShredding',
        'oracleRestJsonShredding',
        'simpleBinaryDataShredding',
        'queryHandlers'
      ]
    }
  })
})()
