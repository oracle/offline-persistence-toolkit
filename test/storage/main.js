(function () {
  'use strict';

  requirejs.config({
    paths: {
      'promise': '../lib/es6-promise/es6-promise.min',
      'opt': '../../dist/debug',
      'object-assign': '../lib/phantomjs-object-assign/object-assign'
    },
    shim: {
      'storagetest': {
        deps: ['promise', 'object-assign', 'opt/bundles-config']
      }
    }
  });

  require(['storagetest'], function () {
    QUnit.load();
    QUnit.start();
  });

}());