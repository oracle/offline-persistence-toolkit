(function () {
  'use strict';

  requirejs.config({
    paths: {
      'promise': '../lib/es6-promise/es6-promise.min',
      'pouchdb': '../../lib/pouchdb-6.3.4',
      'pouchfind': '../../lib/pouchdb.find',
      'persist' : '../../src',
      'object-assign': '../lib/phantomjs-object-assign/object-assign'
    },
    shim: {
      'storagetest': {
        deps: ['promise', 'object-assign']
      }
    }
  });

  require(['pouchdb'], function (pouchdb) {
    window.PouchDB = pouchdb;
  });

  require(['storagetest'], function () {
    QUnit.load();
    QUnit.start();
  });

}());