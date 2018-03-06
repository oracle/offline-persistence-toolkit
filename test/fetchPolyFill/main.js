(function () {
  'use strict';
  window.fetch = null;
  requirejs.config({
    paths: {
      'promise': '../lib/es6-promise/es6-promise.min',
      'opt': '../../dist/debug',
      'MockFetch': '../lib/mockfetch/MockFetch'
    },
    shim: {
      'test': {
        deps: ['promise', 'opt/bundles-config']
      }
    }
  });

  require(['test'], function () {
    QUnit.load();
    QUnit.start();
  });

}());