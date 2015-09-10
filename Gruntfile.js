'use strict';

/**
 * Gruntfile.js is used to configure or define tasks and load Grunt plugins.
 *
 * Use uglify with Grunt to minify all ".js" file in documentation
 * Use yuidoc to generate the docs
 * 
 * @class Gruntfile
 * @module Grunt file 
 * @date 21/04/2015
 * @author ROBERT Mathieu <mathieu@yocto.re>
 * @copyright Yocto SAS, All Right Reserved <http://www.yocto.re>
 *
 */
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
    yoctodoc : {
        dist : {
            src: ['src/index.js'],
            options: {
              name : 'Yocto logger'
            }
        }
    } ,    
     /**
      * Yuidoc permit to generate the yuidoc of the Yocto Stack Generator
      *
      * @submodule yuidoc
      */
     /*yuidoc : {
       compile : {
         name : '<%= pkg.name %>',
         description : '<%= pkg.description %>',
         version     : '<%= pkg.version %>',
         url         : '<%= pkg.homepage %>',
         options     : {
           paths    : '.',
           outdir   : 'documentation',
           exclude  : 'Gruntfile.js,example,dist,documentation,node_modules',
           themedir : "node_modules/yuidoc-lucid-theme",
           helpers  : ["node_modules/yuidoc-lucid-theme/helpers/helpers.js"]           
         }
       },
     },*/

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
   grunt.loadNpmTasks('yoctodoc');
   
   // register tasks
   grunt.registerTask('default', [ 'yoctohint', 'mochacli','yuidoc', 'uglify' ]);
   grunt.registerTask('hint', [ 'yoctohint' ]);   
   grunt.registerTask('tests', 'mochacli');   
   grunt.registerTask('build', [ 'yoctohint', 'yuidoc', 'uglify' ]);  
   grunt.registerTask('doc', [ 'yoctodoc' ]);
 };
