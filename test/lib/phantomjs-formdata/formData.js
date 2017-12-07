/**
 * Copyright (c) 2017, Oracle and/or its affiliates.
 * All rights reserved.
 */
if(navigator.userAgent.match(/PhantomJS/)) {
  (function (self) {
    'use strict';

    var FormDataPolyfill = function () {
      this.polyfill = true;
      this.boundary = '--------FormDataPolyfill' + Math.random().toString(36).substring(7);
      this._fields = [];
    };

    FormDataPolyfill.prototype = new String();

    self.FormData = FormDataPolyfill;

    FormDataPolyfill.prototype.append = function (name, value) {
      var existed = this.get(name);
      if (existed) {
        existed.push(value);
      } else {
        this._fields.push([name, [value]]);
      }
    };

    FormDataPolyfill.prototype.delete = function (name) {
      var index = -1;
      for (var i = 0; i < this._fields.length; i++) {
        if (this._fields[i][0] === name) {
          index = i;
          break;
        }
      }
      if (index > -1) {
        this._fields.splice(index, 1);
      }
    };

    FormDataPolyfill.prototype.entries = function () {
      return _makeIterator(this._fields, function (element, index) {
        return {
          value: [element[0], element[1][index]],
          nextInner: index + 1
        };
      });
    };

    FormDataPolyfill.prototype.get = function (name) {
      var allValues = this.getAll(name);
      return allValues ? allValues[0] : null;
    };

    FormDataPolyfill.prototype.getAll = function (name) {
      for (var index = 0; index < this._fields.length; index++) {
        if (this._fields[index][0] === name) {
          return this._fields[index][1];
        }
      }
      return;
    };

    FormDataPolyfill.prototype.has = function (name) {
      return this.getAll(name) ? true : false;
    };

    FormDataPolyfill.prototype.set = function (name, value, fileName) {
      for (var index = 0; index < this._fields.length; index++) {
        if (this._fields[index][0] === name) {
          this._fields[index][1] = value;
          return;
        }
      }
      this._fields.push([name, [value]]);
    };

    FormDataPolyfill.prototype.keys = function () {
      return _makeIterator(this._fields, function (element) {
        return {
          value: element[0],
          nextInner: element[1].length
        };
      });
    };

    FormDataPolyfill.prototype.values = function () {
      return _makeIterator(this._fields, function (element, index) {
        return {
          value: element[1][index],
          nextInner: index + 1
        };
      });
    };
 
    function _makeIterator(fieldArray, callback) {
      var outerIndex = 0;
      var innerIndex = 0;

      return {
        next: function () {
          if (outerIndex < fieldArray.length) {
            var result = callback(fieldArray[outerIndex], innerIndex);
            innerIndex = result.nextInner;
            if (innerIndex === fieldArray[outerIndex][1].length) {
              outerIndex++;
              innerIndex = 0;
            }
            return {
              value: result.value,
              done: false
            };
          } else {
            return {
              done: true
            };
          }
        }
      }
    };

  })(typeof self !== 'undefined' ? self : this);
}