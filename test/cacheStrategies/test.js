define(['persist/persistenceManager', 'persist/defaultResponseProxy', 'persist/fetchStrategies', 'persist/persistenceUtils', 'persist/persistenceStoreManager', 'persist/localPersistenceStoreFactory', 'MockFetch', 'persist/impl/logger'],
  function (persistenceManager, defaultResponseProxy, fetchStrategies, persistenceUtils, persistenceStoreManager, localPersistenceStoreFactory, MockFetch, logger) {
    'use strict';
    logger.option('level',  logger.LEVEL_LOG);
    QUnit.module('cacheStrategies', {
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

    var versionedLocalPersistenceStoreFactory = (function () {
      return {
        'createPersistenceStore': function (name, options) {
          return localPersistenceStoreFactory.createPersistenceStore(name, {version: 2});
        }
      };
    }());

    var mockFetch = new MockFetch();
    persistenceStoreManager.registerDefaultStoreFactory(versionedLocalPersistenceStoreFactory);
    persistenceManager.init().then(function () {

      QUnit.test('getHttpCacheHeaderStrategy: expires', function (assert) {
        var done = assert.async();
        assert.expect(5);
        mockFetch.addRequestReply('GET', '/testExpires', {
          status: 200,
          statusText: 'OK',
          body: 'REPLY',
          headers: {'Expires': 'Wed, 21 Oct 2015 07:28:00 GMT'}
        }, function (request, response) {
          assert.ok(true, 'Mock Fetch received Request when online');
        });

        persistenceManager.register({
          scope: '/testExpires'
        }).then(function (registration) {
          var defaultTestResponseProxy = defaultResponseProxy.getResponseProxy();
          registration.addEventListener('fetch', defaultTestResponseProxy.getFetchEventListener());
          return fetch('/testExpires');
        }).then(function (response) {
          assert.ok(!persistenceUtils.isCachedResponse(response), 'Not cached response');
          assert.ok(true, 'Received Response when online');
          persistenceManager.forceOffline(true);
          return fetch('/testExpires');
        }).then(function (response) {
          assert.ok(persistenceUtils.isCachedResponse(response), 'Cached response');
          assert.ok(response.headers.get('x-oracle-jscpt-cache-expiration-date') == 'Wed, 21 Oct 2015 07:28:00 GMT', 'x-oracle-jscpt-cache-expiration-date is correct');
          done();
        });
      });

      QUnit.test('getHttpCacheHeaderStrategy: max-age', function (assert) {
        var done = assert.async();
        assert.expect(5);
        mockFetch.addRequestReply('GET', '/testMaxAge', {
          status: 200,
          statusText: 'OK',
          body: 'REPLY',
          headers: {'Cache-Control': 'max-age=10'}
        }, function (request, response) {
          assert.ok(true, 'Mock Fetch received Request when online');
        });

        persistenceManager.register({
          scope: '/testMaxAge'
        }).then(function (registration) {
          var defaultTestResponseProxy = defaultResponseProxy.getResponseProxy();
          registration.addEventListener('fetch', defaultTestResponseProxy.getFetchEventListener());
          return fetch('/testMaxAge');
        }).then(function (response) {
          assert.ok(!persistenceUtils.isCachedResponse(response), 'Not cached response');
          assert.ok(true, 'Received Response when online');
          persistenceManager.forceOffline(true);
          return fetch('/testMaxAge');
        }).then(function (response) {
          assert.ok(persistenceUtils.isCachedResponse(response), 'Cached response');
          var expiresTime = (new Date(response.headers.get('x-oracle-jscpt-cache-expiration-date'))).getTime();
          var currentTime = (new Date()).getTime();
          var expiresIn = expiresTime - currentTime;
          assert.ok(expiresIn > 9000 && expiresIn < 10000, 'Expiration time is correct');
          done();
        });
      });

      QUnit.test('getHttpCacheHeaderStrategy: If-Match', function (assert) {
        var done = assert.async();
        assert.expect(10);
        mockFetch.addRequestReply('GET', '/testIfMatch', {
          status: 200,
          statusText: 'OK',
          body: 'REPLY',
          headers: {'ETag': 'XYZ123'}
        }, function (request, response) {
          assert.ok(true, 'Mock Fetch received Request when online');
        });

        persistenceManager.register({
          scope: '/testIfMatch'
        }).then(function (registration) {
          var defaultTestResponseProxy = defaultResponseProxy.getResponseProxy();
          registration.addEventListener('fetch', defaultTestResponseProxy.getFetchEventListener());
          return fetch('/testIfMatch');
        }).then(function (response) {
          assert.ok(!persistenceUtils.isCachedResponse(response), 'Not cached response');
          assert.ok(true, 'Received Response when online');
          persistenceManager.forceOffline(true);
          var init = {method: 'GET',
            headers: {'If-Match': 'XYZ123'},
            mode: 'cors'};
          var request = new Request('/testIfMatch', init);
          return fetch('/testIfMatch', request);
        }).then(function (response) {
          assert.ok(persistenceUtils.isCachedResponse(response), 'Cached response');
          var init = {method: 'GET',
            headers: {'If-Match': 'ABC123'},
            mode: 'cors'};
          var request = new Request('/testIfMatch', init);
          return fetch('/testIfMatch', request);
        }).then(function (response) {
          assert.ok(persistenceUtils.isCachedResponse(response), 'Cached response');
          assert.ok(response.status == 412, 'response status is 412');
          var init = {method: 'GET',
            headers: {'If-None-Match': 'ABC123'},
            mode: 'cors'};
          var request = new Request('/testIfMatch', init);
          return fetch('/testIfMatch', request);
        }).then(function (response) {
          assert.ok(persistenceUtils.isCachedResponse(response), 'Cached response');
          assert.ok(response.status == 200, 'response status is 200');
          var init = {method: 'GET',
            headers: {'If-None-Match': 'XYZ123'},
            mode: 'cors'};
          var request = new Request('/testIfMatch', init);
          return fetch('/testIfMatch', request);
        }).then(function (response) {
          assert.ok(persistenceUtils.isCachedResponse(response), 'Cached response');
          assert.ok(response.status == 412, 'response status is 412');
          done();
        });
      });

      QUnit.test('getHttpCacheHeaderStrategy: must-revalidate', function (assert) {
        var done = assert.async();
        assert.expect(4);
        mockFetch.addRequestReply('GET', '/testMustRevalidate', {
          status: 200,
          statusText: 'OK',
          body: 'REPLY',
          headers: {'Cache-control': 'must-revalidate',
            'Expires': 'Wed, 21 Oct 2015 07:28:00 GMT'}
        }, function (request, response) {
          assert.ok(true, 'Mock Fetch received Request when online');
        });

        persistenceManager.register({
          scope: '/testMustRevalidate'
        }).then(function (registration) {
          var defaultTestResponseProxy = defaultResponseProxy.getResponseProxy();
          registration.addEventListener('fetch', defaultTestResponseProxy.getFetchEventListener());
          return fetch('/testMustRevalidate');
        }).then(function (response) {
          assert.ok(!persistenceUtils.isCachedResponse(response), 'Not cached response');
          assert.ok(true, 'Received Response when online');
          persistenceManager.forceOffline(true);
          return fetch('/testMustRevalidate');
        }).then(function (response) {
          assert.ok(response.status == 504, 'response status is 504');
          done();
        });
      });

      QUnit.test('getHttpCacheHeaderStrategy: no-cache', function (assert) {
        var done = assert.async();
        assert.expect(5);
        mockFetch.addRequestReply('GET', '/testNoCache', {
          status: 200,
          statusText: 'OK',
          body: 'REPLY',
          headers: {'Cache-control': 'no-cache'}
        }, function (request, response) {
          assert.ok(true, 'Mock Fetch received Request when online');
        });

        persistenceManager.register({
          scope: '/testNoCache'
        }).then(function (registration) {
          var defaultTestResponseProxy = defaultResponseProxy.getResponseProxy();
          registration.addEventListener('fetch', defaultTestResponseProxy.getFetchEventListener({fetchStrategy: fetchStrategies.getCacheFirstStrategy()}));
          return fetch('/testNoCache');
        }).then(function (response) {
          assert.ok(!persistenceUtils.isCachedResponse(response), 'Not cached response');
          assert.ok(true, 'Received Response when online');
          return fetch('/testNoCache');
        }).then(function (response) {
          assert.ok(!persistenceUtils.isCachedResponse(response), 'Not cached response');
          done();
        });
      });

      QUnit.test('getHttpCacheHeaderStrategy: no-store', function (assert) {
        var done = assert.async();
        assert.expect(5);
        mockFetch.addRequestReply('GET', '/testNoStore', {
          status: 200,
          statusText: 'OK',
          body: 'REPLY',
          headers: {'Cache-control': 'no-store'}
        }, function (request, response) {
          assert.ok(true, 'Mock Fetch received Request when online');
        });

        persistenceManager.register({
          scope: '/testNoStore'
        }).then(function (registration) {
          var defaultTestResponseProxy = defaultResponseProxy.getResponseProxy();
          registration.addEventListener('fetch', defaultTestResponseProxy.getFetchEventListener());
          return fetch('/testNoStore');
        }).then(function (response) {
          assert.ok(!persistenceUtils.isCachedResponse(response), 'Not cached response');
          assert.ok(true, 'Received Response when online');
          persistenceManager.forceOffline(true);
          return fetch('/testNoStore');
        }).then(function (response) {
          assert.ok(!persistenceUtils.isCachedResponse(response), 'Not cached response');
          done();
        });
      });
    });
  });


