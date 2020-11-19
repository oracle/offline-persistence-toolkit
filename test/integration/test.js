define(['persist/persistenceManager', 'persist/persistenceUtils',
        'persist/defaultResponseProxy', 'persist/queryHandlers',
        'persist/fetchStrategies',
        'persist/persistenceStoreManager', 'persist/localPersistenceStoreFactory',
        'persist/simpleJsonShredding', 'persist/oracleRestJsonShredding',
        'MockFetch', 'persist/impl/logger', 'persist/impl/defaultCacheHandler'],
  function (persistenceManager, persistenceUtils, defaultResponseProxy,
    queryHandlers, fetchStrategies, persistenceStoreManager,
    localPersistenceStoreFactory, simpleJsonShredding,
    oracleRestJsonShredding, MockFetch, logger, cacheHandler) {
    'use strict';
    logger.option('level',  logger.LEVEL_LOG);
    QUnit.module('persist/integration', {
      beforeEach: function (assert) {
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
          return persistenceStoreManager.openStore('DepartmentsWQ');
        }).then(function (store) {
          if (store) {
            return store.delete();
          } else {
            return Promise.resolve();
          }
        }).then(function () {
          return persistenceStoreManager.openStore('DepartmentsIC');
        }).then(function (store) {
          if (store) {
            return store.delete();
          } else {
            return Promise.resolve();
          }
        }).then(function () {
          return persistenceStoreManager.openStore('SyncCache');
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

      QUnit.test('Integration - sync replay with cache handling', function (assert) {
        var done = assert.async();
        //assert.expect(6);
        mockFetch.addRequestReply('GET', '/testSyncCacheHandling/1001', {
          status: 200,
          body: JSON.stringify({DepartmentId: 1001, DepartmentName: 'ADFPM 1001 neverending', LocationId: 200, ManagerId: 300})
        }, function () {
          assert.ok(true, 'Mock Fetch received Request when online');
        });
        mockFetch.addRequestReply('GET', '/testSyncCacheHandling', {
          status: 200,
          body: JSON.stringify([{DepartmentId: 1001, DepartmentName: 'ADFPM 1001 neverending', LocationId: 200, ManagerId: 300},
                                {DepartmentId: 556, DepartmentName: 'BB', LocationId: 200, ManagerId: 300},
                                {DepartmentId: 10, DepartmentName: 'Administration', LocationId: 200, ManagerId: 300}])
        }, function () {
          assert.ok(true, 'Mock Fetch received Request when online');
        });

        persistenceManager.register({
          scope: '/testSyncCacheHandling'
        }).then(function (registration) {
          var options = {
            jsonProcessor: {
              shredder: simpleJsonShredding.getShredder('SyncCache', 'DepartmentId'),
              unshredder: simpleJsonShredding.getUnshredder()
            },
            queryHandler: queryHandlers.getSimpleQueryHandler('SyncCache'),
            fetchStrategy: fetchStrategies.getCacheIfOfflineStrategy({
              backgroundFetch: 'disabled'
            })
          };
          var defaultTestResponseProxy = defaultResponseProxy.getResponseProxy(options);
          registration.addEventListener('fetch', defaultTestResponseProxy.getFetchEventListener());
          var store;
          var endpointKey;
          fetch('/testSyncCacheHandling').then(function (response) {
            assert.ok(true, 'Received Response when online');
            return persistenceStoreManager.openStore('SyncCache');
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
            persistenceManager.forceOffline(true);
            return fetch('/testSyncCacheHandling/1001');
          }).then(function(response) {
            return response.text();
          }).then(function(payload) {
            var data = JSON.parse(payload);
            assert.ok(data.DepartmentName === 'ADFPM 1001 neverending');
            persistenceManager.forceOffline(true);
            return persistenceManager.getSyncManager().sync();
          }).then(function() {
            return fetch('/testSyncCacheHandling/1001');
          }).then(function(response) {
            return response.text();
          }).then(function(payload) {
            var data = JSON.parse(payload);
            assert.ok(data.DepartmentName === 'ADFPM 1001 neverending');
            var request = new Request('/testSyncCacheHandling/1001');
            endpointKey = persistenceUtils.buildEndpointKey(request);
            cacheHandler.registerEndpointOptions(endpointKey, options);
            return options.queryHandler(request, options);
          }).then(function(response) {
            assert.ok(response != null);
            return response.text();
          }).then(function(payload) {
            var data = JSON.parse(payload);
            assert.ok(data.DepartmentName === 'ADFPM 1001 neverending');
            cacheHandler.unregisterEndpointOptions(endpointKey);
            done();
          });
        });
      });

      QUnit.test('Integration - server side deletion', function (assert) {
        var done = assert.async();
        mockFetch.addRequestReply('GET', '/testServerDeletion', {
          status: 200,
          body: JSON.stringify([{DepartmentId: 1001, DepartmentName: 'AA', LocationId: 200, ManagerId: 300},
                                {DepartmentId: 556, DepartmentName: 'BB', LocationId: 200, ManagerId: 300},
                                {DepartmentId: 10, DepartmentName: 'CC', LocationId: 200, ManagerId: 300}]),
          headers: {'ETag': 'XYZ123'}
        }, function () {
          assert.ok(true, 'Mock Fetch received Request when online');
        });

        persistenceManager.register({
          scope: '/testServerDeletion'
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
            fetch('/testServerDeletion').then(function (response) {
              assert.ok(true, 'Received Response when online');
              return persistenceStoreManager.openStore('Departments');
            }).then(function (pstore) {
              store = pstore;
              return store.findByKey(1001);
            }).then(function (data) {
              assert.ok(data.DepartmentName == 'AA', 'Found DepartmentId 1001 in localStore');
              return store.findByKey(556);
            }).then(function (data) {
              assert.ok(data.DepartmentName == 'BB', 'Found DepartmentId 556 in localStore');
              return store.findByKey(10);
            }).then(function (data) {
              assert.ok(data.DepartmentName == 'CC', 'Found DepartmentId 10 in localStore');
              //remove a row from server, and add a new etag value on the response
              mockFetch.clearAllRequestReplies();
              mockFetch.addRequestReply('GET', '/testServerDeletion', {
                status: 200,
                body: JSON.stringify([{DepartmentId: 1001, DepartmentName: 'AA', LocationId: 200, ManagerId: 300},
                                      {DepartmentId: 556, DepartmentName: 'BB', LocationId: 200, ManagerId: 300}]),
                headers: {'ETag': 'ABC123'}
              }, function () {
                assert.ok(true, 'Mock Fetch received Request when online');
              });
              return fetch('/testServerDeletion');
            }).then(function(response) {
              return response.text();
            }).then(function(payload) {
              var rows = JSON.parse(payload);
              assert.ok(rows.length === 2, 'Should only get 2 rows back when online');
              return store.findByKey(10);
            }).then(function(data) {
              assert.ok(data == null, 'DepartmentId 10 should have been deleted in localStore');
              persistenceManager.forceOffline(true);
              return fetch('/testServerDeletion');
            }).then(function(response) {
              return response.text();
            }).then(function(payload) {
              var rows = JSON.parse(payload);
              assert.ok(rows.length === 2, 'Should only get 2 rows back when offline');
              done();
            });
          });
        });

        QUnit.test('Integration - server side deletion with query parameters', function (assert) {
          var done = assert.async();
          mockFetch.addRequestReply('GET', '/testParameterServerDeletion?offset=0&limit=25', {
            status: 200,
            body: JSON.stringify({
              hasMore: false,
              items: [{DepartmentId: 1001, DepartmentName: 'AA', LocationId: 200, ManagerId: 300},
                      {DepartmentId: 556, DepartmentName: 'BB', LocationId: 200, ManagerId: 300},
                      {DepartmentId: 10, DepartmentName: 'CC', LocationId: 200, ManagerId: 300}]
            }),
            headers: {'X-ORACLE-DMS-ECID': 'XYZ123'}
          }, function () {
            assert.ok(true, 'Mock Fetch received Request when online');
          });
    
          persistenceManager.register({
            scope: '/testParameterServerDeletion'
          }).then(function (registration) {
            var options = {
              jsonProcessor: {
                shredder: oracleRestJsonShredding.getShredder('DepartmentsWQ', 'DepartmentId'),
                unshredder: oracleRestJsonShredding.getUnshredder()
              },
              queryHandler: queryHandlers.getOracleRestQueryHandler('DepartmentsWQ'),
              fetchStrategy: fetchStrategies.getCacheIfOfflineStrategy({
                backgroundFetch: 'disabled'
              })
            };
            var defaultTestResponseProxy = defaultResponseProxy.getResponseProxy(options);
            registration.addEventListener('fetch', defaultTestResponseProxy.getFetchEventListener());
              var store;
              fetch('/testParameterServerDeletion?offset=0&limit=25').then(function (response) {
                assert.ok(true, 'Received Response when online');
                return persistenceStoreManager.openStore('DepartmentsWQ');
              }).then(function (pstore) {
                store = pstore;
                return store.findByKey(1001);
              }).then(function (data) {
                assert.ok(data.DepartmentName == 'AA', 'Found DepartmentId 1001 in localStore');
                return store.findByKey(556);
              }).then(function (data) {
                assert.ok(data.DepartmentName == 'BB', 'Found DepartmentId 556 in localStore');
                return store.findByKey(10);
              }).then(function (data) {
                assert.ok(data.DepartmentName == 'CC', 'Found DepartmentId 10 in localStore');
                //remove a row from server, and add a new etag value on the response
                mockFetch.clearAllRequestReplies();
                mockFetch.addRequestReply('GET', '/testParameterServerDeletion?offset=0&limit=25', {
                  status: 200,
                  body: JSON.stringify({
                    hasMore: false,
                    items: [{DepartmentId: 1001, DepartmentName: 'AA', LocationId: 200, ManagerId: 300},
                            {DepartmentId: 556, DepartmentName: 'BB', LocationId: 200, ManagerId: 300}]
                  }),
                  headers: {'X-ORACLE-DMS-ECID': 'ABC123'}
                }, function () {
                  assert.ok(true, 'Mock Fetch received Request when online');
                });
              return fetch('/testParameterServerDeletion?offset=0&limit=25');
            }).then(function(response) {
              return response.text();
            }).then(function(payload) {
              var rows = JSON.parse(payload).items;
              assert.ok(rows.length === 2, 'Should only get 2 rows back when online');
              return store.findByKey(10);
            }).then(function(data) {
              assert.ok(data == null, 'DepartmentId 10 should have been deleted in localStore');
              persistenceManager.forceOffline(true);
              return fetch('/testParameterServerDeletion?offset=0&limit=25');
            }).then(function(response) {
              return response.text();
            }).then(function(payload) {
              var rows = JSON.parse(payload).items;
              assert.ok(rows.length === 2, 'Should only get 2 rows back when offline');
              done();
            });
          });
        });

        QUnit.test('Integration - server side deletion with incomplete collection', function (assert) {
          var done = assert.async();
          mockFetch.addRequestReply('GET', '/testIncompleteServerDeletion?LocationId=200', {
            status: 200,
            body: JSON.stringify([{DepartmentId: 1001, DepartmentName: 'AA', LocationId: 200, ManagerId: 300},
                      {DepartmentId: 556, DepartmentName: 'BB', LocationId: 200, ManagerId: 300},
                      {DepartmentId: 10, DepartmentName: 'CC', LocationId: 200, ManagerId: 300}]),
            headers: {'Etag': 'XYZ123'}
          }, function () {
            assert.ok(true, 'Mock Fetch received Request when online');
          });

          persistenceManager.register({
            scope: '/testIncompleteServerDeletion'
          }).then(function (registration) {
            var locationDataMapping = {};
            locationDataMapping.mapFields = function(item) {
              var mappedItem = {};
              mappedItem.data = {};
              Object.keys(item.data).forEach(function(field) {
                if (field == 'LocationId') {
                  mappedItem.data[field] = parseInt(item.data[field]);
                } else {
                  mappedItem.data[field] = item.data[field];
                }
              });
              mappedItem.metadata = item.metadata;
              return mappedItem;
            };
            locationDataMapping.unmapFields = function(item) {
              var unmappedItem = {};
              unmappedItem.data = {};
              Object.keys(item.data).forEach(function(field) {
                if (field == 'LocationId') {
                  unmappedItem.data[field] = item.data[field].toString();
                } else {
                  unmappedItem.data[field] = item.data[field];
                }
              });
              unmappedItem.metadata = item.metadata;
              return unmappedItem;
            };
            locationDataMapping.mapFilterCriterion = function(filterCriterion) {
              if (filterCriterion && filterCriterion.attribute == 'LocationId') {
                filterCriterion.value = parseInt(filterCriterion.value);
              }
              return filterCriterion;
            };
            var options = {
              jsonProcessor: {
                shredder: simpleJsonShredding.getShredder('DepartmentsIC', 'DepartmentId', locationDataMapping),
                unshredder: simpleJsonShredding.getUnshredder(locationDataMapping)
              },
              queryHandler: queryHandlers.getSimpleQueryHandler('DepartmentsIC', null, locationDataMapping),
              fetchStrategy: fetchStrategies.getCacheIfOfflineStrategy({
                backgroundFetch: 'disabled'
              })
            };          var defaultTestResponseProxy = defaultResponseProxy.getResponseProxy(options);
          registration.addEventListener('fetch', defaultTestResponseProxy.getFetchEventListener());
            var store;
            fetch('/testIncompleteServerDeletion?LocationId=200').then(function (response) {
              assert.ok(true, 'Received Response when online');
              return persistenceStoreManager.openStore('DepartmentsIC');
            }).then(function (pstore) {
              store = pstore;
              return store.findByKey(1001);
            }).then(function (data) {
              assert.ok(data.DepartmentName == 'AA', 'Found DepartmentId 1001 in localStore');
              return store.findByKey(556);
            }).then(function (data) {
              assert.ok(data.DepartmentName == 'BB', 'Found DepartmentId 556 in localStore');
              return store.findByKey(10);
            }).then(function (data) {
              assert.ok(data.DepartmentName == 'CC', 'Found DepartmentId 10 in localStore');
              //remove a row from server, and add a new etag value on the response
              mockFetch.clearAllRequestReplies();
              mockFetch.addRequestReply('GET', '/testIncompleteServerDeletion?LocationId=200', {
                status: 200,
                body: JSON.stringify([{DepartmentId: 1001, DepartmentName: 'AA', LocationId: 200, ManagerId: 300},
                          {DepartmentId: 556, DepartmentName: 'BB', LocationId: 200, ManagerId: 300}]),
                headers: {'Etag': 'ABC123'}
              }, function () {
                assert.ok(true, 'Mock Fetch received Request when online');
              });
              return fetch('/testIncompleteServerDeletion?LocationId=200');
            }).then(function(response) {
              return response.text();
            }).then(function(payload) {
              var rows = JSON.parse(payload);
              assert.ok(rows.length === 2, 'Should only get 2 rows back when online');
              return store.findByKey(10);
            }).then(function(data) {
              assert.ok(data.DepartmentName == 'CC', 'Should still found DepartmentId 10 in localStore');
              persistenceManager.forceOffline(true);
              return fetch('/testIncompleteServerDeletion?LocationId=200');
            }).then(function(response) {
              return response.text();
            }).then(function(payload) {
              var rows = JSON.parse(payload);
              assert.ok(rows.length === 3, 'Should still only get 3 rows back when offline.');
              return fetch('/testIncompleteServerDeletion/10');
            }).then(function(response) {
              return response.text();
            }).then(function(payload) {
              var data = JSON.parse(payload);
              assert.ok(data.DepartmentName == 'CC', 'Should still get stale department response back when offline');
              done();
            });
          });
        });

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
