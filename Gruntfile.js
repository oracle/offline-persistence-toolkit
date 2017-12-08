/*global module:false*/
module.exports = function (grunt) {
  // Project configuration.
  grunt.initConfig({
    // Metadata.
    pkg: grunt.file.readJSON('package.json'),
    paths: {
      src: 'src',
      src_files: 'src/**/*.js',
      ext_lib: 'lib',
      dist: 'dist',
      dist_debug: 'dist/debug',
      dist_min: 'dist/min',
      docs: 'docs'
    },
    banner: '/*! <%= pkg.title || pkg.name %> - v<%= pkg.version %> - ' +
      '<%= grunt.template.today("yyyy-mm-dd") %>\n' +
      '<%= pkg.homepage ? "* " + pkg.homepage + "\\n" : "" %>' +
      '* Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author.name %>;' +
      ' Licensed <%= _.pluck(pkg.licenses, "type").join(", ") %> */\n',
    watch: {
      gruntfile: {
        files: '<%= jshint.gruntfile.src %>'
      }
    },
    clean: ['<%= paths.dist_debug %>/*.js',
            '<%= paths.dist_min %>/*.js',
            '<%= paths.docs %>/*.*'],
    requirejs: {
      compile: {
        options: {
          mainConfigFile: 'config/config.js',
          baseUrl: '<%= paths.src %>',
          modules: [
            {
              name: '<%= pkg.name %>-amd'
            }],
          dir: '<%= paths.dist %>',
          optimize: 'none'
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
      dist_debug: {
        files: [
          {expand: true,
           cwd: '<%= paths.src %>',
           src: ['*.js', '*/**'],
           dest: '<%= paths.dist_debug %>'}
        ]
      },
      dist_ext_lib: {
        files: [
          {expand: true,
           cwd: '<%= paths.ext_lib %>',
           src: ['*.js'],
           dest: '<%= paths.dist_debug %>'}
        ]
      },
      test_coverage: {
        files: [
          {expand: true,
           cwd: 'test',
           src: '**',
           dest: 'coverage/test'}
        ]
      },
      lib_coverage: {
        files: [
          {expand: true,
           cwd: 'lib',
           src: '**',
           dest: 'coverage/lib'}
        ]
      }
    },
    jsdoc : {
        dist : {
            src: ['<%= paths.src %>/*.js', 'USAGE.md'],
            options: {
                destination: '<%= paths.docs %>',
                config: 'config/conf_jsdoc.json'
            }
        }
    },
    uglify: {
      dist: {
        options: {
          sourceMap: true
        },
        files: [{
          expand: true,
          cwd: '<%= paths.src %>',
          src: ['*.js', '*/*.js'],
          dest: '<%= paths.dist_min %>'
        }]
      },
      dist_ext_lib: {
        options: {
          sourceMap: true
        },
        files: [{
          expand: true,
          cwd: '<%= paths.ext_lib %>',
          src: ['*.js'],
          dest: '<%= paths.dist_min %>'
        }]
      }
    },
    qunit: {
      files: ['test/**/*.html'],
      options: {inject: null}
    },
    run_java: {
      jscover: {
        command: 'java',
        jarName: 'coverage/JSCover-all.jar',
        javaArgs: '-fs src coverage/src --no-instrument=impl/fetch.js'
      }
    }
  });

  // These plugins provide necessary tasks.
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-requirejs');
  grunt.loadNpmTasks('grunt-jsdoc');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('gruntify-eslint');
  grunt.loadNpmTasks('grunt-contrib-qunit');
  grunt.loadNpmTasks('grunt-run-java');

  // Default task.
  grunt.registerTask('build', ['clean', 'copy', 'eslint', 'run_java', 'qunit', 'uglify', 'jsdoc']);
  grunt.registerTask('coverage', ['clean', 'copy', 'run_java']);
};
