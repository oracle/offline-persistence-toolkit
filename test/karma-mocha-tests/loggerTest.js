define(['persist/impl/logger'],
  function (logger) {
    'use strict';

    describe('log levels', function () {
      it('log levels', function() {
        var customWriter = {};
        customWriter.error = function (args) {
          assert.ok(true, 'error log');
        }
        customWriter.info = function (args) {
          assert.ok(true, 'info log');
        }
        customWriter.warn = function (args) {
          assert.ok(true, 'warn log');
        }
        customWriter.log = function (args) {
          assert.ok(true, 'log log');
        }
        logger.option('writer', customWriter);
        logger.option('level', 5);
        assert.ok(logger.option('level') == 5, 'level is 5');
        assert.ok(logger.option()['level'] == 5, 'level is 5');
        assert.ok(logger.option()['writer'] == customWriter, 'writer is customWriter');
        logger.error('Test Error');
        logger.info('Test Info');
        logger.warn('Test Warn');
        logger.log('Test Log');
      });
    });
  });