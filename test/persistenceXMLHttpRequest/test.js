define(['persist/persistenceManager', 'persist/defaultResponseProxy', 'persist/persistenceStoreManager', 'persist/localPersistenceStoreFactory', 'MockFetch', 'persist/impl/logger'],
  function (persistenceManager, defaultResponseProxy, persistenceStoreManager, localPersistenceStoreFactory, MockFetch, logger) {
    'use strict';
    logger.option('level',  logger.LEVEL_LOG);
    QUnit.module('PersistenceXMLHttpRequest', {
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

      QUnit.test('open()/send()', function (assert) {
        var done = assert.async();
        assert.expect(109);
        mockFetch.addRequestReply('GET', '/testOpen', {
          status: 200,
          statusText: 'OK',
          body: 'REPLY'
        }, function (request, response) {
          assert.ok(request.headers.get('test') == 'value', 'header value received');
          assert.ok(true, 'Mock Fetch received Request when online');
        });

        persistenceManager.register({
          scope: '/testOpen'
        }).then(function (registration) {
          var defaultTestResponseProxy = defaultResponseProxy.getResponseProxy();
          registration.addEventListener('fetch', defaultTestResponseProxy.getFetchEventListener());

          var xhr = new XMLHttpRequest();

          xhr.onreadystatechange = function(event) {
            assert.ok(event.type == 'readystatechange', 'readystatechange event');

            if (this.readyState == 1) {
              assert.ok(this.onabort === null, 'onabort is null');
              assert.ok(this.onerror === null, 'onerror is null');
              assert.ok(this.onabort === null, 'onabort is null');
              assert.ok(this.onload === null, 'onload is null');
              assert.ok(this.onloadend === null, 'onloadend is null');
              assert.ok(this.onloadstart === null, 'onloadstart is null');
              assert.ok(this.onprogress === null, 'onprogress is null');
              assert.ok(this.ontimeout === null, 'ontimeout is null');
              assert.ok(this.response === '', 'response is empty');
              assert.ok(!this.responseText, 'responseText is empty');
              assert.ok(this.responseType == '', 'responseType is empty');
              assert.ok(this.responseURL === '', 'responseURL is empty');
              assert.ok(this.responseXML === null, 'responseXML is null');
              assert.ok(this.status === 0, 'status is 0');
              assert.ok(this.statusText === '', 'statusText is empty');
              assert.ok(this.timeout === 0, 'timeout is 0');
              assert.ok(this.withCredentials === false, 'withCredentials is false');
              assert.ok(this.getResponseHeader('content-type') == null, 'responseHeader is null');
              assert.ok(this.getAllResponseHeaders() == '', 'responseHeaders are empty');
            } else if (this.readyState == 2) {
              assert.ok(this.response === '', 'response is empty');
              assert.ok(!this.responseText, 'responseText is empty');
              assert.ok(this.responseType == '', 'responseType is empty');
              assert.ok(this.responseURL === '', 'responseURL is empty');
              assert.ok(this.responseXML === null, 'responseXML is null');
              assert.ok(this.status === 0, 'status is 0');
              assert.ok(this.statusText === '', 'statusText is empty');
              assert.ok(this.timeout === 0, 'timeout is 0');
              assert.ok(this.withCredentials === false, 'withCredentials is false');
            } else if (this.readyState == 4) {
              assert.ok(this.response === 'REPLY', 'response is correct');
              assert.ok(this.responseText === 'REPLY', 'responseText is correct');
              assert.ok(!this.responseType, 'responseType is null');
              assert.ok(this.responseURL === 'http://localhost/testOpen', 'responseURL is null');
              assert.ok(this.responseXML === null, 'responseXML is null');
              assert.ok(this.status === 200, 'status is 200');
              assert.ok(this.statusText === 'OK', 'statusText is OK');
              assert.ok(this.timeout === 0, 'timeout is 0');
              assert.ok(this.withCredentials === false, 'withCredentials is false');
              assert.ok(this.getResponseHeader('content-type') == 'test-mime', 'responseHeader is correct');
              assert.ok(this.getAllResponseHeaders().indexOf('content-type: test-mime') >= 0, 'responseHeader is correct');
            }
          };
          xhr.addEventListener('readystatechange', xhr.onreadystatechange);
          xhr.addEventListener('loadstart', function(event) {
            assert.ok(this.readyState == 1, 'state is correct');
          });
          xhr.addEventListener('load', function(event) {
            assert.ok(this.readyState == 4, 'state is correct');
          });
          xhr.addEventListener('loadend', function(event) {
            assert.ok(this.readyState == 4, 'state is correct');
            var xhrErr = new XMLHttpRequest();
            try {
              xhrErr.open('GET', 'http://localhost/testOpenErr', false);
            } catch (err) {
              assert.ok(true, 'Error for sync open');
            }

            var xhrErrNoRegisteredUrl = new XMLHttpRequest();
            try {
              xhrErrNoRegisteredUrl.onerror = function(event) {
                assert.ok(event.type == 'error', 'error handler invoked');
                done();
              };
              xhrErrNoRegisteredUrl.open('GET', 'http://localhost/testNonReg');
              xhrErrNoRegisteredUrl.send();
            } catch (err) {
              assert.ok(false, 'Should not throw error. The onerror handler should be invoked');
            }
          });
          xhr.open('GET', 'http://localhost/testOpen', true);
          xhr.setRequestHeader('test', 'value');
          xhr.overrideMimeType('test-mime');
          xhr.send();
          xhr.removeEventListener('readystatechange', xhr.onreadystatechange);
          xhr.abort();
        });
      });

      QUnit.test('test null content type', function (assert) {
        var done = assert.async();
        assert.expect(6);
        var headers = new Headers({'Content-Type': null});
        mockFetch.addRequestReply('GET', '/testNullContentHeader', {
          status: 200,
          statusText: 'OK',
          headers: headers,
          body: "Hello"
        });
        persistenceManager.register({
          scope: '/testNullContentHeader'
        }).then(function (registration) {
          var defaultTestResponseProxy = defaultResponseProxy.getResponseProxy();
          registration.addEventListener('fetch', defaultTestResponseProxy.getFetchEventListener());

          var xhr = new XMLHttpRequest();
          xhr.onreadystatechange = function(event) {
            assert.ok(event.type == 'readystatechange', 'readystatechange event');
            if (this.readyState == 4) {
              assert.ok(this.status === 200, 'status is 200');
              assert.ok(this.statusText === 'OK', 'statusText is OK');
              done();
            }
          };
          xhr.open('GET', 'http://testNullContentHeader', true);
          xhr.send();
        });
      });

      QUnit.test('test binary data handling', function (assert) {
        var done = assert.async();
        assert.expect(6);
        generateMultipartFormWithBlob({firstName: 'Bob', lastName: 'Smith'}).then(function(multipartDataToTest) {
          var headers = new Headers({'Content-Type': 'image/png'});
          mockFetch.addRequestReply('GET', '/testBinaryDataHandling', {
            status: 200,
            statusText: 'OK',
            headers: headers,
            body: multipartDataToTest.content
          });
          persistenceManager.register({
            scope: '/testBinaryDataHandling'
          }).then(function (registration) {
            var defaultTestResponseProxy = defaultResponseProxy.getResponseProxy();
            registration.addEventListener('fetch', defaultTestResponseProxy.getFetchEventListener());

            var xhr = new XMLHttpRequest();
            xhr.onreadystatechange = function(event) {
              assert.ok(event.type == 'readystatechange', 'readystatechange event');
              if (this.readyState == 4) {
                assert.ok(this.status === 200, 'status is 200');
                assert.ok(this.statusText === 'OK', 'statusText is OK');
                done();
              }
            };
            xhr.open('GET', 'http://testBinaryDataHandling', true);
            xhr.send();
          });
        });
      });
    });

    QUnit.test('test binary data handling without URL support', function (assert) {
      var done = assert.async();
      assert.expect(6);
      generateMultipartFormWithBlob({firstName: 'Bob', lastName: 'Smith'}, true).then(function(multipartDataToTest) {
        var headers = new Headers({'Content-Type': 'image/png'});
        mockFetch.addRequestReply('GET', '/testBinaryDataHandlingNoURL', {
          status: 200,
          statusText: 'OK',
          headers: headers,
          body: multipartDataToTest.content
        });
        persistenceManager.register({
          scope: '/testBinaryDataHandlingNoURL'
        }).then(function (registration) {
          var defaultTestResponseProxy = defaultResponseProxy.getResponseProxy();
          registration.addEventListener('fetch', defaultTestResponseProxy.getFetchEventListener());

          var xhr = new XMLHttpRequest();
          xhr.onreadystatechange = function(event) {
            assert.ok(event.type == 'readystatechange', 'readystatechange event');
            if (this.readyState == 4) {
              assert.ok(this.status === 200, 'status is 200');
              assert.ok(this.statusText === 'OK', 'statusText is OK');
              done();
            }
          };
          xhr.open('GET', 'http://testBinaryDataHandlingNoURL', true);
          xhr.send();
        });
      });
    });

    var generateMultipartFormWithBlob = function (params, noURL) {
      return new Promise(function(resolve, reject) {
        var saveURL = window.URL;
        if (noURL) {
          window.URL = null;
        }
        var request = new XMLHttpRequest();
        request.open('GET', 'oracle.png', true);
        if (noURL) {
          window.URL = saveURL;
        }
        request.responseType = 'blob';
        request.addEventListener('load', function () {
          var boundary = '---Testboundary' + Math.random().toString(36).substring(7);
          var contentType = 'multipart/form-data; boundary=' + boundary;
          var parts = [];

          var keys = Object.keys(params);
          for (var index = 0; index < keys.length; index++) {
            var part = boundary + '\r\n';
            part += 'Content-Disposition: form-data; name="';
            part += keys[index] + '"\r\n\r\n';
            part += params[keys[index]] + '\r\n';
            parts.push(part);
          }
          var reader = new FileReader();
          reader.addEventListener("loadend", function() {
            var part = boundary + '\r\n';
            part += 'Content-Disposition: form-data; name="';
            part += 'oracle.png' + '"\r\n';
            part += 'Content-Type: image/png\r\n\r\n';
            var base64text = reader.result.split("data:image/png;base64,")[1];
            part += base64text + '\r\n';
            parts.push(part);
            parts.push(boundary + '\r\n');
            resolve({
              contentType: contentType,
              content: parts.join('')
            });
          });
          reader.readAsDataURL(request.response);
        });
        request.send();
      });
    };
  });
