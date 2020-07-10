/**
 * Copyright (c) 2014, Oracle and/or its affiliates.
 * All rights reserved.
 */

/**
 * @preserve Copyright 2013 jQuery Foundation and other contributors
 * Released under the MIT license.
 * http://jquery.org/license
 */

define([], function () {
  'use strict';

  if (!window.navigator._mocked &&
    navigator.userAgent.match(/PhantomJS/)) {
    window.navigator = (function (oldNav) {
      var newNav = Object.create(oldNav);
      Object.defineProperty(newNav, 'onLine', {
        get: function () {
          return true;
        },
        enumerable: true
      });
      Object.defineProperty(newNav, '_mocked', {
        value: true,
        enumerable: true
      });
      return newNav;
    }(window.navigator));
  }

  function MockFetch() {
    this._replies = [];
    window._fetch = fetch;
    window.fetch = this.fetch.bind(this);
  };

  /**
   * Clear all request replies
   * @method
   * @name clearAllRequestReplies
   * @memberof! MockFetch
   * @export
   * @instance
   */
  MockFetch.prototype.clearAllRequestReplies = function () {
    this._replies = [];
  };

    /**
   * Add request reply
   * @method
   * @name addRequestReply
   * @memberof! MockFetch
   * @export
   * @instance
   * @param {string} method Method of the request
   * @param {string} scope The URI which should be handled
   * @param {Object} result Object with all the result data
   * @param {Function} callback callback function to invoke when the request is processed
   *                            The callback function is invoked with the request & response
   */
  MockFetch.prototype.addRequestReply = function (method, scope, result, callback) {
    this._replies.push({
      scope: scope,
      method: method,
      result: result,
      callback: callback
    });
  };

  MockFetch.prototype.fetch = function (input, init) {
    var self = this;
    var request;
    if (Request.prototype.isPrototypeOf(input) && !init) {
      request = input
    } else {
      request = new Request(input, init)
    }
    var i, response;
    var repliesCount = self._replies.length;
    // calling regular browser fetch when calling against our localhost server
    // this is to be able to use abortController/timeout
    if (request.url === "http://localhost:3003/testOPT"){
      return _fetch(request)
    }
    for (i = 0; i < repliesCount; i++) {
      if ((request.url.toLowerCase().indexOf(self._replies[i].scope.toLowerCase()) != -1) &&
        (self._replies[i].method == '*' || request.method == self._replies[i].method)) {
        if (self._replies[i].result instanceof Promise) {
          return self._replies[i].result.then(function(result) {
            return result;
          }, function(err) {
            return Promise.reject(err);
          });
          return;
        } else {
          response = new Response(self._replies[i].result.body, self._replies[i].result);

          if (response.headers.get('Content-Type') === 'null') {
            response.headers.delete('Content-Type');
          }

          if (self._replies[i].callback) {
            self._replies[i].callback(request, response);
          }
          return Promise.resolve(response);
        }
      }
    }
    if (request.method == 'OPTIONS') {
      return Promise.resolve(new Response());
    }
    return Promise.reject();
  };

  return MockFetch;
});
