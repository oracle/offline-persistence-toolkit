requirejs.config({
  // Path mappings for the logical module names
  baseUrl: "js",
  paths: {
    'promise': 'es6-promise.min',
    'fetch' : 'fetch',
    'pouchdb' : 'pouchdb-browser-6.3.4'
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
