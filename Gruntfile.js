'use strict';

module.exports = function (grunt) {
  // Init config
  grunt.initConfig({
    // Default package
    pkg : grunt.file.readJSON('package.json'),

    // Current generation date
    date : new Date(),

    // Hint our app
    yoctohint : {
      json : [
        'package.json'
      ],
      node : [
        'src/index.js', 'Gruntfile.js'
      ],
      options : {
        env : {
          es6 : true
        }
      }
    },

    // Uglify our app
    uglify : {
      options : {
        banner : [
          '/* <%= pkg.name %>',
          '<%= pkg.description %>',
          'V<%= pkg.version %>',
          '<%= date %>*/\n' ].join(' - ')
      },
      api : {
        src  : 'src/index.js',
        dest : 'dist/index.js'
      }
    },

    // Test our app
    mochacli : {
      options : {
        reporter       : 'spec',
        'inline-diffs' : false,
        'no-exit'      : true,
        force          : false,
        'check-leaks'  : true,
        bail           : false
      },
      all : []
    },

    // Generate our doc
    yoctodoc : {
      // Set all your file here
      all : [ 'src/*.js' ]
    },

    // Utility tools to auto generate docs on source changes
    watch : {
      scripts : {
        files   : [ 'src/*.js', '*.md' ],
        tasks   : [ 'doc' ],
        options : {
          interrupt     : true,
          debounceDelay : 250
        }
      }
    }
  });

  // Load tasks
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-uglify-es');
  grunt.loadNpmTasks('grunt-mocha-cli');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('yocto-hint');
  grunt.loadNpmTasks('yocto-doc');

  // Register tasks
  grunt.registerTask('hint', [ 'yoctohint' ]);
  grunt.registerTask('test', 'mochacli');
  grunt.registerTask('build', [ 'yoctohint', 'uglify' ]);
  grunt.registerTask('doc', [ 'yoctodoc' ]);
  grunt.registerTask('default', [ 'build', 'test', 'doc' ]);
};
