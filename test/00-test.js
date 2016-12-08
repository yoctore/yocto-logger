/**
 * Unit tests
 */
var logger = require('../src/index.js');
var assert = require('chai').assert;
var should = require('chai').should;
var util   = require('util');
var expect = require('chai').expect;
var _      = require('lodash');

logger.enableConsole(false);

// start unit tests
describe('Logger()', function() {
  describe('Simple setting different logs level must return true', function() {
    // define log level
    var levels = [ 'error', 'warning', 'info', 'verbose', 'debug', 'silly' ];

    levels.forEach(function(level) {
      it('Using level' + util.inspect(level, { depth : null }), function() {
        expect(logger.setLogLevel(level)).to.be.an('Object').not.null;
      });
    });
  });

  describe('Loging must be succeed for each defined method', function() {
    // define log level
    var levels = [ 'debug', 'verbose', 'warning', 'error', 'info', 'silly', 'banner' ];

    levels.forEach(function(level) {
      it('processing message with level' + util.inspect(level, { depth : null }), function() {
        expect(logger[level]('test message ' + level)).to.be.an(level === 'banner' ? 'Boolean' : 'Object').not.null;
      });
    });
  });

  describe('Chaining less level change will be succeed', function() {
    // items
    var items = [ 'error', 'warning', 'info', 'verbose', 'debug' ];
    // parse all items
    items.forEach(function (i, k) {
      it ('Current level must equal to ' + i + ' level', function () {
        // process less request
        logger.less();
        expect(logger.logLevel).to.equal(5 - (k + 1));
      });
    });
  });

  describe('Chaining more level change will be succeed', function() {
    // items
    var items = [ 'warning', 'info', 'verbose', 'debug', 'silly' ];
    // parse all items
    items.forEach(function (i, k) {
      it ('Current level must equal to ' + i + ' level', function () {
        // process less request
        logger.more();
        expect(logger.logLevel).to.equal(0 + (k + 1));
      });
    });
  });
  
  describe('Adding daily rotate transport must succeed.', function() {
    // items
    var items = [ [], [ null, 'test.log', { name : 'test' } ] ];
    // parse all items
    items.forEach(function (i, k) {
      it ('Adding daily rotate with given param : ' + util.inspect(i, { depth : null }), function () {
        // add rotate
        logger.addDailyRotateTransport.call(logger, i).then(function (success) {
          expect(success).not.null.to.be.an('EventEmitter');
        });
      });
    });
  });
});