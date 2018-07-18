define(['persist/persistenceManager', 'persist/defaultResponseProxy', 'persist/persistenceStoreManager', 'persist/localPersistenceStoreFactory', 'MockFetch', 'persist/impl/logger'],
  function (persistenceManager, defaultResponseProxy, persistenceStoreManager, localPersistenceStoreFactory, MockFetch, logger) {
    'use strict';
    logger.option('level',  logger.LEVEL_LOG);
    module('PersistenceXMLHttpRequest', {
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
          start();
        });
      }
    });

    var mockFetch = new MockFetch();
    persistenceStoreManager.registerDefaultStoreFactory(localPersistenceStoreFactory);
    persistenceManager.init().then(function () {

      asyncTest('open()/send()', function (assert) {
        expect(108);
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
            ok(event.type == 'readystatechange', 'readystatechange event');
            
            if (this.readyState == 1) {
              ok(this.onabort === null, 'onabort is null');
              ok(this.onerror === null, 'onerror is null');
              ok(this.onabort === null, 'onabort is null');
              ok(this.onload === null, 'onload is null');
              ok(this.onloadend === null, 'onloadend is null');
              ok(this.onloadstart === null, 'onloadstart is null');
              ok(this.onprogress === null, 'onprogress is null');
              ok(this.ontimeout === null, 'ontimeout is null');
              ok(this.response === '', 'response is empty');
              ok(!this.responseText, 'responseText is empty');
              ok(this.responseType == '', 'responseType is empty');
              ok(this.responseURL === '', 'responseURL is empty');
              ok(this.responseXML === null, 'responseXML is null');
              ok(this.status === 0, 'status is 0');
              ok(this.statusText === '', 'statusText is empty');
              ok(this.timeout === 0, 'timeout is 0');
              ok(this.withCredentials === false, 'withCredentials is false');
              ok(this.getResponseHeader('content-type') == null, 'responseHeader is null');
              ok(this.getAllResponseHeaders() == '', 'responseHeaders are empty');
            } else if (this.readyState == 2) {
              ok(this.response === '', 'response is empty');
              ok(!this.responseText, 'responseText is empty');
              ok(this.responseType == '', 'responseType is empty');
              ok(this.responseURL === '', 'responseURL is empty');
              ok(this.responseXML === null, 'responseXML is null');
              ok(this.status === 0, 'status is 0');
              ok(this.statusText === '', 'statusText is empty');
              ok(this.timeout === 0, 'timeout is 0');
              ok(this.withCredentials === false, 'withCredentials is false');
            } else if (this.readyState == 4) {
              ok(this.response === 'REPLY', 'response is correct');
              ok(this.responseText === 'REPLY', 'responseText is correct');
              ok(!this.responseType, 'responseType is null');
              ok(this.responseURL === 'http://localhost/testOpen', 'responseURL is null');
              ok(this.responseXML === null, 'responseXML is null');
              ok(this.status === 200, 'status is 200');
              ok(this.statusText === 'OK', 'statusText is OK');
              ok(this.timeout === 0, 'timeout is 0');
              ok(this.withCredentials === false, 'withCredentials is false');
              ok(this.getResponseHeader('content-type') == 'test-mime', 'responseHeader is correct');
              ok(this.getAllResponseHeaders().indexOf('content-type: test-mime') >= 0, 'responseHeader is correct');
              start();
            }
          };
          xhr.addEventListener('readystatechange', xhr.onreadystatechange);
          xhr.addEventListener('loadstart', function(event) {
            ok(this.readyState == 1, 'state is correct');
          });
          xhr.addEventListener('load', function(event) {
            ok(this.readyState == 4, 'state is correct');
          });
          xhr.addEventListener('loadend', function(event) {
            ok(this.readyState == 4, 'state is correct');
          });
          xhr.open('GET', 'http://localhost/testOpen', true);
          xhr.setRequestHeader('test', 'value');
          xhr.overrideMimeType('test-mime');
          xhr.send();
          xhr.removeEventListener('readystatechange', xhr.onreadystatechange);
          xhr.abort();
          
          var xhrErr = new XMLHttpRequest();
          try {
            xhrErr.open('GET', 'http://localhost/testOpenErr', false);
          } catch (err) {
            assert.ok(true, 'Error for sync open');
          }
        });
      });
      
      QUnit.asyncTest('test binary data handling', function (assert) {
        expect(6);
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
              ok(event.type == 'readystatechange', 'readystatechange event');
              if (this.readyState == 4) {
                ok(this.status === 200, 'status is 200');
                ok(this.statusText === 'OK', 'statusText is OK');
                start();
              }
            };
            xhr.open('GET', 'http://testBinaryDataHandling', true);
            xhr.send();
          });
        });
      });
    });
    
    QUnit.asyncTest('test binary data handling without URL support', function (assert) {
      expect(6);
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
            ok(event.type == 'readystatechange', 'readystatechange event');
            if (this.readyState == 4) {
              ok(this.status === 200, 'status is 200');
              ok(this.statusText === 'OK', 'statusText is OK');
              start();
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
