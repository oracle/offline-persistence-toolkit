(function () {
  'use strict';

  requirejs.config({
    paths: {
      
      'promise': '../lib/es6-promise/es6-promise.min',
      'persist': '../../dist/debug'
    },
    shim: {
      'test': {
        deps: ['promise', 'persist/bundles-config', 'qunit']
      }
    }
  });

  require(['test'], function () {
    QUnit.load();
    QUnit.start();
  });

}());