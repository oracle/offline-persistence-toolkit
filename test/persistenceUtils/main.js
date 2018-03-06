(function () {
  'use strict';

  requirejs.config({
    paths: {
      'promise': '../lib/es6-promise/es6-promise.min',
      'opt': '../../dist/debug',
      'MockFetch': '../lib/mockfetch/MockFetch',
      'formData': '../lib/phantomjs-formdata/formData'
    },
    shim: {
      'persistenceutilstest': {
        deps: ['promise', 'opt/bundles-config']
      }
    }
  });

  require(['persistenceutilstest'], function () {
    QUnit.load();
    QUnit.start();
  });

}());