define(['persist/persistenceManager', 'persist/persistenceUtils', 'persist/defaultResponseProxy', 'persist/persistenceStoreManager', 'persist/localPersistenceStoreFactory', 'persist/simpleJsonShredding', 'persist/oracleRestJsonShredding', 'MockFetch', 'persist/impl/logger'],
  function (persistenceManager, persistenceUtils, defaultResponseProxy, persistenceStoreManager, localPersistenceStoreFactory, simpleJsonShredding, oracleRestJsonShredding, MockFetch, logger) {
    'use strict';
    //logger.option('level',  logger.LEVEL_LOG);
    var mockFetch = new MockFetch();
    persistenceStoreManager.registerDefaultStoreFactory(localPersistenceStoreFactory);
    persistenceManager.init().then(function () {
      describe('persist/defaultResponseProxy', function() {
        this.timeout(300000);
        afterEach(function (done) {
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
        });
        it('getResponseProxy() shredder/unshredder', function (done) {
          mockFetch.addRequestReply('GET', '/testShredder', {
            status: 200,
            body: JSON.stringify([{DepartmentId: 1001, DepartmentName: 'ADFPM 1001 neverending', LocationId: 200, ManagerId: 300},
              {DepartmentId: 556, DepartmentName: 'BB', LocationId: 200, ManagerId: 300},
              {DepartmentId: 10, DepartmentName: 'Administration', LocationId: 200, ManagerId: 300}])
          }, function () {
            assert.ok(true, 'Mock Fetch received Request when online');
          });
      
          persistenceManager.register({
            scope: '/testShredder'
          }).then(function (registration) {
            var shredder = function (response) {
              assert.ok(true, 'shredder invoked');
              return new Promise(function (resolve, reject) {
                var responseClone = response.clone();
                responseClone.text().then(function (payload) {
                  var i, idArray = [], dataArray = [];
                  if (payload != null &&
                    payload.length > 0) {
                    var payloadJson = JSON.parse(payload);
                    var payloadJsonCount = payloadJson.length;
                    for (i = 0; i < payloadJsonCount; i++) {
                      idArray[i] = payloadJson[i]['DepartmentId'];
                      dataArray[i] = payloadJson[i];
                    }
                  }
                  resolve([{'name': 'test', 'resourceIdentifier': null,
                      'keys': idArray, 'data': dataArray}]);
                });
              });
            };
            var unshredder = function (data) {
              assert.ok(true, 'unshredder invoked');
              return new Promise(function (resolve, reject) {
                var response = new Response(JSON.stringify(data), {
                  status: 200,
                  statusText: 'OK',
                  headers: {'content-type': 'application/json',
                    'x-oracle-jscpt-cache-expiration-date': ''}
                });
                resolve(response);
              });
            };
            var options = {jsonProcessor: {shredder: shredder, unshredder: unshredder}}
            var defaultTestResponseProxy = defaultResponseProxy.getResponseProxy(options);
            registration.addEventListener('fetch', defaultTestResponseProxy.getFetchEventListener());
      
            fetch('/testShredder').then(function (response) {
              assert.ok(true, 'Received Response when online');
              persistenceStoreManager.openStore('test').then(function (store) {
                store.findByKey(1001).then(function (data) {
                  assert.ok(data.DepartmentName == 'ADFPM 1001 neverending', 'Found DepartmentId 1001 in localStore');
                  return store.findByKey(556);
                }).then(function (data) {
                  assert.ok(data.DepartmentName == 'BB', 'Found DepartmentId 556 in localStore');
                  return store.findByKey(10);
                }).then(function (data) {
                  assert.ok(data.DepartmentName == 'Administration', 'Found DepartmentId 10 in localStore');
                  done();
                });
              });
            });
          });
        });
        it('getResponseProxy() queryHandler', function (done) {
          mockFetch.addRequestReply('GET', '/testQueryHandler', {
            status: 200,
            body: JSON.stringify([{DepartmentId: 1001, DepartmentName: 'ADFPM 1001 neverending', LocationId: 200, ManagerId: 300},
              {DepartmentId: 556, DepartmentName: 'BB', LocationId: 200, ManagerId: 300},
              {DepartmentId: 10, DepartmentName: 'Administration', LocationId: 200, ManagerId: 300}])
          }, function () {
            assert.ok(true, 'Mock Fetch received Request when online');
          });
      
          persistenceManager.register({
            scope: '/testQueryHandler'
          }).then(function (registration) {
            var queryHandler = function (request) {
              assert.ok(true, 'queryHandler invoked');
              var response = new Response('OK', {
                status: 200,
                statusText: 'OK',
                headers: {'content-type': 'application/json',
                  'x-oracle-jscpt-cache-expiration-date': ''}
              });
              return Promise.resolve(response);
            };
            var options = {queryHandler: queryHandler};
            var defaultTestResponseProxy = defaultResponseProxy.getResponseProxy(options);
            registration.addEventListener('fetch', defaultTestResponseProxy.getFetchEventListener());
      
            fetch('/testQueryHandler?DepartmentName=BB').then(function (response) {
              persistenceManager.forceOffline(true);
              fetch('/testQueryHandler?DepartmentName=BB').then(function (response) {
                assert.ok(true, 'Received Response when offline');
                registration.unregister().then(function (unregistered) {
                  assert.ok(unregistered == true, 'unregistered scope');
                  done();
                });
              });
            });
          });
        });
        it('getResponseProxy() fetchStrategy', function (done) {
          mockFetch.addRequestReply('GET', '/testFetchStrategy', {
            status: 200,
            body: 'OK'
          }, function () {
            assert.ok(true, 'Mock Fetch received Request');
          });
      
          persistenceManager.register({
            scope: '/testFetchStrategy'
          }).then(function (registration) {
            var alwaysFetchFromBrowserFetchStrategy = function (request) {
              assert.ok(true, 'Invoked fetch strategy');
              return persistenceManager.browserFetch(request);
            };
            var options = {fetchStrategy: alwaysFetchFromBrowserFetchStrategy};
            var defaultTestResponseProxy = defaultResponseProxy.getResponseProxy(options);
            registration.addEventListener('fetch', defaultTestResponseProxy.getFetchEventListener());
      
            fetch('/testFetchStrategy').then(function (response) {
              assert.ok(true, 'Received Response when offline');
              registration.unregister().then(function (unregistered) {
                assert.ok(unregistered == true, 'unregistered scope');
                done();
              });
            });
          });
        });
        it('getResponseProxy() cacheStrategy', function (done) {
          mockFetch.addRequestReply('GET', '/testCacheStrategy', {
            status: 200,
            body: 'OK'
          }, function () {
            assert.ok(true, 'Mock Fetch received Request when offline');
          });
      
          persistenceManager.register({
            scope: '/testCacheStrategy'
          }).then(function (registration) {
            var cacheStrategy = function (request, response) {
              assert.ok(true, 'Cache Strategy invoked');
              return Promise.resolve(response);
            };
            var options = {cacheStrategy: cacheStrategy};
            var defaultTestResponseProxy = defaultResponseProxy.getResponseProxy(options);
            registration.addEventListener('fetch', defaultTestResponseProxy.getFetchEventListener());
      
            fetch('/testCacheStrategy').then(function (response) {
              registration.unregister().then(function (unregistered) {
                assert.ok(unregistered == true, 'unregistered scope');
                done();
              });
            });
          });
        });
        it('getResponseProxy() requestHandlerOverride.handle*', function (done) {
          mockFetch.addRequestReply('*', '/testRequestHandlerOverride', {
            status: 200,
            body: 'OK'
          }, function () {
            assert.ok(true, 'Mock Fetch received Request when offline');
          });
      
          persistenceManager.register({
            scope: '/testRequestHandlerOverride'
          }).then(function (registration) {
            var handleGet = function (request) {
              assert.ok(true, 'requestHandlerOverride.handleGet invoked');
              return defaultTestResponseProxy.handleGet(request);
            };
            var handlePost = function (request) {
              assert.ok(true, 'requestHandlerOverride.handlePost invoked');
              return defaultTestResponseProxy.handlePost(request);
            };
            var handlePatch = function (request) {
              assert.ok(true, 'requestHandlerOverride.handlePatch invoked');
              return defaultTestResponseProxy.handlePatch(request);
            };
            var handlePut = function (request) {
              assert.ok(true, 'requestHandlerOverride.handlePut invoked');
              return defaultTestResponseProxy.handlePut(request);
            };
            var handleDelete = function (request) {
              assert.ok(true, 'requestHandlerOverride.handleDelete invoked');
              return defaultTestResponseProxy.handleDelete(request);
            };
            var handleOptions = function (request) {
              assert.ok(true, 'requestHandlerOverride.handleOptions invoked');
              return defaultTestResponseProxy.handleOptions(request);
            };
            var options = {requestHandlerOverride: {handleGet: handleGet,
                                                    handlePost: handlePost,
                                                    handlePatch: handlePatch,
                                                    handlePut: handlePut,
                                                    handleDelete: handleDelete,
                                                    handleOptions: handleOptions}};
            var defaultTestResponseProxy = defaultResponseProxy.getResponseProxy(options);
            registration.addEventListener('fetch', defaultTestResponseProxy.getFetchEventListener());
      
            fetch('/testRequestHandlerOverride').then(function (response) {
              var request = new Request('/testRequestHandlerOverride', {method: 'POST'});
              return fetch(request);
            }).then(function () {
              var request = new Request('/testRequestHandlerOverride', {method: 'PATCH'});
              return fetch(request);
            }).then(function () {
              var request = new Request('/testRequestHandlerOverride', {method: 'PUT'});
              return fetch(request);
            }).then(function () {
              var request = new Request('/testRequestHandlerOverride', {method: 'DELETE'});
              return fetch(request);
            }).then(function () {
              var request = new Request('/testRequestHandlerOverride', {method: 'OPTIONS'});
              return fetch(request);
            }).then(function () {
              registration.unregister().then(function (unregistered) {
                assert.ok(unregistered == true, 'unregistered scope');
                done();
              });
            });
          });
        });
        it('getResponseProxy() default handle*', function (done) {
          var deptData = [{DepartmentId: 1001, DepartmentName: 'ADFPM 1001 neverending', LocationId: 200, ManagerId: 300},
              {DepartmentId: 556, DepartmentName: 'BB', LocationId: 200, ManagerId: 300},
              {DepartmentId: 10, DepartmentName: 'Administration', LocationId: 200, ManagerId: 300}];
          mockFetch.addRequestReply('GET', '/testDefaultHandler', {
            status: 200,
            body: JSON.stringify(deptData)
          }, function () {
            assert.ok(true, 'Mock Fetch received Request when offline');
          });
      
          persistenceManager.register({
            scope: '/testDefaultHandler'
          }).then(function (registration) {
            var options = {jsonProcessor: {shredder: simpleJsonShredding.getShredder('departments', 'DepartmentId'), unshredder: simpleJsonShredding.getUnshredder()}}
            var defaultTestResponseProxy = defaultResponseProxy.getResponseProxy(options);
            registration.addEventListener('fetch', defaultTestResponseProxy.getFetchEventListener());
            var updateBody = JSON.stringify({DepartmentId: 10, DepartmentName: 'Administration123', LocationId: 200, ManagerId: 300});
      
            fetch('/testDefaultHandler').then(function (response) {
              persistenceManager.forceOffline(true);
              var request = new Request('/testDefaultHandler', {method: 'POST'});
              return fetch(request);
            }).then(function (response) {
              assert.ok(response.status == 503, 'status 503 is correct');
              var request = new Request('/testDefaultHandler', {method: 'PATCH'});
              return fetch(request);
            }).then(function (response) {
              assert.ok(response.status == 503, 'status 503 is correct');
              var request = new Request('/testDefaultHandler/10', {method: 'PUT', body: updateBody, headers: {'IF-Match': '12345'}});
              return fetch(request);
            }).then(function (response) {
              assert.ok(response.status == 200, 'status 200 is correct');
              assert.ok(response.headers.get('x-oracle-jscpt-etag-generated') != null, 'generated ETag');
              assert.ok(persistenceUtils.isGeneratedEtagResponse(response), 'generated ETag');
              assert.ok(response.headers.get('x-oracle-jscpt-etag-generated') == response.headers.get('ETag'), 'generated ETag correct');
              return response.text();
            }).then(function(content) {
              assert.ok(content);
              var request = new Request('/testDefaultHandler/10', {method: 'DELETE'});
              return fetch(request);
            }).then(function (response) {
                assert.ok(response.status == 200, 'status 200 is correct');
                return response.text();
            }).then(function(content) {
              assert.ok(updateBody == content, 'body is correct');
              registration.unregister().then(function (unregistered) {
                assert.ok(unregistered == true, 'unregistered scope');
                done();
              });
            });
          });
        });
        it('Response Not Ok for request *', function (done) {
          mockFetch.addRequestReply('*', '/testResponseNotOk', {
            status: 500,
            body: 'NOTOK'
          }, function () {
            assert.ok(true, 'Mock Fetch received Request when offline');
          });
      
          persistenceManager.register({
            scope: '/testResponseNotOk'
          }).then(function (registration) {
            var defaultTestResponseProxy = defaultResponseProxy.getResponseProxy();
            registration.addEventListener('fetch', defaultTestResponseProxy.getFetchEventListener());
      
            fetch('/testResponseNotOk').then(function (response) {
              var request = new Request('/testResponseNotOk', {method: 'POST'});
              return fetch(request);
            }).then(function (response) {
              assert.ok(response.status == 500, 'status is 500');
              assert.ok(response.ok == false, 'ok is false');
              var request = new Request('/testResponseNotOk', {method: 'PATCH'});
              return fetch(request);
            }).then(function (response) {
              assert.ok(response.status == 500, 'status is 500');
              assert.ok(response.ok == false, 'ok is false');
              var request = new Request('/testResponseNotOk', {method: 'PUT'});
              return fetch(request);
            }).then(function (response) {
              // server status 500 for PUT requests causes it to be handled offline
              assert.ok(response.status == 200, 'status is 200');
              assert.ok(response.ok, 'ok is true');
              var request = new Request('/testResponseNotOk', {method: 'DELETE'});
              return fetch(request);
            }).then(function (response) {
              // server status 500 for DELETE requests causes it to be handled offline
              assert.ok(response.status == 200, 'status is 500');
              assert.ok(response.ok, 'ok is true');
              var request = new Request('/testResponseNotOk', {method: 'OPTIONS'});
              return fetch(request);
            }).then(function (response) {
              assert.ok(response.status == 500, 'status is 500');
              assert.ok(response.ok == false, 'ok is false');
              registration.unregister().then(function (unregistered) {
                assert.ok(unregistered == true, 'unregistered scope');
                done();
              });
            });
          });
        });
        it('fetch rejected for request *', function (done) {
          mockFetch.addRequestReply('*', '/testFetchRejected', {
            status: 500,
            body: 'NOTOK'
          }, function () {
            assert.ok(true, 'Mock Fetch received Request when offline');
          });
      
          persistenceManager.register({
            scope: '/testFetchRejected'
          }).then(function (registration) {
            var defaultTestResponseProxy = defaultResponseProxy.getResponseProxy();
            registration.addEventListener('fetch', defaultTestResponseProxy.getFetchEventListener());
            var saveFetch = persistenceManager.browserFetch;
            fetch('/testFetchRejected').then(function (response) {
              // deliberately cause fetch to reject. That should result in offline
              persistenceManager.browserFetch = function(request) {
                return Promise.reject();
              };
              var request = new Request('/testFetchRejected', {method: 'POST'});
              return fetch(request);
            }).then(function (response) {
              }, function (err) {
              assert.ok(true, 'fetch rejected for POST');
              var request = new Request('/testFetchRejected', {method: 'PATCH'});
              return fetch(request);
            }).then(function (response) {
              }, function (err) {
              assert.ok(true, 'fetch rejected for POST');
              var request = new Request('/testFetchRejected', {method: 'PUT'});
              return fetch(request);
            }).then(function (response) {
              // server status 500 for PUT requests causes it to be handled offline
              assert.ok(response.status == 200, 'status is 200');
              assert.ok(response.ok, 'ok is true');
              var request = new Request('/testFetchRejected', {method: 'DELETE'});
              return fetch(request);
            }).then(function (response) {
              // server status 500 for DELETE requests causes it to be handled offline
              assert.ok(response.status == 200, 'status is 200');
              assert.ok(response.ok, 'ok is true');
              var request = new Request('/testFetchRejected', {method: 'OPTIONS'});
              return fetch(request);
            }).then(function (response) {
              }, function (err) {
              assert.ok(true, 'fetch rejected for OPTIONS');
              persistenceManager.browserFetch = saveFetch;
              registration.unregister().then(function (unregistered) {
                assert.ok(unregistered == true, 'unregistered scope');
                done();
              });
            });
          });
        });
        it('blob response', function () {
          generateBlob().then(function(blob) {
            mockFetch.addRequestReply('GET', '/blobResponse', {
              status: 200,
              body: blob
            }, function () {
              assert.ok(true, 'Mock Fetch received Request when online');
            });
      
      
            persistenceManager.register({
              scope: '/blobResponse'
            }).then(function (registration) {
              var defaultTestResponseProxy = defaultResponseProxy.getResponseProxy();
              registration.addEventListener('fetch', defaultTestResponseProxy.getFetchEventListener());
      
              fetch('/blobResponse').then(function (response) {
                assert.ok(true, 'Received Response when online');
                response.blob().then(function(blob) {
                  assert.ok(blob != null, 'body is not empty');
                  registration.unregister().then(function (unregistered) {
                    assert.ok(unregistered == true, 'unregistered scope');
                    done();
                  });
                });
              });
            });
          });
        });
        it('getResponseProxy() delete', function (done) {
          var deptData = {items: [{DepartmentId: 1001, DepartmentName: 'ADFPM 1001 neverending', LocationId: 200, ManagerId: 300},
              {DepartmentId: 556, DepartmentName: 'BB', LocationId: 200, ManagerId: 300},
              {DepartmentId: 10, DepartmentName: 'Administration', LocationId: 200, ManagerId: 300}]};
          mockFetch.addRequestReply('GET', '/testDelete', {
            status: 200,
            body: JSON.stringify(deptData)
          }, function () {
            assert.ok(true, 'Mock Fetch received Request when offline');
          });
          mockFetch.addRequestReply('DELETE', '/testDelete', {
            status: 200,
            body: null
          }, function () {
            assert.ok(true, 'Mock Fetch received Request when offline');
          });
      
          persistenceManager.register({
            scope: '/testDelete'
          }).then(function (registration) {
            var options = {jsonProcessor: {shredder: oracleRestJsonShredding.getShredder('departments', 'DepartmentId'), unshredder: oracleRestJsonShredding.getUnshredder()}}
            var defaultTestResponseProxy = defaultResponseProxy.getResponseProxy(options);
            registration.addEventListener('fetch', defaultTestResponseProxy.getFetchEventListener());
      
            fetch('/testDelete').then(function (response) {
              return fetch('/testDelete/556', {method: 'DELETE'});
            }).then(function (response) {
              persistenceManager.forceOffline(true);
              return fetch('/testDelete');
            }).then(function (response) {
              return response.json();
            }).then(function (responseJson) {
              assert.ok(responseJson.items.length == 2, 'returned 2 items');
              done();
            });
          });
        });
      })
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
