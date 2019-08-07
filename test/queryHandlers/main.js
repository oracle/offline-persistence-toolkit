(function () {
  'use strict';

  requirejs.config({
    paths: {

      'promise': '../lib/es6-promise/es6-promise.min',
      'persist': '../../dist/debug',
      'MockFetch': '../lib/mockfetch/MockFetch',
      'object-assign': '../lib/phantomjs-object-assign/object-assign',
      'get-own-property-symbols': '../lib/phantomjs-get-own-property-symbols/get-own-property-symbols'
    },
    shim: {
      'test': {
        deps: ['promise', 'object-assign', 'get-own-property-symbols', 'persist/bundles-config', 'qunit']
      }
    }
  });

  require(['test'], function () {
    QUnit.load();
    QUnit.start();
  });

}());