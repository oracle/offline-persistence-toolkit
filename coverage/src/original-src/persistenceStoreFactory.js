/**
 * Copyright (c) 2017, Oracle and/or its affiliates.
 * All rights reserved.
 */

define([], function () {
  'use strict';
  
  /**
   * @export
   * @classdesc Contract for a PersistenceStoreFactory that provides a factory
   * method to create a PersisteneStore instance with the name and options. The
   * options is the same as the one used in
   * {@link persistenceStoreManager.openStore}. A default factory is provided
   * that implements this contract. Customers can register custom store factory
   * for creating persistence stores of their choice. 
   */
  var PersistenceStoreFactory = {
    createPersistenceStore: function (name, options) {}
  };

  return PersistenceStoreFactory;
});