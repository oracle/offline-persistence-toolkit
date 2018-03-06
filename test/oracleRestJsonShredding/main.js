(function () {
  'use strict';

  requirejs.config({
    paths: {
      'promise': '../lib/es6-promise/es6-promise.min',
      'opt': '../../dist/debug'
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