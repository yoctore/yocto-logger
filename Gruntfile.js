'use strict';

module.exports = function (grunt) {
  // init config
  grunt.initConfig({
    // default package
    pkg       : grunt.file.readJSON('package.json'),

    // hint our app
    yoctohint : {
      options  : {},
      all      : [ 'src/index.js', 'Gruntfile.js' ]
    },

    // Uglify our app
    uglify    : {
      options : {
        banner  : '/* <%= pkg.name %> - <%= pkg.description %> - V<%= pkg.version %> */\n'
      },
      api     : {
        src    : 'src/index.js',
        dest   : 'dist/index.js'
      }
    },

    // test our app
    mochacli  : {
      options : {
        'reporter'       : 'spec',
        'inline-diffs'   : false,
        'no-exit'        : true,
        'force'          : false,
        'check-leaks'    : true,
        'bail'           : false
      },
      all     : [ 'test/*.js' ]
    },
    yoctodoc  : {
      options : {
        // change your path destination
        destination     : './docs'
      },
      // Set all your file here
      all     : [ 'src/*.js' ]
    }
  });

  // load tasks
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-mocha-cli');
  grunt.loadNpmTasks('yocto-hint');
  grunt.loadNpmTasks('yocto-doc');

  // register tasks
  grunt.registerTask('hint', [ 'yoctohint' ]);
  grunt.registerTask('test', 'mochacli');
  grunt.registerTask('build', [ 'yoctohint', 'uglify' ]);
  grunt.registerTask('doc', [ 'yoctodoc' ]);
  grunt.registerTask('default', [ 'test', 'build', 'doc' ]);
};
