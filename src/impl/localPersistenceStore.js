/**
 * Copyright (c) 2017, Oracle and/or its affiliates.
 * All rights reserved.
 */

define(["../PersistenceStore"],
  function (PersistenceStore) {
    'use strict';

    var LocalPersistenceStore = function (name) {
      PersistenceStore.call(this, name);
    }

    LocalPersistenceStore.prototype = new PersistenceStore();

    LocalPersistenceStore.prototype.Init = function (options) {
      this._version = (options && options.version) || '0';
      return Promise.resolve();
    };

    LocalPersistenceStore.prototype.upsert = function (key, metadata, value, expectedVersionIdentifier) {
      var insertKey = this.createRawKey(key);
      var existingValue = localStorage.getItem(insertKey);
      if (existingValue && expectedVersionIdentifier) {
        var existingVersionIdentifier = JSON.parse(existingValue).metadata.versionIdentifier;
        if (existingVersionIdentifier !== expectedVersionIdentifier) {
          return Promise.reject({
            status: 409
          });
        } else {
          var newVersionIdentifier = metadata.versionIdentifier;
          if (newVersionIdentifier !== existingVersionIdentifier) {
            this._insert(insertKey, metadata, value);
          }
          return Promise.resolve();
        }
      } else {
        this._insert(insertKey, metadata, value);
        return Promise.resolve();
      }
    };

    LocalPersistenceStore.prototype._insert = function (key, metadata, value) {
      var insertValue = {
        metadata: metadata,
        value: value
      };

      var valueToStore = JSON.stringify(insertValue);
      localStorage.setItem(key, valueToStore);
    };

    LocalPersistenceStore.prototype.upsertAll = function (dataArray) {
      var promiseArray = [];
      for (var index = 0; index < dataArray.length; index++) {
        var data = dataArray[index];
        promiseArray.push(this.upsert(data.key, data.metadata, data.value, data.expectedVersionIndentifier));
      }
      return Promise.all(promiseArray);
    };

    LocalPersistenceStore.prototype.find = function (findExpression) {
      var self = this;
      var resultSet = [];
      var unsorted = [];
      var findExpression = findExpression || {};

      var allRawKeys = Object.keys(localStorage);;
      for (var index = 0; index < allRawKeys.length; index++) {
        var rawKey = allRawKeys[index];
        var key = this.extractKey(rawKey);
        if (key) {
          var itemData = JSON.parse(localStorage.getItem(rawKey));
          if (self._satisfy(findExpression.selector, itemData)) {
            itemData.key = key;
            unsorted.push(itemData);
          }
        }
      }

      var sorted = this._sort(unsorted, findExpression.sort);
      for (var index = 0; index < sorted.length; index++) {
        resultSet.push(self._constructReturnObject(findExpression.fields, sorted[index]));
      }

      return Promise.resolve(resultSet);
    };

    LocalPersistenceStore.prototype._sort = function (unsorted, sortCriteria) {

      if (!unsorted || !unsorted.length ||
          !sortCriteria || !sortCriteria.length) {
        return unsorted;
      }

      return unsorted.sort(this._sortFunction(sortCriteria, this));
    };

    /**
     * Helper method that returns a function that can be used as callback
     * to Array.sort.
     * @method
     * @name _sortFunction
     * @memberof! LocalPersistenceStore
     * @param {object} sortCriteria Rule that defines how sort should be
     *                              performed.
     * @param {object} thisArg The object that should be used as this.
     * @returns {function} the function that is used as callback to
     *                     Array.sort.
     */
    LocalPersistenceStore.prototype._sortFunction = function (sortCriteria, thisArg) {
      return function (a, b) {
        for (var index = 0; index < sortCriteria.length; index++) {
          var sortC = sortCriteria[index];
          var sortField;
          var sortAsc = true;

          if (typeof(sortC) === 'string') {
            sortField = sortC;
          } else if (typeof(sortC) === 'object'){
            var keys = Object.keys(sortC);
            if (!keys || keys.length !== 1) {
              throw new Error('invalid sort criteria');
            }
            sortField = keys[0];
            sortAsc = (sortC[sortField].toLowerCase() === 'asc');
          } else {
            throw new Error("invalid sort criteria.");
          }

          var valueA = thisArg._getValue(sortField, a);
          var valueB = thisArg._getValue(sortField, b);
          if (valueA == valueB) {
            continue;
          } else if (sortAsc) {
            return (valueA < valueB ? -1 : 1);
          } else {
            return (valueA < valueB ? 1 : -1);
          }
        }
        return 0;
      };
    };

    LocalPersistenceStore.prototype.findByKey = function (key) {
      var insertKey = this.createRawKey(key);
      var storeageData = localStorage.getItem(insertKey);
      if (storeageData) {
        return Promise.resolve(JSON.parse(storeageData).value);
      } else {
        return Promise.resolve();
      }
    };

    LocalPersistenceStore.prototype.removeByKey = function (key) {
      var insertKey = this.createRawKey(key);
      var storeageData = localStorage.getItem(insertKey);
      if (storeageData) {
        localStorage.removeItem(insertKey);
        return Promise.resolve(true);
      } else {
        return Promise.resolve(false);
      }
    };

    LocalPersistenceStore.prototype.createRawKey = function (key) {
      return this._name + this._version + key.toString();
    }

    LocalPersistenceStore.prototype.extractKey = function (rawKey) {
      var prefix = this._name + this._version;
      var prefixLength = prefix.length;
      if (rawKey.indexOf(prefix) === 0) {
        return rawKey.slice(prefixLength);
      } else {
        return null;
      }
    }

    /**
     * Helper function that checks if itemData satisfies the search criteria
     * defined by selector or not. Undefined selector means everything is
     * selected.
     * @method
     * @name _satisfy
     * @memberof! LocalPersistenceStore
     * @param {string} selector Rule that defines whether an object is selected
     *                          or not.
     * @param {object} itemData The value to check with.
     * @returns {boolean} true if itemData satisfies search criteria defined
     *                         by selector, and false otherwise.
     */
    LocalPersistenceStore.prototype._satisfy = function (selector, itemData) {
      if (!selector) {
        // undefined selector means select everything.
        return true;
      } else {
        var expTree = this._buildExpressionTree(selector);
        return this._evaluateExpressionTree(expTree, itemData);
      }
    };

    /**
     * Helper function used by {@link _satisfy} to build an expression tree
     * based on expression object for easier evaluation later.
     * @method
     * @name _buildExpressionTree
     * @memberof! LocalPersistenceStore
     * @param {object} expression The expression that used to filter an object.
     * @returns {object} The tree representation of the passed-in expression.
     */
    LocalPersistenceStore.prototype._buildExpressionTree = function (expression) {
      var subTree;
      var itemTreeArray = [];
      for (var key in expression) {
        if (expression.hasOwnProperty(key)) {
          var value = expression[key];
          if (key.indexOf('$') === 0) {
            if (this._isMultiSelector(key)) {
              if (value instanceof Array) {
                subTree = {
                  operator: key,
                  array: []
                };
                for (var subindex = 0; subindex < value.length; subindex++) {
                  var itemTree = this._buildExpressionTree(value[subindex]);
                  subTree.array.push(itemTree);
                }
              } else {
                throw new Error("not a valid expression: " + expression);
              }
            } else if (this._isSingleSelector(key)) {
              throw new Error("not a valid expression: " + expression);
            }
          } else if (this._isLiteral(value)) {
            itemTreeArray.push({
              left: key,
              right: value,
              operator: '$eq'
            });
          } else {
            var partialTree = {
              left: key,
            };
            this._completePartialTree(partialTree, value);
            itemTreeArray.push(partialTree);
          }
        }
      }

      if (itemTreeArray.length > 1) {
        subTree = {
          operator: '$and',
          array: itemTreeArray
        };
      } else if (itemTreeArray.length === 1) {
        subTree = itemTreeArray[0];
      }

      return subTree;
    };

    /**
     * Helper function used by {@link _buildExpressionTree} to complete the
     * right side of an expression tree.
     * @method
     * @name _completePartialTree
     * @memberof! LocalPersistenceStore
     * @param {object} partialTree The tree representation of an expression.
     * @param {object} expression The object to evaluate the expression tree
     *                          against.
     */
    LocalPersistenceStore.prototype._completePartialTree = function (partialTree, expression) {
      var found = false;
      for (var key in expression) {
        if (expression.hasOwnProperty(key)) {
          var value = expression[key];
          if (found || !this._isSingleSelector(key)) {
            throw new Error("parsing error " + expression);
          }
          partialTree.operator = key;
          partialTree.right = value;
          found = true;
        }
      }
    };

    /**
     * Helper function used by {@link find} to apply an expression tree to
     * an object to check if this object satisfies the expression tree or not.
     * @method
     * @name _evaluateExpressionTree
     * @memberof! LocalPersistenceStore
     * @param {object} expTree The tree representation of an expression.
     * @param {object} itemData The object to evaluate the expression tree
     *                          against.
     * @returns {boolean} true if itemData satisfies expression tree, false
     *                    otherwise.
     */
    LocalPersistenceStore.prototype._evaluateExpressionTree = function (expTree, itemData) {
      var operator = expTree.operator;
      if (this._isMultiSelector(operator)) {
        if (expTree.left || !(expTree.array instanceof Array)) {
          throw new Error("invalid expression tree!" + expTree);
        } else {
          var result;
          var subTreeArray = expTree.array;
          for (var subIndex = 0; subIndex < subTreeArray.length; subIndex++) {
            var subResult = this._evaluateExpressionTree(subTreeArray[subIndex], itemData);
            if (operator === '$or' && subResult === true) {
              return true;
            } else if (operator === '$and' && subResult === false) {
              return false;
            }
            result = subResult;
          }
          return result;
        }
      } else if (this._isSingleSelector(operator)) {
        var itemValue = this._getValue(expTree.left, itemData);
        var value = expTree.right;
        if (operator === '$lt') {
          return (itemValue < value);
        } else if (operator === '$gt') {
          return (itemValue > value);
        } else if (operator === '$lte') {
          return (itemValue <= value);
        } else if (operator === '$gte') {
          return (itemValue >= value);
        } else if (operator === '$eq') {
          return (itemValue === value);
        } else if (operator === '$ne') {
          return (itemValue !== value);
        } else if (operator === '$regex') {
          var matchResult = itemValue.match(value);
          return (matchResult !== null);
        } else if (operator === '$exists') {
          if (value) {
            return (itemValue !== null && itemValue !== undefined);
          } else {
            return (itemValue === null || itemValue === undefined);
          }
        } else {
          throw new Error("not a valid expression! " + expTree);
        }
      } else {
        throw new Error("not a valid expression!" + expTree);
      }
      return false;
    };

    /**
     * Helper function that checks if the token is a multiple selector operator
     * or not.
     * @method
     * @name _isMultiSelector
     * @memberof! LocalPersistenceStore
     * @param {string} token The token to check against.
     * @returns {boolean} true if the token is the supported multiple selector
     *                    operator, false otherwise.
     */
    LocalPersistenceStore.prototype._isMultiSelector = function (token) {
      return (token === '$and' || token === '$or');
    };

    /**
     * Helper function that checks if the token is a single selector operator
     * or not.
     * @method
     * @name _isSingleSelector
     * @memberof! LocalPersistenceStore
     * @param {string} token The token to check against.
     * @returns {boolean} true if the token is the supported single selector
     *                    operator, false otherwise.
     */
    LocalPersistenceStore.prototype._isSingleSelector = function (token) {
      return (token === '$lt' || token === '$gt' || token === '$lte' ||
        token === '$gte' || token === '$eq' || token === '$ne' ||
        token === '$regex' || token === '$exists');
    };

    /**
     * Helper function that checks if the token is a literal or not.
     * @method
     * @name _isLiteral
     * @memberof! LocalPersistenceStore
     * @param {string} token The token to check against.
     * @returns {boolean} true if the token is a literal, false otherwise.
     */
    LocalPersistenceStore.prototype._isLiteral = function (token) {
      return (typeof(token) !== 'object');
    };

    /**
     * Helper function that retrieves the value of a property from an object.
     * The object can have nested properties, and the property name could be
     * a path to the leaf property.
     * @method
     * @name _getValue
     * @memberof! LocalPersistenceStore
     * @param {string} path The chain of the property names from the root to
     *                      the leaf when the object has nested properties.
     * @param {object} itemValue The object to retrieve the property value
     *                           from.
     * @returns {object} the object that contains all the properties defined
     *                   in fieldsExpression array, the corresponding property
     *                   value is obtained from itemData.
     */
    LocalPersistenceStore.prototype._getValue = function (path, itemValue) {
      var paths = path.split('.');
      var returnValue = itemValue;
      for (var index = 0; index < paths.length; index++) {
        returnValue = returnValue[paths[index]];
      }
      return returnValue;
    };

    /**
     * Helper function used by {@link find} that constructs an object out from
     * itemData based on fieldsExpression.
     * @method
     * @name _constructReturnObject
     * @memberof! LocalPersistenceStore
     * @param {Array} fieldsExpression An array of property names whose values
     *                                 should be included in the final contructed
     *                                 return object.
     * @param {object} itemData The original object to construct the return object
     *                        from.
     * @returns {object} the object that contains all the properties defined
     *                   in fieldsExpression array, the corresponding property
     *                   value is obtained from itemData.
     */
    LocalPersistenceStore.prototype._constructReturnObject = function (fieldsExpression, itemData) {
      var returnObject;
      if (!fieldsExpression) {
        returnObject = itemData.value;
      } else {
        returnObject = {};
        for (var index = 0; index < fieldsExpression.length; index++) {
          var currentObject = returnObject;
          var currentItemDataValue = itemData;
          var field = fieldsExpression[index];
          var paths = field.split('.');
          for (var pathIndex = 0; pathIndex < paths.length; pathIndex++) {
            currentItemDataValue = currentItemDataValue[paths[pathIndex]];
            if (!currentObject[paths[pathIndex]] && pathIndex < paths.length - 1) {
              currentObject[paths[pathIndex]] = {};
            }
            if (pathIndex === paths.length - 1) {
              currentObject[paths[pathIndex]] = currentItemDataValue;
            } else {
              currentObject = currentObject[paths[pathIndex]];
            }
          }
        }
      }
      return returnObject;
    };

    // delete entries in this store that matches the deleteExpression
    LocalPersistenceStore.prototype.delete = function (deleteExpression) {
      var self = this;

      if (!deleteExpression) {
        var allRawKeys = Object.keys(localStorage);
        for (var index = 0; index < allRawKeys.length; index++) {
          var key = this.extractKey(allRawKeys[index]);
          if (key) {
            localStorage.removeItem(allRawKeys[index]);
          }
        }
        return Promise.resolve();
      }

      var modExpression = deleteExpression;
      modExpression.fields = ['key'];
      return self.find(modExpression).then(function (searchResults) {
        if (searchResults && searchResults.length) {
          var promises = searchResults.map(self._removeByKeyMapCallback('key'), self);
          return Promise.all(promises);
        } else {
          return Promise.resolve();
        }
      }).then(function () {
        return Promise.resolve();
      });
    };

  /**
   * Helper function that returns a callback function that can be used by
   * Array.map in {@link delete}.
   * @method
   * @name _removeByKeyMapCallback
   * @memberof! LocalPersistenceStore
   * @param {string} propertyName An array of Request
   * @return {function} Returns a function that can be used as a callback
   *                    by Array.map.
   */
    LocalPersistenceStore.prototype._removeByKeyMapCallback = function (propertyName) {
      var self = this;
      return function (element) {
        var valueToOperate;
        if (propertyName) {
          valueToOperate = element[propertyName];
        } else {
          valueToOperate = element;
        }
        return self.removeByKey(valueToOperate);
      };
    };

    LocalPersistenceStore.prototype.keys = function () {
      var allRawKeys = Object.keys(localStorage);
      var allKeys = [];
      for (var index = 0; index < allRawKeys.length; index++) {
        var key = this.extractKey(allRawKeys[index]);
        if (key) {
          allKeys.push(key);
        }
      }
      return Promise.resolve(allKeys);
    };

    return LocalPersistenceStore;
  });