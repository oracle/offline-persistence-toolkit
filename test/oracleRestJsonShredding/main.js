(function () {
  'use strict';

  requirejs.config({
    paths: {
      'promise': '../lib/es6-promise/es6-promise.min',
      'persist' : '../../src'
    },
    shim: {
      'test': {
        deps: ['promise', 'persist/impl/fetch']
      }
    }
  });

  require(['test'], function () {
    QUnit.load();
    QUnit.start();
  });

}());