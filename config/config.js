requirejs.config({
  // Path mappings for the logical module names
  baseUrl: "js",
  paths: {
    'promise': 'persist/es6-promise.min',
    'fetch' : 'persist/fetch',
    'pouchdb' : 'persist/pouchdb-browser-7.0.0'
  },
  // Shim configurations for modules that do not expose AMD
  shim: {
        'promise': {
          exports: ['promise']
        },
        'fetch': {
          exports: ['fetch']
        },
        'pouchdb': {
          exports: ['pouchdb']
        }
  }
});
