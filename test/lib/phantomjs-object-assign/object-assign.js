/**
 * Copyright (c) 2017, Oracle and/or its affiliates.
 * All rights reserved.
 */
if(navigator.userAgent.match(/PhantomJS/) && typeof(Object.assign) !== 'function') {
  (function(){
    Object.assign = function(target) {
      'use strict';
      
      if (!target) {
        throw new Error('must provide a valid target');
      }
      
      var result = Object(target);
      for (var index = 1; index < arguments.length; index++) {
        var source = arguments[index];
        if (!source) {
          continue;
        }
        Object.keys(source).forEach(function (key) {
          result[key] = source[key];
        });
      }

      return result;
    };
  })();
}