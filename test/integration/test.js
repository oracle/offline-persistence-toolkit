define(['persist/persistenceManager', 'persist/persistenceUtils', 
        'persist/defaultResponseProxy', 'persist/queryHandlers',
        'persist/fetchStrategies', 
        'persist/persistenceStoreManager', 'persist/localPersistenceStoreFactory',
        'persist/simpleJsonShredding', 'persist/oracleRestJsonShredding', 
        'MockFetch', 'persist/impl/logger'],
  function (persistenceManager, persistenceUtils, defaultResponseProxy, 
    queryHandlers, fetchStrategies, persistenceStoreManager, localPersistenceStoreFactory, simpleJsonShredding, oracleRestJsonShredding, MockFetch, logger) {
    'use strict';
    logger.option('level',  logger.LEVEL_LOG);
    QUnit.module('persist/integration', {
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
          return persistenceStoreManager.openStore('syncLog');
        }).then(function (store) {
          return store.delete();
        }).then(function () {
          return persistenceStoreManager.openStore('Departments');
        }).then(function (store) {
          if (store) {
            return store.delete();
          } else {
            return Promise.resolve();
          }
        }).then(function () {
          done();
        });
      }
    });

    var mockFetch = new MockFetch();
    persistenceStoreManager.registerDefaultStoreFactory(localPersistenceStoreFactory);
    persistenceManager.init().then(function () {

      QUnit.test('Integration - shredder, queryHandler, resourceHanlder', function (assert) {
        var done = assert.async();
        //assert.expect(6);
        mockFetch.addRequestReply('GET', '/testResourceIdentifierHandling', {
          status: 200,
          body: JSON.stringify([{DepartmentId: 1001, DepartmentName: 'ADFPM 1001 neverending', LocationId: 200, ManagerId: 300},
                                {DepartmentId: 556, DepartmentName: 'BB', LocationId: 200, ManagerId: 300},
                                {DepartmentId: 10, DepartmentName: 'Administration', LocationId: 200, ManagerId: 300}]),
          headers: {'ETag': 'XYZ123'}
        }, function () {
          assert.ok(true, 'Mock Fetch received Request when online');
        });

        persistenceManager.register({
          scope: '/testResourceIdentifierHandling'
        }).then(function (registration) {
          var options = {
            jsonProcessor: {
              shredder: simpleJsonShredding.getShredder('Departments', 'DepartmentId'), 
              unshredder: simpleJsonShredding.getUnshredder()
            }, 
            queryHandler: queryHandlers.getSimpleQueryHandler('Departments'),
            fetchStrategy: fetchStrategies.getCacheIfOfflineStrategy({
              backgroundFetch: 'disabled'
            })
          };
          var defaultTestResponseProxy = defaultResponseProxy.getResponseProxy(options);
          registration.addEventListener('fetch', defaultTestResponseProxy.getFetchEventListener());
            var store;
            fetch('/testResourceIdentifierHandling').then(function (response) {
              assert.ok(true, 'Received Response when online');
              return persistenceStoreManager.openStore('Departments');
            }).then(function (pstore) {
              store = pstore;
              return store.findByKey(1001);
            }).then(function (data) {
              assert.ok(data.DepartmentName == 'ADFPM 1001 neverending', 'Found DepartmentId 1001 in localStore');
              return store.findByKey(556);
            }).then(function (data) {
              assert.ok(data.DepartmentName == 'BB', 'Found DepartmentId 556 in localStore');
              return store.findByKey(10);
            }).then(function (data) {
              assert.ok(data.DepartmentName == 'Administration', 'Found DepartmentId 10 in localStore');
              //remove a row from server, and add a new etag value on the response
              mockFetch.clearAllRequestReplies();
              mockFetch.addRequestReply('GET', '/testResourceIdentifierHandling', {
                status: 200,
                body: JSON.stringify([{DepartmentId: 1001, DepartmentName: 'ADFPM 1001 neverending', LocationId: 200, ManagerId: 300},
                                      {DepartmentId: 556, DepartmentName: 'BB', LocationId: 200, ManagerId: 300}]),
                headers: {'ETag': 'ABC123'}
              }, function () {
                assert.ok(true, 'Mock Fetch received Request when online');
              });
              return fetch('/testResourceIdentifierHandling');
            }).then(function(response) {
              return response.text();
            }).then(function(payload) {
              var rows = JSON.parse(payload);
              assert.ok(rows.length === 2, 'Should only get 2 rows back when online');
              persistenceManager.forceOffline(true);
              return fetch('/testResourceIdentifierHandling');
            }).then(function(response) {
              return response.text();
            }).then(function(payload) {
              var rows = JSON.parse(payload);
              assert.ok(rows.length === 2, 'Should only get 2 rows back when offline');
              done();
            });
          });
        });
    
/*
      QUnit.test('Integration', function (assert) {
        var done = assert.async();
        // the order of the following addRequestReply is important for the test,
        // don't change.
        mockFetch.addRequestReply('GET', '/testIntegration?q=DepartmentId=1001', {
         status: 200,
          body: JSON.stringify([{DepartmentId: 1001, DepartmentName: 'ADFPM 1001 neverending', LocationId: 200, ManagerId: 300}])
        }, function () {
          assert.ok(true, 'Mock Fetch received Request when online');
        });
        mockFetch.addRequestReply('GET', '/testIntegration/1001', {
          status: 200,
          body: JSON.stringify({DepartmentId: 1001, DepartmentName: 'ADFPM 1001 neverending', LocationId: 200, ManagerId: 300})
        }, function () {
          assert.ok(true, 'Mock Fetch received Request when online');
        });
        mockFetch.addRequestReply('GET', '/testIntegration', {
          status: 200,
          body: JSON.stringify([{DepartmentId: 1001, DepartmentName: 'ADFPM 1001 neverending', LocationId: 200, ManagerId: 300},
            {DepartmentId: 556, DepartmentName: 'BB', LocationId: 200, ManagerId: 300},
            {DepartmentId: 10, DepartmentName: 'Administration', LocationId: 200, ManagerId: 300}])
        }, function () {
          assert.ok(true, 'Mock Fetch received Request when online');
        });

        persistenceManager.register({
          scope: '/testIntegration'
        }).then(function (registration) {
          var options = {jsonProcessor: {
              shredder: simpleJsonShredding.getShredder('Departments', 'DepartmentId'), 
              unshredder: simpleJsonShredding.getUnshredder()
            },
            queryHandler: queryHandlers.getSimpleQueryHandler('Departments'),
            fetchStrategy: fetchStrategies.getCacheIfOfflineStrategy()
          };

          var defaultTestResponseProxy = defaultResponseProxy.getResponseProxy(options);
          registration.addEventListener('fetch', defaultTestResponseProxy.getFetchEventListener());
          var store;
          
          fetch('/testIntegration').then(function (response) {
            assert.ok(true, 'Received Response when online');
            return persistenceStoreManager.openStore('Departments');
          }).then(function (pstore) {
            store = pstore;
            return  store.findByKey(1001);
          }).then(function (data) {
            assert.ok(data.DepartmentName == 'ADFPM 1001 neverending', 'Found DepartmentId 1001 in localStore');
            return store.findByKey(556);
          }).then(function (data) {
            assert.ok(data.DepartmentName == 'BB', 'Found DepartmentId 556 in localStore');
            return store.findByKey(10);
          }).then(function (data) {
            assert.ok(data.DepartmentName == 'Administration', 'Found DepartmentId 10 in localStore');
            return fetch('/testIntegration?q=DepartmentId=1001');
          }).then(function (response) {
            return response.text();
          }).then(function(payload) {
            var data = JSON.parse(payload);
            assert.ok(data.length === 1 && 
                      data[0].DepartmentName === 'ADFPM 1001 neverending');
            return fetch('/testIntegration/1001');
          }).then(function (response) {
            return response.text();
          }).then(function(payload) {
            var data = JSON.parse(payload);
            assert.ok(data.DepartmentName === 'ADFPM 1001 neverending');
            persistenceManager.forceOffline(true);
            return fetch('/testIntegration/1001');
          }).then(function (response) {
            return response.text();
          }).then(function(payload) {
            var data = JSON.parse(payload);
            assert.ok(data.DepartmentName === 'ADFPM 1001 neverending');
            return persistenceManager.getSyncManager().getSyncLog();
          }).then(function (syncLog) {
            //assert.ok(syncLog.length == 1, 'SyncLog contains one item');
            assert.ok(syncLog[0].request instanceof Request, 'SyncLog item contains request');
            assert.ok(syncLog[0].requestId >= 0, 'SyncLog item contains requestId');
            persistenceManager.forceOffline(false);
            return persistenceManager.getSyncManager().sync();
          }).then(function() {
            return persistenceManager.getSyncManager().getSyncLog();
          }).then(function (syncLog) {
            assert.ok(syncLog.length == 0, 'SyncLog contains no item');
            persistenceManager.forceOffline(true);
            return fetch('/testIntegration/1001');
          }).then(function (response) {
            return response.text();
          }).then(function(payload) {
            var data = JSON.parse(payload);
            assert.ok(data.DepartmentName === 'ADFPM 1001 neverending');
            return persistenceManager.getSyncManager().getSyncLog();
          }).then(function (syncLog) {
            //assert.ok(syncLog.length == 1, 'SyncLog contains one item');
            assert.ok(syncLog[0].request instanceof Request, 'SyncLog item contains request');
            assert.ok(syncLog[0].requestId >= 0, 'SyncLog item contains requestId');
            done();
          });
        });
      });
*/
      QUnit.test('Conflict Resolution', function(assert) {
        var done = assert.async();
        mockFetch.addRequestReply('GET', '/testConflict/1001', {
          status: 200,
          body: JSON.stringify({DepartmentId: 1001, DepartmentName: 'ADFPM 1001 neverending', LocationId: 200, ManagerId: 300})
        }, function () {
          assert.ok(true, 'Mock Fetch received Request when online');
        });
        mockFetch.addRequestReply('PATCH', '/testConflict/1001', {
          status: 412,
          ok: false,
          statusText: "Precondition Failed",
          headers: {ETag: "CED0005737200136A6176612E75746"}
        }, function () {
          assert.ok(true, 'Mock Fetch received Conflict response');
        });
        persistenceManager.register({scope: '/testConflict'
        }).then(function (registration) {
          var handlePatch = function (request) {
            return request.text().then(function() {
              console.log("1");
              return request.text();
            }).then(function() {
              console.log("2");
              return new Response(JSON.stringify({
                DepartmentId: 1001,
                DepartmentName: 'ADFPM 1001 modified', 
                LocationId: 200,
                ManagerId: 300
              }), {
                status: 200,
                headers: {ETag: "6AC951D0B94E08B0200007870000000"}
              });
            });
          };
          var options = {
            jsonProcessor: {
              shredder: simpleJsonShredding.getShredder('Departments', 'DepartmentId'), 
              unshredder: simpleJsonShredding.getUnshredder()
            },
            queryHandler: queryHandlers.getSimpleQueryHandler('Departments'),
            fetchStrategy: fetchStrategies.getCacheIfOfflineStrategy(),
            requestHandlerOverride: {
              handlePatch: handlePatch
            }
          };
          var defaultTestConflictResponseProxy = defaultResponseProxy.getResponseProxy(options);
          registration.addEventListener('fetch', defaultTestConflictResponseProxy.getFetchEventListener());
          fetch('/testConflict/1001').then(function (response) {
            return response.text();
          }).then(function(payload) {
            console.log(payload);
            persistenceManager.forceOffline(true);
            var request = new Request('/testConflict/1001', {method: 'PATCH'});
            return fetch(request);
          }).then(function (response) {
            return response.text();
          }).then(function(payload) {
            console.log(payload);
            //persistenceManager.forceOffline(false);
            return persistenceManager.getSyncManager().sync();
          }).then(function () {
            assert.ok(true);
            done();
          }).catch(function (error) {
            console.log(error);
            done();
          });
        });
      });
    });
    
  });
