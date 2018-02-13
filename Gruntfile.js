'use strict';

module.exports = function (grunt) {
  // Init config
  grunt.initConfig({
    // Default package
    pkg : grunt.file.readJSON('package.json'),

    // Hint our app
    yoctohint : {
      json : [
        'package.json'
      ],
      node : [
        'src/index.js', 'Gruntfile.js'
      ],
      options : {
        compatibility : true
      }
    },

    // Uglify our app
    uglify : {
      options : {
        banner : '/* <%= pkg.name %> - <%= pkg.description %> - V<%= pkg.version %> */\n'
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
      all : [ 'test/*.js' ]
    },
    yoctodoc : {
      options : {
        // Change your path destination
        destination : './docs'
      },

      // Set all your file here
      all : [ 'src/*.js' ]
    }
  });

  // Load tasks
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-mocha-cli');
  grunt.loadNpmTasks('yocto-hint');
  grunt.loadNpmTasks('yocto-doc');

  // Register tasks
  grunt.registerTask('hint', [ 'yoctohint' ]);
  grunt.registerTask('test', 'mochacli');
  grunt.registerTask('build', [ 'yoctohint', 'uglify' ]);
  grunt.registerTask('doc', [ 'yoctodoc' ]);
  grunt.registerTask('default', [ 'test', 'build', 'doc' ]);
};
