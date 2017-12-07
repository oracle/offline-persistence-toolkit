/**
 * Copyright (c) 2017, Oracle and/or its affiliates.
 * All rights reserved.
 */

define(["../PersistenceStore", "pouchdb", "pouchfind"],
       function (PersistenceStore, PouchDB) {
  'use strict';

  var PouchDBPersistenceStore = function (name) {
    PersistenceStore.call(this, name);
  }

  PouchDBPersistenceStore.prototype = new PersistenceStore();

  // in ---> index: ['foo', 'bar']
  // out---> index: {
  //                  fields: ['foo', 'bar'],
  //                  name: 'storefoobar'
  //                }
  PouchDBPersistenceStore.prototype.Init = function (options) {
    this._version = (options && options.version) || '0';
    var dbname = this._name + this._version;
    this._db = new PouchDB(dbname);

    if (!options || !options.index) {
      return Promise.resolve();
    } else {
      var self = this;
      var indexArray = options.index;
      var indexName = self._name + indexArray.toString().replace(",", "").replace(".","");
      var indexSyntax = {
        index: {
          fields: indexArray,
          name: indexName
        }
      };
      return new Promise(function (resolve, reject) {
        self._db.createIndex(indexSyntax).then(function () {
          resolve();
        }).catch(function(err){
          reject(err);
        });
      });
    }
  };

  PouchDBPersistenceStore.prototype.upsert = function (key, metadata, value, expectedVersionIdentifier) {
    var self = this;
    var docId = key.toString();

    var attachmentParts = [];
    this._prepareUpsert(value, attachmentParts);

    return new Promise(function (resolve, reject) {
      self._db.get(docId).then(function (doc) {
        // document exists already, update it if its versionIdentifier value
        // is the same as the expected value. Otherwise, throw conflict error
        if (!_verifyVersionIdentifier(expectedVersionIdentifier, doc)) {
          return Promise.reject({status: 409});
        } else {
          return Promise.resolve(doc);
        }
      }).catch(function (geterr) {
        if (geterr.status === 404 && geterr.message === 'missing') {
          return Promise.resolve();
        } else {
          return Promise.reject(geterr);
        }
      }).then(function (existingDoc) {
        return self._put(docId, metadata, value, expectedVersionIdentifier, attachmentParts, existingDoc);
      }).then(function () {
        resolve();
      }).catch(function (err) {
        reject(err);
      });
    });
  };

  PouchDBPersistenceStore.prototype._put = function (docId, metadata, value,
                                                     expectedVersionIdentifier,
                                                     attachmentParts, existingDoc) {
    var dbdoc = {
      _id: docId,
      metadata: metadata,
      value: value
    };

    if (existingDoc) {
      dbdoc._rev = existingDoc._rev;
    }

    var self = this;
    return new Promise(function (resolve, reject) {
      self._db.put(dbdoc).then(function (addeddoc) {
        return Promise.resolve(addeddoc);
      }).catch(function (puterr) {
        if (puterr.status === 409) {
          // because of the asynchroness nature, and the same resource
          // could be asked to add to the store in multiple paths, it's
          // valid to have conflict error from pouchDB, we'll verify if
          // this is a valid conflict or not.
          self._db.get(docId).then(function (conflictDoc) {
            if (expectedVersionIdentifier) {
              if (!_verifyVersionIdentifier(expectedVersionIdentifier, conflictDoc)) {
                return Promise.reject({status: 409});
              } else {
                return Promise.resolve(conflictDoc);
              }
            } else {
              return Promise.resolve(conflictDoc);
            }
          });
        } else {
          return Promise.reject(puterr);
        }
      }).then(function(finalDoc){
        return self._addAttachments(finalDoc, attachmentParts);
      }).then(function () {
        resolve();
      }).catch(function (err) {
        reject(err);
      });
    });
  };

  // helper function to check expectedVersionIdentifier with the
  // versionIdentifier value of currentDocument. Return true if there is no
  // confict, false otherwise.
  var _verifyVersionIdentifier = function (expectedVersionIdentifier, currentDocument) {
    if (!expectedVersionIdentifier) {
      return true;
    } else {
      var docVersionIdentifier = currentDocument.metadata.versionIdentifier;
      return docVersionIdentifier === expectedVersionIdentifier;
    }
  };

  // add the binary part of the value as attachment to the main document.
  PouchDBPersistenceStore.prototype._addAttachments = function (doc, attachmentParts) {
    if (!attachmentParts || !attachmentParts.length) {
      return Promise.resolve();
    } else {
      var promises = attachmentParts.map(function (attachment) {
        var blob;
        if (attachment.value instanceof Blob) {
          blob = attachment.value;
        } else {
          blob = new Blob([attachment.value]);
        }
        return this._db.putAttachment(doc.id, attachment.path, doc.rev, blob, 'binary')
      }, this);
      return Promise.all(promises);
    }
  };

  PouchDBPersistenceStore.prototype.upsertAll = function (values) {
    if (!values || !values.length) {
      return Promise.resolve();
    } else {
      var promises = values.map(function (element) {
        return this.upsert(element.key, element.metadata, element.value, element.expectedVersionIdentifier);
      }, this);
      return Promise.all(promises);
    }
  };

  PouchDBPersistenceStore.prototype.find = function (findExpression) {
    var self = this;
    var modifiedFind = self._prepareFind(findExpression);

    return new Promise(function (resolve, reject) {
      self._db.find(modifiedFind).then(function (result) {
        if (result && result.docs && result.docs.length) {
          var promises = result.docs.map(self._findResultCallback(modifiedFind.fields), self);
          return Promise.all(promises);
        } else {
          return Promise.resolve([]);
        }
      }).catch(function (finderr) {
        if (finderr.status === 404 && finderr.message === 'missing') {
          return Promise.resolve([]);
        } else {
          return Promise.reject(finderr);
        }
      }).then(function (entries) {
        resolve(entries);
      }).catch(function (err) {
        reject(err);
      });
    });
  };

  PouchDBPersistenceStore.prototype._findResultCallback = function (useDefaultField) {
    return function (element) {
      var self = this;
      return new Promise(function (resolve, reject) {
        self._fixValue(element).then(function (fixedDoc) {
          if (useDefaultField) {
            resolve(fixedDoc);
          } else {
            resolve(fixedDoc.value);
          }
        }).catch(function (err) {
          reject(err);
        });
      });
    };
  };

  // invoked after document is retrieved. If the original value
  // has binary data in it, we need to retrieve it back as attachments
  // and add it back to the value part.
  PouchDBPersistenceStore.prototype._fixValue = function (doc) {

    var docId = doc._id || doc.id || doc.key;

    if (docId) {
      doc.key = docId;
    }

    var attachments = doc._attachments;
    if (!attachments) {
      return Promise.resolve(doc);
    } else {
      var self = this;
      var filename = Object.keys(attachments)[0];
      return new Promise(function (resolve, reject) {
        self._db.getAttachment(docId, filename).then(function (blob) {
          var paths = filename.split('.');
          var targetValue = doc.value;
          for (var pathIndex = 0; pathIndex < paths.length - 1; pathIndex++) {
            targetValue = targetValue[paths[pathIndex]];
          }
          targetValue[paths[paths.length - 1]] = blob;
          resolve(doc);
        }).catch(function (err) {
          reject(err);
        });
      });
    }
  };

  PouchDBPersistenceStore.prototype.findByKey = function (key) {
    var self = this;
    var docId = key.toString();

    return new Promise(function (resolve, reject) {
      self._db.get(docId).then(function (doc) {
        resolve(doc.value);
      }).catch(function (err) {
        if (err.status === 404 && err.message === 'missing') {
          resolve();
        } else {
          reject(err);
        }
      });
    });
  };

  PouchDBPersistenceStore.prototype.removeByKey = function (key) {
    var self = this;
    var docId = key.toString();
    return new Promise(function (resolve, reject) {
      self._db.get(docId).then(function (doc) {
        return self._db.remove(doc);
      }).then(function () {
        resolve(true);
      }).catch(function (err) {
        if (err.status === 404 && err.message === 'missing') {
          resolve(false);
        } else {
          reject(err);
        }
      });
    });
  };

  PouchDBPersistenceStore.prototype.delete = function (deleteExpression) {
    var self = this;

    if (deleteExpression) {
      var modifiedExpression = deleteExpression;
      modifiedExpression.fields = ['_id', '_rev'];
      return new Promise(function (resolve, reject) {
        self.find(modifiedExpression).then(function (entries) {
          if (entries && entries.length) {
             var promisesArray = entries.map(function (element) {
               return this._db.remove(element._id, element._rev);
             }, self);
             return Promise.all(promisesArray);
           } else {
             resolve();
           }
        }).then(function () {
          resolve();
        }).catch(function (err) {
          reject(err);
        });
      });
    } else {
      return new Promise(function (resolve, reject) {
        self._db.allDocs({include_docs: true}).then(function (result) {
          if (result && result.rows && result.rows.length) {
            var promises = result.rows.map(function (element) {
              this._db.remove(element.doc);
            }, self);
            return Promise.all(promises);
          } else {
            return Promise.resolve();
          }
        }).then(function () {
          resolve();
        }).catch(function (err) {
          reject(err);
        });
      });
    }
  };

  PouchDBPersistenceStore.prototype.keys = function () {
    var self = this;

    return new Promise(function (resolve, reject) {
      self._db.allDocs().then(function (result) {
        var rows = result.rows;
        var keysArray = [];
        if (rows && rows.length) {
          keysArray = rows.map(function (element) {
            return element.id;
          });
        }
        resolve(keysArray);
      }).catch(function (err) {
        reject(err);
      });
    });
  };

  // return a promise that resolves to an expression that can be
  // understood by pouchdb find plugin.
  PouchDBPersistenceStore.prototype._prepareFind = function (findExpression) {

    var modifiedExpression = findExpression || {};

    // ideally we should allow sort, but PouchDB-find-plugin
    // has bug on that, so disable sorting at this time.
    var sortFieldsArray = modifiedExpression.sort;
    if (sortFieldsArray !== undefined) {
      delete modifiedExpression.sort;
    }

    // selector is required from pouchdb.find plugin, thus create a selector
    // property if no selector is explicitely defined in findExpression. The
    // default selector is {'_id': {$gt: null}} which selects everything.
    var selector = modifiedExpression.selector;
    if (!selector) {
      modifiedExpression.selector = {
        '_id': {'$gt': null}
      };
    }

    // our key attribute maps to pouchdb documents' _id field.
    var fields = modifiedExpression.fields;
    if (fields && fields.length) {
      var modifiedFields = fields.map(function (x) {
        if (x === 'key') {
          return '_id';
        } else {
          return x;
        }
      });
      modifiedExpression.fields = modifiedFields;
    }

    return modifiedExpression;
  };

  // prepare the value for upsert. pouchDB requires that binary part of the value
  // be added as attachment instead of as part of the value.
  PouchDBPersistenceStore.prototype._prepareUpsert = function (value, attachmentParts) {
    var path = '';
    this._inspectValue(path, value, attachmentParts);
  };

  // scan the value to see if there's any binary data in it, if so, extract it out.
  PouchDBPersistenceStore.prototype._inspectValue = function (path, value, attachmentParts) {
    for (var key in value) {
      if (value.hasOwnProperty(key)) {
        var itemValue = value[key];
        if (itemValue && typeof(itemValue) === 'object') {
          if ((itemValue instanceof Blob) || (itemValue instanceof ArrayBuffer)) {
            var localPath = path;
            if (localPath.length > 0) {
              localPath = localPath + '.';
            }
            var attachment = {
              path: localPath + key,
              value: itemValue
            };
            attachmentParts.push(attachment);
            value.key = null;
          } else if (itemValue.length === undefined) {
            var oldPath = path;
            if (path.length > 0) {
              path = path + '.';
            }
            path = path + key;
            this._inspectValue(path, itemValue, attachmentParts);
            path = oldPath;
          }
        }
      }
    }
  };

  return PouchDBPersistenceStore;
});
