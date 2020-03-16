define(['persist/persistenceManager', 'persist/defaultResponseProxy', 'persist/queryHandlers', 'persist/simpleJsonShredding', 'persist/oracleRestJsonShredding', 'persist/persistenceStoreManager', 'persist/localPersistenceStoreFactory', 'MockFetch', 'persist/impl/logger'],
  function (persistenceManager, defaultResponseProxy, queryHandlers, simpleJsonShredding, oracleRestJsonShredding, persistenceStoreManager, localPersistenceStoreFactory, MockFetch, logger) {
    'use strict';
    logger.option('level',  logger.LEVEL_LOG);
    QUnit.module('queryHandlers', {
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
          return persistenceStoreManager.openStore('departments');
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

    var versionedLocalPersistenceStoreFactory = (function () {
      return {
        'createPersistenceStore': function (name, options) {
          return localPersistenceStoreFactory.createPersistenceStore(name, {version: 3});
        }
      };
    }());

    var dataMapping = {};
    dataMapping.mapFields = function(item) {
      var mappedItem = {};
      mappedItem.data = {};
      Object.keys(item.data).forEach(function(field) {
        if (field == 'establishedDate') {
          var date = new Date(item.data[field]);
          mappedItem.data[field] = date.getTime();
        } else {
          mappedItem.data[field] = item.data[field];
        }
      });
      mappedItem.metadata = item.metadata;
      return mappedItem;
    };
    dataMapping.unmapFields = function(item) {
      var unmappedItem = {};
      unmappedItem.data = {};
      Object.keys(item.data).forEach(function(field) {
        if (field == 'establishedDate') {
          var date = new Date(item.data[field]);
          unmappedItem.data[field] = date.toISOString();
        } else {
          unmappedItem.data[field] = item.data[field];
        }
      });
      unmappedItem.metadata = item.metadata;
      return unmappedItem;
    };
    dataMapping.mapFilterCriterion = function(filterCriterion) {
      if (filterCriterion && filterCriterion.attribute == 'establishedDate') {
        filterCriterion.value = (new Date(filterCriterion.value)).getTime();
      }
      return filterCriterion;
    };

    var mockFetch = new MockFetch();
    persistenceStoreManager.registerDefaultStoreFactory(versionedLocalPersistenceStoreFactory);
    persistenceManager.init().then(function () {

      QUnit.test('getSimpleQueryHandler', function (assert) {
        var done = assert.async();
        assert.expect(13);
        mockFetch.addRequestReply('GET', '/testSimpleQuery?DepartmentName=BB', {
          status: 200,
          body: JSON.stringify([{DepartmentId: 556, DepartmentName: 'BB', establishedDate: '2010-01-01T08:30:40Z', LocationId: 200, ManagerId: 300}])
        }, function () {
          assert.ok(true, 'Mock Fetch received Request when online');
        });
        mockFetch.addRequestReply('GET', '/testSimpleQuery', {
          status: 200,
          body: JSON.stringify([{DepartmentId: 1001, DepartmentName: 'ADFPM 1001 neverending', establishedDate: '1999-01-01T08:30:40Z', LocationId: 200, ManagerId: 300},
            {DepartmentId: 556, DepartmentName: 'BB', establishedDate: '2010-01-01T08:30:40Z', LocationId: 200, ManagerId: 300},
            {DepartmentId: 10, DepartmentName: 'Administration', establishedDate: '2005-01-01T08:30:40Z', LocationId: 200, ManagerId: 300,lastModified:'2005-01-01T08:30:40Z'}])
        }, function () {
          assert.ok(true, 'Mock Fetch received Request when online');
        });

        persistenceManager.register({
          scope: '/testSimpleQuery'
        }).then(function (registration) {
          var options = {queryHandler: queryHandlers.getSimpleQueryHandler('departments', null, dataMapping),
                    jsonProcessor: {shredder: simpleJsonShredding.getShredder('departments', 'DepartmentId', dataMapping), unshredder: simpleJsonShredding.getUnshredder(dataMapping)}};
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
                                done();
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
      QUnit.test('getOracleRestQueryHandler', function (assert) {
        var done = assert.async();
        assert.expect(84);
        mockFetch.addRequestReply('GET', '/testOracleRestQuery?q=DepartmentName=BB&offset=0&limit=10', {
          status: 200,
          body: JSON.stringify({items: [{DepartmentId: 556, DepartmentName: 'BB', establishedDate: '2010-01-01T08:30:40Z', LocationId: 200, ManagerId: 300}]})
        }, function () {
          assert.ok(true, 'Mock Fetch received Request when online');
        });
        mockFetch.addRequestReply('GET', '/testOracleRestQuery/556', {
          status: 200,
          body: JSON.stringify({DepartmentId: 556, DepartmentName: 'BB', establishedDate: '2010-01-01T08:30:40Z', LocationId: 200, ManagerId: 300})
        }, function () {
          assert.ok(true, 'Mock Fetch received Request when online');
        });
        mockFetch.addRequestReply('GET', '/testOracleRestQuery', {
          status: 200,
          body: JSON.stringify({items: [{DepartmentId: 1001, DepartmentName: 'ADFPM 1001 neverending', establishedDate: '1999-01-01T08:30:40Z', LocationId: 200, ManagerId: 300},
            {DepartmentId: 556, DepartmentName: 'BB', establishedDate: '2010-01-01T08:30:40Z', LocationId: 200, ManagerId: 300},
            {DepartmentId: 10, DepartmentName: 'Administration', establishedDate: '2005-01-01T08:30:40Z', LocationId: 200, ManagerId: 300,lastModified:'2005-01-01T08:30:40Z'}]})
        }, function () {
          assert.ok(true, 'Mock Fetch received Request when online');
        });

        persistenceManager.register({
          scope: '/testOracleRestQuery'
        }).then(function (registration) {
          var options = {queryHandler: queryHandlers.getOracleRestQueryHandler('departments', null, dataMapping),
                    jsonProcessor: {shredder: oracleRestJsonShredding.getShredder('departments', 'DepartmentId', dataMapping), unshredder: oracleRestJsonShredding.getUnshredder(dataMapping)}};
          var defaultTestResponseProxy = defaultResponseProxy.getResponseProxy(options);
          registration.addEventListener('fetch', defaultTestResponseProxy.getFetchEventListener());
          var responseArray = [];

          persistenceManager.forceOffline(true);
          fetch('/testOracleRestQuery?q=DepartmentName=BB&offset=0&limit=10').then(function (response) {
              assert.ok(true, 'Received Response when offline');
              persistenceManager.forceOffline(false);
              return fetch('/testOracleRestQuery');
            }).then(function(){
              assert.ok(true, 'Received Response when online');
              return fetch('/testOracleRestQuery/556');
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
              return fetch("/testOracleRestQuery?q=establishedDate>'2005-01-01T08:30:40Z'&offset=0&limit=10");
            }).then(function (response) {
              assert.ok(true, 'Received Response when offline');
              return response.json();
            }).then(function (responseData) {
              assert.ok(responseData.items.length == 1, 'Returned the correct departments');
              assert.ok(responseData.items[0].DepartmentName == 'BB', 'Returned the correct department');
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
              return fetch("/testOracleRestQuery?q=DepartmentName%3D%27BB%27%3BDepartmentId%3D556&offset=0&limit=10");
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
              return fetch('/testOracleRestQuery?q=DepartmentId%20IN%201001');
            }).then(function (response) {
              assert.ok(true, 'Received Response when offline');
              return response.json();
            }).then(function (responseData) {
              assert.ok(responseData.items.length == 1 && responseData.items[0].DepartmentId === 1001, '1 document found using $in');
              return fetch('/testOracleRestQuery?q=DepartmentId%20IN%2010,1001');
            }).then(function (response) {
              assert.ok(true, 'Received Response when offline');
              return response.json();
            }).then(function (responseData) {
              assert.ok(responseData.items.length == 2 || responseData.count == 2 , '2 document found using $in');
              assert.ok( responseData.items[0].DepartmentId === 1001 || responseData.items[0].DepartmentId === 10 , 'DepartmentId is Correct');
              assert.ok( responseData.items[1].DepartmentId === 1001 || responseData.items[1].DepartmentId === 10 , 'DepartmentId is Correct');
              assert.ok( responseData.items[0].DepartmentId != responseData.items[1].DepartmentId , 'Not the same Department');
              return fetch('/testOracleRestQuery?q=DepartmentName IN ("BB","ADFPM 1001 neverending")');
            }).then(function (response) {
              assert.ok(true, 'Received Response when offline');
              return response.json();
            }).then(function (responseData) {
              assert.ok(responseData.items.length == 2 || responseData.count == 2 , 'found 2 documents');
              assert.ok( responseData.items[0].DepartmentName === "BB" || responseData.items[0].DepartmentName === "ADFPM 1001 neverending" , 'DepartmentName is Correct');
              assert.ok( responseData.items[1].DepartmentName === "BB" || responseData.items[1].DepartmentName === "ADFPM 1001 neverending" , 'DepartmentName is Correct');
              assert.ok( responseData.items[0].DepartmentName != responseData.items[1].DepartmentName , 'Not the same Department');
              return fetch('/testOracleRestQuery?q=LocationId IN (200,201,202,203)');
            }).then(function (response) {
              assert.ok(true, 'Received Response when offline');
              return response.json();
            }).then(function (responseData) {
              assert.ok(responseData.items.length == 3 || responseData.count == 3 , 'found 3 documents');
              assert.ok( responseData.items[0].LocationId === 200 && responseData.items[1].LocationId === 200 && responseData.items[2].LocationId === 200 , 'LocationId is Correct');
              return fetch("/testOracleRestQuery?q=DepartmentId<>556&offset=0&limit=10");
            }).then(function (response) {
              assert.ok(true, 'Received Response when offline');
              return response.json();
            }).then(function (responseData) {
              assert.ok(responseData.items.length == 2, 'Returned the correct departments');
              assert.ok(responseData.items[0].DepartmentName == 'Administration' || responseData.items[1].DepartmentName == 'Administration', 'Returned the correct department');
              assert.ok(responseData.items[1].DepartmentName == 'ADFPM 1001 neverending' || responseData.items[0].DepartmentName == 'ADFPM 1001 neverending', 'Returned the correct department');

              return fetch("/testOracleRestQuery?q=images IS NULL");
            }).then(function (response) {
              assert.ok(true, 'Received Response when offline');
              return response.json();
            }).then(function (responseData) {
              assert.ok(responseData.items.length == 3, 'Returned the correct departments');
              return fetch("/testOracleRestQuery?q=lastModified IS NULL");
            }).then(function (response) {
              assert.ok(true, 'Received Response when offline');
              return response.json();
            }).then(function (responseData) {
              assert.ok(responseData.items.length == 2, 'Returned the correct departments');
              assert.ok(responseData.items[0].DepartmentName == 'BB' || responseData.items[1].DepartmentName == 'BB', 'Returned the correct department');
              assert.ok(responseData.items[1].DepartmentName == 'ADFPM 1001 neverending' || responseData.items[0].DepartmentName == 'ADFPM 1001 neverending', 'Returned the correct department');
              return registration.unregister();
            }).then(function (unregistered) {
              assert.ok(unregistered == true, 'unregistered scope');
              done();
            });
          });
        });
      });
    });
