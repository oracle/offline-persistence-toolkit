(function () {
  'use strict';

  requirejs.config({
    paths: {
      'promise': '../lib/es6-promise/es6-promise.min',
      'pouchdb': '../../lib/pouchdb-6.3.4',
      'pouchfind': '../../lib/pouchdb.find',
      'persist' : '../../src',
      'MockFetch': '../lib/mockfetch/MockFetch'
    },
    shim: {
      'cachestest': {
        deps: ['promise', 'persist/impl/fetch']
      }
    }
  });

  require(['cachestest'], function () {
    QUnit.load();
    QUnit.start();
  });

}());