/*global module:false*/
module.exports = function (grunt) {
  // Project configuration.
  grunt.initConfig({
    // Metadata.
    pkg: grunt.file.readJSON('package.json'),
    pouchdb_bundle: 'pouchdb-browser-7.2.2.js',
    paths: {
      src: 'src',
      src_files: 'src/**/*.js',
      ext_lib: 'lib',
      dist: 'dist',
      dist_debug: 'dist/debug',
      dist_min: 'dist/min',
      dist_bundles_min: 'dist/bundles',
      dist_bundles_debug: 'dist/bundles-debug',
      node_modules: 'node_modules',
      temp: 'temp',
      docs: 'docs',
      config: 'config'
    },
    banner: '/*! <%= pkg.title || pkg.name %> - v<%= pkg.version %> - ' +
      '<%= grunt.template.today("yyyy-mm-dd") %>\n' +
      '<%= pkg.homepage ? "* " + pkg.homepage + "\\n" : "" %>' +
      '* Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author.name %>;' +
      ' Licensed <%= _.pluck(pkg.licenses, "type").join(", ") %> */\n',
    copyRightBanner: '/**\n' +
        ' * Copyright (c) 2017, Oracle and/or its affiliates.\n' +
        ' * All rights reserved.\n' +
        ' */\n',
    watch: {
      gruntfile: {
        files: '<%= jshint.gruntfile.src %>'
      }
    },
    clean: {
      all: ['<%= paths.dist_debug %>',
        '<%= paths.dist_min %>',
        '<%= paths.dist_bundles_min %>',
        '<%= paths.dist_bundles_debug %>',
        '<%= paths.docs %>',
        '<%= paths.temp %>'],
      bundles_debug: '<%= paths.dist_bundles_debug %>',
      bundles_min: '<%= paths.dist_bundles_min %>'
    },
    browserify: {
      pouchDB_browser_bundle: {
        src: ['<%= paths.node_modules %>/pouchdb-browser/lib/index.js'],
        dest: '<%= paths.dist_debug %>/<%= pouchdb_bundle %>',
        options: {
          browserifyOptions: {
            standalone: 'PouchDB'
          }
        }
      }
    },
    requirejs: {
      compileBundles_min: {
        options: {
          mainConfigFile: 'config/config.js',
          baseUrl: '<%= paths.temp %>/min',
          optimize: 'none',
          modules: [
            {
              name: 'persist/persistenceManager'
            },
            {
              name: 'persist/arrayPersistenceStoreFactory',
              include: ['persist/persistenceStoreFactory'],
              excludeShallow: ['persist/impl/logger', 'persist/persistenceStoreManager']
            },
            {
              name: 'persist/pouchDBPersistenceStoreFactory',
              include: ['persist/persistenceStoreFactory', 'persist/configurablePouchDBStoreFactory'],
              excludeShallow: ['persist/impl/logger']
            },
            {
              name: 'persist/localPersistenceStoreFactory',
              include: ['persist/persistenceStoreFactory'],
              excludeShallow: ['persist/impl/logger']
            },
            {
              name: 'persist/fileSystemPersistenceStoreFactory',
              include: ['persist/persistenceStoreFactory'],
              excludeShallow: ['persist/impl/logger', 'persist/persistenceStoreManager']
            },
            {
              name: 'persist/defaultResponseProxy',
              include: ['persist/simpleJsonShredding', 'persist/oracleRestJsonShredding', 'persist/simpleBinaryDataShredding', 'persist/queryHandlers'],
              excludeShallow: ['persist/persistenceUtils',
                              'persist/impl/logger',
                              'persist/impl/PersistenceXMLHttpRequest',
                              'persist/persistenceStoreManager',
                              'persist/impl/defaultCacheHandler',
                              'persist/impl/PersistenceSyncManager',
                              'persist/impl/OfflineCache',
                              'persist/impl/offlineCacheManager',
                              'persist/impl/fetch',
                              'persist/persistenceManager']
            }
          ],
          dir: '<%= paths.dist_bundles_min %>',
          removeCombined: true
        }
      },
      compileBundles_debug: {
        options: {
          mainConfigFile: 'config/config.js',
          baseUrl: '<%= paths.temp %>/debug',
          modules: [
            {
              name: 'persist/persistenceManager'
            },
            {
              name: 'persist/arrayPersistenceStoreFactory',
              include: ['persist/persistenceStoreFactory'],
              excludeShallow: ['persist/impl/logger', 'persist/persistenceStoreManager']
            },
            {
              name: 'persist/pouchDBPersistenceStoreFactory',
              include: ['persist/persistenceStoreFactory', 'persist/configurablePouchDBStoreFactory'],
              excludeShallow: ['persist/impl/logger']
            },
            {
              name: 'persist/localPersistenceStoreFactory',
              include: ['persist/persistenceStoreFactory'],
              excludeShallow: ['persist/impl/logger']
            },
            {
              name: 'persist/fileSystemPersistenceStoreFactory',
              include: ['persist/persistenceStoreFactory'],
              excludeShallow: ['persist/impl/logger', 'persist/persistenceStoreManager']
            },
            {
              name: 'persist/defaultResponseProxy',
              include: ['persist/simpleJsonShredding', 'persist/oracleRestJsonShredding', 'persist/simpleBinaryDataShredding', 'persist/queryHandlers'],
              excludeShallow: ['persist/persistenceUtils',
                              'persist/impl/logger',
                              'persist/impl/PersistenceXMLHttpRequest',
                              'persist/persistenceStoreManager',
                              'persist/impl/defaultCacheHandler',
                              'persist/impl/PersistenceSyncManager',
                              'persist/impl/OfflineCache',
                              'persist/impl/offlineCacheManager',
                              'persist/impl/fetch',
                              'persist/persistenceManager']
            }],
          dir: '<%= paths.dist_bundles_debug %>',
          removeCombined: true,
          optimize: 'none'
        }
      }
    },
    rename: {
      main: {
        files: [
          {
            src: '<%= paths.dist_bundles_min %>/persist/persistenceManager.js',
            dest: '<%= paths.dist_bundles_min %>/persist/offline-persistence-toolkit-core-<%= pkg.version %>.js'
          },
          {
            src: '<%= paths.dist_bundles_min %>/persist/arrayPersistenceStoreFactory.js',
            dest: '<%= paths.dist_bundles_min %>/persist/offline-persistence-toolkit-arraystore-<%= pkg.version %>.js'
          },
          {
            src: '<%= paths.dist_bundles_min %>/persist/localPersistenceStoreFactory.js',
            dest: '<%= paths.dist_bundles_min %>/persist/offline-persistence-toolkit-localstore-<%= pkg.version %>.js'
          },
          {
            src: '<%= paths.dist_bundles_min %>/persist/pouchDBPersistenceStoreFactory.js',
            dest: '<%= paths.dist_bundles_min %>/persist/offline-persistence-toolkit-pouchdbstore-<%= pkg.version %>.js'
          },
          {
            src: '<%= paths.dist_bundles_min %>/persist/fileSystemPersistenceStoreFactory.js',
            dest: '<%= paths.dist_bundles_min %>/persist/offline-persistence-toolkit-filesystemstore-<%= pkg.version %>.js'
          },
          {
            src: '<%= paths.dist_bundles_min %>/persist/defaultResponseProxy.js',
            dest: '<%= paths.dist_bundles_min %>/persist/offline-persistence-toolkit-responseproxy-<%= pkg.version %>.js'
          },
          {
            src: '<%= paths.dist_bundles_debug %>/persist/persistenceManager.js',
            dest: '<%= paths.dist_bundles_debug %>/persist/offline-persistence-toolkit-core-<%= pkg.version %>.js'
          },
          {
            src: '<%= paths.dist_bundles_debug %>/persist/arrayPersistenceStoreFactory.js',
            dest: '<%= paths.dist_bundles_debug %>/persist/offline-persistence-toolkit-arraystore-<%= pkg.version %>.js'
          },
          {
            src: '<%= paths.dist_bundles_debug %>/persist/localPersistenceStoreFactory.js',
            dest: '<%= paths.dist_bundles_debug %>/persist/offline-persistence-toolkit-localstore-<%= pkg.version %>.js'
          },
          {
            src: '<%= paths.dist_bundles_debug %>/persist/pouchDBPersistenceStoreFactory.js',
            dest: '<%= paths.dist_bundles_debug %>/persist/offline-persistence-toolkit-pouchdbstore-<%= pkg.version %>.js'
          },
          {
            src: '<%= paths.dist_bundles_debug %>/persist/fileSystemPersistenceStoreFactory.js',
            dest: '<%= paths.dist_bundles_debug %>/persist/offline-persistence-toolkit-filesystemstore-<%= pkg.version %>.js'
          },
          {
            src: '<%= paths.dist_bundles_debug %>/persist/defaultResponseProxy.js',
            dest: '<%= paths.dist_bundles_debug %>/persist/offline-persistence-toolkit-responseproxy-<%= pkg.version %>.js'
          },
          {
            src: 'coverage/dist/debug/require-config-coverage.js',
            dest: 'coverage/dist/debug/bundles-config.js'
          }
        ]
      }
    },
    'string-replace': {
      dist: {
        files: [{
          expand: true,
          cwd: '<%= paths.config %>',
          src: 'bundles-config.js',
          dest: '<%= paths.dist_debug %>/'
        }],
        options: {
          replacements: [{
            pattern: /\{pkg.version\}/ig,
            replacement: '<%= pkg.version %>'
          }]
        }
      }
    },
    eslint: {
      src: ['<%= paths.src_files %>'],
      options: {
        configFile: "config/.eslintrc.js"
      }
    },
    copy: {
      oracle_logo: {
        files: [
          {
            expand: true,
            cwd: '<%= paths.config %>/oj',
            src: ['oracle_logo_sm.png'],
            dest: '<%= paths.docs %>'
          }
        ]
      },
      dist_debug: {
        files: [
          {
            expand: true,
            cwd: '<%= paths.src %>',
            src: ['*.js', '*/**'],
            dest: '<%= paths.dist_debug %>'
          }
        ]
      },
      dist_ext_lib: {
        files: [
          {
            expand: true,
            cwd: '<%= paths.ext_lib %>',
            src: ['*.js'],
            dest: '<%= paths.dist_debug %>'
          },
          {
            expand: true,
            cwd: 'node_modules/sql-where-parser',
            src: ['sql-where-parser.min.js'],
            dest: '<%= paths.dist_debug %>/impl'
          }
        ]
      },
      config_coverage: {
        files: [
          {
            expand: true,
            cwd: 'config',
            src: 'require-config-coverage.js',
            dest: 'coverage/dist/debug'
          }
        ]
      },
      test_coverage: {
        files: [
          {
            expand: true,
            cwd: 'test',
            src: '**',
            dest: 'coverage/test'
          }
        ]
      },
      lib_coverage: {
        files: [
          {
            expand: true,
            cwd: 'lib',
            src: '**',
            dest: 'coverage/lib'
          }
        ]
      },
      temp_debug: {
        files: [
          {
            expand: true,
            cwd: '<%= paths.dist_debug %>',
            src: ['*.js', '*/**'],
            dest: '<%= paths.temp %>/debug/persist'
          }
        ]
      },
      temp_min: {
        files: [
          {
            expand: true,
            cwd: '<%= paths.dist_min %>',
            src: ['*.js', '*/**'],
            dest: '<%= paths.temp %>/min/persist'
          }
        ]
      },
      dist_bundles_debug: {
        files: [
          {
            expand: true,
            cwd: '<%= paths.dist_bundles_debug %>/persist',
            src: ['offline*.js', '*/**'],
            dest: '<%= paths.dist_debug %>'
          }
        ]
      },
      dist_bundles_min: {
        files: [
          {
            expand: true,
            cwd: '<%= paths.dist_bundles_min %>/persist',
            src: ['offline*.js', '*/**'],
            dest: '<%= paths.dist_min %>'
          }
        ]
      },
    },
    jsdoc: {
      dist: {
        src: ['<%= paths.src %>/*.js', 'JSDOC.md'],
        options: {
          destination: '<%= paths.docs %>',
          config: 'config/conf_jsdoc.json'
        }
      }
    },
    terser: {
      minifyMinForBundleWithComments: {
        options: {
          sourceMap: false,
          format: {
            comments: "all"
          }
        },
        files: [{
          expand: true,
          cwd: '<%= paths.dist_debug %>',
          src: ["<%= pouchdb_bundle %>", "**/fetch.js"],
          dest: '<%= paths.dist_min %>'
        }]
      },
      minifyMinForBundleWithoutComments: {
        options: {
          sourceMap: false
        },
        files: [{
          expand: true,
          cwd: '<%= paths.dist_debug %>',
          src: ['*.js', '**/*.js', "!*<%= pouchdb_bundle %>", "!**/fetch.js"],
          dest: '<%= paths.dist_min %>'
        }]
      },
      minifyMinDistWithComments: {
        options: {
          sourceMap: false,
          format: {
            comments: "all"
          }
        },
        files: [{
          expand: true,
          cwd: '<%= paths.dist_min %>',
          src: ['*.js', '**/*.js'],
          dest: '<%= paths.dist_min %>'
        }]
      }
    },
    qunit: {
      files: ['test/**/*.html'],
      options: {
        puppeteer: {
          headless: true,
          args: ['--disable-web-security']
        }
      }
    },
    run_java: {
      jscover: {
        command: 'java',
        jarName: 'coverage/JSCover-all.jar',
        javaArgs: '-fs dist/debug coverage/dist/debug --no-instrument=impl/sql-where-parser.min.js --no-instrument=impl/fetch.js --no-instrument=<%= pouchdb_bundle %>'
      }
    },
    shell: {
      start_test_server: {
        command: 'node ./test/lib/testServer/server.js',
        options: {
          stdout: true,
          async: true,
        }
      }
    },
    usebanner:{
      addBannerToMinDist:{
        options:{
          position:"top",
          banner:"<%= copyRightBanner %>"
        },
        files:{
          src: ['<%= paths.dist_min %>/*.js',
           '<%= paths.dist_min %>/**/*.js',
           "!<%= paths.dist_min %>/<%= pouchdb_bundle %>",
           "!<%= paths.dist_min %>/require.js",
           "!<%= paths.dist_min %>/pouchdb.find.js",
           "!<%= paths.dist_min %>/**/sql-where-parser.min.js",
           "!<%= paths.dist_min %>/**/fetch.js"],
        }
      }
    }
  });

  // These plugins provide necessary tasks.
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-requirejs');
  grunt.loadNpmTasks('grunt-jsdoc');
  grunt.loadNpmTasks('grunt-terser');
  grunt.loadNpmTasks('gruntify-eslint');
  grunt.loadNpmTasks('grunt-contrib-qunit');
  grunt.loadNpmTasks('grunt-run-java');
  grunt.loadNpmTasks('grunt-browserify');
  grunt.loadNpmTasks('grunt-contrib-rename');
  grunt.loadNpmTasks('grunt-string-replace');
  grunt.loadNpmTasks('grunt-shell-spawn');
  grunt.loadNpmTasks('grunt-banner');

  // Default task.
  grunt.registerTask('build', ['clean:all',
                              'browserify',
                              'eslint',
                              'copy:dist_debug',
                              'copy:dist_ext_lib',
                              'copy:config_coverage',
                              'copy:test_coverage',
                              'copy:lib_coverage',
                              'copy:temp_debug',
                              'terser:minifyMinForBundleWithComments',
                              'terser:minifyMinForBundleWithoutComments',
                              'copy:temp_min',
                              'requirejs:compileBundles_min',
                              'requirejs:compileBundles_debug',
                              'run_java',
                              'rename',
                              'string-replace',
                              'copy:dist_bundles_debug',
                              'copy:dist_bundles_min',
                              'terser:minifyMinDistWithComments',
                              'clean:bundles_debug',
                              'clean:bundles_min',
                              'usebanner',
                              'shell:start_test_server',
                              'qunit',
                              'jsdoc',
                              'copy:oracle_logo'
  ]);
};
