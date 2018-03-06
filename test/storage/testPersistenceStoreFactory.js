/**
 * Copyright (c) 2017, Oracle and/or its affiliates.
 * All rights reserved.
 */

define(["PersistenceStore"],
       function(PersistenceStore) {
  'use strict';
  
  var TestPersistenceStoreFactory = (function () {

    function _createPersistenceStore (name, options) {
      return new Promise(function (resolve, reject) {
        var store = new PersistenceStore(name);
        store.Init(options).then(function () {
          resolve(store);
        }, function (err) {
          reject(err);
        });
      });
    };

    return {
      'createPersistenceStore' : function (name, options) {
        return _createPersistenceStore(name, options);
      }
    };
  }());

  return TestPersistenceStoreFactory;
});