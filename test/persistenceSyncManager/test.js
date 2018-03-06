define(['persistenceManager', 'defaultResponseProxy', 'persistenceStoreManager', 'localPersistenceStoreFactory', 'simpleJsonShredding', 'persistenceUtils', 'MockFetch', 'impl/logger'],
  function (persistenceManager, defaultResponseProxy, persistenceStoreManager, localPersistenceStoreFactory, simpleJsonShredding, persistenceUtils, MockFetch, logger) {
    'use strict';
    logger.option('level',  logger.LEVEL_LOG);
    module('persistenceSyncManager', {
      setup: function() {
        stop();
        persistenceStoreManager.openStore('syncLog').then(function (store) {
          store.delete();
          start();
        });
      },
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
    
    var versionedLocalPersistenceStoreFactory = (function () {
      return {
        'createPersistenceStore': function (name, options) {
          return localPersistenceStoreFactory.createPersistenceStore(name, {version: 1});
        }
      };
    }());
    
    var mockFetch = new MockFetch();
    persistenceStoreManager.registerDefaultStoreFactory(versionedLocalPersistenceStoreFactory);
    persistenceManager.init().then(function () {
      asyncTest('addEventListener()', function (assert) {
        expect(9);
        mockFetch.addRequestReply('GET', '/testListener', {
          status: 200,
          body: 'Ok'
        }, function () {
          assert.ok(true, 'Mock Fetch received Request when online');
        });

        var afterRequestListener = function (event) {
          assert.ok(event.response instanceof Response, 'syncRequest event Response exists');
          assert.ok(event.request instanceof Request, 'syncRequest event Request exists');
          assert.ok(event.request.url.indexOf('/testListener') >= 0, 'event Request has the correct URL');
          assert.ok(event.response.status == 200, 'successful response');
          return Promise.resolve(null);
        };

        persistenceManager.getSyncManager().addEventListener('syncRequest', afterRequestListener, '/testListener');
        persistenceManager.register({
          scope: '/testListener'
        }).then(function (registration) {
          var defaultTestResponseProxy = defaultResponseProxy.getResponseProxy();
          registration.addEventListener('fetch', defaultTestResponseProxy.getFetchEventListener());

          fetch('/testListener').then(function (response) {
            assert.ok(true, 'Received Response when online');
            persistenceManager.forceOffline(true);
            return fetch('/testListener');
          }).then(function () {
            assert.ok(true, 'Received Response when offline');
            persistenceManager.forceOffline(false);
            return persistenceManager.getSyncManager().sync();
          }).then(function () {
            registration.unregister().then(function (unregistered) {
              assert.ok(unregistered == true, 'unregistered scope');
              start();
            });
          });
        });
      });
      asyncTest('beforeSyncRequest event', function (assert) {
        expect(27);
        var validateHeader = null;
        mockFetch.addRequestReply('*', '/testBeforeSyncRequest', {
          status: 200,
          body: 'Ok'
        }, function (request) {
          if (validateHeader != null && request.method != 'OPTIONS') {
            assert.ok(true, 'Mock Fetch received Request when online');
            assert.ok(request.headers.get(validateHeader), 'Header in request');
          }
        });

        var beforeSyncRequestResolveNull = function (event) {
          assert.ok(event.request instanceof Request, 'beforeSyncRequest event Request exists');
          assert.ok(event.request.url.indexOf('/testBeforeSyncRequest') >= 0, 'event Request has the correct URL');
          return Promise.resolve(null);
        };
        var beforeSyncRequestResolveContinue = function (event) {
          assert.ok(event.request instanceof Request, 'beforeSyncRequest event Request exists');
          assert.ok(event.request.url.indexOf('/testBeforeSyncRequest') >= 0, 'event Request has the correct URL');
          return Promise.resolve({action: 'continue'});
        };
        var beforeSyncRequestResolveSkip = function (event) {
          assert.ok(event.request instanceof Request, 'beforeSyncRequest event Request exists');
          assert.ok(event.request.url.indexOf('/testBeforeSyncRequest') >= 0, 'event Request has the correct URL');
          return Promise.resolve({action: 'skip'});
        };
        var beforeSyncRequestResolveStop = function (event) {
          assert.ok(event.request instanceof Request, 'beforeSyncRequest event Request exists');
          assert.ok(event.request.url.indexOf('/testBeforeSyncRequest') >= 0, 'event Request has the correct URL');
          return Promise.resolve({action: 'stop'});
        };
        var beforeSyncRequestResolveReplay = function (event) {
          assert.ok(event.request instanceof Request, 'beforeSyncRequest event Request exists');
          assert.ok(event.request.url.indexOf('/testBeforeSyncRequest') >= 0, 'event Request has the correct URL');
          var request = new Request('/testBeforeSyncRequest', {
            headers: new Headers({
              'X-Resolve-Replay': 'true'
            })
          });
          return Promise.resolve({action: 'replay', request: request});
        };

        persistenceManager.register({
          scope: '/testBeforeSyncRequest'
        }).then(function (registration) {
          var defaultTestResponseProxy = defaultResponseProxy.getResponseProxy();
          registration.addEventListener('fetch', defaultTestResponseProxy.getFetchEventListener());

          fetch('/testBeforeSyncRequest').then(function (response) {
            assert.ok(true, 'Received Response when online');
            persistenceManager.forceOffline(true);
            // beforeSyncRequest listener returns Promise resolves to null
            persistenceManager.getSyncManager().addEventListener('beforeSyncRequest', beforeSyncRequestResolveNull, '/testBeforeSyncRequest');
            validateHeader = 'X-Resolve-Null';
            var request = new Request('/testBeforeSyncRequest', {
              headers: new Headers({
                'X-Resolve-Null': 'true'
              })
            });
            return fetch(request);
          }).then(function () {
            assert.ok(true, 'Received Response when offline');
            persistenceManager.forceOffline(false);
            return persistenceManager.getSyncManager().sync();
          }).then(function () {
            validateHeader = null;
            persistenceManager.getSyncManager().removeEventListener('beforeSyncRequest', beforeSyncRequestResolveNull, '/testBeforeSyncRequest');
            persistenceManager.forceOffline(true);
            // beforeSyncRequest listener returns Promise resolves to action: continue
            persistenceManager.getSyncManager().addEventListener('beforeSyncRequest', beforeSyncRequestResolveContinue, '/testBeforeSyncRequest');
            validateHeader = 'X-Resolve-Continue';
            var request = new Request('/testBeforeSyncRequest', {
              headers: new Headers({
                'X-Resolve-Continue': 'true'
              })
            });
            return fetch(request);
          }).then(function () {
            assert.ok(true, 'Received Response when offline');
            persistenceManager.forceOffline(false);
            return persistenceManager.getSyncManager().sync();
          }).then(function () {
            validateHeader = null;
            persistenceManager.getSyncManager().removeEventListener('beforeSyncRequest', beforeSyncRequestResolveContinue, '/testBeforeSyncRequest');
             persistenceManager.forceOffline(true);
            // beforeSyncRequest listener returns Promise resolves to action: skip
            persistenceManager.getSyncManager().addEventListener('beforeSyncRequest', beforeSyncRequestResolveSkip, '/testBeforeSyncRequest');
            return fetch('/testBeforeSyncRequest');
          }).then(function () {
            assert.ok(true, 'Received Response when offline');
            persistenceManager.forceOffline(false);
            return persistenceManager.getSyncManager().sync();
          }).then(function () {
            persistenceManager.getSyncManager().removeEventListener('beforeSyncRequest', beforeSyncRequestResolveSkip, '/testBeforeSyncRequest');
            persistenceManager.forceOffline(true);
            // beforeSyncRequest listener returns Promise resolves to action: stop
            persistenceManager.getSyncManager().addEventListener('beforeSyncRequest', beforeSyncRequestResolveStop, '/testBeforeSyncRequest');
            return fetch('/testBeforeSyncRequest');
          }).then(function () {
            assert.ok(true, 'Received Response when offline');
            persistenceManager.forceOffline(false);
            return persistenceManager.getSyncManager().sync();
          }).then(function () {
            persistenceManager.getSyncManager().removeEventListener('beforeSyncRequest', beforeSyncRequestResolveStop, '/testBeforeSyncRequest');
            persistenceManager.forceOffline(true);
            // beforeSyncRequest listener returns Promise resolves to action: replay
            persistenceManager.getSyncManager().addEventListener('beforeSyncRequest', beforeSyncRequestResolveReplay, '/testBeforeSyncRequest');
            validateHeader = 'X-Resolve-Replay';
            return fetch('/testBeforeSyncRequest');
          }).then(function () {
            assert.ok(true, 'Received Response when offline');
            persistenceManager.forceOffline(false);
            return persistenceManager.getSyncManager().sync();
          }).then(function () {
            persistenceManager.getSyncManager().removeEventListener('beforeSyncRequest', beforeSyncRequestResolveReplay, '/testBeforeSyncRequest');
            registration.unregister().then(function (unregistered) {
              assert.ok(unregistered == true, 'unregistered scope');
              start();
            });
          });
        });
      });
      asyncTest('syncRequest event', function (assert) {
        expect(15);
        var validateHeader = null;
        mockFetch.addRequestReply('*', '/testSyncRequest', {
          status: 200,
          body: 'Ok'
        }, function (request) {
          if (validateHeader != null && request.method != 'OPTIONS') {
            assert.ok(true, 'Mock Fetch received Request when online');
            assert.ok(request.headers.get(validateHeader), 'Header in request');
          }
        });

        var syncRequestResolveNull = function (event) {
          assert.ok(event.request instanceof Request, 'syncRequest event Request exists');
          assert.ok(event.request.url.indexOf('/testSyncRequest') >= 0, 'event Request has the correct URL');
          return Promise.resolve(null);
        };
        var syncRequestResolveContinue = function (event) {
          assert.ok(event.request instanceof Request, 'syncRequest event Request exists');
          assert.ok(event.request.url.indexOf('/testSyncRequest') >= 0, 'event Request has the correct URL');
          return Promise.resolve({action: 'continue'});
        };
        var syncRequestResolveStop = function (event) {
          assert.ok(event.request instanceof Request, 'syncRequest event Request exists');
          assert.ok(event.request.url.indexOf('/testSyncRequest') >= 0, 'event Request has the correct URL');
          return Promise.resolve({action: 'stop'});
        };

        persistenceManager.register({
          scope: '/testSyncRequest'
        }).then(function (registration) {
          var defaultTestResponseProxy = defaultResponseProxy.getResponseProxy();
          registration.addEventListener('fetch', defaultTestResponseProxy.getFetchEventListener());

          fetch('/testSyncRequest').then(function (response) {
            assert.ok(true, 'Received Response when online');
            persistenceManager.forceOffline(true);
            // beforeSyncRequest listener returns Promise resolves to null
            persistenceManager.getSyncManager().addEventListener('syncRequest', syncRequestResolveNull, '/testSyncRequest');
            validateHeader = 'X-Resolve-Null';
            var request = new Request('/testSyncRequest', {
              headers: new Headers({
                'X-Resolve-Null': 'true'
              })
            });
            return fetch(request);
          }).then(function () {
            assert.ok(true, 'Received Response when offline');
            persistenceManager.forceOffline(false);
            return persistenceManager.getSyncManager().sync();
          }).then(function () {
            validateHeader = null;
            persistenceManager.getSyncManager().removeEventListener('syncRequest', syncRequestResolveNull, '/testSyncRequest');
            persistenceManager.forceOffline(true);
            // beforeSyncRequest listener returns Promise resolves to action: continue
            persistenceManager.getSyncManager().addEventListener('syncRequest', syncRequestResolveContinue, '/testSyncRequest');
            validateHeader = 'X-Resolve-Continue';
            var request = new Request('/testSyncRequest', {
              headers: new Headers({
                'X-Resolve-Continue': 'true'
              })
            });
            return fetch(request);
          }).then(function () {
            assert.ok(true, 'Received Response when offline');
            persistenceManager.forceOffline(false);
            return persistenceManager.getSyncManager().sync();
          }).then(function () {
            validateHeader = null;
            persistenceManager.getSyncManager().removeEventListener('syncRequest', syncRequestResolveContinue, '/testSyncRequest');
            persistenceManager.forceOffline(true);
            // beforeSyncRequest listener returns Promise resolves to action: stop
            persistenceManager.getSyncManager().addEventListener('syncRequest', syncRequestResolveStop, '/testSyncRequest');
            return fetch('/testSyncRequest');
          }).then(function () {
            assert.ok(true, 'Received Response when offline');
            persistenceManager.forceOffline(false);
            return persistenceManager.getSyncManager().sync();
          }).then(function () {
            persistenceManager.getSyncManager().removeEventListener('syncRequest', syncRequestResolveStop, '/testSyncRequest');
            registration.unregister().then(function (unregistered) {
              assert.ok(unregistered == true, 'unregistered scope');
              start();
            });
          });
        });
      });
      asyncTest('getSyncLog()', function (assert) {
        expect(11);
        mockFetch.addRequestReply('GET', '/testSyncLog', {
          status: 200,
          body: 'Ok'
        }, function () {
          assert.ok(true, 'Mock Fetch received Request when online');
        });

        persistenceManager.register({
          scope: '/testSyncLog'
        }).then(function (registration) {
          var defaultTestResponseProxy = defaultResponseProxy.getResponseProxy();
          registration.addEventListener('fetch', defaultTestResponseProxy.getFetchEventListener());

          fetch('/testSyncLog').then(function (response) {
            assert.ok(true, 'Received Response when online');
            persistenceManager.forceOffline(true);
            fetch('/testSyncLog').then(function (response) {
              assert.ok(true, 'Received Response when online');
              return persistenceManager.getSyncManager().getSyncLog();
            }).then(function (syncLog) {
              assert.ok(syncLog.length == 1, 'SyncLog contains one item');
              assert.ok(syncLog[0].request instanceof Request, 'SyncLog item contains request');
              assert.ok(syncLog[0].requestId >= 0, 'SyncLog item contains requestId');
              assert.ok(syncLog[0].undo instanceof Function, 'SyncLog item contains undo');
              assert.ok(syncLog[0].redo instanceof Function, 'SyncLog item contains redo');
              return Promise.resolve(syncLog[0]);
            }).then(function (syncLogItem) {
              syncLogItem.undo().then(function (undoResult) {
                ok(!undoResult, 'No undo data');
                return syncLogItem.redo();
              }).then(function (redoResult) {
                ok(!redoResult, 'No redo data');
              });
            }).then(function () {
              registration.unregister().then(function (unregistered) {
                assert.ok(unregistered == true, 'unregistered scope');
                start();
              });
            });
          });
        });
      });
      asyncTest('insertRequest()', function (assert) {
        expect(9);

        persistenceManager.register({
          scope: '/testInsertRequest'
        }).then(function (registration) {
          var defaultTestResponseProxy = defaultResponseProxy.getResponseProxy();
          registration.addEventListener('fetch', defaultTestResponseProxy.getFetchEventListener());
          var request = new Request('http://localhost/testInsertRequest');
          persistenceManager.getSyncManager().insertRequest(request).then(function () {
            return persistenceManager.getSyncManager().getSyncLog();
          }).then(function (syncLog) {
            assert.ok(syncLog.length == 1, 'SyncLog contains one item');
            assert.ok(syncLog[0].request instanceof Request, 'SyncLog item contains request');
            assert.ok(syncLog[0].request.url == 'http://localhost/testInsertRequest', 'Request url is correct');
            assert.ok(syncLog[0].requestId >= 0, 'SyncLog item contains requestId');
            assert.ok(syncLog[0].undo instanceof Function, 'SyncLog item contains undo');
            assert.ok(syncLog[0].redo instanceof Function, 'SyncLog item contains redo');
            return Promise.resolve(syncLog[0]);
          }).then(function (syncLogItem) {
            syncLogItem.undo().then(function (undoResult) {
              ok(!undoResult, 'No undo data');
              return syncLogItem.redo();
            }).then(function (redoResult) {
              ok(!redoResult, 'No redo data');
            });
          }).then(function () {
            registration.unregister().then(function (unregistered) {
              assert.ok(unregistered == true, 'unregistered scope');
              start();
            });
          });
        });
      });
      asyncTest('removeRequest()', function (assert) {
        expect(4);

        persistenceManager.register({
          scope: '/testRemoveRequest'
        }).then(function (registration) {
          var defaultTestResponseProxy = defaultResponseProxy.getResponseProxy();
          registration.addEventListener('fetch', defaultTestResponseProxy.getFetchEventListener());
          var request = new Request('http://localhost/testRemoveRequest');
          persistenceManager.getSyncManager().insertRequest(request).then(function () {
            return persistenceManager.getSyncManager().getSyncLog();
          }).then(function (syncLog) {
            var requestId = syncLog[0].requestId;
            return persistenceManager.getSyncManager().removeRequest(requestId);
          }).then(function (request) {
            assert.ok(request instanceof Request, 'removeRequest resolved to Request object');
            assert.ok(request.url == 'http://localhost/testRemoveRequest', 'Request url is correct');
            return persistenceManager.getSyncManager().getSyncLog();
          }).then(function (syncLog) {
            assert.ok(syncLog.length == 0, 'SyncLog is empty');
            registration.unregister().then(function (unregistered) {
              assert.ok(unregistered == true, 'unregistered scope');
              start();
            });
          });
        });
      });
      asyncTest('updateRequest()', function (assert) {
        expect(10);

        persistenceManager.register({
          scope: '/testUpdateRequest'
        }).then(function (registration) {
          var defaultTestResponseProxy = defaultResponseProxy.getResponseProxy();
          registration.addEventListener('fetch', defaultTestResponseProxy.getFetchEventListener());
          var request = new Request('http://localhost/testUpdateRequest');
          persistenceManager.getSyncManager().insertRequest(request).then(function () {
            return persistenceManager.getSyncManager().getSyncLog();
          }).then(function (syncLog) {
            assert.ok(syncLog.length == 1, 'SyncLog contains one item');
            assert.ok(syncLog[0].request instanceof Request, 'SyncLog item contains request');
            assert.ok(syncLog[0].request.url == 'http://localhost/testUpdateRequest', 'Request url is correct');
            assert.ok(syncLog[0].requestId >= 0, 'SyncLog item contains requestId');
            var requestId = syncLog[0].requestId;
            syncLog[0].request.headers.set('X-Update', 'true');
            persistenceManager.getSyncManager().updateRequest(requestId, syncLog[0].request).then(function () {
              return persistenceManager.getSyncManager().getSyncLog();
            }).then(function (syncLog) {
              assert.ok(syncLog.length == 1, 'SyncLog contains one item');
              assert.ok(syncLog[0].request instanceof Request, 'SyncLog item contains request');
              assert.ok(syncLog[0].request.url == 'http://localhost/testUpdateRequest', 'Request url is correct');
              assert.ok(syncLog[0].requestId >= 0, 'SyncLog item contains requestId');
              assert.ok(syncLog[0].request.headers.get('X-Update') == 'true', 'Request header updated');
            }).then(function () {
              registration.unregister().then(function (unregistered) {
                assert.ok(unregistered == true, 'unregistered scope');
                start();
              });
            });
          });
        });
      });
      asyncTest('sync()', function (assert) {
        expect(7);
        mockFetch.addRequestReply('*', '/testSync', {
          status: 200,
          body: 'Ok'
        }, function () {
          assert.ok(true, 'Mock Fetch received Request when online');
        });

        persistenceManager.register({
          scope: '/testSync'
        }).then(function (registration) {
          var defaultTestResponseProxy = defaultResponseProxy.getResponseProxy();
          registration.addEventListener('fetch', defaultTestResponseProxy.getFetchEventListener());

          fetch('/testSync').then(function (response) {
            assert.ok(true, 'Received Response when online');
            persistenceManager.forceOffline(true);
            return fetch('/testSync');
          }).then(function () {
            assert.ok(true, 'Received Response when offline');
            persistenceManager.forceOffline(false);
            return persistenceManager.getSyncManager().sync();
          }).then(function () {
             return persistenceManager.getSyncManager().getSyncLog();
          }).then(function (syncLog) {
            assert.ok(syncLog.length == 0, 'SyncLog is empty');
            registration.unregister().then(function (unregistered) {
              assert.ok(unregistered == true, 'unregistered scope');
              start();
            });
          });
        });
      });
      asyncTest('fetch error', function (assert) {
        expect(8);

        persistenceManager.register({
          scope: '/testFetchError'
        }).then(function (registration) {
          var handleGet = function (request) {
            return Promise.reject();
          };
          var options = {requestHandlerOverride: {handleGet: handleGet}};
          var defaultTestResponseProxy = defaultResponseProxy.getResponseProxy(options);
          registration.addEventListener('fetch', defaultTestResponseProxy.getFetchEventListener());

          fetch('/testFetchError').then(function (response) {  
            }, function(error) {
            persistenceManager.getSyncManager().getSyncLog().then(function (syncLog) {
              assert.ok(syncLog.length == 1, 'SyncLog contains one item');
              assert.ok(syncLog[0].request instanceof Request, 'SyncLog item contains request');
              assert.ok(syncLog[0].requestId >= 0, 'SyncLog item contains requestId');
              assert.ok(syncLog[0].undo instanceof Function, 'SyncLog item contains undo');
              assert.ok(syncLog[0].redo instanceof Function, 'SyncLog item contains redo');
              return Promise.resolve(syncLog[0]);
            }).then(function (syncLogItem) {
              syncLogItem.undo().then(function (undoResult) {
                ok(!undoResult, 'No undo data');
                return syncLogItem.redo();
              }).then(function (redoResult) {
                ok(!redoResult, 'No redo data');
              });
            }).then(function () {
              registration.unregister().then(function (unregistered) {
                assert.ok(unregistered == true, 'unregistered scope');
                start();
              });
            });
          });
        });
      });
      asyncTest('timeout fetch()', function (assert) {
        expect(5);
        mockFetch.addRequestReply('GET', '/testTimeout', {
          status: 200,
          body: 'Ok'
        }, function () {
          assert.ok(true, 'Mock Fetch received Request when online');
        });
        mockFetch.addRequestReply('OPTIONS', '/testTimeout', new Promise(function(resolve, reject) {
        }), function () {
          assert.ok(true, 'Mock Fetch received Request when online');
        });

        persistenceManager.register({
          scope: '/testTimeout'
        }).then(function (registration) {
          var defaultTestResponseProxy = defaultResponseProxy.getResponseProxy();
          registration.addEventListener('fetch', defaultTestResponseProxy.getFetchEventListener());

          fetch('/testTimeout').then(function (response) {
            assert.ok(true, 'Received Response when online');
            persistenceManager.forceOffline(true);
            return fetch('/testTimeout');
          }).then(function () {
            assert.ok(true, 'Received Response when offline');
            persistenceManager.forceOffline(false);
            return persistenceManager.getSyncManager().sync({preflightOptionsRequestTimeout: 1000});
          }).then(function () {}, function(err) {
            assert.ok(err.error == 'Preflight OPTIONS request timed out', 'Timeout');
            registration.unregister().then(function (unregistered) {
              assert.ok(unregistered == true, 'unregistered scope');
              start();
            });
          });
        });
      });
      asyncTest('timeout fetch() URL', function (assert) {
        expect(5);
        mockFetch.addRequestReply('GET', '/testURLTimeout', {
          status: 200,
          body: 'Ok'
        }, function () {
          assert.ok(true, 'Mock Fetch received Request when online');
        });
        mockFetch.addRequestReply('OPTIONS', '/testURLTimeout', new Promise(function(resolve, reject) {
        }), function () {
          assert.ok(true, 'Mock Fetch received Request when online');
        });

        persistenceManager.register({
          scope: '/testURLTimeout'
        }).then(function (registration) {
          var defaultTestResponseProxy = defaultResponseProxy.getResponseProxy();
          registration.addEventListener('fetch', defaultTestResponseProxy.getFetchEventListener());

          fetch('/testURLTimeout').then(function (response) {
            assert.ok(true, 'Received Response when online');
            persistenceManager.forceOffline(true);
            return fetch('/testURLTimeout');
          }).then(function () {
            assert.ok(true, 'Received Response when offline');
            persistenceManager.forceOffline(false);
            return persistenceManager.getSyncManager().sync({preflightOptionsRequest: '/testURLTimeout', preflightOptionsRequestTimeout: 1000});
          }).then(function () {}, function(err) {
            assert.ok(err.error == 'Preflight OPTIONS request timed out', 'Timeout');
            return persistenceManager.getSyncManager().sync({preflightOptionsRequest: '/testURLTimeout', preflightOptionsRequestTimeout: 1000});
          }).then(function () {}, function(err) {
            registration.unregister().then(function (unregistered) {
              assert.ok(unregistered == true, 'unregistered scope');
              start();
            });
          });
        });
      });
      asyncTest('server errpr', function (assert) {
        expect(4);
        mockFetch.addRequestReply('GET', '/testServerError', {
          status: 200,
          body: 'Ok'
        }, function () {
          assert.ok(true, 'Mock Fetch received Request when online');
        });

        persistenceManager.register({
          scope: '/testServerError'
        }).then(function (registration) {
          var defaultTestResponseProxy = defaultResponseProxy.getResponseProxy();
          registration.addEventListener('fetch', defaultTestResponseProxy.getFetchEventListener());

          fetch('/testServerError').then(function (response) {
            assert.ok(true, 'Received Response when online');
            persistenceManager.forceOffline(true);
            fetch('/testServerError').then(function (response) {
              mockFetch.clearAllRequestReplies();
              mockFetch.addRequestReply('GET', '/testServerError', {
                status: 400,
                body: 'NotOk'
              });
              persistenceManager.forceOffline(false);
              return persistenceManager.getSyncManager().sync();
            }).then(function () {}, 
            function(err) {
              assert.ok(true, 'Rejected on server error');
              mockFetch.clearAllRequestReplies();
              mockFetch.addRequestReply('GET', '/testServerError', new Promise.reject('fetch rejected'));
              return persistenceManager.getSyncManager().sync();
            }).then(function () {}, 
            function(err) {
              registration.unregister().then(function (unregistered) {
                assert.ok(unregistered == true, 'unregistered scope');
                start();
              });
            });
          });
        });
      });
      asyncTest('undo/redo', function (assert) {
        expect(31);
        mockFetch.addRequestReply('GET', '/testUndoRedo', {
          status: 200,
          body: JSON.stringify([{ID: 2, name: 'Test1'}])
        }, function () {
          assert.ok(true, 'Mock Fetch received Request when online');
        });

        persistenceManager.register({
          scope: '/testUndoRedo'
        }).then(function (registration) {
          var defaultTestResponseProxy = defaultResponseProxy.getResponseProxy({
                jsonProcessor:
                  {
                    shredder: simpleJsonShredding.getShredder('item', 'ID'),
                    unshredder: simpleJsonShredding.getUnshredder()
                  }
              });
          registration.addEventListener('fetch', defaultTestResponseProxy.getFetchEventListener());

          fetch('/testUndoRedo').then(function (response) {
            assert.ok(true, 'Received Response when online');
            persistenceManager.forceOffline(true);
            var request = new Request('/testUndoRedo', {method: 'PUT', body: JSON.stringify([{ID: 2, name: 'Test2'}])});
            fetch(request).then(function (response) {
              assert.ok(true, 'Received Response when offline');
              return persistenceManager.getSyncManager().getSyncLog();
            }).then(function (syncLog) {
              assert.ok(syncLog.length == 1, 'SyncLog contains one item');
              assert.ok(syncLog[0].request instanceof Request, 'SyncLog item contains request');
              assert.ok(syncLog[0].requestId >= 0, 'SyncLog item contains requestId');
              assert.ok(syncLog[0].undo instanceof Function, 'SyncLog item contains undo');
              assert.ok(syncLog[0].redo instanceof Function, 'SyncLog item contains redo');
              return Promise.resolve(syncLog[0]);
            }).then(function (syncLogItem) {
              return syncLogItem.undo().then(function (undoResult) {
                assert.ok(undoResult, 'Undo data');
                return fetch('/testUndoRedo');
              }).then(function(response) {
                return persistenceUtils.responseToJSON(response);
              }).then(function(responseJSON) {
                assert.ok(responseJSON.body.text == JSON.stringify([{ID: 2, name: 'Test1'}]), 'undo data correct');
                return syncLogItem.redo();
              }).then(function (redoResult) {
                assert.ok(redoResult, 'Redo data');
                return fetch('/testUndoRedo');
              }).then(function(response) {
                return persistenceUtils.responseToJSON(response);
              }).then(function(responseJSON) {
                assert.ok(responseJSON.body.text == JSON.stringify([{ID: 2, name: 'Test2'}]), 'redo data correct');
              });
            }).then(function () {
              var request = new Request('/testUndoRedo/2', {method: 'DELETE'});
              return fetch(request);
            }).then(function () {
              assert.ok(true, 'Received Response when offline');
              return persistenceManager.getSyncManager().getSyncLog();
            }).then(function (syncLog) {
              assert.ok(syncLog.length == 4, 'SyncLog contains 4 items');
              assert.ok(syncLog[3].request instanceof Request, 'SyncLog item contains request');
              assert.ok(syncLog[3].requestId >= 0, 'SyncLog item contains requestId');
              assert.ok(syncLog[3].undo instanceof Function, 'SyncLog item contains undo');
              assert.ok(syncLog[3].redo instanceof Function, 'SyncLog item contains redo');
              return Promise.resolve(syncLog[3]);
            }).then(function (syncLogItem) {
              return syncLogItem.undo().then(function (undoResult) {
                assert.ok(undoResult, 'Undo data');
                return fetch('/testUndoRedo');
              }).then(function(response) {
                return persistenceUtils.responseToJSON(response);
              }).then(function(responseJSON) {
                assert.ok(responseJSON.body.text == JSON.stringify([{ID: 2, name: 'Test2'}]), 'undo data correct');
                return syncLogItem.redo();
              }).then(function (redoResult) {
                assert.ok(redoResult, 'Redo data');
                return fetch('/testUndoRedo');
              }).then(function(response) {
                return persistenceUtils.responseToJSON(response);
              }).then(function(responseJSON) {
                assert.ok(responseJSON.body.text == JSON.stringify([null]), 'redo data correct');
              });
            }).then(function() {
              var request = new Request('/testUndoRedo', {method: 'PUT', body: JSON.stringify([{ID: 3, name: 'Test3'}])});
              return fetch(request);
            }).then(function() {
              assert.ok(true, 'Received Response when offline');
              return persistenceManager.getSyncManager().getSyncLog();
            }).then(function (syncLog) {
              assert.ok(syncLog.length == 7, 'SyncLog contains one item');
              assert.ok(syncLog[6].request instanceof Request, 'SyncLog item contains request');
              assert.ok(syncLog[6].requestId >= 0, 'SyncLog item contains requestId');
              assert.ok(syncLog[6].undo instanceof Function, 'SyncLog item contains undo');
              assert.ok(syncLog[6].redo instanceof Function, 'SyncLog item contains redo');
              return Promise.resolve(syncLog[6]);
            }).then(function (syncLogItem) {
              return syncLogItem.undo().then(function (undoResult) {
                assert.ok(undoResult, 'Undo data');
                return fetch('/testUndoRedo');
              }).then(function(response) {
                return persistenceUtils.responseToJSON(response);
              }).then(function(responseJSON) {
                assert.ok(responseJSON.body.text == JSON.stringify([null]), 'undo data correct');
                return syncLogItem.redo();
              });
            }).then(function() {
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
