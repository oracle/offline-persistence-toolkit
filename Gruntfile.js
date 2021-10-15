/*global module:false*/
module.exports = function (grunt) {
  var fs = require('fs');
  var path = require('path');

  var karmaSetup = {
    optSourceFolder : 'src/',
    karmaTestFolder : 'test/karma-mocha-tests/',
    karmaPreProcessorFiles : {},
    karmaPreProcessorExcludedFiles : ['src/impl/fetch.js'],
    karmaTestFiles : [],
    testTasks : []
  };

  var helper = {
    fetchFilesFromDirectory : function(directory, callback) {
      fs.readdirSync(directory).forEach(file => {
        var fullPath = path.join(directory, file);
        if (fs.lstatSync(fullPath).isDirectory()) {
          this.fetchFilesFromDirectory(fullPath, callback);
         } else {
          callback(fullPath, file);
         }  
      });
    }
  }

  var generateKarmaPreProcessorFiles = function(file) {
    if(!karmaSetup.karmaPreProcessorExcludedFiles.includes(file)) {
      let _filePath = file.replace("src","dist/debug");
      karmaSetup.karmaPreProcessorFiles[_filePath] = ['coverage'];
    }
  };

  var setKarmaTestFiles = function(fileFullPath, fileName) {
    var testFileData = {
      testFile : null,
      coverageFile : null
    };
    testFileData.testFile = fileFullPath;
    testFileData.coverageFile = fileName.replace('.js','.json');
    karmaSetup.karmaTestFiles.push(testFileData);
  };

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
      config: 'config',
      karma_coverage: 'temp/coverage',
      coverage_report: 'coverage'
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
      bundles: '<%= paths.dist_bundles %>',
      bundles_min: '<%= paths.dist_bundles_min %>',
      karmaCoverage: '<%= paths.karma_coverage %>'
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
      }
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
    shell: {
      start_test_server: {
        command: 'node ./test/lib/testServer/server.js',
        options: {
          stdout: true,
          async:true,
        }
      },
      karma_coverage_report: {
        command: 'node_modules/nyc/bin/nyc.js -t <%= paths.karma_coverage %>/**/ report --reporter=html --report-dir=<%= coverage_report %>'
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
    },
    karma: {
      unit: {
        configFile: 'karma.conf.js',
        fileToTest: '',
        karmaPreProcessorFiles: karmaSetup.karmaPreProcessorFiles,
        browser: 'ChromeHeadless',
        singleRun: true,
        coverageDir: '<%= paths.karma_coverage %>'
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
  grunt.loadNpmTasks('grunt-browserify');
  grunt.loadNpmTasks('grunt-contrib-rename');
  grunt.loadNpmTasks('grunt-string-replace');
  grunt.loadNpmTasks('grunt-shell-spawn');
  grunt.loadNpmTasks('grunt-banner');
  grunt.loadNpmTasks('grunt-karma');

  // Default task.
  grunt.registerTask('build', ['clean:all',
                              'browserify',
                              'eslint',
                              'copy:dist_debug',
                              'copy:dist_ext_lib',
                              'copy:temp_debug',
                              'terser:minifyMinForBundleWithComments',
                              'terser:minifyMinForBundleWithoutComments',
                              'copy:temp_min',
                              'requirejs:compileBundles_min',
                              'requirejs:compileBundles_debug',
                              'rename',
                              'string-replace',
                              'copy:dist_bundles_debug',
                              'copy:dist_bundles_min',
                              'terser:minifyMinDistWithComments',
                              'clean:bundles_debug',
                              'clean:bundles_min',
                              'usebanner',
                              'run-karma-mocha',
                              'jsdoc',
                              'copy:oracle_logo'
                              ]);

  function buildKarmaMochaTestTasks() {
    karmaSetup.testTasks.push('clean:karmaCoverage');
    karmaSetup.testTasks.push('shell:start_test_server');
    karmaSetup.karmaTestFiles.forEach((file, index) => {
      var taskName = 'run-karma-mocha-test-'+ (index+1);
      karmaSetup.testTasks.push(taskName);
      grunt.task.registerTask(taskName, function() {
        grunt.config.set('karma.unit.fileToTest', file.testFile);
        grunt.config.set('karma.unit.coverageFile', file.coverageFile);
        grunt.task.run('karma');
      });
    })
    karmaSetup.testTasks.push('shell:karma_coverage_report'); // Task to generate coverage report
  }

  function runTargetTestFiles(testFileParam) {
    karmaSetup.karmaTestFiles = [];
    var testFiles = testFileParam.split(',');
    testFiles.forEach(file => {
      var fileName = file+'.js',
          filePath = karmaSetup.karmaTestFolder + fileName;
      if(fs.existsSync(filePath)) {
        setKarmaTestFiles(filePath, fileName);
      }
      else {
        grunt.fail.warn(`No test file named ${fileName} exists in karma test directory`)
      }
    })
  }


  grunt.task.registerTask('run-karma-mocha', function() {
    helper.fetchFilesFromDirectory(karmaSetup.karmaTestFolder, setKarmaTestFiles);
    helper.fetchFilesFromDirectory(karmaSetup.optSourceFolder, generateKarmaPreProcessorFiles); // Generate Preprocessors for Karma

    if(grunt.option('test')) {
      var testFileParam = grunt.option('test');
      if(typeof testFileParam === 'string')
        runTargetTestFiles(testFileParam);
      else 
        grunt.fail.warn("No test file provided as input!!");
    }
    if(grunt.option('browser')) {
      var browser = grunt.option('browser');
      grunt.config.set('karma.unit.browser', browser);
    }
    if(typeof grunt.option('singleRun') === 'boolean')
      grunt.config.set('karma.unit.singleRun', grunt.option('singleRun'));

    buildKarmaMochaTestTasks(); // Generates batch of karma mocha tests
    grunt.task.run(karmaSetup.testTasks);
  });

  grunt.task.registerTask('run-karma-coverage', function() {
    grunt.task.run('run-karma-mocha');
  });
};
