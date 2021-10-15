// Karma configuration
// Generated on Mon Oct 23 2017 22:26:54 GMT+0800 (CST)

module.exports = function(config) {
  config.set({

    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: '',


    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ['mocha', 'requirejs', 'chai'],


    // list of files / patterns to load in the browser
    files: [
      'test-main.js',
      {pattern: 'dist/debug/**/*.js', included: false},
      {pattern: 'test/lib/**/*.js', included: false},
      {pattern: 'test/util/testPersistenceStoreFactory.js', included: false},
      {pattern: 'lib/**/*.js', included: false},
      {pattern: 'test/util/oracle.png',watched: false, included: false, served:true},
      {pattern: config.fileToTest, included: false}
    ],

    // list of files to exclude
    exclude: [
    ],


    // preprocess matching files before serving them to the browser
    // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    preprocessors: config.karmaPreProcessorFiles,

    failOnEmptyTestSuite: false,

    coverageReporter : {
      type : 'json',
      dir : config.coverageDir,
      file : config.coverageFile,
      reporters: [
        {type: 'json'}
      ]
    },
    // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: ['mocha', 'coverage'],


    // web server port
    port: 9876,


    // enable / disable colors in the output (reporters and logs)
    colors: true,


    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO,


    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: true,


    // start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    browsers: [config.browser],


    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: config.singleRun,

    // Concurrency level
    // how many browser should be started simultaneous
    concurrency: Infinity,

    browserNoActivityTimeout: 400000
  })
}
  