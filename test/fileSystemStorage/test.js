define(['persistenceManager', 'defaultResponseProxy', 'impl/PersistenceSyncManager', 'persistenceUtils', 'persistenceStoreManager', 'localPersistenceStoreFactory', 'fileSystemPersistenceStoreFactory', 'simpleBinaryDataShredding', 'MockFetch', 'impl/logger'],
  function (persistenceManager, defaultResponseProxy, PersistenceSyncManager, persistenceUtils, persistenceStoreManager, localPersistenceStoreFactory, fileSystemPersistenceStoreFactory, simpleBinaryDataShredding, MockFetch, logger) {
    'use strict';
    logger.option('level',  logger.LEVEL_LOG);
    module('persistenceManager', {
      teardown: function () {
        stop();
        persistenceManager.forceOffline(false);
        persistenceStoreManager.openStore('syncLog').then(function (store) {
          return store.delete();
        }).then(function () {
          return persistenceStoreManager.openStore('offlineCaches-systemCache');
        }).then(function (store) {
          return store.delete();
        }).then(function () {
          start();
        });
      }
    });

    var mockFetch = new MockFetch();
    persistenceStoreManager.registerDefaultStoreFactory(localPersistenceStoreFactory);
    persistenceStoreManager.registerStoreFactory('blobResponse', fileSystemPersistenceStoreFactory);
    persistenceManager.init().then(function () {

      asyncTest('blob response', function (assert) {
        var isPhantomjs = false;
        if (navigator.userAgent.match(/PhantomJS/)) {
          isPhantomjs = true;
        }
        if (isPhantomjs) {
          expect(0);
          console.log('\nSkipping filesystem store tests on Phantomjs. Please test in a browser.\n');
          start();
        } else {
          expect(12);
          generateBlob().then(function(blob) {
            mockFetch.addRequestReply('GET', '/blobResponse1', {
              status: 200,
              body: blob
            }, function () {
              assert.ok(true, 'Mock Fetch received Request when online');
            });
            mockFetch.addRequestReply('GET', '/blobResponse2', {
              status: 200,
              body: blob
            }, function () {
              assert.ok(true, 'Mock Fetch received Request when online');
            });


            persistenceManager.register({
              scope: '/blobResponse'
            }).then(function (registration) {
              var options = {jsonProcessor: {shredder: simpleBinaryDataShredding.getShredder('blobResponse'), unshredder: simpleBinaryDataShredding.getUnshredder()}}
              var defaultTestResponseProxy = defaultResponseProxy.getResponseProxy(options);
              registration.addEventListener('fetch', defaultTestResponseProxy.getFetchEventListener());
              var localVars = {};
              fetch('/blobResponse1').then(function (response) {
                assert.ok(true, 'Received Response when online');
                return response.blob();
              }).then(function(blobData) {
                assert.ok(blobData != null, 'Received blob while online');
                localVars.blobLength = blobData.size;
                //return Promise.resolve();
                return fetch('/blobResponse2');
              }).then(function(response) {
                assert.ok(true, 'Received Response when online');
                return response.blob();
              }).then(function(blobData) {
                assert.ok(blobData != null, 'Received blob while online');
                localVars.blobLength = blobData.size;
                persistenceManager.forceOffline(true);
                return fetch('/blobResponse1');
              }).then(function (response) {
                assert.ok(true, 'Received Response when offline');
                return response.blob();
              }).then(function(blobData) {
                assert.ok(blobData != null, 'Received blob while online');
                assert.ok(localVars.blobLength == blobData.size, 'Blob correct size');
                return persistenceStoreManager.openStore('blobResponse');
              }).then(function (store) {
                localVars.store = store;
                return store.keys();
              }).then(function(keys){
                assert.ok(keys.length == 2, '2 keys');
                return localVars.store.delete();
              }).then(function() {
                return localVars.store.keys();
              }).then(function(keys){
                assert.ok(keys.length == 0, '0 keys');
                return registration.unregister();
              }).then(function (unregistered) {
                assert.ok(unregistered == true, 'unregistered scope');
                start();
              });
            });
          });
        }
      });
      
      var generateBlob = function () {
        return new Promise(function(resolve, reject) {
          var request = new XMLHttpRequest();
          request.open('GET', 'oracle.png', true);
          request.responseType = 'blob';
          request.addEventListener('load', function () {
            resolve(request.response);
          });
          request.send();
        });
      };
    });
  });
