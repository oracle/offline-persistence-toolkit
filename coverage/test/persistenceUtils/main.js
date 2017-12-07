(function () {
  'use strict';

  requirejs.config({
    paths: {
      'promise': '../lib/es6-promise/es6-promise.min',
      'pouchdb': '../../lib/pouchdb-6.3.4',
      'pouchfind': '../../lib/pouchdb.find',
      'persist' : '../../src',
      'MockFetch': '../lib/mockfetch/MockFetch',
      'formData': '../lib/phantomjs-formdata/formData'
    },
    shim: {
      'persistenceutilstest': {
        deps: ['promise', 'persist/impl/fetch']
      }
    }
  });

  require(['persistenceutilstest'], function () {
    QUnit.load();
    QUnit.start();
  });

}());