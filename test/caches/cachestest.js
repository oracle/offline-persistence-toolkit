define(['persist/persistenceStoreManager', 'persist/localPersistenceStoreFactory',
        'persist/oracleRestJsonShredding', 'persist/persistenceUtils',
        'persist/impl/offlineCacheManager', 'persist/impl/defaultCacheHandler',
        'MockFetch', 'persist/impl/logger'],
  function(persistenceStoreManager, localPersistenceStoreFactory, 
           oracleRestJsonShredding, persistenceUtils, offlineCacheManager,
           cacheHandler, MockFetch, logger){
  'use strict';
  logger.option('level',  logger.LEVEL_LOG);
  QUnit.module('cachestest');

  persistenceStoreManager.registerDefaultStoreFactory(localPersistenceStoreFactory);

  QUnit.test("basic cache manager test", function (assert) {
    var testCache;
    return new Promise(function (resolve, reject) {
      offlineCacheManager.delete('testcachemanager').then(function () {
        return offlineCacheManager.open('testcachemanager');
      }).then(function (cache) {
        assert.ok(true, 'cache with name testcachemanager is opened.');
        testCache = cache;
        return offlineCacheManager.has('testcachemanager');
      }).then(function(hasCache){
        assert.ok(hasCache, 'cache should have existed.');
        var cacheName = testCache.getName();
        assert.ok(cacheName === 'testcachemanager');
        return offlineCacheManager.keys();
      }).then(function (keysArray) {
        var filteredArray = keysArray.filter(function (element) {
          return element === 'testcachemanager';
        });
        assert.ok(filteredArray && filteredArray.length === 1);
        return offlineCacheManager.open('testcachemanager');
      }).then(function (cache1) {
        assert.ok(cache1);
        assert.ok('testcachemanager' === cache1.getName());
        return offlineCacheManager.keys();
      }).then(function (keysArray1) {
        var filteredArray1 = keysArray1.filter(function (element) {
          return element === 'testcachemanager';
        });
        assert.ok(filteredArray1 && filteredArray1.length === 1);
        return offlineCacheManager.delete('testcachemanager');
      }).then(function (deleted) {
        assert.ok(deleted);
        return offlineCacheManager.has('testcachemanager');
      }).then(function(hasCache) {
        assert.ok(!hasCache);
        resolve();
      }).catch(function (err) {
        reject(err);
      });
    });
  });

  QUnit.test("basic cache test", function (assert) {
    var mockFetch = new MockFetch();
    mockFetch.addRequestReply('GET', '/testcacheadd', {
      status: 200,
      body: 'OK'
    });

    mockFetch.addRequestReply('GET', '/testcacheaddall1', {
      status: 200,
      body: 'OK'
    });

    mockFetch.addRequestReply('GET', '/testcacheaddall2', {
      status: 200,
      body: 'OK'
    });

    return new Promise(function(resolve, reject){
      var testCache;
      var request;
      offlineCacheManager.delete('basicCacheTest').then(function(){
        return offlineCacheManager.open('basicCacheTest');
      }).then(function (cache) {
        assert.ok(cache);
        testCache = cache;
        return testCache.delete();
      }).then(function () {
        assert.ok(true);
        assert.ok(testCache.getName() === 'basicCacheTest');
        request = new Request('http://localhost:7001/testcacheadd');
        return testCache.add(request);
      }).then(function () {
        assert.ok(true);
        return testCache.match(request);
      }).then(function (response){
        assert.ok(response !== undefined);
        return testCache.delete(request);
      }).then(function (deleted) {
        assert.ok(deleted);
        return testCache.match(request);
      }).then(function (response1) {
        assert.ok(!response1);
        return testCache.keys();
      }).then(function (keysArray) {
        assert.ok(!keysArray || keysArray.length === 0);
        var requests = [new Request('http://localhost:7001/testcacheaddall1'),
                        new Request('http://localhost:7001/testcacheaddall2')];
        return testCache.addAll(requests);
      }).then(function () {
        assert.ok(true);
        return testCache.keys();
      }).then(function (keysArray) {
        assert.ok(keysArray && keysArray.length === 2);
        return testCache.clear();
      }).then(function (deleted) {
        assert.ok(deleted);
        return testCache.keys();
      }).then(function (keysArray) {
        assert.ok(keysArray && keysArray.length === 0);
        resolve();
      }).catch(function (err) {
        assert.ok(false);
        reject(err);
      });
    });
  });

  QUnit.test('cache match test', function (assert) {

    var dataSet = [{
      request : new Request('http://localhost/employees', {
                      method: 'GET'
                    }),
      response: new Response('response body for all employees.', {
                      status: 200
                    })
    }, {
      request : new Request('http://localhost/employees?FirstName=Bob', {
                      method: 'GET'
                    }),
      response: new Response('response body for employees whose first name is Bob.', {
                      status: 200
                    })
    }, {
      request:  new Request('http://localhost/employees/209', {
                      method: 'PUT',
                      body: 'update employee with id 209.'
                    }),
      response: new Response('response body for updating employee with id 209.', {
                      status: 200
                    })
    }, {
      request : new Request('http://localhost/employees/209', {
                      method: 'DELETE',
                      body: 'delete employee with id 209.'
                    }),
      response: new Response('response body for deleting employee with id 209.', {
                      status: 200
                    })
    }, {
      request : new Request('http://localhost/employees/209', {
                      method: 'GET'
                    }),
      response: new Response('response body for getting employee with id 209.', {
                      status: 200
                    })
    }, {
      request : new Request('http://localhost/departments', {
                      method: 'GET'
                    }),
      response: new Response('response body for all departments uncompressed', {
                      headers: new Headers({'Vary': 'test-accept-encoding'})
                    })
    }, {
      request : new Request('http://localhost/departments', {
                      headers: new Headers({'test-accept-encoding': 'gzip'}),
                      method: 'GET'
                    }),
      response: new Response('response body for all departments compressed with gzip', {
                      headers: new Headers({
                        'Content-Encoding': 'gzip',
                        'Vary': 'test-accept-encoding'
                      })
                    })
    }, {
      request : new Request('http://localhost/departments', {
                      method: 'GET',
                      headers: new Headers({'test-accept-encoding': 'random'})
                    }),
      response: new Response('response body for all departments compressed with random', {
                      headers: new Headers({
                        'Content-Encoding': 'random',
                         'Vary': 'test-accept-encoding'
                      })
                    })
    }, {
      request:  new Request('http://localhost/departments', {
                      method: 'GET',
                      headers: new Headers({'test-accept-encoding': 'gzip, random'})
                    }),
      response: new Response('response body for all departments compressed with gzip random', {
                      headers: new Headers({
                        'Content-Encoding': 'gzip random',
                        Vary: 'test-accept-encoding, test-accept-encoding1'
                      })
                    })
    }];

    var testCases = [{
      name: 'defaultOptionMatch0',
      requestToMatch: 0,
      matchResult: 'response body for all employees.',
      matchAllResult: ['response body for all employees.']
    }, {
      name: 'defaultOptionMatch1',
      requestToMatch: 1,
      matchResult: 'response body for employees whose first name is Bob.',
      matchAllResult: ['response body for employees whose first name is Bob.']
    }, {
      name: 'defaultOptionMatch2',
      requestToMatch: 2,
      matchResult: 'response body for updating employee with id 209.',
      matchAllResult: ['response body for updating employee with id 209.']
    }, {
      name: 'defaultOptionMatch3',
      requestToMatch: 3,
      matchResult: 'response body for deleting employee with id 209.',
      matchAllResult: ['response body for deleting employee with id 209.']
    }, {
      name: 'defaultOptionMatch4',
      requestToMatch: 4,
      matchResult: 'response body for getting employee with id 209.',
      matchAllResult: ['response body for getting employee with id 209.']
    }, {
      name: 'ignoreSearchMatchTest0',
      requestToMatch: 0,
      options: {ignoreSearch: true},
      matchResult: 'response body for all employees.',
      matchAllResult: ['response body for all employees.', 'response body for employees whose first name is Bob.']
    }, {
      name: 'ignoreSearchMatchTest1',
      requestToMatch: 1,
      options: {ignoreSearch: true},
      matchResult: 'response body for all employees.',
      matchAllResult: ['response body for all employees.', 'response body for employees whose first name is Bob.']
    }, {
      name: 'ignoreMethodMatchTest0',
      requestToMatch: 2,
      options: {ignoreMethod: true},
      matchResult: 'response body for updating employee with id 209.',
      matchAllResult: ['response body for updating employee with id 209.',
                       'response body for deleting employee with id 209.',
                       'response body for getting employee with id 209.']
    }, {
      name: 'ignoreMethodMatchTest1',
      requestToMatch: 3,
      options: {ignoreMethod: true},
      matchResult: 'response body for updating employee with id 209.',
      matchAllResult: ['response body for updating employee with id 209.',
                       'response body for deleting employee with id 209.',
                       'response body for getting employee with id 209.']
    }, {
      name: 'ignoreMethodMatchTest2',
      requestToMatch: 4,
      options: {ignoreMethod: true},
      matchResult: 'response body for updating employee with id 209.',
      matchAllResult: ['response body for updating employee with id 209.',
                       'response body for deleting employee with id 209.',
                       'response body for getting employee with id 209.']
    }, {
      name: 'ignoreVaryMatchTest0',
      requestToMatch: 5,
      options: {ignoreVary: true},
      matchResult: 'response body for all departments uncompressed',
      matchAllResult: ['response body for all departments uncompressed',
                       'response body for all departments compressed with gzip',
                       'response body for all departments compressed with random',
                       'response body for all departments compressed with gzip random']
    }, {
      name: 'VaryMatchTest0',
      requestToMatch: 5,
      options: {ignoreVary: false},
      matchResult: 'response body for all departments uncompressed',
      matchAllResult: ['response body for all departments uncompressed']
    }, {
      name: 'ignoreVaryMatchTest1',
      requestToMatch: 6,
      options: {ignoreVary: true},
      matchResult: 'response body for all departments uncompressed',
      matchAllResult: ['response body for all departments uncompressed',
                       'response body for all departments compressed with gzip',
                       'response body for all departments compressed with random',
                       'response body for all departments compressed with gzip random']
    }, {
      name: 'VaryMatchTest1',
      requestToMatch: 6,
      options: {ignoreVary: false},
      matchResult: 'response body for all departments compressed with gzip',
      matchAllResult: ['response body for all departments compressed with gzip']
    }, {
      name: 'ignoreVaryMatchTest2',
      requestToMatch: 7,
      options: {ignoreVary: true},
      matchResult: 'response body for all departments uncompressed',
      matchAllResult: ['response body for all departments uncompressed',
                       'response body for all departments compressed with gzip',
                       'response body for all departments compressed with random',
                       'response body for all departments compressed with gzip random']
    }, {
      name: 'VaryMatchTest2',
      requestToMatch: 7,
      options: {ignoreVary: false},
      matchResult: 'response body for all departments compressed with random',
      matchAllResult: ['response body for all departments compressed with random']
    }, {
      name: 'ignoreVaryMatchTest3',
      requestToMatch: 8,
      options: {ignoreVary: true},
      matchResult: 'response body for all departments uncompressed',
      matchAllResult: ['response body for all departments uncompressed',
                       'response body for all departments compressed with gzip',
                       'response body for all departments compressed with random',
                       'response body for all departments compressed with gzip random']
    }, {
      name: 'VaryMatchTest3',
      requestToMatch: 8,
      options: {ignoreVary: false},
      matchResult: 'response body for all departments compressed with gzip random',
      matchAllResult: ['response body for all departments compressed with gzip random']
    }];

    return new Promise(function (resolve, reject) {
      var testCache;
      offlineCacheManager.delete('cacheMatchTest').then(function(){
        return offlineCacheManager.open('cacheMatchTest');
      }).then(function (cache) {
        assert.ok(true);
        testCache = cache;
        return testCache.delete();
      }).then(function () {
        assert.ok(true);
        return prepareTest(dataSet, testCache);
      }).then(function () {
        assert.ok(true);
        var executeTestCase = function (testCases) {
          if (testCases.length === 0) {
            resolve();
          } else {
            var testName = testCases[0].name;
            console.log('test case: ' + testName);
            var requestToMatch = dataSet[testCases[0].requestToMatch].request;
            var options = testCases[0].options;
            testCache.match(requestToMatch, options).then(function (response) {
              assert.ok(true);
              return checkMatchResult(response.clone(), testCases[0].matchResult);
            }).then(function (matchTestPassed) {
              assert.ok(matchTestPassed);
              return testCache.matchAll(requestToMatch, options);
            }).then(function (responseArray) {
              assert.ok(true);
              return checkMatchAllResult(responseArray, testCases[0].matchAllResult);
            }).then(function (matchAllTestPassed) {
              assert.ok(matchAllTestPassed);
              testCases.shift();
              executeTestCase(testCases);
            });
          }
        };
        executeTestCase(testCases);
      }).catch(function (error) {
        assert.ok(false);
        reject(error);
      });
    });
  });

  QUnit.test('cache manager match test', function (assert) {
    return new Promise(function (resolve, reject) {
      var testCache1;
      var testCache2;
      var requestToMatch;
      offlineCacheManager.delete('cacheManagerMatchTestCache1').then(function(){
        return offlineCacheManager.open('cacheManagerMatchTestCache1');
      }).then(function (cache1) {
        assert.ok(cache1);
        testCache1 = cache1;
        return testCache1.delete();
      }).then(function () {
        assert.ok(true);
        return offlineCacheManager.delete('cacheManagerMatchTestCache2');
      }).then(function(){
        assert.ok(true);
        return offlineCacheManager.open('cacheManagerMatchTestCache2');
      }).then(function(cache2){
        assert.ok(cache2);
        testCache2 = cache2;
        return testCache2.delete();
      }).then(function () {
        assert.ok(true);
        var request1 = new Request('http://localhost/cachemanagermatchtest', {
                         method: 'GET'
                       });
        var response1 = new Response('response body 1.', {
                          status: 200
                        });
        var request2 = new Request('http://localhost/cachemanagermatchtest', {
                         method: 'GET'
                       });
        var response2 = new Response('response body 2.', {
                          status: 200
                        });
        requestToMatch = request1;
        var promises = [];
        promises.push(testCache1.put(request1.clone(), response1.clone()));
        promises.push(testCache2.put(request2.clone(), response2.clone()));
        return Promise.all(promises);
      }).then(function () {
        assert.ok(true);
        return offlineCacheManager.match(requestToMatch);
      }).then(function (matchedResponse) {
        assert.ok(matchedResponse);
        return checkMatchResult(matchedResponse, 'response body 1.');
      }).then(function (checkMatchResult) {
        assert.ok(checkMatchResult);
        var request3 = new Request('http://localhost/cachemanagermatch', {
                         method: 'GET'
                       });
        var response3 = new Response('response body 3.', {
                          status: 200
                        });
        requestToMatch = request3;
        return testCache2.put(request3.clone(), response3.clone());
      }).then(function () {
        assert.ok(true);
        return offlineCacheManager.match(requestToMatch);
      }).then(function (matchedResponse1) {
        assert.ok(matchedResponse1);
        return checkMatchResult(matchedResponse1, 'response body 3.');
      }).then(function (checkMatchResult1) {
        assert.ok(checkMatchResult1);
        resolve();
      }).catch(function (err) {
        assert.ok(false);
        reject(err);
      });
    });
  });

  QUnit.test('cache shredding test collection', function (assert) {
    var data = [{
      DepartmentId: 1001, DepartmentName: 'ADFPM 1001 neverending', LocationId: 200, ManagerId: 300
    }, {
      DepartmentId: 556, DepartmentName: 'BB', LocationId: 200, ManagerId: 300
    }, {
      DepartmentId: 10, DepartmentName: 'Administration', LocationId: 200, ManagerId: 300
    }];
    var payloadJson = JSON.stringify({items: data});
    var request = new Request('http://localhost:7001/testcacheshreddingcollection');
    var endpointKey = persistenceUtils.buildEndpointKey(request);

    var shreddedStoreName = 'departments';
    var shredder = oracleRestJsonShredding.getShredder(shreddedStoreName, 'DepartmentId');
    var unshredder = oracleRestJsonShredding.getUnshredder();
    var options = {jsonProcessor: {shredder: shredder, unshredder: unshredder}}
    
    var mockFetch = new MockFetch();
    mockFetch.addRequestReply('GET', '/testcacheshreddingcollection', {
      status: 200,
      body: payloadJson
    });

    return new Promise(function (resolve, reject) {
      var testCache;
      offlineCacheManager.delete('cacheShreddingTestCollection').then(function(){
        return offlineCacheManager.open('cacheShreddingTestCollection');
      }).then(function (cache) {
        assert.ok(cache);
        testCache = cache;
        return testCache.delete();
      }).then(function () {
        assert.ok(true);
        assert.ok(testCache.getName() === 'cacheShreddingTestCollection');
        cacheHandler.registerEndpointOptions(endpointKey, options);
        return testCache.add(request);
      }).then(function () {
        assert.ok(true, "request is added to the cache");
        return testCache.match(request);
      }).then(function (response1) {
        assert.ok(response1 != null, "request is found in the cache");
        var hasStore = persistenceStoreManager.hasStore(shreddedStoreName);
        assert.ok(hasStore, "shredded store exists");
        return persistenceStoreManager.openStore(shreddedStoreName);
      }).then(function (shreddedStore) {
        assert.ok(shreddedStore, "shredded store is opened.");
        return shreddedStore.keys();
      }).then(function (keysArray) {
        assert.ok(keysArray.length === 3, "found 3 entries in the shredded store.");
        return testCache.delete(request);
      }).then(function (deleted) {
        assert.ok(deleted, "request is deleted from the cache");
        return testCache.match(request);
      }).then(function (response1) {
        assert.ok(!response1, "no request is found in the cache.");
        var hasStore = persistenceStoreManager.hasStore(shreddedStoreName);
        assert.ok(hasStore, "shredded store still exits.");
        return persistenceStoreManager.openStore(shreddedStoreName);
      }).then(function (shreddedStore) {
        assert.ok(shreddedStore, "shredded store can still be opened.");
        return shreddedStore.keys();
      }).then(function (keysArray) {
        assert.ok(keysArray.length === 0, "no entry is found in the shredded store.");
        resolve();
      }).catch(function (err) {
        assert.ok(false);
        reject(err);
      }).finally(function() {
        cacheHandler.unregisterEndpointOptions(endpointKey);
      });
    });
  });

  QUnit.test('cache shredding test single', function (assert) {
    var data = {
      DepartmentId: 1001, DepartmentName: 'ADFPM 1001 neverending', LocationId: 200, ManagerId: 300
    };
    var payloadJson = JSON.stringify(data);
    var request = new Request('http://localhost:7001/testcacheshreddingsingle');
    var endpointKey = persistenceUtils.buildEndpointKey(request);

    var shreddedStoreName = 'department';
    var shredder = oracleRestJsonShredding.getShredder(shreddedStoreName, 'DepartmentId');
    var unshredder = oracleRestJsonShredding.getUnshredder();
    var options = {jsonProcessor: {shredder: shredder, unshredder: unshredder}}
    
    var mockFetch = new MockFetch();
    mockFetch.addRequestReply('GET', '/testcacheshreddingsingle', {
      status: 200,
      body: payloadJson
    });

    return new Promise(function (resolve, reject) {
      var testCache;
      offlineCacheManager.delete('cacheShreddingTestSingle').then(function(){
        return offlineCacheManager.open('cacheShreddingTestSingle');
      }).then(function (cache) {
        assert.ok(cache);
        testCache = cache;
        return testCache.delete();
      }).then(function () {
        assert.ok(true);
        assert.ok(testCache.getName() === 'cacheShreddingTestSingle');
        cacheHandler.registerEndpointOptions(endpointKey, options);
        return testCache.add(request);
      }).then(function () {
        assert.ok(true, "request is added to the cache");
        return testCache.match(request);
      }).then(function (response1) {
        assert.ok(response1 != null, "request is found in the cache");
        var hasStore = persistenceStoreManager.hasStore(shreddedStoreName);
        assert.ok(hasStore, "shredded store exists");
        return persistenceStoreManager.openStore(shreddedStoreName);
      }).then(function (shreddedStore) {
        assert.ok(shreddedStore, "shredded store is opened.");
        return shreddedStore.keys();
      }).then(function (keysArray) {
        assert.ok(keysArray.length === 1, "found 1 entry in the shredded store.");
        return testCache.delete(request);
      }).then(function (deleted) {
        assert.ok(deleted, "request is deleted from the cache");
        return testCache.match(request);
      }).then(function (response1) {
        assert.ok(!response1, "no request is found in the cache.");
        var hasStore = persistenceStoreManager.hasStore(shreddedStoreName);
        assert.ok(hasStore, "shredded store still exits.");
        return persistenceStoreManager.openStore(shreddedStoreName);
      }).then(function (shreddedStore) {
        assert.ok(shreddedStore, "shredded store can still be opened.");
        return shreddedStore.keys();
      }).then(function (keysArray) {
        assert.ok(keysArray.length === 0, "no entry is found in the shredded store.");
        resolve();
      }).catch(function (err) {
        assert.ok(false);
        reject(err);
      }).finally(function() {
        cacheHandler.unregisterEndpointOptions(endpointKey);
      });
    });
  });

  // helper function to add the request/response pairs into cache
  // sequentially with one second deply in between. The order of the
  // request/response added into cache matters for some tests, thus we add them
  // one by one with delayes in between
  var prepareTest = function (dataSet, cache) {
    return new Promise(function (resolve, reject) {

      var addRequestResponseSequentially = function (dataSet, index) {
        if (!dataSet || dataSet.length === index) {
          resolve();
        } else {
          cache.put(dataSet[index].request.clone(), dataSet[index].response.clone()).then(function () {
            waitForSeconds(1);
            addRequestResponseSequentially(dataSet, index + 1);
          }).catch(function (err) {
            reject(err);
          });
        }
      };

      addRequestResponseSequentially(dataSet, 0);
    });
  };

  // helper function to wait for the specified time period.
  var waitForSeconds = function (seconds) {
    var counter = 0;
    var start = (new Date()).getTime();
    var end;

    while (counter < seconds * 1000) {
      end = (new Date()).getTime();
      counter = end - start;
    }
  };

  // helper function to check cache.match result against the expected
  // result. It returns a promise that resolves to true if actual response is
  // the same as the expected, and false otherwise. The promise is rejected
  // for any other error conditions.
  var checkMatchResult = function (response, expectedText) {
    if (!response && !expectedText) {
      return Promise.resolve(true);
    } else if (response && expectedText) {
      return new Promise(function (resolve, reject) {
        response.clone().text().then(function (text) {
          if (text === expectedText) {
            resolve(true);
          } else {
            resolve(false);
          }
        }).catch(function (error) {
          reject(error);
        });
      });
    } else {
      return Promise.resolve(false);
    }
  };

  // helper function to return a function that can be used as callback
  // of Array.map in checkMatchAllResult
  var checkResultMapCallback = function (expectedTextArray) {
    return function (response, index) {
      return checkMatchResult(response, expectedTextArray[index]);
    };
  };

  // helper function to check cache.matchAll result against the expected
  // result. It returns a promise that resolves to true if the actual response
  // array is the same as the expected (order counts), and false otherwise.
  // The promise is rejected for any other error conditions.
  var checkMatchAllResult = function (responseArray, expectedTextArray) {
    if ((!responseArray     || responseArray.length === 0) &&
        (!expectedTextArray || expectedTextArray.length === 0)) {
      return Promise.resolve(true);
    } else if (responseArray && expectedTextArray && responseArray.length > 0 &&
               expectedTextArray.length === expectedTextArray.length) {
      return new Promise(function (resolve, reject) {
        var promiseArray = responseArray.map(checkResultMapCallback(expectedTextArray));
        Promise.all(promiseArray).then(function (resultArray) {
          var passedArray = resultArray.filter(function (element) {
            return element;
          });
          if (passedArray && passedArray.length === resultArray.length) {
            resolve(true);
          } else {
            resolve(false);
          }
        }).catch(function (err) {
          return Promise.reject(err);
        });
      });
    } else {
      return Promise.resolve(false);
    }
  };

});

