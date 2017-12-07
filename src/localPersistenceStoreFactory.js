/**
 * Copyright (c) 2017, Oracle and/or its affiliates.
 * All rights reserved.
 */

define(["./impl/localPersistenceStore"], function (LocalPersistenceStore) {
  'use strict';

  var LocalPersistenceStoreFactory = (function () {

    function _createPersistenceStore (name, options) {
      return new Promise(function (resolve, reject) {
        var store = new LocalPersistenceStore(name);
        store.Init(options).then(function () {
          resolve(store);
        });
      });
    };

    return {
      'createPersistenceStore': function (name, options) {
        return _createPersistenceStore(name, options);
      }
    };
  }());

  return LocalPersistenceStoreFactory;
});