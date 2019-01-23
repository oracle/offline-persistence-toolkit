define(['persist/persistenceUtils', 'formData', 'persist/impl/logger'],
  function(persistenceUtils, formData, logger){
  'use strict';
  logger.option('level',  logger.LEVEL_LOG);
  module('persistenceUtilsTest');
 
  QUnit.test("request to and from JSON", function (assert) {
    var testCases = [{
      request: new Request('http://localhost:9001/requesttofromjson', {
                     method: 'GET',
                     headers: new Headers({'test-accept-encoding': 'gzip'})
                   }),
      jsonObj: {
        url: 'http://localhost:9001/requesttofromjson',
        method: 'GET',
        bodyUsed: false,
        headers: {
          'test-accept-encoding': 'gzip'
        },
        body: {
          text: ""
        }
      }
    }, {
      request: new Request('http://localhost:9001/requesttofromjson', {
                     method: 'PUT',
                     body: 'body for put request.',
                     headers: new Headers({'Content-Type': 'text'})
                   }),
      jsonObj: {
        url: 'http://localhost:9001/requesttofromjson',
        method: 'PUT',
        bodyUsed: false,
        headers: {
          'Content-Type': 'text'
        },
        body: {
          text: 'body for put request.'
        }
      }
    }];

    return new Promise(function (resolve, reject) {
      var executeTests = function (testCases, currentIndex) {
        if (testCases.length === currentIndex) {
          resolve();
        } else {
          var request = testCases[currentIndex].request;
          persistenceUtils.requestToJSON(request).then(function (convertedJson) {
            var same = checkResult(testCases[currentIndex].jsonObj, convertedJson);
            if (same) {
              assert.ok(true);
              return persistenceUtils.requestFromJSON(convertedJson);
            } else {
              assert.ok(false);
              return Promise.reject();
            }
          }).then(function (convertedRequest) {
            assert.ok(convertedRequest);
            executeTests(testCases, currentIndex + 1);
          }).catch(function (err) {
            reject(err);
          });
        }
      };
      executeTests(testCases, 0);
    });
  });

  QUnit.test("request to and from JSON with FormData", function (assert) {
    var testCases = [{
      request: {
        url: 'http://localhost:9001/requesttofromjsonwithformdata',
        method: 'POST',
        formFields: {
          firstName: 'Bob',
          lastName: 'Smith'
        }
      },
      jsonObj: {
        method: 'POST',
        url: 'http://localhost:9001/requesttofromjsonwithformdata',
        body: {
          formData: {
            firstName: 'Bob',
            lastName: 'Smith'
          }
        }
      }
    }];
    return new Promise(function (resolve, reject) {
      var executeTests = function (testCases, currentIndex) {
        if (testCases.length === currentIndex) {
          resolve();
        } else {
          var request = constructRequestWithFormData(testCases[currentIndex].request);
          persistenceUtils.requestToJSON(request).then(function (convertedJson) {
            assert.ok(convertedJson);
            resolve();
          }).catch(function (error) {
            assert.ok(false);
            reject(error);
          });
        }
      };
      executeTests(testCases, 0);
    });
  });

  QUnit.test("response to and from JSON", function (assert) {
    var testCases = [{
      response: new Response('reponse body', {
                  headers: new Headers({
                             'content-encoding': 'text'
                           }),
                  status: 200
                }),
      jsonObj: {
        url: '',
        status: 200,
        headers: {
          'content-encoding': 'text'
        },
        bodyUsed: false,
        body: {
          text: 'reponse body'
        }
      }
    }];
             
    return new Promise(function (resolve, reject) {
      var executeTest = function (testCases, currentIndex) {
        if (testCases.length === currentIndex) {
          resolve();
        } else {
          var response = testCases[currentIndex].response;
          persistenceUtils.responseToJSON(response).then(function (convertedJSON) {
            var same = checkResult(testCases[currentIndex].jsonObj, convertedJSON);
            if (same) {
              assert.ok(true);
              return persistenceUtils.responseFromJSON(convertedJSON);
            } else {
              assert.ok(false);
              return Promise.reject();
            }
          }).then(function (convertedResponse) {
            assert.ok(convertedResponse);
            executeTest(testCases, currentIndex + 1);
          }).catch(function (err) {
            reject(err);
          });
        }
      };
      executeTest(testCases, 0);
    });
  });

  QUnit.test("setResponsePayload test", function (assert) {
    var testCases = [{
      response: new Response('reponse body', {
                  headers: new Headers({
                             'content-encoding': 'text'
                           }),
                  status: 200
                }),
      payload: 'new payload.',
      jsonObj: {
        url: '',
        status: 200,
        headers: {
          'content-encoding': 'text'
        },
        bodyUsed: false,
        body: {
          text: 'new payload.'
        }
      }
    }, {
      response: new Response(loadArrayBuffer(16), {
                  status: 200
                }),
      payload: loadArrayBuffer(8),
      jsonObj: {
        url: '',
        status: 200,
        bodyUsed: false
      }
    }, {
      response: new Response(loadArrayBuffer(16), {
                  status: 200
                }),
      payload: 'new payload.',
      jsonObj: {
        url: '',
        status: 200,
        bodyUsed: false,
        body: {
          text: 'new payload.'
        }
      }
    }];

    return new Promise(function (resolve, reject) {
      var executeTests = function (testCases, currentIndex) {
        if (testCases.length === currentIndex) {
          resolve();
        } else {
          var response = testCases[currentIndex].response;
          var payload = testCases[currentIndex].payload;
          persistenceUtils.setResponsePayload(response, payload).then(function (newResponse) {
            assert.ok(newResponse);
            return persistenceUtils.responseToJSON(newResponse);
          }).then(function (convertedJSON) {
            assert.ok(true);
            var same = checkResult(testCases[currentIndex].jsonObj, convertedJSON);
            if (same) {
              assert.ok(true);
              executeTests(testCases, currentIndex + 1);
            } else {
              assert.ok(false);
              return Promise.reject();
            }
          }).catch(function (err) {
            assert.ok(false);
            reject(err);
          });
        }
      };
      
      executeTests(testCases, 0);
    });
  });

  QUnit.test("multipart form test", function (assert) {
    return new Promise(function (resolve, reject) {
      try {
        persistenceUtils.parseMultipartFormData('', 'garbage');
        assert.ok(false);
      } catch (e) {
        assert.ok(true);
      }
      var multipartDataToTest= generateMultipartFormAsText({firstName: 'Bob', lastName: 'Smith'});
      var parsedResult = persistenceUtils.parseMultipartFormData(multipartDataToTest.content, multipartDataToTest.contentType);
      assert.ok(parsedResult.length === 2);
      assert.ok(parsedResult[0].data === 'Bob');
      assert.ok(parsedResult[0].headers.name === 'firstName');
      assert.ok(parsedResult[1].data === 'Smith');
      assert.ok(parsedResult[1].headers.name === 'lastName');
      assert.ok(true);
      resolve();
    });
  });
  
  QUnit.test("multipart form blob test", function (assert) {
    return new Promise(function (resolve, reject) {
      generateMultipartFormWithBlob({firstName: 'Bob', lastName: 'Smith'}).then(function(multipartDataToTest) {
        var parsedResult = persistenceUtils.parseMultipartFormData(multipartDataToTest.content, multipartDataToTest.contentType);
        assert.ok(parsedResult.length === 3);
        assert.ok(parsedResult[0].data === 'Bob');
        assert.ok(parsedResult[0].headers.name === 'firstName');
        assert.ok(parsedResult[1].data === 'Smith');
        assert.ok(parsedResult[1].headers.name === 'lastName');
        var request = new XMLHttpRequest();
        request.open('GET', 'oracle.png', true);
        request.responseType = 'blob';
        request.overrideMimeType('image/png');
        request.addEventListener('load', function () {
          var imageReader = new FileReader();
          imageReader.addEventListener("loadend", function() {
            var base64encImg = imageReader.result;
            var partReader = new FileReader();
            partReader.addEventListener("loadend", function() {
              assert.ok(base64encImg == partReader.result, 'parsed correctly');
              resolve();
            });
            partReader.readAsDataURL(parsedResult[2].data);
          });
          imageReader.readAsDataURL(request.response);
        });
        request.send();
      });
    });
  });
  
  QUnit.test("request to JSON with multipart data, no FormData support", function (assert) {
    return new Promise(function (resolve, reject) {
      generateMultipartFormWithBlob({firstName: 'Bob', lastName: 'Smith'}).then(function(multipartDataToTest) {
        var request = new Request('http://test', {method: 'POST',
                                                  headers: {'Content-Type': multipartDataToTest.contentType},
                                                  body: multipartDataToTest.content});
        // remove formData support
        request.formData = null;
        persistenceUtils.requestToJSON(request, {_noClone: true}).then(function(requestJson) {
          assert.ok(true);
          resolve();
        });
      });
    })
  });

  var constructRequestWithFormData = function (requestProp) {
    var init = {
      method: requestProp.method,
      body: constructFormData(requestProp.formFields),
      headers: constructHeadersForFormData()
    };

    return new Request(requestProp.url, init);
  };

  var constructFormData = function (contentPairs) {
    var formData = new FormData();
    var keys = Object.keys(contentPairs);
    for (var index = 0; index < keys.length; index++) {
      var key = keys[index];
      formData.append(key, contentPairs[key]);
    }
    return formData;
  };
  
  var constructHeadersForFormData = function () {
    if (navigator.userAgent.match(/PhantomJS/)) {
      return new Headers({'Content-Type': 'multipart/form-data'});
    } else {
      return new Headers();
    }
  };

  // helper function to check that all the property name/value pairs from
  // expected object are in the actual object.
  var checkResult = function (expected, actual) {
    return Object.keys(expected).every(checkResultCallback(expected, actual));
  };
  
  var checkResultCallback = function (obj1, obj2) {
    return function (element) {
      var value1 = obj1[element];
      var value2 = obj1[element];
      if (!value1 && !value2) {
        return true;
      } else if (value1 && value2) {
        var type1 = typeof value1;
        var type2 = typeof value2;
        if (type1 !== type2) {
          return false;
        } else if (type1 === 'object') {
          return checkResult(value1, value2);
        } else {
          return value1 === value2;
        }
      } else {
        return false;
      }
    };
  };
  
  var loadArrayBuffer = function (size) {
    var arrayBuffer = new ArrayBuffer(size);
    var int32View = new Int32Array(arrayBuffer);
    for (var index = 0; index < int32View.length; index++) {
      int32View[index] = index * 2;
    }
    return arrayBuffer;
  };

  var generateMultipartFormAsText = function (params) {
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
    parts.push(boundary + '\r\n');
    return {
      contentType: contentType,
      content: parts.join('')
    };
  };
  
  var generateMultipartFormWithBlob = function (params) {
    return new Promise(function(resolve, reject) {
      var request = new XMLHttpRequest();
      request.open('GET', 'oracle.png', true);
      request.responseType = 'blob';
      request.overrideMimeType('image/png');
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

