(function () {
  'use strict';

  requirejs.config({
    paths: {
      'promise': '../lib/es6-promise/es6-promise.min',
      'opt': '../../dist/debug',
      'MockFetch': '../lib/mockfetch/MockFetch'
    },
    shim: {
      'cachestest': {
        deps: ['promise', 'opt/bundles-config']
      }
    }
  });

  require(['cachestest'], function () {
    QUnit.load();
    QUnit.start();
  });

}());