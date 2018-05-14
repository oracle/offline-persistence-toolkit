# offline-persistence-toolkit 1.1.2 #

# Introduction #

This document describes how you use the Offline Persistence Toolkit (the toolkit) to implement a range of common and advanced use cases with the toolkit. The document assumes that you have already installed the toolkit in your application and reviewed the toolkit’s [README](https://github.com/oracle/offline-persistence-toolkit/ "README") file which provides an overview of the toolkit’s capabilities. If you have not done so, please see [README](https://github.com/oracle/offline-persistence-toolkit/ "README").

The document progresses from simple to more complex use cases.

The links to the [JSDoc](https://oracle.github.io/offline-persistence-toolkit/ "JSDoc") for all classes are available on this page.

# Common Use Cases #
## Read-Only	
The simplest read-only use case does not require any extra configuration apart from specifying the scope when registering with the [PersistenceManager](https://oracle.github.io/offline-persistence-toolkit/PersistenceManager.html "PersistenceManager"). This provides simple persisting of requests and responses. When online, all requests go to the server and the responses are persisted. When offline, those persisted responses are returned for matching requests. Requests are also inserted in the sync log for replay later when the application is back online.


```javascript

var empResponseProxy = defaultResponseProxy.getResponseProxy(); 
persistenceManager.register({scope:  '/employees' }).then(function (registration) { 
   registration.addEventListener( 'fetch' , empResponseProxy.getFetchEventListener()); 
}); 



```

## Read-Only and Fetch Strategy	
The fetch strategy defines how a resource is fetched. The toolkit provides two ready-to-use [fetchStrategies](https://oracle.github.io/offline-persistence-toolkit/fetchStrategies.html "fetchStrategies"):
- CacheIfOfflineStrategy (default)
- CacheFirstStrategy

The following code example shows how you fetch employees using the non-default CacheFirstStrategy.

```javascript

var empResponseProxy = defaultResponseProxy.getResponseProxy( 
         { 
         fetchStrategy: fetchStrategies.getCacheFirstStrategy() 
         }); 
persistenceManager.register({scope:  '/employees' }).then(function (registration) 
    {
     registration.addEventListener
      ( 'fetch' , defaultEmpResponseProxy.getFetchEventListener()); 
    }
); 



```

## Read-Only with Offline Search	

In order to facilitate searching of cached records whilst offline, the rows of a collection-based response payload need to be stored individually. The process of tearing down a collection type response payload into individual rows is called *shredding*. Conversely, assembling individual rows into a collection type of response is called *unshredding*. The toolkit provides two ready-to-use shredding methods: [simpleJsonShredding](https://oracle.github.io/offline-persistence-toolkit/simpleJsonShredding.html "simpleJsonShredding") and [oracleRestJsonShredding](https://oracle.github.io/offline-persistence-toolkit/oracleRestJsonShredding.html "oracleRestJsonShredding"). In addition, you need to specify a `queryHandler` to define how the toolkit will handle the URL query parameters for the query. GET requests specify queries using URL query parameters but the format of those parameters is up to the application. The toolkit provides two ready-to-use [queryHandlers](https://oracle.github.io/offline-persistence-toolkit/queryHandlers.html "queryHandlers"): `queryHandlers.getSimpleQueryHandler()` and `queryHandlers.getOracleRestQueryHandler()`. The simple query handler assumes field-value pairs for the URL query parameters while the Oracle REST query handler follows the Oracle REST standard.



The following code example illustrates how you shred and unshred a collection of employees, plus use the simple query handler to specify a field-value pair of item and limit.


```javascript

var empResponseProxy = defaultResponseProxy.getResponseProxy( 
    jsonProcessor: { 
      shredder: simpleJsonShredding.getSimpleJsonShredder( 'employees' ,  'EmployeeId' ),
      unshredder:  simpleJsonShredding.getSimpleJsonUnshredder() 
		   }, 
    queryHandler: queryHandlers.getSimpleQueryHandler('item', ['limit'])});       
    
persistenceManager.register({scope: '/employees' }).then(function (registration) { 
   registration.addEventListener( 'fetch' , empResponseProxy.getFetchEventListener());
}); 


```





## Offline Update	
You can enable an offline update operation in your application by registering the data that you want to update while offline. The toolkit automatically records the update operations and replays them when the application returns online. You also need to enable shredding to access the updated resources before the update operations can be replayed.

The following code example illustrates how you might implement this use case for an `ID` value.


```javascript


var itemResponseProxy = defaultResponseProxy.getResponseProxy( 
  jsonProcessor: { 
     shredder: simpleJsonShredding.getSimpleJsonShredder( 'item' ,  'ID' ), 
     unshredder:  simpleJsonShredding.getSimpleJsonUnshredder() 
  } 
}); 
persistenceManager.register({ 
   scope:  '/item' 
   }).then(function (registration) { 
    registration.addEventListener
      ( 'fetch' , itemResponseProxy.getFetchEventListener()); 
 }); 


```



## Offline Creation	

You can enable offline creation through the use of REST calls (PUT or POST). The PUT request approach would be the same as the previous use case for Offline Update. Using POST is a more advanced case where your application must override `handlePost` on the response proxy. In addition, cleanup of the client-side data may be needed after the request is replayed. For example, your application might create an object with a fake ID and then the server substitutes the real ID when the object creation is replayed. Any foreign keys linked to the fake ID must be cleaned up upon replay. Such cleanup can be implemented within a `syncRequest` event listener on the [PersistenceSyncManager](https://oracle.github.io/offline-persistence-toolkit/PersistenceSyncManager.html "PersistenceSyncManager"). 


```javascript
var customHandlePost = function(request) {      
// Custom implementation to handle the POST request 
}; 

var createOrderResponseProxy = 
     defaultResponseProxy.getResponseProxy({requestHandlerOverride: 
                                        {handlePost: customHandlePost}); 


persistenceManager.register({ 
       scope:  '/createOrder' 
     }).then(function (registration) { 
       registration.addEventListener
         ( 'fetch' , createOrderResponseProxy.getFetchEventListener()); 
     }); 
                             
  
// Register the listener with the sync manager on 'syncRequest' to handle any cleanup. 
// For example, replace client-generated ID with server-generated ID 

persistenceManager.getSyncManager().addEventListener
                  ( 'syncRequest' , self.afterRequestListener,  '/createOrder' ); 
  

// Listener implementation 
self.afterRequestListener= function (event) { 
   var statusCode = event.response.status; 
   if   (statusCode ==  200 ) { 
     // Sync is successful, do cleanup as needed. 
     // The simplest, although not most efficient, is to refetch. 
   } 
} 



```



## Online Replay with Conflict Resolution	
This use case describes how you can use the toolkit to implement conflict resolution logic in your application. 

Applications can call `persistenceSyncManager.sync()` whenever they needs to synchronize with the server.

- To resolve data conflict by applying server-side changes, the application can always discard local changes on promise failure from persistenceSyncManager.sync(). Depending on the application server implementation, the client either gets the most-up-to-date value from the server during synchronization, or has to fetch to refresh local data, as demonstrated by the following example. 

```javascript

syncManager.sync().then(function () { 
	 // Finished! 
     }, function (error) { 
	 var requestId = error.requestId; 
         var response = error.response;
         syncManager.removeRequest(requestId);
         
         // if needed, application logic to update the local
         // data with the response from the server 
                  .....
         });


```
- To resolve data conflict by applying client-side changes, configure the server-side implementation so that the persistenceSyncManager.sync() promise always succeeds.
- To implement interactive conflict resolution, the application can implement logic on promise failure from persistenceSyncManager.sync() . For example, you can implement logic to open a dialog that populates with server data and client data and allows the end user to choose the data to use.



The following example demonstrates an interactive conflict resolution implementation where a dialog populated with client and server data opens when a conflict returns from the server.

```javascript

// invoke sync 
self.sync = function() { 
     $( '#offlineWrapper' ).ojButtonset( 'option' ,  'checked' , []); 
     syncManager.sync().then(function () { 
	 // Finished! 
     }, function (error) { 
	 var statusCode = error.response.status; 

      if   (statusCode ==  409   && error.request.url.match( '/location' ) !=  null)
	 { 
	   // there is a conflict, now open the dialog and populate both client and 
	   // server values 
	   $( "#errorLocationConflictDialog" ).ojDialog( "open" ); 
	   var request = error.request; 
	   var response = error.response; 
	   response.json().then(function (value) { 
	       inventoryVMClient.inventoryConflictServerArray(value); 
	   }); 
	   request.json().then(function (value) { 
	       inventoryVMClient.inventoryConflictClientArray(value); 
	   }); 
	   inventoryVMClient.inventoryConflictOperationId = error.requestId; 
	 } 
     }); 
} 
...
 
// The following code demonstrates how you implement client-side changes assuming 
// this is the option the end user chose from the interactive dialog that you 
// displayed previously 
self.locationConflictKeepClient = function () { 
 var serverInventory = self.inventoryConflictServerArray(); 
 var serverRevNum = serverInventory[ 'revNum' ]; 
 syncManager.removeRequest(self.inventoryConflictOperationId).then(function (request){ 
   $( "#errorLocationConflictDialog" ).ojDialog( "close" ); 
   PersistenceUtils.requestToJson(request).then(function (requestData) { 
     var inventory = JSON.parse(requestData.text); 
     inventory.revNum = serverRevNum; 
     requestData.text = JSON.stringify(inventory); 
     PersistenceUtils.requestFromJson(requestData).then(function (request) { 
      syncManager.insertRequest(request).then(function () { 
        syncManager.sync(); 
        }); 
     }); 
   }); 
  }); 
} 

```


# Advanced Use Cases #

## Implement Master-Detail Pattern 
A common application pattern is for a list to be displayed which permits drilling into the detail data for the row. The detail data may consist of details for that row as well as any child data which could be displayed in multiple lists on the detail page. On the server side, the list data and detail data may be represented as REST endpoints in hierarchical fashion. A typical sequence of GET requests for the list followed by a detail is as follows:

    GET /employeeList
    GET /employeeList/123/detail

Where `123` is the ID for the employee we want the details for. The persistence toolkit can handle this in a number of ways. The list and details could be modelled as two separate endpoints and the scope for the detail can be set as a regular expression which satisfies the endpoint pattern above. While this approach may be simple for read-only data, it becomes more complicated for updates as you may be required to keep the list and detail in the shredded store in sync if there is any overlap. This is especially true for deletes as the detail data should be deleted if the corresponding list item is deleted and vice versa. In addition, storage is inefficient if there is any overlap in data between list and detail.

    // scope regex only satisfies employee list
    
    var defaultEmpListResponseProxy = defaultResponseProxy.getResponseProxy(jsonProcessor: { shredder: simpleJsonShredding.getSimpleJsonShredder( 'empList' , 'ID' ), unshredder: simpleJsonShredding.getSimpleJsonUnshredder() });
    
    persistenceManager.register({scope: /employeeList($|\/\?)/ }).then(function (registration) {
    
      registration.addEventListener( 'fetch' , defaultEmpListResponseProxy. getFetchEventListener());
    
    });

    // scope regex only satisfies employee detail

    var defaultEmpDetailResponseProxy = defaultResponseProxy.getResponseProxy(jsonProcessor: { shredder: simpleJsonShredding.getSimpleJsonShredder( 'empDetail' , 'ID' ), unshredder: simpleJsonShredding.getSimpleJsonUnshredder() });

    persistenceManager.register({scope: /employeeList\/.*\/detail($|\/\?)/ }).then(function (registration) {

      registration.addEventListener( 'fetch' , defaultEmpDetailResponseProxy. getFetchEventListener());

    });

 

A better approach would be to store the list and detail in the same store. Fetching the detail should simply be treated as updating the list item with the detail data. This approach can be achieved by registering a scope with a regular expression which can satisfy the list and detail URLs and then writing a custom shredder/unshredder.

 

    // scope satisfies employee list and detail

    var defaultEmpResponseProxy = defaultResponseProxy.getResponseProxy(jsonProcessor: { shredder: customEmpShredder, unshredder: customEmpUnshredder });

    persistenceManager.register({scope: '/employeeList' }).then(function (registration) {

      registration.addEventListener( 'fetch' , defaultEmpDetailResponseProxy. getFetchEventListener());

    });

## Customizing the Fetch Strategies, Shredding Methods, and Storage Mechanism
The toolkit’s modular approach allows you to choose the desired behavior. You can use one of the ready-to-use pieces that we provide, such as the default fetch strategy, or you can develop and plug in your own code. An application can mix and match combinations of code provided by the toolkit and custom code that you develop. The following sections provide information describing how you might go above developing custom code.




### Customize Fetch Strategy	

The persistence toolkit currently supports the CacheFirstStrategy and CacheIfOfflineStrategy fetch strategies. If you want to customize the fetch strategy, you need to implement the fetch strategy function and add it to the response proxy, as demonstrated by the following example.

```javascript

/** 
 * Returns my customized fetch strategy 
 * @method 
 * @name MyCustomizedFetchStrategy 
 * @param {Request} request Request 
 * @param {Object=} options Options 
 * @param {Object} options.jsonProcessor An object containing the JSON shredder, 
 *                               unshredder, and queryHandler for the responses. 
 * @param {Object} options.jsonProcessor.shredder JSON shredder for the responses 
 * @param {Object} options.jsonProcessor.unshredder JSON unshredder for the responses 
 * @param {Object} options.jsonProcessor.queryHandler query parameter handler. Should 
 *                                        be a function which returns a Promise which 
 *                                        resolves with a response when the query 
 *                                        parameters have been processed. 
 *                                        If unspecified then uses the default which 
 *                                        uses the query parameters in the URL as the
 *                                        field names when querying the store. 
 * @param {function} options.serverResponseCallback The callback which will be called
 *                                        when the server responds 
 * @return {Promise} Returns a Promise which resolves to a Response object 
*/ 


var myCustomizedFetchStrategy = function(request, options) { 
   return   new   Promise(function(resolve, reject) { 
     // your customized logic goes here. 
   }); 
}; 
  
// this is how the fetch strategy is hooked with the framework: 
var defaultEmpResponseProxy =  defaultResponseProxy.getResponseProxy({ 
                                   fetchStrategy: myCustomizedFetchStrategy 
                                 });       
persistenceManager.register({scope:  '/employees' }).then(function (registration) { 
   registration.addEventListener
       ( 'fetch' , defaultEmpResponseProxy.getFetchEventListener()); 
}); 

```




### Customize Shredding Methods	

The persistence toolkit provides `simpleJsonShredding` and `oracleRestJsonShredding` out-of-the-box. Create your own custom shredding methods if the response payload is more complex than a simple JSON structure, as demonstrated by the following example.

```javascript

// this is how your customized shredding functions should look like 
function customizedShredder(response) {        
  return   new   Promise(function (resolve, reject) {          
    response.clone().text().then(function (payload) { 
       var i, idArray = [], dataArray = []; 
        if   (payload && payload.length) { 
           // customized logic here to parse the payload and generate idArray 
           // and dataArray. 
        } 
        resolve([{name: storeName, resourceIdentifier: resourceIdentifier, 
                  keys: idArray, data: dataArray, resourceType: resourceType}]); 
    }); 
  }); 
}}; 

function customizedUnshredder (response, data) {     
  return   new   Promise(function(resolve, reject) { 
   // your customized logic goes here to unshred the data. 
    }); 
}}; 

  
// this is how the fetch strategy is hooked with the framework: 
var defaultEmpResponseProxy =   defaultResponseProxy.getResponseProxy({ 
                                 jsonProcessor: { shredder: customizedShredder, 
                                                  unshredder:  customizedUnshredder 
                                                }, 
                                 });       
persistenceManager.register({scope:  '/employees' }).then(function (registration) { 
   registration.addEventListener( 'fetch' , defaultEmpResponseProxy.
                                                          getFetchEventListener());
}); 

```



### Customize Storage Mechanism	

The following code samples demonstrate how you can:
- Implement a custom persistence store
- Implement a custom store factory that creates a custom persistence store
- Register the factory with the persistenceStoreManager 


Store Implementation

```javascript

define([ "PersistenceStore" ], function(PersistenceStore){ 
   var MyCustomizedPersistenceStore = function (name){ 
     //constructor here 
   } 
   MyCustomizedPersistenceStore.prototype =  new   PersistenceStore(); 
   MyCustomizedPersistenceStore.prototype.constructor = MyCustomizedPersistenceStore; 
   MyCustomizedPersistenceStore.superclass = PersistenceStore.prototype; 
  
   MyCustomizedPersistenceStore.prototype.upsert = function(key, metadata, value, 
                                                        expectedVersionIdentifier){}; 
  
   MyCustomizedPersistenceStore.prototype.upsertAll = function (values) {}; 
  
   MyCustomizedPersistenceStore.prototype.find = function(findExpression){}; 
  
   MyCustomizedPersistenceStore.prototype.findByKey = function(key){}; 
  
   MyCustomizedPersistenceStore.prototype.removeByKey = function(key){}; 
  
   MyCustomizedPersistenceStore.prototype.delete = function(deleteExpression){}; 
  
   MyCustomizedPersistenceStore.prototype.keys = function(){}; 
  
   return   MyCustomizedPersistenceStore; 
}); 


```

Store Factory Implementation

```javascript

define([ "MyCustomizedPersistenceStore" ], function(MyCustomizedPersistenceStore) { 
   var MyCustomizedPersistenceStoreFactory = (function () { 
     function _createPersistenceStore (name, options) { 
       // store creation logic goes here... 
     }; 
     return   { 
       'createPersistenceStore'   : function (name, options) { 
         return   _createPersistenceStore(name, options); 
       } 
     }; 
   }()); 
  
   return   MyCustomizedPersistenceStoreFactory; 
}); 
 


```

Register the store factory with `persistenceStoreManager`

```javascript

persistenceStoreManager.registerDefaultStoreFactory
                        (myCustomizedPersistenceStoreFactory); 
persistenceStoreManager.registerStoreFactory(
                        "myStoreName" , myCustomizedPersistenceStoreFactory); 

```

## Contributing ##
This is an open source project maintained by Oracle Corp. Pull Requests are currently not being accepted. See [CONTRIBUTING](https://github.com/oracle/offline-persistence-toolkit/tree/master/CONTRIBUTING.md "CONTRIBUTING") for details.

## License ##
Copyright (c) 2017 Oracle and/or its affiliates The Universal Permissive License (UPL), Version 1.0.
