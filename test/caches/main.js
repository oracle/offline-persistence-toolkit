(function () {
  'use strict';

  requirejs.config({
    paths: {
      
      'promise': '../lib/es6-promise/es6-promise.min',
      'persist': '../../dist/debug',
      'MockFetch': '../lib/mockfetch/MockFetch'
    },
    shim: {
      'cachestest': {
        deps: ['promise', 'persist/bundles-config', 'qunit']
      }
    }
  });

  require(['cachestest'], function () {
    QUnit.load();
    QUnit.start();
  });

}());