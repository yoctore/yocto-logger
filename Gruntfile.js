'use strict';

module.exports = function(grunt) {
  // init config
  grunt.initConfig({
   // default package
   pkg : grunt.file.readJSON('package.json'),
  
   yoctohint : {
     options : {
     },
     all : [ 'src/index.js' ]
   },
  /**
   * Uglify permit to minify javascript file
   *
   * @submodule uglify
   */
   uglify : {
     api : {
        src    : 'src/index.js',
        dest   : 'dist/index.js'
     }
   },
  
   /**
    * Mocah unit test
    */
    mochacli : {
      options : {
        'reporter'       : 'spec',
        'inline-diffs'   : false,
        'no-exit'        : true,
        'force'          : false,
        'check-leaks'    : true,
        'bail'           : false
      },
      all : [ 'test/*.js' ]
    }     
  });
  
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-mocha-cli');
  grunt.loadNpmTasks('yoctohint');
  
  // register tasks
  grunt.registerTask('default', [ 'yoctohint', 'mochacli', 'uglify' ]);
  grunt.registerTask('hint', [ 'yoctohint' ]);
  grunt.registerTask('tests', 'mochacli');
  grunt.registerTask('build', [ 'yoctohint', 'yuidoc', 'uglify' ]);
};
