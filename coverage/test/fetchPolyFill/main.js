(function () {
  'use strict';
  window.fetch = null;
  requirejs.config({
    paths: {
      'promise': '../lib/es6-promise/es6-promise.min',
      'pouchdb': '../../lib/pouchdb-6.3.4',
      'pouchfind': '../../lib/pouchdb.find',
      'persist' : '../../src',
      'MockFetch': '../lib/mockfetch/MockFetch'
    },
    shim: {
      'test': {
        deps: ['promise']
      }
    }
  });

  require(['test'], function () {
    QUnit.load();
    QUnit.start();
  });

}());