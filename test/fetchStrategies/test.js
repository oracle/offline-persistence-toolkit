define(['persist/persistenceManager', 'persist/defaultResponseProxy', 'persist/fetchStrategies', 'persist/persistenceUtils', 'persist/persistenceStoreManager', 'persist/localPersistenceStoreFactory', 'MockFetch', 'persist/impl/logger'],
  function (persistenceManager, defaultResponseProxy, fetchStrategies, persistenceUtils, persistenceStoreManager, localPersistenceStoreFactory, MockFetch, logger) {
    'use strict';
    logger.option('level',  logger.LEVEL_LOG);
    QUnit.module('fetchStrategies', {
      afterEach: function (assert) {
        var done = assert.async();
        persistenceManager.forceOffline(false);
        persistenceStoreManager.openStore('syncLog').then(function (store) {
          return store.delete();
        }).then(function () {
          return persistenceStoreManager.openStore('offlineCaches-systemCache');
        }).then(function (store) {
          return store.delete();
        }).then(function () {
          return persistenceStoreManager.openStore('test');
        }).then(function (store) {
          return store.delete();
        }).then(function () {
          done();
        });
      }
    });

    var mockFetch = new MockFetch();
    persistenceStoreManager.registerDefaultStoreFactory(localPersistenceStoreFactory);
    persistenceManager.init().then(function () {

      QUnit.test('getCacheFirstStrategy()', function (assert) {
        var done = assert.async();
        assert.expect(8);
        mockFetch.addRequestReply('GET', '/testCacheFirst', {
          status: 200,
          body: JSON.stringify([{DepartmentId: 1001, DepartmentName: 'ADFPM 1001 neverending', LocationId: 200, ManagerId: 300},
            {DepartmentId: 556, DepartmentName: 'BB', LocationId: 200, ManagerId: 300},
            {DepartmentId: 10, DepartmentName: 'Administration', LocationId: 200, ManagerId: 300}])
        }, function () {
        });
        mockFetch.addRequestReply('GET', '/testCacheFirst?offset=1', {
          status: 200,
          body: JSON.stringify([
            {DepartmentId: 556, DepartmentName: 'BB', LocationId: 200, ManagerId: 300},
            {DepartmentId: 10, DepartmentName: 'Administration', LocationId: 200, ManagerId: 300}])
        }, function () {
        });

        var serverCallback = function(request, response) {
          return Promise.resolve(response);
        };

        persistenceManager.register({
          scope: '/testCacheFirst'
        }).then(function (registration) {
          var defaultTestResponseProxy = defaultResponseProxy.getResponseProxy({fetchStrategy: fetchStrategies.getCacheFirstStrategy({serverResponseCallback: serverCallback})});
          registration.addEventListener('fetch', defaultTestResponseProxy.getFetchEventListener());

          fetch('/testCacheFirst').then(function (response) {
            assert.ok(!persistenceUtils.isCachedResponse(response), 'Not cached response');
            assert.ok(true, 'Received Response when online');
            return fetch('/testCacheFirst');
          }).then(function (response) {
            assert.ok(persistenceUtils.isCachedResponse(response), 'Cached response');
            assert.ok(true, 'Received Cached Response when online');
            persistenceManager.forceOffline(true);
            return fetch('/testCacheFirst');
          }).then(function (response) {
            assert.ok(persistenceUtils.isCachedResponse(response), 'Cached response');
            assert.ok(true, 'Received Cached Response when offline');
            persistenceManager.forceOffline(false);
            return fetch('/testCacheFirst?offset=1');
          }).then(function (response) {
            assert.ok(!persistenceUtils.isCachedResponse(response), 'Not cached response');
            persistenceManager.forceOffline(true);
            return fetch('/testCacheFirst?offset=1');
          }).then(function (response) {
            assert.ok(persistenceUtils.isCachedResponse(response), 'Cached response');
            return registration.unregister();
          }).then(function (unregistered) {
            mockFetch.clearAllRequestReplies();
            done();
          });
        });
      });
      QUnit.test('getCacheFirstStrategy() no serverCallback specified', function (assert) {
        var done = assert.async();
        assert.expect(9);
        mockFetch.addRequestReply('GET', '/testCacheFirstNoServerCallback', {
          status: 200,
          body: JSON.stringify([{DepartmentId: 1001, DepartmentName: 'ADFPM 1001 neverending', LocationId: 200, ManagerId: 300},
            {DepartmentId: 556, DepartmentName: 'BB', LocationId: 200, ManagerId: 300},
            {DepartmentId: 10, DepartmentName: 'Administration', LocationId: 200, ManagerId: 300}])
        }, function () {
          assert.ok(true, 'Mock Fetch received Request when online');
        });

        persistenceManager.register({
          scope: '/testCacheFirstNoServerCallback'
        }).then(function (registration) {
          var defaultTestResponseProxy = defaultResponseProxy.getResponseProxy({fetchStrategy: fetchStrategies.getCacheFirstStrategy()});
          registration.addEventListener('fetch', defaultTestResponseProxy.getFetchEventListener());

          fetch('/testCacheFirstNoServerCallback').then(function (response) {
            assert.ok(!persistenceUtils.isCachedResponse(response), 'Not cached response');
            assert.ok(true, 'Received Response when online');
            fetch('/testCacheFirstNoServerCallback').then(function (response) {
              assert.ok(persistenceUtils.isCachedResponse(response), 'Cached response');
              assert.ok(true, 'Received Cached Response when online');
              persistenceManager.forceOffline(true);
              fetch('/testCacheFirstNoServerCallback').then(function (response) {
                assert.ok(persistenceUtils.isCachedResponse(response), 'Cached response');
                assert.ok(true, 'Received Cached Response when offline');
                registration.unregister().then(function (unregistered) {
                  mockFetch.clearAllRequestReplies();
                  done();
                });
              });
            });
          });
        });
      });
      QUnit.test('getCacheFirstStrategy() backgroundFetch disabled', function (assert) {
        var done = assert.async();
        assert.expect(7);
        mockFetch.addRequestReply('GET', '/testCacheFirstBackgroundFetchDisabled', {
          status: 200,
          body: JSON.stringify([{DepartmentId: 1001, DepartmentName: 'ADFPM 1001 neverending', LocationId: 200, ManagerId: 300},
            {DepartmentId: 556, DepartmentName: 'BB', LocationId: 200, ManagerId: 300},
            {DepartmentId: 10, DepartmentName: 'Administration', LocationId: 200, ManagerId: 300}])
        }, function () {
          assert.ok(true, 'Mock Fetch received Request when online');
        });

        persistenceManager.register({
          scope: '/testCacheFirstBackgroundFetchDisabled'
        }).then(function (registration) {
          var defaultTestResponseProxy = defaultResponseProxy.getResponseProxy({fetchStrategy: fetchStrategies.getCacheFirstStrategy({backgroundFetch: 'disabled'})});
          registration.addEventListener('fetch', defaultTestResponseProxy.getFetchEventListener());

          fetch('/testCacheFirstBackgroundFetchDisabled').then(function (response) {
            assert.ok(!persistenceUtils.isCachedResponse(response), 'Not cached response');
            assert.ok(true, 'Received Response when online');
            fetch('/testCacheFirstBackgroundFetchDisabled').then(function (response) {
              assert.ok(persistenceUtils.isCachedResponse(response), 'Cached response');
              assert.ok(true, 'Received Cached Response when online');
              persistenceManager.forceOffline(true);
              fetch('/testCacheFirstBackgroundFetchDisabled').then(function (response) {
                assert.ok(persistenceUtils.isCachedResponse(response), 'Cached response');
                assert.ok(true, 'Received Cached Response when offline');
                registration.unregister().then(function (unregistered) {
                  mockFetch.clearAllRequestReplies();
                  done();
                });
              });
            });
          });
        });
      });
      QUnit.test('getCacheIfOffline()', function (assert) {
        var done = assert.async();
        assert.expect(10);
        mockFetch.addRequestReply('GET', '/testCacheIfOffline', {
          status: 200,
          body: JSON.stringify([{DepartmentId: 1001, DepartmentName: 'ADFPM 1001 neverending', LocationId: 200, ManagerId: 300},
            {DepartmentId: 556, DepartmentName: 'BB', LocationId: 200, ManagerId: 300},
            {DepartmentId: 10, DepartmentName: 'Administration', LocationId: 200, ManagerId: 300}])
        }, function () {
          assert.ok(true, 'Mock Fetch received Request when online');
        });

        persistenceManager.register({
          scope: '/testCacheIfOffline'
        }).then(function (registration) {
          var defaultTestResponseProxy = defaultResponseProxy.getResponseProxy({fetchStrategy: fetchStrategies.getCacheIfOfflineStrategy()});
          registration.addEventListener('fetch', defaultTestResponseProxy.getFetchEventListener());

          fetch('/testCacheIfOffline').then(function (response) {
            assert.ok(!persistenceUtils.isCachedResponse(response), 'Not cached response');
            assert.ok(true, 'Received Response when online');
            fetch('/testCacheIfOffline').then(function (response) {
              assert.ok(!persistenceUtils.isCachedResponse(response), 'Not cached response');
              assert.ok(true, 'Received Response when online');
              persistenceManager.forceOffline(true);
              fetch('/testCacheIfOffline').then(function (response) {
                assert.ok(persistenceUtils.isCachedResponse(response), 'Cached response');
                assert.ok(true, 'Received Cached Response when offline');
                persistenceManager.forceOffline(false);
                // deliberately cause fetch to reject. That should result in offline
                var saveFetch = persistenceManager.browserFetch;
                persistenceManager.browserFetch = function(request) {
                  return Promise.reject();
                };
                fetch('/testCacheIfOffline').then(function (response) {
                  assert.ok(persistenceUtils.isCachedResponse(response), 'Cached response');
                  assert.ok(true, 'Received Cached Response when offline');
                  persistenceManager.browserFetch = saveFetch;
                  registration.unregister().then(function (unregistered) {
                    mockFetch.clearAllRequestReplies();
                    done();
                  });
                });
              });
            });
          });
        });
      });
      QUnit.test('getCacheIfOffline() HEAD', function (assert) {
        var done = assert.async();
        assert.expect(7);
        mockFetch.addRequestReply('HEAD', '/testCacheIfOfflineHead', {
          status: 200,
          body: null
        });

        persistenceManager.register({
          scope: '/testCacheIfOfflineHead'
        }).then(function (registration) {
          var defaultTestResponseProxy = defaultResponseProxy.getResponseProxy({fetchStrategy: fetchStrategies.getCacheIfOfflineStrategy()});
          registration.addEventListener('fetch', defaultTestResponseProxy.getFetchEventListener());

          fetch('/testCacheIfOfflineHead', {method: 'HEAD'}).then(function (response) {
            assert.ok(!persistenceUtils.isCachedResponse(response), 'Not cached response');
            assert.ok(true, 'Received Response when online');
            fetch('/testCacheIfOfflineHead', {method: 'HEAD'}).then(function (response) {
              assert.ok(!persistenceUtils.isCachedResponse(response), 'Not cached response');
              assert.ok(true, 'Received Response when online');
              persistenceManager.forceOffline(true);
              fetch('/testCacheIfOfflineHead', {method: 'HEAD'}).then(function (response) {
                assert.ok(persistenceUtils.isCachedResponse(response), 'Cached response');
                assert.ok(response.body == null, 'Response body is null');
                assert.ok(true, 'Received Cached Response when offline');
                registration.unregister().then(function (unregistered) {
                  mockFetch.clearAllRequestReplies();
                  done();
                });
              });
            });
          });
        });
      });
      QUnit.test('getCacheIfOffline() response NotOk', function (assert) {
        var done = assert.async();
        assert.expect(3);
        mockFetch.addRequestReply('GET', '/testCacheIfOfflineNotOk', {
          status: 200,
          body: JSON.stringify([{DepartmentId: 1001, DepartmentName: 'ADFPM 1001 neverending', LocationId: 200, ManagerId: 300},
            {DepartmentId: 556, DepartmentName: 'BB', LocationId: 200, ManagerId: 300},
            {DepartmentId: 10, DepartmentName: 'Administration', LocationId: 200, ManagerId: 300}])
        });

        persistenceManager.register({
          scope: '/testCacheIfOfflineNotOk'
        }).then(function (registration) {
          var defaultTestResponseProxy = defaultResponseProxy.getResponseProxy({fetchStrategy: fetchStrategies.getCacheIfOfflineStrategy()});
          registration.addEventListener('fetch', defaultTestResponseProxy.getFetchEventListener());

          fetch('/testCacheIfOfflineNotOk').then(function (response) {
            assert.ok(!persistenceUtils.isCachedResponse(response), 'Not cached response');
            // >= 500 errors should fetch from cache
            mockFetch.clearAllRequestReplies();
            mockFetch.addRequestReply('GET', '/testCacheIfOfflineNotOk', {
              status: 500,
              body: JSON.stringify([{DepartmentId: 1001, DepartmentName: 'ADFPM 1001 neverending', LocationId: 200, ManagerId: 300},
                {DepartmentId: 556, DepartmentName: 'BB', LocationId: 200, ManagerId: 300},
                {DepartmentId: 10, DepartmentName: 'Administration', LocationId: 200, ManagerId: 300}])
            });
            fetch('/testCacheIfOfflineNotOk').then(function (response) {
              assert.ok(persistenceUtils.isCachedResponse(response), 'Cached response');
              // >= 200 errors should not fetch from cache
              mockFetch.clearAllRequestReplies();
              mockFetch.addRequestReply('GET', '/testCacheIfOfflineNotOk', {
                status: 300,
                body: JSON.stringify([{DepartmentId: 1001, DepartmentName: 'ADFPM 1001 neverending', LocationId: 200, ManagerId: 300},
                  {DepartmentId: 556, DepartmentName: 'BB', LocationId: 200, ManagerId: 300},
                  {DepartmentId: 10, DepartmentName: 'Administration', LocationId: 200, ManagerId: 300}])
              });
              fetch('/testCacheIfOfflineNotOk').then(function (response) {
                assert.ok(!persistenceUtils.isCachedResponse(response), 'Not cached response');
                registration.unregister().then(function (unregistered) {
                  mockFetch.clearAllRequestReplies();
                  done();
                });
              });
            });
          });
        });
      });
    });
  });
