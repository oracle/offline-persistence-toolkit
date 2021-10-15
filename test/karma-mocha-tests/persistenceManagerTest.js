define(['persist/persistenceManager', 'persist/defaultResponseProxy', 'persist/impl/PersistenceSyncManager', 'persist/persistenceUtils', 'persist/persistenceStoreManager', 'persist/localPersistenceStoreFactory', 'MockFetch', 'persist/impl/logger'],
  function (persistenceManager, defaultResponseProxy, PersistenceSyncManager, persistenceUtils, persistenceStoreManager, localPersistenceStoreFactory, MockFetch, logger) {
    'use strict';
    //logger.option('level',  logger.LEVEL_LOG);
      var mockFetch = new MockFetch();
      persistenceManager.init().then(function () {
        describe('persist/persistenceManager', function() {
          afterEach(function (done) {
            persistenceManager.forceOffline(false);
            persistenceStoreManager.openStore('syncLog').then(function (store) {
              return store.delete();
            }).then(function () {
              return persistenceStoreManager.openStore('offlineCaches-systemCache');
            }).then(function (store) {
              return store.delete();
            }).then(function () {
              done();
            });
          });
        it('getRegistration()', function (done) {
          persistenceManager.register({
            scope: '/testRegistration'
          }).then(function (registration) {
            persistenceManager.getRegistration('/testRegistration').then(function (regObj) {
              assert.ok(registration === regObj, 'getRegistration() returned the registration object');
              registration.unregister().then(function (unregistered) {
                assert.ok(unregistered == true, 'unregistered scope');
                done();
              });
            });
          });
        });
        it('getRegistrations()', function (done) {
          persistenceManager.register({
            scope: '/testRegistrations'
          }).then(function (registration) {
            persistenceManager.getRegistrations().then(function (regObjArray) {
              assert.ok(regObjArray.length == 1, 'getRegistrations() returned an array of one registration obj');
              assert.ok(registration === regObjArray[0], 'getRegistrations() array contains the registration object');
              registration.unregister().then(function (unregistered) {
                assert.ok(unregistered == true, 'unregistered scope');
                done();
              });
            });
          });
        });
        it('Remove all registrations', function (done) {
          persistenceManager.register({
            scope: '/testRegistration1'
          }).then(function () {
            return persistenceManager.register({
              scope: '/testRegistration2'
            });
          }).then(function () {
            return persistenceManager.register({
              scope: '/testRegistration3'
            });
          }).then(function () {
            return persistenceManager.register({
              scope: '/testRegistration4'
            });
          }).then(function () {
            persistenceManager.getRegistrations().then(function (regObjArray) {
              var unregisterPromiseArray = [];
              for (var i = 0; i < regObjArray.length; i++) {
                unregisterPromiseArray.push(regObjArray[i].unregister());
              }
              return Promise.all(unregisterPromiseArray).then(function (resp) {
                persistenceManager.getRegistrations().then(function (regObjArray) {
                  assert.ok(regObjArray.length == 0, 'Unregistered all registrations');
                  done();
                  return Promise.resolve();
                });
              });
            });
          });
        });
        
        persistenceStoreManager.registerDefaultStoreFactory(localPersistenceStoreFactory);
        it('forceOffline()', function (done) {
          mockFetch.addRequestReply('GET', '/testOnline', {
            status: 200,
            body: 'Ok'
          }, function () {
            assert.ok(true, 'Mock Fetch received Request when online');
          });
  
          mockFetch.addRequestReply('GET', '/testOffline', {
            status: 200,
            body: 'Ok'
          }, function () {
            if (!persistenceManager.isOnline()) {
              assert.ok(false, 'Mock Fetch should not have received Request when offline');
            }
          });
  
          persistenceManager.register({
            scope: '/testOnline'
          }).then(function (registration) {
            var defaultTestResponseProxy = defaultResponseProxy.getResponseProxy();
            registration.addEventListener('fetch', defaultTestResponseProxy.getFetchEventListener());
  
            fetch('/testOnline').then(function (response) {
              assert.ok(true, 'Received Response when online');
              registration.unregister().then(function (unregistered) {
                assert.ok(unregistered == true, 'unregistered scope');
              });
            });
          });
          persistenceManager.register({
            scope: '/testOffline'
          }).then(function (registration) {
            var defaultTestResponseProxy = defaultResponseProxy.getResponseProxy();
            registration.addEventListener('fetch', defaultTestResponseProxy.getFetchEventListener());
            fetch('/testOffline').then(function (response) {
              assert.ok(true, 'Received Response when online');
              persistenceManager.forceOffline(true);
              fetch('/testOffline').then(function (response) {
                assert.ok(persistenceUtils.isCachedResponse(response), 'Received cached Response when offline');
                registration.unregister().then(function (unregistered) {
                  assert.ok(unregistered == true, 'unregistered scope');
                });
                done();
              });
            });
          });
        });
        it('isOnline()', function (done) {
          assert.ok(persistenceManager.isOnline(), 'isOnline() returned true');
          persistenceManager.forceOffline(true);
          assert.ok(!persistenceManager.isOnline(), 'isOnline() returned false');
          persistenceManager.forceOffline(false);
          // fake the cordova network information plugin
          window.Connection = {NONE: 'none'};
          var networkConnectionInfo = {connection: {type: Connection.NONE}};
          navigator.network = networkConnectionInfo;
          assert.ok(!persistenceManager.isOnline(), 'isOnline() returned false');
          navigator.network = null;
          done();
        });
        it('register() and registration object apis', function (done) {
          mockFetch.addRequestReply('GET', '/testRegister', {
            status: 200,
            body: 'Ok'
          }, function () {
            assert.ok(true, 'Mock Fetch received Request when online');
          });
  
          persistenceManager.register({
            scope: '/testRegister'
          }).then(function (registration) {
            assert.ok(registration.scope == '/testRegister', 'registration.scope is /testRegister');
            var defaultTestResponseProxy = defaultResponseProxy.getResponseProxy();
            registration.addEventListener('fetch', defaultTestResponseProxy.getFetchEventListener());
  
            fetch('/testRegister').then(function (response) {
              assert.ok(true, 'Received Response when online');
              persistenceManager.forceOffline(true);
              fetch('/testRegister').then(function (response) {
                assert.ok(persistenceUtils.isCachedResponse(response), 'Received cached Response when offline');
                registration.unregister().then(function (unregistered) {
                  assert.ok(unregistered == true, 'unregistered scope');
                  fetch('/testRegister').then(function (response) {
                    assert.ok(response instanceof Response, 'Received Response when not registered');
                    done();
                  });
                });
              });
            });
          });
        });
        it('getSyncManager()', function (done) {
          assert.ok(persistenceManager.getSyncManager() instanceof PersistenceSyncManager, 'getSyncManager() returned PersistenceSyncManager');
          done();
        });
        it('browserFetch()', function (done) {
           mockFetch.addRequestReply('GET', '/testBrowserFetch', {
            status: 200,
            body: 'Ok'
          }, function () {
            assert.ok(true, 'Mock Fetch received Request');
          });
  
          persistenceManager.register({
            scope: '/testBrowserFetch'
          }).then(function (registration) {
            var defaultTestResponseProxy = defaultResponseProxy.getResponseProxy();
            registration.addEventListener('fetch', defaultTestResponseProxy.getFetchEventListener());
  
            fetch('/testBrowserFetch').then(function (response) {
              assert.ok(true, 'Received Response when online');
              persistenceManager.forceOffline(true);
              persistenceManager.browserFetch('/testBrowserFetch').then(function (response) {
                assert.ok(response instanceof Response, 'Received Response when browserFetch() called');
                registration.unregister().then(function (unregistered) {
                  assert.ok(unregistered == true, 'unregistered scope');
                  done();
                });
              });
            });
          });
        });
      });
    });
  });
