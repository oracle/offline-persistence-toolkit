define(['persist/persistenceManager', 'persist/defaultResponseProxy', 'persist/queryHandlers', 'persist/simpleJsonShredding', 'persist/oracleRestJsonShredding', 'persist/persistenceStoreManager', 'persist/localPersistenceStoreFactory', 'MockFetch', 'persist/impl/logger'],
  function (persistenceManager, defaultResponseProxy, queryHandlers, simpleJsonShredding, oracleRestJsonShredding, persistenceStoreManager, localPersistenceStoreFactory, MockFetch, logger) {
    'use strict';
    logger.option('level',  logger.LEVEL_LOG);
    module('queryHandlers', {
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
          return persistenceStoreManager.openStore('test');
        }).then(function (store) {
          return store.delete();
        }).then(function () {
          return persistenceStoreManager.openStore('departments');
        }).then(function (store) {
          if (store) {
            return store.delete();
          } else {
            return Promise.resolve();
          }
        }).then(function () {
          start();
        });
      }
    });

    var versionedLocalPersistenceStoreFactory = (function () {
      return {
        'createPersistenceStore': function (name, options) {
          return localPersistenceStoreFactory.createPersistenceStore(name, {version: 3});
        }
      };
    }());

    var mockFetch = new MockFetch();
    persistenceStoreManager.registerDefaultStoreFactory(versionedLocalPersistenceStoreFactory);
    persistenceManager.init().then(function () {

      asyncTest('getSimpleQueryHandler', function (assert) {
        expect(13);
        mockFetch.addRequestReply('GET', '/testSimpleQuery', {
          status: 200,
          body: JSON.stringify([{DepartmentId: 1001, DepartmentName: 'ADFPM 1001 neverending', LocationId: 200, ManagerId: 300},
            {DepartmentId: 556, DepartmentName: 'BB', LocationId: 200, ManagerId: 300},
            {DepartmentId: 10, DepartmentName: 'Administration', LocationId: 200, ManagerId: 300}])
        }, function () {
          assert.ok(true, 'Mock Fetch received Request when online');
        });

        persistenceManager.register({
          scope: '/testSimpleQuery'
        }).then(function (registration) {
          var options = {queryHandler: queryHandlers.getSimpleQueryHandler('departments'),
                    jsonProcessor: {shredder: simpleJsonShredding.getShredder('departments', 'DepartmentId'), unshredder: simpleJsonShredding.getUnshredder()}};
          var defaultTestResponseProxy = defaultResponseProxy.getResponseProxy(options);
          registration.addEventListener('fetch', defaultTestResponseProxy.getFetchEventListener());

          persistenceManager.forceOffline(true);
          fetch('/testSimpleQuery?DepartmentName=BB').then(function (response) {
            assert.ok(true, 'Received Response when offline');
            persistenceManager.forceOffline(false);
            fetch('/testSimpleQuery').then(function (response) {
              assert.ok(true, 'Received Response when online');
              persistenceManager.forceOffline(true);
              fetch('/testSimpleQuery?DepartmentName=BB').then(function (response) {
                assert.ok(true, 'Received Response when offline');
                response.json().then(function (responseData) {
                  assert.ok(responseData.length == 1 && responseData[0].DepartmentName == 'BB', 'Returned the correct department');
                  // test simulating a browser without URLSearchParams
                  var saveURLSearchParams = window.URLSearchParams;
                  window.URLSearchParams = undefined;
                  fetch('/testSimpleQuery?DepartmentName=BB').then(function (response) {
                    assert.ok(true, 'Received Response when offline');
                    response.json().then(function (responseData) {
                      assert.ok(responseData.length == 1 && responseData[0].DepartmentName == 'BB', 'Returned the correct department');
                      window.URLSearchParams = saveURLSearchParams;
                      fetch('/testSimpleQuery/556').then(function (response) {
                        assert.ok(true, 'Received Response when offline');
                        response.json().then(function (responseData) {
                          assert.ok(responseData.DepartmentName == 'BB', 'Returned the correct department');
                          fetch('/testSimpleQuery').then(function (response) {
                            assert.ok(true, 'Received Response when offline');
                            response.json().then(function (responseData) {
                              assert.ok(responseData.length == 3, 'Returned the correct departments');
                              registration.unregister().then(function (unregistered) {
                                assert.ok(unregistered == true, 'unregistered scope');
                                start();
                              });
                            });
                          });
                        });
                      });
                    });
                  });
                });
              });
            });
          });
        });
      });
      asyncTest('getOracleRestQueryHandler', function (assert) {
        expect(52);
        mockFetch.addRequestReply('GET', '/testOracleRestQuery', {
          status: 200,
          body: JSON.stringify({items: [{DepartmentId: 1001, DepartmentName: 'ADFPM 1001 neverending', LocationId: 200, ManagerId: 300},
            {DepartmentId: 556, DepartmentName: 'BB', LocationId: 200, ManagerId: 300},
            {DepartmentId: 10, DepartmentName: 'Administration', LocationId: 200, ManagerId: 300}]})
        }, function () {
          assert.ok(true, 'Mock Fetch received Request when online');
        });

        persistenceManager.register({
          scope: '/testOracleRestQuery'
        }).then(function (registration) {
          var options = {queryHandler: queryHandlers.getOracleRestQueryHandler('departments'),
                    jsonProcessor: {shredder: oracleRestJsonShredding.getShredder('departments', 'DepartmentId'), unshredder: oracleRestJsonShredding.getUnshredder()}};
          var defaultTestResponseProxy = defaultResponseProxy.getResponseProxy(options);
          registration.addEventListener('fetch', defaultTestResponseProxy.getFetchEventListener());
          var responseArray = [];

          persistenceManager.forceOffline(true);
          fetch('/testOracleRestQuery?q=DepartmentName=BB&offset=0&limit=10').then(function (response) {
              assert.ok(true, 'Received Response when offline');
              persistenceManager.forceOffline(false);
              return fetch('/testOracleRestQuery').then(function (response) {
            }).then(function(){
              assert.ok(true, 'Received Response when online');
              persistenceManager.forceOffline(true);
              return fetch('/testOracleRestQuery?q=DepartmentName=BB&offset=0&limit=10');
            }).then(function (response) {
              assert.ok(true, 'Received Response when offline');
              return response.json();
            }).then(function (responseData) {
              assert.ok(responseData.items.length == 1 && responseData.items[0].DepartmentName == 'BB', 'Returned the correct department');
              return fetch("/testOracleRestQuery?q=DepartmentName='BB'&offset=0&limit=10");
            }).then(function (response) {
              assert.ok(true, 'Received Response when offline');
              return response.json();
            }).then(function (responseData) {
              assert.ok(responseData.items.length == 1 && responseData.items[0].DepartmentName == 'BB', 'Returned the correct department');
              return fetch("/testOracleRestQuery?q=DepartmentId>556&offset=0&limit=10");
            }).then(function (response) {
              assert.ok(true, 'Received Response when offline');
              return response.json();
            }).then(function (responseData) {
              assert.ok(responseData.items.length == 1 && responseData.items[0].DepartmentName == 'ADFPM 1001 neverending', 'Returned the correct department');
              return fetch("/testOracleRestQuery?q=DepartmentId<556&offset=0&limit=10");
            }).then(function (response) {
              assert.ok(true, 'Received Response when offline');
              return response.json();
            }).then(function (responseData) {
              assert.ok(responseData.items.length == 1 && responseData.items[0].DepartmentName == 'Administration', 'Returned the correct department');
              return fetch("/testOracleRestQuery?q=DepartmentId>=556&offset=0&limit=10");
            }).then(function (response) {
              assert.ok(true, 'Received Response when offline');
              return response.json();
            }).then(function (responseData) {
              assert.ok(responseData.items.length == 2, 'Returned the correct departments');  
              assert.ok(responseData.items[0].DepartmentName == 'ADFPM 1001 neverending' || responseData.items[1].DepartmentName == 'ADFPM 1001 neverending', 'Returned the correct department');
              assert.ok(responseData.items[1].DepartmentName == 'BB' || responseData.items[0].DepartmentName == 'BB', 'Returned the correct department');
              return fetch("/testOracleRestQuery?q=DepartmentId<=556&offset=0&limit=10");
            }).then(function (response) {
              assert.ok(true, 'Received Response when offline');
              return response.json();
            }).then(function (responseData) {
              assert.ok(responseData.items.length == 2, 'Returned the correct departments');  
              assert.ok(responseData.items[0].DepartmentName == 'Administration' || responseData.items[1].DepartmentName == 'Administration', 'Returned the correct department');
              assert.ok(responseData.items[1].DepartmentName == 'BB' || responseData.items[0].DepartmentName == 'BB', 'Returned the correct department');
              return fetch("/testOracleRestQuery?q=DepartmentId!=556&offset=0&limit=10");
            }).then(function (response) {
              assert.ok(true, 'Received Response when offline');
              return response.json();
            }).then(function (responseData) {
              assert.ok(responseData.items.length == 2, 'Returned the correct departments');  
              assert.ok(responseData.items[0].DepartmentName == 'Administration' || responseData.items[1].DepartmentName == 'Administration', 'Returned the correct department');
              assert.ok(responseData.items[1].DepartmentName == 'ADFPM 1001 neverending' || responseData.items[0].DepartmentName == 'ADFPM 1001 neverending', 'Returned the correct department');
              return fetch("/testOracleRestQuery?q=DepartmentId=556%20OR%20DepartmentId=10&offset=0&limit=10");
            }).then(function (response) {
              assert.ok(true, 'Received Response when offline');
              return response.json();
            }).then(function (responseData) {
              assert.ok(responseData.items.length == 2, 'Returned the correct departments');  
              assert.ok(responseData.items[0].DepartmentName == 'Administration' || responseData.items[1].DepartmentName == 'Administration', 'Returned the correct department');
              assert.ok(responseData.items[1].DepartmentName == 'BB' || responseData.items[0].DepartmentName == 'BB', 'Returned the correct department');
              return fetch("/testOracleRestQuery?q=DepartmentId=556%20AND%20DepartmentName=Administration&offset=0&limit=10");
            }).then(function (response) {
              assert.ok(true, 'Received Response when offline');
              return response.json();
            }).then(function (responseData) {
              assert.ok(responseData.items.length == 0, 'No departments');
              return fetch("/testOracleRestQuery?q=DepartmentName%20LIKE%20%27B%25%27&offset=0&limit=10");
            }).then(function (response) {
              assert.ok(true, 'Received Response when offline');
              return response.json();
            }).then(function (responseData) {
              assert.ok(responseData.items.length == 1 && responseData.items[0].DepartmentName == 'BB', 'Returned the correct department');
              return fetch("/testOracleRestQuery?q=DepartmentId%20BETWEEN%2010%20AND%201001&offset=0&limit=10");
            }).then(function (response) {
              assert.ok(true, 'Received Response when offline');
              return response.json();
            }).then(function (responseData) {
              assert.ok(responseData.items.length == 3, 'Returned the correct departments');
              return fetch("/testOracleRestQuery?q=DepartmentName=%27BB%27&offset=0&limit=10");
            }).then(function (response) {
              assert.ok(true, 'Received Response when offline');
              return response.json();
            }).then(function (responseData) {
              assert.ok(responseData.items.length == 1 && responseData.items[0].DepartmentName == 'BB', 'Returned the correct department');
              return fetch('/testOracleRestQuery/556');
            }).then(function (response) {
              assert.ok(true, 'Received Response when offline');
              return response.json();
            }).then(function (responseData) {
              assert.ok(responseData.DepartmentName == 'BB', 'Returned the correct department');
              return fetch('/testOracleRestQuery/556?');
            }).then(function (response) {
              assert.ok(true, 'Received Response when offline');
              return response.json();
            }).then(function (responseData) {
              assert.ok(responseData.DepartmentName == 'BB', 'Returned the correct department');
              return fetch('/testOracleRestQuery');
            }).then(function (response) {
              assert.ok(true, 'Received Response when offline');
              return response.json();
            }).then(function (responseData) {
              responseArray = responseData.items;
              assert.ok(responseData.items.length == 3, 'Returned the correct departments');
              return fetch("/testOracleRestQuery?offset=1&limit=1");
            }).then(function (response) {
              assert.ok(true, 'Received Response when offline');
              return response.json();
            }).then(function (responseData) {
              assert.ok(responseData.items.length == 1 && responseData.items[0].DepartmentName == responseArray[1].DepartmentName, 'Returned the correct department');
              assert.ok(responseData.hasMore == true, 'hasMore is true');
              assert.ok(responseData.count == 1, 'hasMore is true');
              return fetch("/testOracleRestQuery?offset=1&limit=3");
            }).then(function (response) {
              assert.ok(true, 'Received Response when offline');
              return response.json();
            }).then(function (responseData) {
              assert.ok(responseData.items.length == 2 && responseData.items[0].DepartmentName == responseArray[1].DepartmentName, 'Returned the correct department');
              assert.ok(responseData.hasMore == false, 'hasMore is false');
              assert.ok(responseData.count == 2, 'count is 2');
              assert.ok(responseData.totalResults == 3, 'totalResults is 3');
              return registration.unregister();
            }).then(function (unregistered) {
              assert.ok(unregistered == true, 'unregistered scope');
              start();
            });
          });
        });
      });
    });
  });
