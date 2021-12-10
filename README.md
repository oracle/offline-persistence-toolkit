# offline-persistence-toolkit 1.5.7 #

offline-persistence-toolkit is a client-side JavaScript library that provides caching and offline support at the HTTP request layer. This support is transparent to the user and is done through the Fetch API and an XHR adapter. HTTP requests made while the client device is offline are captured for replay when connection to the server is restored. Additional capabilities include a persistent storage layer, synchronization manager, binary data support and various configuration APIs for customizing the default behavior. This framework can be used in both ServiceWorker and non-ServiceWorker contexts within web and hybrid mobile apps.

## Introduction ##

A common issue faced by web and hybrid mobile application developers is how to ensure a reasonable user experience under a range of connectivity conditions.  Some applications are targeted at users who are known to be completely offline during normal use (e.g. field service workers who may lose connectivity for extended periods of time).  Other applications may need to be optimized to cope with intermittent connection loss, or to deal with high latency connections without the resulting user experience degrading to the point of being unusable.

There are various approaches to addressing this issue, most of which involve caching data locally at the browser or device while connected so that the data can be quickly accessed during later periods of slow, limited or no connectivity. Some solutions include:

- Caching resources via the [HTML5 application cache](https://developer.mozilla.org/en-US/docs/Web/HTML/Using_the_application_cache "HTML5 application cache").  This feature is now deprecated.
- Caching resources via the [HTML5 Service Workers](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API "HTML5 Service Workers").  This Service Worker API is an excellent addition to the web platform that will help application developers address a range of connectivity requirements.  However, this feature is [not available](http://caniuse.com/#feat=serviceworkers "not available") in some browsers (Safari, IE) and is still under development in others (Edge).
- Application-specific managing of persistent storage.  Applications have access to a range of local storage APIs, including those directly provided by the browsers ([localStorage](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage "localStorage"), [IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API "IndexedDB")), along with various third party storage libraries (e.g. [PouchDB](https://pouchdb.com/ "PouchDB")).  Industrious application developers can leverage these APIs to meet their caching needs, though this is typically a tedious manual exercise.

The Offline Persistence Toolkit simplifies life for application developers by providing a response caching solution that works well across modern browsers.  The toolkit covers common caching cases with a minimal amount of application-specific coding, but provides flexibility to cover non-trivial cases as well.  In addition to providing the ability to cache complete response payloads, the toolkit supports "shredding" of REST response payloads into objects that can be stored, queried and updated on the client while offline.

The following sections provide an introduction to the Offline Persistence Toolkit.

After reading this document, you can find more information about how to implement a range of common and advanced use cases with the toolkit in the [Usage guide](https://github.com/oracle/offline-persistence-toolkit/blob/master/USAGE.md "Usage").

Details of the toolkit's JavaScript API can be found in the [JSDoc](https://oracle.github.io/offline-persistence-toolkit/ "JSDoc").

The architecture diagram illustrates the major components of the toolkit and how an application interacts with it.

![](https://oracle.github.io/offline-persistence-toolkit/images/arch_diagram.png)

## Getting Started ##

The Offline Persistence Toolkit is distributed as an [npm](https://www.npmjs.com/ "npm") package consisting of [AMD](https://github.com/amdjs/amdjs-api/blob/master/AMD.md "AMD") modules.

To install the toolkit, enter the following command at a terminal prompt in your app’s top-level directory:

    npm install @oracle/offline-persistence-toolkit

After you install the toolkit’s npm package, your app will have the following additional directory structure in the `node_modules` directory:

```javascript
node_modules\@oracle\offline-persistence-toolkit\dist\debug
node_modules\@oracle\offline-persistence-toolkit\dist\min
```
If you are using the Offline Persistence Toolkit as a library in an Oracle JET app, edit `oraclejet-build.js` to include the toolkit as a library in the app that the Oracle JET tooling framework includes by default when building your app, as illustrated by the following example:

```javascript

copyCustomLibsToStaging: {
    fileList: [
              {cwd:'node_modules/@oracle/offline-persistence-toolkit/',
               src: ['*'],
               dest: 'web/js/libs/persist'	}
              ]
},

```


If your app uses [RequireJS](http://www.requirejs.org/ "RequireJS"), update the library configuration paths to reference the toolkit. To do this, open `appDir/src/js/main.js` and edit `requirejs.config()`, as illustrated by the following example.

```javascript
  requirejs.config({
    paths: {
      'persist' : 'js/libs/persist/v1.5.7/min'

      // Other path mappings here
 }
```
For Oracle JET apps, also open `appDir/src/js/main-release-paths.json` and add the `'persist' : 'js/libs/persist/v1.5.7/min'` entry to the list of paths.

You can choose the name of the paths prefix. That is, you can use a different value to the ‘persist’ value shown in the examples.

It is recommended to add the version number as a convention in your application build step such as `'persist' : 'js/libs/persist/v1.5.7/min'`.

Versions of the toolkit are also available on CDN under the latest JET release. e.g.

https://static.oracle.com/cdn/jet/v6.2.0/3rdparty/opt/debug

or

https://static.oracle.com/cdn/jet/v6.2.0/3rdparty/opt/min

The toolkit makes heavy use of the [Promise API](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise "Promise API").  If you are targeting environments that do not support the Promise API, you will need to polyfill this feature.  We recommend the [es6-promise polyfill](https://github.com/stefanpenner/es6-promise "es6-promise polyfill").

The toolkit does not have a dependency on a specific client-side storage solution, but does include a PouchDB adapter.  If you plan to use PouchDB for your persistent store, you will need to install the following PouchDB packages (This version of the toolkit is certified with version 7.2.2 of pouchdb and requires apps to use this version):

    npm install pouchdb pouchdb-find

And again, if you are using RequireJS, you will need to map paths for these packages, e.g.:

```javascript

 requirejs.config({
    paths: {
      'pouchdb': 'js/libs/pouchdb-7.2.2',
      'pouchfind': 'js/libs/pouchdb.find',
      'persist' : 'js/libs/persist/v1.5.7/min'

      // Other path mappings here
 }

```
pouchdb-find version 3.4 requires PouchDB to be available as a global variable. So if you are using RequireJS, please ensure to add PouchDB to global scope in your main.js. Something like below,

```javascript

 require([
   'pouchdb','app'
 ], function (pouchdb, app) {
   window.PouchDB = pouchdb;
  .......
 });

```

Repeat the steps shown previously for the `offline-persistence-toolkit` for each of the packages that you have installed (`pouchdb` and `pouchdb-find`). That is, update `oraclejet-build.js` and `appDir/src/js/main-release-paths.json` with corresponding entries.

Unlike the 'persist' path prefix, the path prefixes for the PouchDB packages must be specified as shown above - i.e. these names must be 'pouchdb' and 'pouchfind'.

The toolkit also supports persisting to the device filesystem which requires the [cordova-file-plugin](https://cordova.apache.org/docs/en/latest/reference/cordova-plugin-file/ "cordova-file-plugin").

Note that RequireJS is not a requirement for using the Offline Persistence Toolkit.  The toolkit should be compatible with any JavaScript bundlers/loaders that are capable of processing AMD modules.

## Simple GET Response Caching ##

The API design for the Offline Persistence Toolkit is heavily inspired by the ServiceWorker and related APIs, such as [Fetch](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API "Fetch") and [Cache](https://developer.mozilla.org/en-US/docs/Web/API/Cache "Cache").

A common ServiceWorker pattern is to use the worker to serve up previously cached content.  The ServiceWorker is registered for a scope:

```javascript

  navigator.serviceWorker.register('/some-service-worker-impl.js', {scope: '/employees/'});

```

The worker implementation can listen for fetch events and respond by producing a previously cached [Response](https://developer.mozilla.org/en-US/docs/Web/API/Response "Response"):

```javascript

  this.addEventListener('fetch', function(event) {
    event.respondWith(
      caches.match(event.request)
    );
  });

```

The Offline Persistence Toolkit follows a similar pattern.  Each endpoint of interest is identified by a scope that is registered with the [PersistenceManager API](https://oracle.github.io/offline-persistence-toolkit/PersistenceManager.html "PersistenceManager API"):

```javascript

  persistenceManager.init().then(function() {
    persistenceManager.register({scope: '/employees'})
  ));


```

The persistenceManager.register() call returns a Promise that resolves to a PersistenceRegistration instance.  Once resolved, the application can add event listeners to handle fetch requests for the scope:

```javascript

  persistenceManager.init().then(function(){
    persistenceManager.register({scope: '/employees'})
      .then(function(registration) {
        registration.addEventListener('fetch', function() {

          // Implement response caching here.

        });
      });
    });
  });



```

While the application could hand-code the fetch event listener, the toolkit provides a convenience API for producing cache-aware listener implementations: the [DefaultResponseProxy](https://oracle.github.io/offline-persistence-toolkit/DefaultResponseProxy.html "DefaultResponseProxy API").

The most trivial use of the DefaultResponseProxy looks like this:

```javascript

  var responseProxy = defaultResponseProxy.getResponseProxy();
  var fetchListener = responseProxy.getFetchEventListener();
  registration.addEventListener('fetch', fetchListener);

```

By default, the fetch event listener produced by the DefaultResponseProxy handles GET requests by first checking see whether the browser/device is online.  If the browser is online, the GET request is sent to the endpoint and the response is cached by writing the response payload to local persistence storage.  If the browser is offline, the default fetch listener will return a previously cached response, if one is available.

This is the simplest form of response caching supported by the Offline Persistence Toolkit.  As we will see in later sections, this behavior is configurable, allowing the application to address more interesting use cases.






### What Storage? ###

As mentioned in the previous section, the Offline Persistence Toolkit caches responses to persistence storage locally within the browser/on the device.  The form of this persistence storage is left up to the application developer.  The toolkit supports three choices of storage implementations out of the box: PouchDB, localStorage, or filesystem storage.  Other storage solutions (e.g. [WebSQL](https://en.wikipedia.org/wiki/Web_SQL_Database "WebSQL")) could be implemented by providing a custom persistenceStoreFactory.  It is also possible to use a mix of storage solutions - e.g. responses from an endpoint with minimal storage size requirements could be stored in localStorage, whereas a second endpoint with larger storage requirements could be configured to persist to pouchDB. If storage of large binary file data is required, then the filesystem storage could be used.

Since it is important for the application developer to determine the preferred type of storage for each use case, the toolkit does not specify a default storage solution.  The app must explicitly configure the preferred storage implementation via the [PersistenceStoreManager API](https://oracle.github.io/offline-persistence-toolkit/PersistenceStoreManager.html "PersistenceStoreManager API").  This preference can be configured globally via a call to persistenceStoreManager.registerDefaultStoreFactory():

```javascript

  persistenceStoreManager.registerDefaultStoreFactory(pouchDBPersistenceStoreFactory);

```

It can also be configured on a per-store basis via a call to persistenceStoreManager.registerStoreFactory().



### All Together Now ###
Putting the snippets from the above sections together, and wrapping this in an AMD-style require() call, we end up with the following:

```javascript

require([
  'persist/persistenceStoreManager',
  'persist/pouchDBPersistenceStoreFactory',
  'persist/persistenceManager',
  'persist/defaultResponseProxy'],
  function(
    persistenceStoreManager,
    pouchDBPersistenceStoreFactory,
    persistenceManager,
    defaultResponseProxy) {
      persistenceStoreManager.registerDefaultStoreFactory(pouchDBPersistenceStoreFactory);
      persistenceManager.init().then(function() {
        persistenceManager.register({scope: '/employees'})
          .then(function(registration) {
            var responseProxy = defaultResponseProxy.getResponseProxy();
            var fetchListener = responseProxy.getFetchEventListener();
            registration.addEventListener('fetch', fetchListener);
          });
      });
  });


```

With the above code, responses from the /employees endpoint will be cached into PouchDB-based storage, and will be available when the application is offline.

### Under the Hood ###
The Offline Persistence Toolkit works by replacing the browser's native HTML5 [Fetch](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API "Fetch") and [XMLHttpRequest](https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest "XMLHttpRequest") APIs with implementations that hook into the persistence logic. This replacement is done in the persistenceManager.init() call. The Offline Persistence Toolkit's XHR object is implemented as an adapter which talks to the fetch implementation. If the browser does not support the HTML5 Fetch API, a fetch polyfill is installed by the toolkit.

If you need to control the order in which the fetch and XHR APIs are replaced, please do so by calling persistenceManager.init() at the right time. For example, there are several mock fetch and XHR libraries which are used for unit testing. Those should be loaded first, followed by persistenceManager.init().

## Shredding and Querying ##

Assuming requests to the /employees endpoint return a response that defines collection of employees:

```javascript
[
  {
    "EmployeeId": 100,
    "FirstName": "Dave",
    "DepartmentId": 10
  },
  {
    "EmployeeId": 101,
    "FirstName": "Carrie",
    "DepartmentId": 20
  },
  {
    "EmployeeId": 102,
    "FirstName": "Mia",
    "DepartmentId": 10
  }
]

```

With the simple endpoint configuration shown in the previous section, the entire body of the response payload will be cached.  As a result, subsequent requests to the same url can be serviced even when the browser is offline: the  response payload will be extracted from the cache and returned to the code that issued the request.

However, requests that attempt to filter the set of employees via query parameters, such as the following example:

	http://example.org/employees?DepartmentId=10

Will not return anything unless the exact same request was made before.

To support the case where a subset of a previously cached collection is requested, the toolkit includes a response "shredding" mechanism.  Rather than storing the text of the response payload as a document, the payload can be broken down (shredded) into individual objects and properties which are then written as entries into the persistent store.

For example, after shredding the unfiltered response from the employees/ endpoint, entries for each of the three employees are stored.  The entries can then be queried via the properties that appear in the response.  A request with the query parameter "?DepartmentId=10" will produce a response with two entries (the two employees with DepartmentId=10).  If the application is offline, this response will be produced by querying the local store, extracting the two matching entries, and then reversing the shredding the process (i.e. "unshredding") in order to produce the response payload.

To enable this capability, the application must configure a "shredder",  "unshredder" and "queryHandler" when initializing the DefaultResponseProxy for the endpoint. The queryHandler processes the actual URL query parameter and maps them to queries to the local store.

```
var responseProxy = defaultResponseProxy.getResponseProxy({
    jsonProcessor: {
        shredder: simpleJsonShredding.getShredder('emp', 'EmployeeId'),
        unshredder:simpleJsonShredding.getUnshredder()
    },
    queryHandler: queryHandlers.getSimpleQueryHandler('emp')
});
```

The toolkit provides "simple" shredder and unshredder implementations via the [simpleJsonShredding](https://oracle.github.io/offline-persistence-toolkit/simpleJsonShredding.html "simpleJsonShredding") module.  This simple shredder requires two pieces of information:

1. The name of the persistent store to which the shredded data should be written (e.g. 'emp').
2. The name of the property that uniquely identifies each entry (e.g. EmployeeId).

The simpleJsonShredding implementation assumes that the response payload is either a flat JSON collection (like the employees response shown above) or a single JSON object.  In the collection case, each entry in the collection will produce a corresponding entry in the persistent store.  In the single JSON object case, only a single entry is written.

As the structure of response payloads can vary from endpoint to endpoint, applications can also implement their own custom shredders and unshredders to meet their own needs.

If the backend resource exposed through a collection endpoint allows delete, there are always race conditions where
rows are deleted behind the scenes. If the resource is cached and shredded on the client, it is possible that even
though a row is deleted at the backend, it can still exist on the client. If queryHandler is configured to support
querying the shredded client data, that row that does not exist on server will be served from client cache. Application
needs to accept that staleness is a possibility. There is one scenario that Offline Persistence Toolkit can help dealing
with staleness is when a returned collection from server is known to be complete. A complete collection response contains
all rows of the resources, thus any client side rows that are not in the list will be removed from the shredded store.
A complete collection response is a collection response that is either one of the following:

1. It is a response that is served to a request which does not contain any query parameters
2. It is a response that is served to a request which only contains offset or limit query parameters where offset is 0
   and the response contains less rows than the specified limit when limit is bigger than 0.

In order for Offline Persistence Toolkit to figure our the offset and limit of the request, queryHandler can
have an optional method normalizeQueryParameter which takes a url and returns a structure as defined in
[NormalizedQuery](https://oracle.github.io/offline-persistence-toolkit/NormalizedQuery.html "NormalizedQuery").
The two out-of-box queryHandlers support normalizeQueryParameter. Any custom queryHandler that would like to
leverage this feature needs to implement normalizeQueryParameter.


## Modifications: PUT and DELETE ##

When a PUT or DELETE request occurs while offline, the local shredded data is updated.  As a result, subsequent GET requests that happen while offline will reflect the updates. This is handled automatically by the toolkit if a shredder/unshredder is defined. In terms of the flow when offline, PUT/DELETE requests generated by the application are first shredded and then the corresponding local store is updated. The request is then persisted in the sync log for later replay to the server. All HTTP requests which satisfy a configured scope will be persisted regardless of type. The sync log can be accessed via the [PersistenceSyncManager API](https://oracle.github.io/offline-persistence-toolkit/PersistenceSyncManager.html "PersistenceSyncManager API").

## Creation: POST ##

POST requests while offline are not automatically handled by the toolkit. The reason is that POST requests are neither idempotent nor safe. To support processing of POST requests while offline a custom POST request handler must be defined. If a custom POST request handler is not defined then all POST requests while offline will result in a HTTP 503 error. Please see the code fragment below to define a custom POST request handler.

```javascript
// custom implementation to handle the POST request
_handlePost = function (request) {
  return new Promise(function (resolve, reject) {
    // application logic
  });
};
var responseProxy = defaultResponseProxy.getResponseProxy({requestHandlerOverride: {handlePost: _handlePost}});

```

A common use case involving POST requests is for the creation of resources. Frequently such objects would specify temporary id on the client set during creation when offline.  After syncing the request with the server, the temporary id would be fixed up based on information in the resulting response.  A sync event listener can be used to handle for this purpose:

```javascript
//  register the listener with sync manager on 'syncRequest' to handle any cleanup.
//  For example, replace client generated id with server generated id

self.afterRequestListener = function(event) {
    var statusCode = event.response.status;
    if (statusCode == 200) {
        // sync is successful, do any clean up as needed.
    }
}
persistenceManager.getSyncManager().addEventListener('syncRequest', self.afterRequestListener, '/createEmployee');
```

## Syncing and Conflict Handling ##
The synchronization process involves replaying all of the requests which were persisted in the sync log while the application was offline. All HTTP requests which are for a configured scope will be persisted in the sync log when offline. The sync process must be manually triggered by the call below, which returns a Promise.
    persistenceManager.getSyncManager().sync();

The Promise will resolve upon successful replay of all the requests in the sync log, or will be rejected upon the first unsuccessful replay of a request. All successful requests are removed from the sync log as they are replayed. A failed request will halt the sync process.

If a new request is initiated while a sync is in progress, the request gets queued and will be played at the end of current sync. This will ensure that the order of the requests are kept intact in case of a glitchy connection. This is the default behaviour of all the request handlers of the offline toolkit. If you have a custom requestHandler, you can match this behaviour by checking if the promise returned by the sync() API call is already resolved or not. If not, you need to handle the request as if the system is offline and the sync will take care of processing the request. [Please note that any request from the syncRequest event handler will be played in real time though the sync is in progress. This is to ensure that the afterRequestHandler completes successfully as intended].

There can be cases where upon syncing with the server, the change made on the client conflicts with the change made on server. Conflict resolution is very application-specific and the toolkit does not contain any default conflict resolution logic. The application will need to implement its own conflict resolution.

For example:

- To implement "server wins" conflict resolution, applications can discard the local change on promise failure from persistenceSyncManager.sync(). Depending on the application server implementation, the client either gets the most up-to-date value from the server during sync, or has to fetch to refresh local data.
- To implement "client wins", the server-side logic simply accepts the value submitted by the client.  In this case, persistenceSyncManager.sync() promise will always succeed.
- To implement interactive conflict resolution, applications can respond to persistenceSyncManager.sync() failures by displaying some UI to the end user.  For example, the application might open a dialog that includes both the server data and client data and allow the user to decide which one wins.



## Configuration ##
Several aspects of the toolkit are completely customizable. The main entry point for customization is via the options passed into the defaultResponseProxy.getResponseProxy(options).

The following items can be customized:


### fetchStrategy ###
The fetchStrategy defines the behavior of GET requests. There are a couple of [fetchStrategies](https://oracle.github.io/offline-persistence-toolkit/fetchStrategies.html "fetchStrategies") which are available out of the box which define under what conditions the toolkit will serve GET requests from the cache. The default fetchStrategy is fetchStrategies.getCacheIfOfflineStrategy(). To specify one of the available fetchStrategies or your own custom one, use the fetchStrategy option:

```javascript
var responseProxy = defaultResponseProxy.getResponseProxy(
              {
                fetchStrategy: customFetchStrategy
              });

```

### cacheStrategy ###
The cacheStrategy defines the behavior of what is cached as well as its expiration and eviction.  There is one [cacheStrategy](https://oracle.github.io/offline-persistence-toolkit/cacheStrategies.html "cacheStrategy") available out of the box and it is also the default. The default cacheStrategy is cacheStrategies.getHttpCacheHeaderStrategy() which uses the HTTP cache headers to determine caching and expiration. To specify your own custom cacheStrategy, use the cacheStrategy option:

```javascript
var responseProxy = defaultResponseProxy.getResponseProxy(
              {
                cacheStrategy: customCacheStrategy
              });

```

### queryHandler ###
The queryHandler defines the behavior of how URL query parameters are handled. There are two [queryHandlers](https://oracle.github.io/offline-persistence-toolkit/queryHandlers.html "queryHandlers") available out of the box. One is a simple queryHandler which matches URL query parameter name/values with corresponding persistent store field/values. The other queryHandler supports the Oracle REST standard for URL query parameters. To specify one of the available queryHandlers or your own custom one, use the queryHandler option:

### requestHandlerOverride ###
Each HTTP request for a registered endpoint is processed by a default HTTP request handler defined in defaultResponseProxy according to the request method. For example, GET requests are handled by a GET request handler which uses the specified fetchStrategy to handle the GET request. To override the default request handlers, please specify the requestHandlerOverride option to use your custom request handler:

```javascript


var responseProxy = defaultResponseProxy.getResponseProxy(
              {
                requestHandlerOverride.handleGet: customGetHandler,
                requestHandlerOverride.handlePost: customPostHandler,
			  });


```

### logger ###
To enable detailed logging information, please set the log level on the toolkit logger:

```javascript


logger.option('level',  logger.LEVEL_LOG);


```

## Offline Toolkit In Action ##
Please check out the [FixItFast sample app](http://www.oracle.com/webfolder/technetwork/jet/public_samples/FixItFast-Redwood/public_html/index.html "FixItFast sample app") to see the Offline Persistence Toolkit in action.

## Contributing ##
This is an open source project maintained by Oracle Corp. Pull Requests are currently not being accepted. See [CONTRIBUTING](https://github.com/oracle/offline-persistence-toolkit/tree/master/CONTRIBUTING.md "CONTRIBUTING") for details.

## License ##
Copyright (c) 2017 Oracle and/or its affiliates The Universal Permissive License (UPL), Version 1.0.
