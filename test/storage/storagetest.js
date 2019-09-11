define(['persist/persistenceStoreManager', 'persist/localPersistenceStoreFactory',
        'persist/pouchDBPersistenceStoreFactory', 'persist/arrayPersistenceStoreFactory',
        'persist/configurablePouchDBStoreFactory',
        'testPersistenceStoreFactory', 'persist/persistenceManager', 'persist/impl/logger'],
  function(persistenceStoreManager, localPersistenceStoreFactory,
           pouchDBPersistenceStoreFactory, arrayPersistenceStoreFactory, 
           ConfigurablePouchDBStoreFactory,
           testPersistenceStoreFactory, persistenceManager, 
           logger){
  'use strict';
  logger.option('level',  logger.LEVEL_LOG);

  QUnit.module('storagetest');

  // helper function that compares expected result set with the actxual result
  // set. Return true if they match, false otherwise. The expected/actual
  // result set are both arrays. They should contain the same number of
  // element, and each element should match. The order of the element in the
  // array does not matters.
  var matchResultSetIgnoreOrder = function (expected, actual) {
    if (!expected && !actual) {
      return true;
    } else if (expected && actual && expected.length === actual.length) {
      var matched = {};
      for (var index = 0; index < actual.length; index++) {
        var checkedForCurrentValue = Object.assign({}, matched);
        var actualElement = actual[index];
        var indexToCheck = getNextAvailableExpectedIndex(expected.length, checkedForCurrentValue, index);
        while (indexToCheck >= 0) {
          var match = matchObject(expected[indexToCheck], actualElement);
          if (match) {
            matched[indexToCheck] = true;
            break;
          } else {
            checkedForCurrentValue[indexToCheck] = true;
            indexToCheck = getNextAvailableExpectedIndex(expected.length, checkedForCurrentValue, -1);
          }
        }
        if (indexToCheck < 0) {
          return false;
        }
      }
      return true;
    } else {
      return false;
    }
  };

  // helper function that compares expected result set with the actual result
  // set. Return true if they match, false otherwise. The order of the array
  // matters.
  var matchResultSet = function (expected, actual) {
    if (!expected && !actual) {
      return true;
    } else if (expected && actual && expected.length === actual.length) {
      for (var index = 0; index < actual.length; index++) {
        if (!matchObject(expected[index], actual[index])) {
          return false;
        }
      }
      return true;
    } else {
      return false;
    }
  };

  // helper function to get the index of the next available expected value to
  // check against from the expected value array.
  var getNextAvailableExpectedIndex = function (arrayLength, checked, mostLikelyIndex) {
    if (mostLikelyIndex >= 0 && !checked[mostLikelyIndex]) {
      return mostLikelyIndex;
    } else {
      for (var index = 0; index < arrayLength; index++) {
        if (!checked[index]) {
          return index;
        }
      }
      return -1;
    }
  };

  // helper function that compare expected object with actual object, return
  // true if they match, false otherwise. Both expected and actual object are
  // simple nested key-value pairs without arrays in the mix.
  var matchObject = function (expected, actual) {
    if (!expected && !actual) {
      return true;
    } else if (expected && actual) {
      if (typeof(expected) === 'object' && typeof(actual) === 'object') {
        var keys = [];
        for (var key in expected) {
          if (expected.hasOwnProperty(key)) {
            keys.push(key);
            var expectedValue = expected[key];
            var actualValue = actual[key];
            if (!matchObject(expectedValue, actualValue)) {
              return false;
            }
          }
        }
        for (var actualKey in actual) {
          if (actual.hasOwnProperty(actualKey)) {
            if (keys.indexOf(actualKey) < 0) {
              return false;
            }
          }
        }
        return true;
      } else {
        return (expected == actual);
      }
    } else {
      return false;
    }
  };

  QUnit.cases([{name:'local',factory:localPersistenceStoreFactory},
               {name:'pouchDB',factory:pouchDBPersistenceStoreFactory},
               {name:'array',factory:arrayPersistenceStoreFactory}])
    .test('basic storage test ', function (testParam, assert) {
    console.log('testing ' + testParam.name);
    var testStoreName = 'http://' + testParam.name;
    var testStore;
    persistenceStoreManager.registerStoreFactory(testStoreName, testParam.factory);
    return new Promise(function (resolve, reject) {
      persistenceStoreManager.deleteStore(testStoreName).then(function () {
        assert.ok(true, 'cleanning up store' + testStoreName);
        return persistenceStoreManager.openStore(testStoreName);
      }).then(function (store) {
        assert.ok(true, 'store is opened.');
        testStore = store;
        return testStore.delete();
      }).then(function () {
        assert.ok(true, 'store is cleaned.');
        var metadata = {
          created: "112231",
          versionIdentifier: "seui1"
        };
        var value = {
          name: "testname",
          phone: '6506789876',
          amount: 123
        };
        return testStore.upsert('testBasicStorageKey1', metadata, value);
      }).then(function(){
        assert.ok(true, 'first row is inserted.');
        return testStore.findByKey('testBasicStorageKey1');
      }).then(function(valueFound){
        assert.ok(valueFound.name === 'testname', 'found first row.');
        // find using incorrect key
        return testStore.findByKey('testBasicStorageKey1A');
      }).then(function(valueFound){
        assert.ok(valueFound == undefined, 'incorrect key not found.');
        return testStore.findByKey('testBasicStorageKey1');
      }).then(function(valueFound){
        assert.ok(valueFound.name === 'testname', 'found first row.');
        var metadata1 = {
          created: '14353535',
          versionIdentifier: 'v2'
        };
        var value1 = {
          name: 'name2',
          phone: '6789018764',
          amount: 34,
          passed: true
        };
        return testStore.upsert('testBasicStorageKey2', metadata1, value1);
      }).then(function () {
        assert.ok(true, 'second row is inserted.');
        var metadata2 = {
          created: '3535938443',
          versionIdentifier: 'f-feax'
        };
        var value2 = {
          name: 'foo',
          phone: '8907863451',
          amount: 40,
          passed: true
        };
        return testStore.upsert('testBasicStorageKey3', metadata2, value2);
      }).then(function () {
        assert.ok(true, 'third row is inserted.');
        return testStore.keys();
      }).then(function (keysArray) {
        assert.ok(matchResultSetIgnoreOrder(keysArray, ['testBasicStorageKey1', 'testBasicStorageKey2', 'testBasicStorageKey3']), 'all rows are found.');
        return testStore.updateKey('testBasicStorageKey1', 'testBasicStorageKey1A');
      }).then(function() {
        return testStore.keys();
      }).then(function (keysArray) {
        assert.ok(matchResultSetIgnoreOrder(keysArray, ['testBasicStorageKey1A', 'testBasicStorageKey2', 'testBasicStorageKey3']), 'all rows are found.');
        return testStore.findByKey('testBasicStorageKey1A');
      }).then(function(valueFound){
        assert.ok(valueFound.name === 'testname', 'found first row.');
        return testStore.updateKey('testBasicStorageKey1A', 'testBasicStorageKey1');
      }).then(function() {
        return testStore.removeByKey('testBasicStorageKey1');
      }).then(function () {
        assert.ok(true, 'first row is deleted.');
        return testStore.findByKey('testBasicStorageKey1');
      }).then(function(valueFound1){
        assert.ok(!valueFound1, 'first row is no longer found.');
        return testStore.removeByKey('testBasicStorageKey1A');
      }).then(function (removed) {
        assert.ok(!removed, 'Invalid key. Not removed');
        return testStore.delete({
          selector: {'value.passed' : true}
        });
      }).then(function () {
        assert.ok(true, '2nd and 3rd rows are deleted.');
        return testStore.findByKey('testBasicStorageKey2');
      }).then(function (valueFound2) {
        assert.ok(!valueFound2, 'second row is no longer found.');
        return testStore.findByKey('testBasicStorageKey3');
      }).then(function (valueFound3) {
        assert.ok(!valueFound3, 'third row is no longer found.');
        resolve();
      }).catch(function (error) {
        assert.ok(false);
        reject(error);
      });
    });
  });

  QUnit.test('store manager test', function (assert) {
    return new Promise(function (resolve, reject) {
      try {
        persistenceStoreManager.registerStoreFactory('randomstore', null);
        assert.ok(false);
      } catch (e) {
        assert.ok(true);
      }
      try {
        persistenceStoreManager.registerStoreFactory(null, localPersistenceStoreFactory);
        assert.ok(false);
      } catch (e) {
        assert.ok(true);
      }
      persistenceStoreManager.registerStoreFactory('randomstore', localPersistenceStoreFactory);
      try {
        persistenceStoreManager.registerStoreFactory('randomstore', pouchDBPersistenceStoreFactory);
        assert.ok(false);
      } catch (e) {
        assert.ok(true);
      }
      persistenceStoreManager.registerStoreFactory('randomstore', localPersistenceStoreFactory);
      assert.ok(true);
      resolve();
    });
  });

  QUnit.cases([{name:'local',factory:localPersistenceStoreFactory},
               {name:'pouchDB',factory:pouchDBPersistenceStoreFactory}])
  .test('test find', function (testParam, assert) {
    var currentDateTime = (new Date()).toUTCString();
    var dataset = [{
      key: 'testFindKey1',
      metadata: {
        created: currentDateTime,
        versionIdentifier: 'v1'
      },
      value: {
        firstName: 'first1',
        lastName: 'last1',
        numberValue: 10,
        booleanValue: true,
        objectValue: {
          objectKey: 'innerkey1',
          objectValue: 'innervalue1'
        }
      }
    },{
      key: 'testFindKey2',
      metadata: {
        created: currentDateTime,
        versionIdentifier: 'v1'
      },
      value: {
        firstName: 'first2',
        lastName: 'last2',
        numberValue: 20,
        booleanValue: true,
        objectValue: {
          objectKey: 'innerkey2',
          objectValue: 'innervalue2'
        }
      }
    },{
      key: 'testFindKey3',
      metadata: {
        created: currentDateTime,
        versionIdentifier: 'v1'
      },
      value: {
        firstName: 'first3',
        lastName: 'last3',
        numberValue: 30,
        booleanValue: false,
        objectValue: {
          objectKey: 'innerkey3',
          objectValue: 'innervalue3'
        },
        optionalValue: 'random'
      }
    }];

    var testCases = [{
      name: 'noSelector',
      findExpression:{
        fields: ['key']
      },
      expectedResult: [{
        key: 'testFindKey1'
      },{
        key: 'testFindKey2'
      }, {
        key: 'testFindKey3'
      }]
    },
    {
      name: 'simpleImpliciteEqual',
      findExpression: {
        selector: {'value.firstName': 'first2'},
        fields: ['value.firstName']
      },
      expectedResult: [{
        value: {
          firstName: 'first2'
        }
      }]
    },
    {
      name: 'simpleImplicitEqualKey',
      findExpression: {
        selector: {'numberValue': 100},
        fields: ['value.firstName']
      },
      expectedResult: []
    },
    {
      name: 'simpleExpliciteEqual',
      findExpression: {
        selector: {'value.firstName': {$eq: 'first2'}},
        fields: ['value.firstName']
      },
      expectedResult: [{
        value: {
          firstName: 'first2'
        }
      }]
    }, {
      name: 'numberGT',
      findExpression: {
        selector: {'value.numberValue': {$gt: 15}},
        fields: ['key']
      },
      expectedResult: [{
        key: 'testFindKey2'
      }, {
        key: 'testFindKey3'
      }]
    }, {
      name: 'existsMatch',
      findExpression: {
        selector: {'value.optionalValue': {$exists: true}},
        fields: ['key']
      },
      expectedResult: [{
        key: 'testFindKey3'
      }]
    }, {
      name: 'impliciteAndMatch',
      findExpression: {
        selector: {
          'value.booleanValue': true,
          'value.numberValue': {$lt: 20}
        },
        fields: ['key']},
      expectedResult: [{
        key: 'testFindKey1'
      }]
    }, {
      name: 'expliciteAndMatch',
      findExpression: {
        selector: {
          $and: [
            {'value.firstName': 'first2'},
            {'value.numberValue': {$ne: 30}}
          ]
        },
        fields: ['key']
      },
      expectedResult: [{
        key: 'testFindKey2'
      }]
    }, {
      name: 'orMatch',
      findExpression: {
        selector: {
          $or: [
            {'value.numberValue': {$gte: 30}},
            {'value.booleanValue': {$eq: true}}
          ]
        },
        fields: ['key']
      },
      expectedResult: [{
        key: 'testFindKey1'
      },{
        key: 'testFindKey2'
      },{
        key: 'testFindKey3'
      }]
    }, {
      name: 'andOrMatch',
      findExpression: {
        selector: {
          $and: [{
            $or: [{
              'value.numberValue': {$lte: 20}
            }, {
              'metadata.versionIdentifier': 'v1'
            }]
          }, {
            'value.optionalValue': {$exists: false}
          }]
        },
        fields: ['key']
      },
      expectedResult: [{
        key: 'testFindKey1'
      },{
        key: 'testFindKey2'
      }]
    }];

    var testStoreName = 'testFindStore' + testParam.name;
    var testStore;
    persistenceStoreManager.registerStoreFactory(testStoreName, testParam.factory);

    console.log('test find on ' + testParam.name);

    return new Promise(function (resolve, reject) {
      persistenceStoreManager.deleteStore(testStoreName).then(function () {
        assert.ok(true);
        return persistenceStoreManager.openStore(testStoreName);
      }).then(function (store) {
        assert.ok(store);
        testStore = store;
        return store.delete();
      }).then(function(){
        assert.ok(true);
        return testStore.upsertAll(dataset);
      }).then(function(){
        return persistenceStoreManager.getStoresMetadata();
      }).then(function(storesMetadata) {
        assert.ok(storesMetadata != null && Object.keys(storesMetadata).length > 0);
        Object.keys(storesMetadata).forEach(function(storeName) {
          assert.ok(storesMetadata[storeName].name != null);
          assert.ok(storesMetadata[storeName].persistenceStoreFactory != null);
          assert.ok(storesMetadata[storeName].versions instanceof Array);
        });
        assert.ok(true);
        var executeTestCaseArray = function (testCases) {
          if (testCases.length === 0) {
            resolve();
          } else {
            var testCaseName = testCases[0].name;
            console.log('testcase: ' + testCaseName);
            var findExpression = testCases[0].findExpression;
            var expectedResult = testCases[0].expectedResult;
            testStore.find(findExpression).then(function(dataFound){
              if (matchResultSetIgnoreOrder(expectedResult, dataFound)) {
                assert.ok(true);
                testCases.shift();
                executeTestCaseArray(testCases);
              } else {
                assert.ok(false);
                return Promise.reject();
              }
            });
          }
        };
        executeTestCaseArray(testCases);
      }).catch(function (err) {
        assert.ok(false);
        reject(err);
      });
    });
  });

  QUnit.test('test sort', function (assert) {
    var dataset = [{
      key: 'testSortKey1',
      metadata: {
        created: (new Date(2016, 1, 1)).getTime(),
        versionIdentifier: 'v1'
      },
      value: {
        stringValue: 'alpha',
        numberValue: 100,
        objectValue: {
          innerNumber: 20,
          innerString: 'zebra'
        }
      }
    },{
      key: 'testSortKey2',
      metadata: {
        created: (new Date(2017, 1, 1)).getTime(),
        versionIdentifier: 'v2'
      },
      value: {
        stringValue: 'beta',
        numberValue: 50,
        objectValue: {
          innerNumber: 20,
          innerString: 'dinasour'
        }
      }
    },{
      key: 'testSortKey3',
      metadata: {
        created: (new Date(2015, 1, 1)).getTime(),
        versionIdentifier: 'v1'
      },
      value: {
        stringValue: 'gamma',
        numberValue: 90,
        objectValue: {
          innerNumber: 10,
          innerString: 'cheeta'
        }
      }
    }];

    var testCases = [{
      name: 'sortStringImpliciteAsc',
      findExpression: {
        sort: ['value.stringValue'],
        fields: ['key']
      },
      expectedResult: [{
        key: 'testSortKey1'
      }, {
        key: 'testSortKey2'
      }, {
        key: 'testSortKey3'
      }]
    }, {
      name: 'sortStringExpliciteAsc',
      findExpression: {
        sort: [{'value.stringValue': 'asc'}],
        fields: ['key']
      },
      expectedResult: [{
        key: 'testSortKey1'
      }, {
        key: 'testSortKey2'
      }, {
        key: 'testSortKey3'
      }]
    }, {
      name: 'sortStringDesc',
      findExpression: {
        sort: [{'value.stringValue': 'desc'}],
        fields: ['key']
      },
      expectedResult: [{
        key: 'testSortKey3'
      }, {
        key: 'testSortKey2'
      }, {
        key: 'testSortKey1'
      }]
    }, {
      name: 'sortNumberAsc',
      findExpression: {
        sort: ['value.numberValue'],
        fields: ['key']
      },
      expectedResult: [{
        key: 'testSortKey2'
      }, {
        key: 'testSortKey3'
      }, {
        key: 'testSortKey1'
      }]
    }, {
      name: 'sortNumberDesc',
      findExpression: {
        sort: [{'value.numberValue': 'desc'}],
        fields: ['key']
      },
      expectedResult: [{
        key: 'testSortKey1'
      }, {
        key: 'testSortKey3'
      }, {
        key: 'testSortKey2'
      }]
    }, {
      name: 'sortDateAsc',
      findExpression: {
        sort: ['metadata.created'],
        fields: ['key']
      },
      expectedResult: [{
        key: 'testSortKey3'
      }, {
        key: 'testSortKey1'
      }, {
        key: 'testSortKey2'
      }]
    }, {
      name: 'sortDateDesc',
      findExpression: {
        sort: [{'metadata.created': 'desc'}],
        fields: ['key']
      },
      expectedResult: [{
        key: 'testSortKey2'
      }, {
        key: 'testSortKey1'
      }, {
        key: 'testSortKey3'
      }]
    }, {
      name: 'sortMultiFields',
      findExpression: {
        sort: ['value.objectValue.innerNumber', {'value.objectValue.innerString': 'asc'}],
        fields: ['key']
      },
      expectedResult: [{
        key: 'testSortKey3'
      }, {
        key: 'testSortKey2'
      }, {
        key: 'testSortKey1'
      }]
    }];

    var testStoreName = 'testSortStore';
    var testStore;
    persistenceStoreManager.registerStoreFactory(testStoreName, localPersistenceStoreFactory);

    return new Promise(function (resolve, reject) {
      persistenceStoreManager.openStore(testStoreName).then(function (store) {
        assert.ok(store);
        testStore = store;
        return testStore.upsertAll(dataset);
      }).then(function(){
        var executeTestCaseArray = function (testCases) {
          if (testCases.length === 0) {
            testStore.delete().then(function () {
              resolve();
            });
          } else {
            var testCaseName = testCases[0].name;
            console.log('testcase: ' + testCaseName);
            var findExpression = testCases[0].findExpression;
            var expectedResult = testCases[0].expectedResult;
            testStore.find(findExpression).then(function(dataFound){
              if (matchResultSet(expectedResult, dataFound)) {
                assert.ok(true);
                testCases.shift();
                executeTestCaseArray(testCases);
              } else {
                assert.ok(false);
                return Promise.reject();
              }
            });
          }
        };
        executeTestCaseArray(testCases);
      }).catch(function (err) {
        assert.ok(false);
        reject(err);
      });
    });
  });

  QUnit.cases([{name:'local',factory:localPersistenceStoreFactory},
               {name:'pouchDB',factory:pouchDBPersistenceStoreFactory}])
  .test('test row version detection', function (testParam, assert) {

    var testCases = [{
      name: 'initialInsert',
      valueToInsert: {
        key: 'testVerDetKey1',
        metadata: {
          versionIdentifier: 'v1'
        },
        value: {
          myValue: 'value1'
        }
      },
      findByKey: 'testVerDetKey1',
      expectedResult: 'value1'
    }, {
      name: 'updateWithExpectedVersionValue',
      valueToInsert: {
        key: 'testVerDetKey1',
        metadata: {
          versionIdentifier: 'v2'
        },
        value: {
          myValue: 'value2'
        },
        expectedVersionIdentifier: 'v1'
      },
      findByKey: 'testVerDetKey1',
      expectedResult: 'value2'
    }, {
      name: 'updateWithConflictVersionValue',
      valueToInsert: {
        key: 'testVerDetKey1',
        metadata: {
          versionIdentifier: 'v3'
        },
        value: {
          myValue: 'value3'
        },
        expectedVersionIdentifier: 'v1'
      },
      expectingConflict: true,
      findByKey: 'testVerDetKey1',
      expectedResult: 'value2'
    }, {
      name: 'updateWithoutExpectedVersionValue',
      valueToInsert: {
        key: 'testVerDetKey1',
        metadata: {
          versionIdentifier: 'v4'
        },
        value: {
          myValue: 'value4'
        },
      },
      expectingConflict: false,
      findByKey: 'testVerDetKey1',
      expectedResult: 'value4'
    }, {
      name: 'updateWithoutVersionIdentifier',
      valueToInsert: {
        key: 'testVerDetKey1',
        metadata: {
          created: (new Date()).toUTCString()
        },
        value: {
          myValue: 'value5'
        },
        expectedVersionIdentifier: 'v4'
      },
      expectingConflict: false,
      findByKey: 'testVerDetKey1',
      expectedResult: 'value5'
    }, {
      name: 'updateValueWithoutVerIdenWithExpectedVersionIdentifier',
      valueToInsert: {
        key: 'testVerDetKey1',
        metadata: {
          created: (new Date()).toUTCString()
        },
        value: {
          myValue: 'value6'
        },
        expectedVersionIdentifier: 'random'
      },
      expectingConflict: true,
      findByKey: 'testVerDetKey1',
      expectedResult: 'value5'
    }];

    var testStoreName = 'testRowVersionDetectionStore' + testParam.name;
    var testStore;
    persistenceStoreManager.registerStoreFactory(testStoreName, testParam.factory);
    console.log('test row version dection on ' + testParam.name);

    return new Promise(function (resolve, reject) {
      persistenceStoreManager.deleteStore(testStoreName).then(function () {
        assert.ok(true);
        return persistenceStoreManager.openStore(testStoreName);
      }).then(function (store) {
        assert.ok(true);
        testStore = store;
        return testStore.delete();
      }).then(function () {
        assert.ok(true);
        var executeTestCaseArray = function (testCases, index) {
          if (index === testCases.length) {
            testStore = null;
            resolve();
          } else {
            var testCaseName = testCases[index].name;
            console.log('testcase: ' + testCaseName);
            var valueToInsert = testCases[index].valueToInsert;
            testStore.upsert(valueToInsert.key, valueToInsert.metadata,
                             valueToInsert.value,
                             valueToInsert.expectedVersionIdentifier).then(function () {
              if(!testCases[index].expectingConflict) {
                assert.ok(true);
                return Promise.resolve();
              } else {
                assert.ok(false);
                return Promise.reject();
              }
            }).catch(function (upsertErr) {
              if (testCases[index].expectingConflict && upsertErr &&
                  upsertErr.status === 409) {
                assert.ok(true);
                return Promise.resolve();
              } else {
                assert.ok(false);
                return Promise.reject(upsertErr);
              }
            }).then(function () {
              return testStore.findByKey(testCases[index].findByKey);
            }).then(function (valueFound) {
              if (valueFound && valueFound.myValue === testCases[index].expectedResult) {
                assert.ok(true);
                index++;
                executeTestCaseArray(testCases, index);
              } else {
                assert.ok(false);
                return Promise.reject();
              }
            }).catch(function (err) {
              assert.ok(false);
              return Promise.reject(err);
            });
          }
        };
        executeTestCaseArray(testCases, 0);
      }).catch(function (err) {
        assert.ok(false);
        reject(err);
      });
    });
  });

  QUnit.cases([{name:'local',factory:localPersistenceStoreFactory},
               {name:'pouchDB',factory:pouchDBPersistenceStoreFactory}])
  .test('test store version detection', function (testParam, assert) {
    var testStoreName = 'testStoreVersionDetectionStore' + testParam.name;
    var options1 = {version: '1.0'}; // specically asks for version 1.0
    var options2 = {version: '2.0'}; // specically asks for version 2.0
    var options3 = {index: ['name']}; // non-null options but no version specified.
    var testStoreDV;
    var testStoreV1;
    var testStoreV2;
    persistenceStoreManager.registerStoreFactory(testStoreName, testParam.factory);
    console.log('test store version dection on ' + testParam.name);

    return new Promise(function (resolve, reject) {
      persistenceStoreManager.deleteStore(testStoreName).then(function () {
        assert.ok(true, 'removed all versions of the store');
        return persistenceStoreManager.openStore(testStoreName);
      }).then(function (store) {
        assert.ok(true, 'opened default version.');
        assert.ok(store.getName() === testStoreName);
        assert.ok(store.getVersion() === '0');
        testStoreDV = store;
        return testStoreDV.delete();
      }).then(function () {
        assert.ok(true, 'default version store cleaned.');
        return persistenceStoreManager.openStore(testStoreName, options1);
      }).then(function (store1) {
        assert.ok(true, 'opened store v1');
        assert.ok(store1.getName() === testStoreName);
        assert.ok(store1.getVersion() === '1.0');
        testStoreV1 = store1;
        return testStoreV1.delete();
      }).then(function () {
        assert.ok(true, 'store v1 is cleaned.');
        return persistenceStoreManager.openStore(testStoreName, options2);
      }).then(function (store2) {
        assert.ok(true, 'store v2 is opened.');
        assert.ok(store2.getName() === testStoreName);
        assert.ok(store2.getVersion() === '2.0');
        testStoreV2 = store2;
        return testStoreV2.delete();
      }).then(function () {
        assert.ok(true, 'store v2 is cleaned.');
        return persistenceStoreManager.openStore(testStoreName, options3);
      }).then(function (store3) {
        assert.ok(store3);
        return testStoreDV.upsert(testStoreName + 'key',
                                  {created: 908935353},
                                  {name: 'name-dv'});
      }).then(function () {
        assert.ok(true, 'row is inserted to dv store.');
        return testStoreV1.upsert(testStoreName + 'key',
                                  {created: 908935353},
                                  {name: 'name-v1'});
      }).then(function () {
        assert.ok(true, 'row is inserted to v1 store');
        return testStoreV2.upsert(testStoreName + 'key',
                                  {created: 908935353},
                                  {name: 'name-v2'});
      }).then(function () {
        assert.ok(true, 'row is inserted to v2 store');
        return persistenceStoreManager.openStore(testStoreName);
      }).then(function (store3) {
        assert.ok(store3, 'get another handle to the default store');
        return store3.findByKey(testStoreName + 'key');
      }).then(function (valueFound) {
        assert.ok(valueFound && valueFound.name === 'name-dv');
        return testStoreV1.findByKey(testStoreName + 'key');
      }).then(function (valueFound) {
        assert.ok(valueFound && valueFound.name === 'name-v1');
        return testStoreV2.findByKey(testStoreName + 'key');
      }).then(function (valueFound) {
        assert.ok(valueFound && valueFound.name === 'name-v2');
        return persistenceStoreManager.deleteStore(testStoreName, {version: '2.0'});
      }).then(function (deleted) {
        assert.ok(deleted);
        assert.ok(!persistenceStoreManager.hasStore(testStoreName, {version: '2.0'}));
        assert.ok(persistenceStoreManager.hasStore(testStoreName, {version: '1.0'}));
        assert.ok(persistenceStoreManager.hasStore(testStoreName));
        return persistenceStoreManager.deleteStore(testStoreName);
      }).then(function (deleted2) {
        assert.ok(deleted2);
        assert.ok(!persistenceStoreManager.hasStore(testStoreName, {version: '1.0'}));
        assert.ok(!persistenceStoreManager.hasStore(testStoreName));
        resolve();
      }).catch(function (err) {
        assert.ok(false);
        reject(err);
      });
    });
  });

  QUnit.cases([{name:'local',factory:localPersistenceStoreFactory},
               {name:'pouchDB',factory:pouchDBPersistenceStoreFactory}])
  .test('test store index', function (testParam, assert) {
    var testStoreName = 'testStoreIndexStore' + testParam.name;
    var options1 = {index: ['firstName', 'lastName']};
    var options2 = {index: ['fullName']};
    persistenceStoreManager.registerStoreFactory(testStoreName, testParam.factory);
    console.log('test store index on ' + testParam.name);

    return new Promise(function (resolve, reject) {
      persistenceStoreManager.deleteStore(testStoreName).then(function () {
        return persistenceStoreManager.openStore(testStoreName, options1);
      }).then(function (store) {
        assert.ok(store);
        return persistenceStoreManager.openStore(testStoreName, options2);
      }).then(function (store2) {
        resolve(store2);
      }).catch(function (err) {
        assert.ok(false);
        reject(err);
      });
    });
  });

  QUnit.test('test binary data handling', function (assert) {
    var done = assert.async();
    var testStoreName = 'testBinaryStore';
    var testStore;
    persistenceStoreManager.registerStoreFactory(testStoreName, pouchDBPersistenceStoreFactory);
    persistenceStoreManager.registerDefaultStoreFactory(pouchDBPersistenceStoreFactory);
    persistenceManager.init().then(function () {
    var blobFromString = new Blob([JSON.stringify('some random string', null, 2)],
                                  {type : 'application/json'});
    var blobFromArray = null;
    var blobFromStringSize = blobFromString.size;
    var blobFromArraySize;

    var request = new XMLHttpRequest();
    request.open('GET', 'oracle.png', true);
    request.responseType = 'blob';
    request.addEventListener('load', function () {
      console.log('image file loaded.');
      blobFromArray = request.response;
      blobFromArraySize = blobFromArray.size;
    });
    request.send();

    return new Promise(function (resolve, reject) {
      persistenceStoreManager.deleteStore(testStoreName).then(function () {
        assert.ok(true, 'store is cleaned.');
        return persistenceStoreManager.openStore(testStoreName);
      }).then(function (store) {
        assert.ok(true, 'store is opened.');
        testStore = store;
        return store.delete();
      }).then(function () {
        assert.ok(true, 'store data is cleaned.');
        return testStore.upsert('testBinaryKey1',
                                {created: 53535251153},
                                {logo: blobFromString});
      }).then(function () {
        assert.ok(true, 'first row is inserted.');
        return testStore.findByKey('testBinaryKey1');
      }).then(function (valueFound) {
        if (!valueFound || !valueFound.logo ||
            blobFromStringSize !== valueFound.logo.size) {
          assert.ok(false, 'first row cannot be found.');
          return Promise.reject({message: 'cannot find the inserted value.'});
        } else {
          var findExpression = {
            selector: {_id: {$eq: 'testBinaryKey1'}},
            fields: ['value.logo']
          }
          return testStore.find(findExpression);
        }
      }).then(function (valueFound) {
        valueFound = valueFound[0].value;
        if (!valueFound || !valueFound.logo ||
            blobFromStringSize !== valueFound.logo.size) {
          assert.ok(false, 'first row cannot be found.');
          return Promise.reject({message: 'cannot find the inserted value.'});
        } else {
          assert.ok(true, 'first row is found.');
          var findExpression = {
            selector: {key: {$eq: 'testBinaryKey1'}},
            fields: ['value.logo']
          }
          return testStore.find(findExpression);
        }
      }).then(function (valueFound) {
        valueFound = valueFound[0].value;
        if (!valueFound || !valueFound.logo ||
            blobFromStringSize !== valueFound.logo.size) {
          assert.ok(false, 'first row cannot be found.');
          return Promise.reject({message: 'cannot find the inserted value.'});
        } else {
          assert.ok(true, 'first row is found.');
          return testStore.upsert('testBinaryKey2',
                                  {created: 98943434},
                                  {logo: blobFromArray});
        }
      }).then(function () {
        assert.ok(true, 'second row is inserted.');
        return testStore.findByKey('testBinaryKey2');
      }).then(function (valueFound1) {
        if (!valueFound1 || !valueFound1.logo ||
            blobFromArraySize !== valueFound1.logo.size) {
          assert.ok(false, 'second row cannot be found.');
          return Promise.reject({message: 'cannot find the inserted value.'});
        } else {
          assert.ok(true, 'second row is found.');
          return testStore.keys();
        }
      }).then(function (keysValue) {
        assert.ok(matchResultSetIgnoreOrder(keysValue, ['testBinaryKey1', 'testBinaryKey2']), 'all rows are found.');
        resolve();
        done();
      }).catch(function (err) {
        assert.ok(false);
        reject(err);
      });
    });
    });
  });

  QUnit.test('test SQLite Adapter', function(assert) {
    var testStoreName = 'testSQLite';
    var testStore;
    var factory = new ConfigurablePouchDBStoreFactory({adapter: {name:'cordova-sqlite'}});
    persistenceStoreManager.registerStoreFactory(testStoreName, factory);
    return persistenceStoreManager.openStore(testStoreName, {version: "1.0"}).then(function (store) {
      assert.ok(true, 'store opened');
      testStore = store;
      return store.upsert(testStoreName + 'key',
                                {created: 908935353},
                                {name: 'name-adapter'});
    }).then(function() {
      assert.ok(true, 'row inserted');
      return testStore.keys();
    }).then(function(keys) {
      assert.ok(keys && keys.length === 1 && keys[0] === 'testSQLitekey');
    }).catch(function (err) {
      // sqlite can only run on hybrid with the needed plugin
      assert.ok(true);
      return;
    });
  });

  QUnit.test('test abstract store', function (assert) {
    var testStoreName = 'testAbstractStore';
    var testStore;
    persistenceStoreManager.registerStoreFactory(testStoreName, testPersistenceStoreFactory);
    return new Promise(function (resolve, reject) {
      persistenceStoreManager.openStore(testStoreName).then(function (store) {
        assert.ok(true);
        testStore = store;
        var options = {version: '1'}
        return persistenceStoreManager.openStore(testStoreName, options);
      }).then(function () {
        assert.ok(true);
        try {
          testStore.upsert();
          assert.ok(false);
        } catch (e) {
          assert.ok(true);
        }
        try {
          testStore.upsertAll();
          assert.ok(false);
        } catch (e) {
          assert.ok(true);
        }
        try {
          testStore.find();
          assert.ok(false);
        } catch (e) {
          assert.ok(true);
        }
        try {
          testStore.findByKey();
          assert.ok(false);
        } catch (e) {
          assert.ok(true);
        }
        try {
          testStore.removeByKey();
          assert.ok(false);
        } catch (e) {
          assert.ok(true);
        }
        try {
          testStore.delete();
          assert.ok(false);
        } catch (e) {
          assert.ok(true);
        }
        try {
          testStore.keys();
          assert.ok(false);
        } catch (e) {
          assert.ok(true);
        }
        return Promise.resolve();
      }).then(function () {
        assert.ok(true);
        resolve();
      }).catch(function (err) {
        reject(err);
      });
    });
  });

  // helper function to convert an object into a string for debugging
  // purpose
  var convertToString = function (toBeConverted, bufferString) {
    if (!toBeConverted) {
      bufferString += 'null';
    } else if (typeof(toBeConverted) === 'object') {
      Object.keys(toBeConverted).forEach(function (key) {
        bufferString += key;
        bufferString += ': ';
        var value = toBeConverted[key];
        bufferString += convertToString(value, '');
      });
    } else {
      bufferString += toBeConverted;
    }
    return bufferString;
  };

});

