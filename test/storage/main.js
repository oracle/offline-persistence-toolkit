(function () {
  'use strict';

  requirejs.config({
    paths: {
      'qunit': '../lib/qunit/qunit',
      'qunit_parameterize': '../lib/qunit/qunit_parameterize',
      'promise': '../lib/es6-promise/es6-promise.min',
      'persist': '../../dist/debug',
      'object-assign': '../lib/phantomjs-object-assign/object-assign'
    },
    shim: {
      'qunit_parameterize': {
        deps: ['qunit']
      },
      'storagetest': {
        deps: ['promise', 'object-assign', 'persist/bundles-config', 'qunit_parameterize']
      }
    }
  });

  require(['storagetest'], function () {
    QUnit.load();
    QUnit.start();
  });

}());