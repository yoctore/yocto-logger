/**
 * Unit tests
 */
var logger = require('../dist/index.js');
var assert = require('chai').assert;
var should = require('chai').should;
var util   = require('util');
var expect = require('chai').expect;
var _      = require('lodash');
var moment = require('moment');
var fs     = require('fs');

// start unit tests
describe('Logger()', function() {
  describe('Create method must be succeed', function() {
    it('Logger must have method create and must be a function', function() {
      expect(logger.create).to.be.an('Function');
    });

    it('create() method must return an instance of Logger', function() {
      // Ty to create a logger instance
      logger = logger.create();
      //logger.disableConsole();
      // Tests
      expect(logger).to.be.an('Object').not.null;
    });
  });

  describe('Required syslog method must be exists and must be a function', function() {
    // define log level
    var levels = [ 'emergency', 'alert', 'critical', 'error', 'warning', 'notice', 'info', 'debug' ];

    levels.forEach(function(level) {
      it(`Method ${level} must be exists and be a function`, function() {
        expect(logger[level]).to.an('Function');
      });
    });
  });

  describe('Daily rotate methods must be exists and must be a function', function() {
    // define log level
    var methods = [ 'enableErrorToDailyRotateFiles', 'enableRequestToDailyRotateFiles', 'addDailyRotateTransport' ];

    methods.forEach(function(level) {
      it(`Method ${level} must be exists and be a function`, function() {
        expect(logger[level]).to.an('Function');
      });
    });
  });

  describe('Utility methods must be exists and must be a function', function() {
    // define log level
    var methods = [ 'changeLogLevel', 'banner', 'enableConsole', 'disableConsole' ];

    methods.forEach(function(method) {
      it(`Method ${method} must be exists and be a function`, function() {
        expect(logger[method]).to.an('Function');
      });
    });
  });


  // define log level
  var levels = [ 'emergency', 'alert', 'critical', 'error', 'warning', 'notice', 'info', 'debug' ];
  levels.forEach(function(level) {
    describe(`Levels method must log given content for levels ${level}`, function() {

      // Try with multiple type of value
      var data = [ 'string', 1, false, {}, new Array() ];
      data.forEach(function (d) {
        it(`Usage of data type ${typeof d} be succeed and return an object`, function() {
          expect(logger[level](d)).to.be.an('Object');
        });
      });
    });
  });

  describe('Add daily rotate transport must succeed or failed', function() {
    it ('Combined daily rotate must failed and return false with invalid destination', function () {
      var destination  = [ process.cwd(), 'test/my-invalid-destination' ].join('/');
      expect(logger.addDailyRotateTransport({
        destination : destination
      })).to.be.an('Boolean').equal(false);
    });

    var destination  = [ process.cwd(), 'test/my-valid-destination' ].join('/');
    var combinedName = [ moment().format('YYYYMMDD'), 'combined.log' ].join('-');

    it ('Combined daily rotate with an valid destination must succeed and return an object. Audit file and combined file must exists too.', function () {
      expect(logger.addDailyRotateTransport({
        destination : destination
      })).to.be.an('Object').and.not.null;
    });

    it (`Combined daily rotate must create a file ${combinedName}`, function () {
      expect(fs.existsSync([ destination, combinedName ].join('/'))).to.be.an('Boolean').equal(true);
    });

    it ('Combined daily rotate must create a audit file', function () {
      expect(fs.existsSync([ destination, '.audit.json' ].join('/'))).to.be.an('Boolean').equal(true);
    });

    it ('Error daily rotate must failed and return false with invalid destination', function () {
      var destination  = [ process.cwd(), 'test/my-invalid-destination' ].join('/');
      expect(logger.enableErrorToDailyRotateFiles({
        destination : destination
      })).to.be.an('Boolean').equal(false);
    });

    destination  = [ process.cwd(), 'test/my-valid-destination' ].join('/');
    combinedName = [ moment().format('YYYYMMDD'), 'error.log' ].join('-');

    it ('Error daily rotate with a valid destination must succeed and return an object. Audit file and combined file must exists too.', function () {
      expect(logger.enableErrorToDailyRotateFiles({
        destination : destination
      })).to.be.an('Object').and.not.null;
    });

    it (`Error daily rotate must create a file ${combinedName}`, function () {
      expect(fs.existsSync([ destination, combinedName ].join('/'))).to.be.an('Boolean').equal(true);
    });

    it ('Error daily rotate must create a audit file', function () {
      expect(fs.existsSync([ destination, '.audit.json' ].join('/'))).to.be.an('Boolean').equal(true);
    });
    
    it ('Request daily rotate must failed and return false with invalid destination', function () {
      var destination  = [ process.cwd(), 'test/my-invalid-destination' ].join('/');
      expect(logger.enableRequestToDailyRotateFiles({
        destination : destination
      })).to.be.an('Boolean').equal(false);
    });

    destination  = [ process.cwd(), 'test/my-valid-destination' ].join('/');
    combinedName = [ moment().format('YYYYMMDD'), 'access.log' ].join('-');

    it ('Request daily rotate with a valid destination must succeed and return a function. Audit file and combined file must exists too.', function () {
      expect(logger.enableRequestToDailyRotateFiles({
        destination : destination
      })).to.be.an('Function').and.not.null;
    });

    it (`Request daily rotate must create a file ${combinedName}`, function () {
      expect(fs.existsSync([ destination, combinedName ].join('/'))).to.be.an('Boolean').equal(true);
    });

    it ('Request daily rotate must create a audit file', function () {
      expect(fs.existsSync([ destination, '.audit.json' ].join('/'))).to.be.an('Boolean').equal(true);
    });
  });
});