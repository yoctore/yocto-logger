/**
 * @author Mathieu ROBERT <mathieu@yocto.re>
 * @copyright Yocto SAS, All right reserved <http://www.yocto.re>
 */
'use strict';

var winston       = require('winston');
var _             = require('lodash');
var chalk         = require('chalk');
var moment        = require('moment');
var format        = require('string-format');
var uuid          = require('uuid');
var fs            = require('fs');
var path          = require('path');
var emmitter      = require('events').EventEmitter;
var util          = require('util');

// Must extend String.prottype for use format to a method mode
format.extend(String.prototype);

// Allow to display errors
winston.emitErrs  = false;

/**
 * Yocto logger manager. Manage your own logger request
 *
 * @class
 * @public
 */
function Logger () {
  /**
   * @property {Integer} logLevel Default log level
   * @default 5
   */
  this.logLevel = 5;

  /**
   * @see https://www.npmjs.com/package/winston#console-transport
   * @property {String} TYPE_CONSOLE Default const to define console type
   * @default console
   * @const
   */
  this.TYPE_CONSOLE = 'console';

  /**
   * @see https://www.npmjs.com/package/winston#daily-rotate-file-transport
   * @property {String} TYPE_DAILY_ROTATE_FILE Default const to define daily rotate file
   * @default daily-rotate-file
   * @const
   */
  this.TYPE_DAILY_ROTATE_FILE = 'daily-rotate-file';

  /**
   * @property {Object} ERROR_LOG_LEVEL Default const to define error log level rules on current class
   * @default { name : 'error', level : 1, fn : 'error' }
   * @const
   */
  this.ERROR_LOG_LEVEL      = { name : 'error', level : 1, fn : 'error' };

  /**
   * @property {Object} WARNING_LOG_LEVEL Default const to define warning log level rules on current class
   * @default { name : 'warning', level : 2, fn : 'warn' }
   * @const
   */
  this.WARNING_LOG_LEVEL    = { name : 'warning', level : 2, fn : 'warn' };

  /**
   * @property {Object} INFO_LOG_LEVEL Default const to define info log level rules on current class
   * @default { name : 'info',    level : 3, fn : 'info' }
   * @const
   */
  this.INFO_LOG_LEVEL       = { name : 'info',    level : 3, fn : 'info' };

  /**
   * @property {Object} VERBOSE_LOG_LEVEL Default const to define verbose log level rules on current class
   * @default { name : 'verbose', level : 4, fn : 'verbose' }
   * @const
   */
  this.VERBOSE_LOG_LEVEL    = { name : 'verbose', level : 4, fn : 'verbose' };

  /**
   * @property {Object} DEBUG_LOG_LEVEL Default const to define debug log level rules on current class
   * @default { name : 'debug',   level : 5, fn : 'debug' }
   * @const
   */
  this.DEBUG_LOG_LEVEL      = { name : 'debug',   level : 5, fn : 'debug' };

  /**
   * Default formatter. use all data to render the correct message format to the logger formatter
   *
   * @param {Object} options default options to use
   * @param {Boolean} colorize if true enable colorize process, false otherwise
   * @return {String} the correct string to use on current transporter
   * @private
   */
  var transportFormatter = function (options, colorize) {
    // Setting up the colorize flag
    colorize = colorize || false;

    // Build data to log
    var dataToLog = {
      level   : options.level,
      date    : _.isFunction(options.timestamp) ?
                options.timestamp() :
                (_.isNull(options.timestamp) ?
                null :
                moment().format()),
      message : (!_.isUndefined(options.message) && !_.isEmpty(options.message) ?
                options.message :
                ''),
      meta    : (!_.isUndefined(options.meta) && Object.keys(options.meta).length ?
                JSON.stringify(options.meta) :
                ''),
    };

    if (_.has(options, 'label') && _.isFunction(options.label)) {
      dataToLog.level = options.label(options.level.toLowerCase());
    }

    if (_.has(options, 'timestamp') && _.isFunction(options.timestamp)) {
      dataToLog.date = options.timestamp();
    }

    // Use colorize only on console mode
    if (colorize) {
      if (_.has(options, 'colorize') && _.isFunction(options.colorize)) {
        // Prepare value to use on logger
        colorize = options.colorize(options.level);

        dataToLog.level = chalk[colorize]('{}'.format(
                            options.label(options.level.toLowerCase())));
      }
    }

    // Default format
    var dformat  = '{level} :';

    if (!_.isNull(dataToLog.date)) {
      dformat = [ '[{date}]', dformat ].join(' ');
    }

    // Check if we have message
    if (!_.isUndefined(dataToLog.message) && !_.isEmpty(dataToLog.message)) {
      dformat = [ dformat, '{message}' ].join(' ');
    }

    // Check if we have meta
    if (!_.isUndefined(dataToLog.meta) && !_.isEmpty(dataToLog.meta)) {
      dformat = [ dformat, '{meta}' ].join(' ');
    }

    // Returning the correct message format
    return dformat.format(dataToLog);
  };

  /**
   * Default function to get a current date format
   *
   * @return {String} formated string based on moment.js format
   * @private
   */
  var timestampFormatter = function () {
    return moment().format('DD/MM/YYYY HH:mm:ss'); // test
  };

  /**
   * Default label function to retrive the correct label to display on logger
   *
   * @param {String} value value to check
   * @return {String} the correct value to display
   * @private
   */
  var labelFormatter =  function (value) {
    var rules = [
      { info     : 'info    ' },
      { warn     : 'warning ' },
      { error    : 'error   ' },
      { debug    : 'debug   ' },
      { verbose  : 'verbose ' }
    ];

    // Get index
    var index = _.findIndex(rules, value);

    // Check and return a correct value
    if (index >= 0) {
      return _.first(_.values(rules[index]));
    }

    // Return correct value
    return value;
  };

  /**
   * Default function to colorize the log level with chalk
   *
   * @param {String} level current level to use
   * @return {String} current color to use on chalk
   * @private
   */
  var colorizeFormatter  = function (level) {
    var rules = [
      { info     : 'green' },
      { warn     : 'yellow' },
      { error    : 'red' },
      { debug    : 'blue' },
      { verbose  : 'white' }
    ];

    // Get index
    var index = _.findIndex(rules, level);

    // Check and return a correct value
    if (index >= 0) {
      return _.first(_.values(rules[index]));
    }

    // Return default value
    return 'white';
  };

  /**
   * Default console formatter. use all data to render the correct message format to the logger formatter
   *
   * @param {Object} options default options to use
   * @return {String} the correct string to use on current transporter
   * @public
   */
  this.consoleTransportFormatter = function (options) {
    return transportFormatter(options, true);
  };

  /**
   * Default daily rotate file formatter. use all data to render the correct message format to the logger formatter
   *
   * @method dailyRotateFileTransportFormatter
   * @private
   * @param {Object} options default options to use
   * @return {String} the correct string to use on current transporter
   */
  this.dailyRotateFileTransportFormatter = function (options) {
    return transportFormatter(options, false);
  };

  /**
   * @property {Object} defaultConsoleTransport Default console transport configuration
   * @default
   */
  this.defaultConsoleTransport = {
    level             : 'debug',
    handleExceptions  : false,
    json              : false,
    showLevel         : true,
    silent            : false,
    label             : labelFormatter,
    formatter         : this.consoleTransportFormatter,
    timestamp         : null,
    colorize          : colorizeFormatter
  };

  /**
   * Default daily rotate transport file
   *
   * @property defaultDailyRotateTransportFile
   * @type Object
   */
  this.defaultDailyRotateTransportFile = {
    name              : 'default-daily-rotate-transport',
    level             : 'verbose',
    dirname           : './',
    filename          : uuid.v4(),
    handleExceptions  : true,
    json              : false,
    maxsize           : 5242880,
    maxFiles          : 5,
    colorize          : true,
    datePattern       : '-yyyy-MM-dd.log',
    label             : labelFormatter,
    formatter         : this.dailyRotateFileTransportFormatter,
    timestamp         : timestampFormatter
  };

  /**
   * Default winston instance logger
   *
   * @property winston
   * @type Object
   */
  this.winston = new (winston.Logger)({
    transports  : [
      new (winston.transports.Console)(_.clone(this.defaultConsoleTransport))
    ],
    exitOnError : false
  });
}

// Process inheritance of emiter to my object.
// We need to process this here beacuse inherits remove all previous prototype declaration
util.inherits(Logger, emmitter);

/**
 * Wrapper function to enable log on console
 *
 * @param {Boolean} status true if we need to enable false otherwise
 */
Logger.prototype.enableConsole = function (status) {
  // Has a valid status
  status      = _.isBoolean(status) ? status : true;
  var fnName  = status ? 'enableConsole' : 'disableConsole';

  // Check instance existence ??
  if (!_.isUndefined(this.winston.transports) || !_.isNull(this.winston.transports) &&
      _.isObject(this.winston.transports)) {
    // Requirements check
    if (_.has(this.winston.transports, 'console')) {

      // Has property silent ?
      if (_.has(this.winston.transports.console, 'silent')) {

        // Disabled
        this.winston.transports.console.silent = !status;

        // Is enabled ?
        if (status) {
          // Log enable message if enable failed message will be appear on dailyrotate if set
          this.info([ '[ Logger.', fnName, ' ] - enable console on current logger' ].join(''));
        }
      }
    }
  } else {
    console.log(chalk.red([ '[ Logger.', fnName, ' ] - winston doesn\'t exists.' ].join('')));
  }
};

/**
 * Wrapper function to disable log on console
 */
Logger.prototype.disableConsole = function () {
  // Log
  this.info('[ Logger.disableConsole ] - disable console on current logger');

  // Enable
  this.enableConsole(false);
};

/**
 * Wrapper function to enable exceptions on transport
 *
 * @param {Boolean} status true if we need to enable false otherwise
 */
Logger.prototype.enableExceptions = function (status) {
  // Has a valid status
  status      = _.isBoolean(status) ? status : true;
  var fnName  = status ? 'enableExceptions' : 'disableExceptions';

  // Check instance existence ??
  if (!_.isUndefined(this.winston.transports) || !_.isNull(this.winston.transports) &&
      _.isObject(this.winston.transports)) {
    // Parse each element before disable exceptions
    _.each(Object.keys(this.winston.transports), function (key) {
      this.info([
        '[ Logger.',
        fnName,
        ' ] - ',
        fnName.replace('Exceptions', ' exceptions'),
        ' for transport ',
        key
      ].join(''));
      this.winston.transports[key].handleExceptions = !status;
    }, this);
  } else {
    console.log(chalk.red([ '[ Logger.', fnName, ' ] - winston doesn\t exists.' ].join('')));
  }
};

/**
 * Wrapper function to disable exception on transport
 */
Logger.prototype.disableExceptions = function () {
  // Log
  this.info('[ Logger.disableExceptions ] - disable exceptions on current logger');

  // Enable
  this.enableExceptions(false);
};

/**
 * Success function for emit event. catch all success for call process
 *
 * @param {Function} callback callback to use success event
 * @return {Object} current instance
 */
Logger.prototype.success = function (callback) {

  // Setting up the default callback
  callback = (!_.isUndefined(callback) && !_.isNull(callback) & _.isFunction(callback)) ? callback
  : function () {};

  // Catch event and call callback
  this.on('success', callback);

  // Returning current instance
  return this;
};

/**
 * Success function for emit event. catch all failure for call process
 *
 * @param {Function} callback callback to use failure event
 * @return {Object} current instance
 */
Logger.prototype.failure = function (callback) {
  // Setting up the default callback
  callback = (!_.isUndefined(callback) && !_.isNull(callback) && _.isFunction(callback)) ? callback
  : function () {};

  // Catch event and call callback
  this.on('failure', callback);

  // Returning current instance
  return this;
};

/**
 * Adding transport on logger module
 *
 * @param {String} fullpath path to use
 * @param {String} filename filename to use
 * @param {Object} options override options value on daily rotate
 */
Logger.prototype.addDailyRotateTransport = function (fullpath, filename, options) {

  // Path is valid type ? transform to default value if not
  if (_.isUndefined(fullpath) || !_.isString(fullpath) || _.isNull(fullpath)) {
    fullpath = './';
    this.warning(
      '[ Logger.addDailyRotateTransport ] - Invalid path given. Using default path \'./\''
    );
  }

  // Normalize path
  fullpath = path.normalize(fullpath);
  fullpath = path.resolve(fullpath);

  // Save current context
  var context = this;

  // Check file
  fs.lstat(fullpath, function (err, stats) {

    // Is directory ?
    if (!stats || !stats.isDirectory()) {
      context.error([
        '[ Logger.addDailyRotateTransport ] - Directory path : [',
        fullpath,
        '] is invalid. Operation aborted !'
      ].join(' '));
    } else {
      // Check permission
      fs.access(fullpath, fs.F_OK | fs.R_OK | fs.W_OK, function (err) {

        // Can read / write ???
        if (err) {
          context.error([
            '[ Logger.addDailyRotateTransport ] - Cannot read and write on',
            fullpath,
            ' - operation aborted !'
          ].join(' '));
        } else {
          // Build object configuration
          var daily = _.clone(context.defaultDailyRotateTransportFile);

          // Extend daily
          _.extend(daily, { dirname : fullpath });

          // Is a valid options ?
          if (!_.isUndefined(options) && !_.isNull(options) && _.isObject(options)) {
            _.extend(daily, options);
          }

          // Check if file is specified
          if (!_.isUndefined(filename) && !_.isEmpty(filename) && !_.isNull(filename)) {

            // Is a valid file name
            if (_.isString(filename) && !_.isEmpty(filename)) {
              _.extend(daily, { filename : filename });
            } else {
              context.warning([
                '[ Logger.addDailyRotateTransport ] -',
                'filename is not a string. restore filename to',
                daily.filename
              ].join(' '));
            }
          }

          // Winston is available ??
          if (!_.isUndefined(context.winston)) {
            // Transport already exists ?
            if (_.has(context.winston.transports, daily.name)) {
              context.warning([
                '[ Logger.addDailyRotateTransport ] - A transport with the name',
                daily.name,
                'already exists. Removing current before adding new transport'
              ].join(' '));

              context.winston.remove(daily.name);
            }

            // Add new
            context.winston.add(winston.transports.DailyRotateFile, daily);

            // Build name for logging message
            filename = [
              fullpath,
              '/',
              daily.filename,
              moment().format(daily.datePattern.replace('.log', '').toUpperCase()),
              '.log'
            ].join('');

            // Log
            context.info([
              '[ Logger.addDailyRotateTransport ] - Success ! Datas are logged in',
              filename
            ].join(' '));

            // Emit sucess event
            context.emit('success');
          } else {
            console.log(chalk.red([
              '[ Logger.addDailyRotateTransport ] -',
              'Cannot add new transport. instance is invalid'
            ].join(' ')));

            // Emit failure event
            context.emit('failure');
          }
        }
      });
    }
  });

  // Return context for chaining
  return this;
};

/**
 * Default process function, get the current level and log our own message and metdata
 *
 * @method process
 * @param {Integer} level level to use on current log level
 * @param {Mixed} message default message to display
 * @param {Mixed} meta default meta to send on logger
 */
Logger.prototype.process = function (level, message, meta) {

  try {
    // Check instance before process
    if (!_.isUndefined(this.winston) && !_.isNull(this.winston)) {
      // Has function ?
      if (_.has(level, 'fn')) {
        // Has meta ?
        if (!_.isUndefined(meta)) {
          // Log with data + meta
          this.winston.log(level.fn, message, meta);
        } else {
          // Log with data
          this.winston.log(level.fn, message);
        }
      } else {
        // Search function is undefined throw error
        throw 'Fn function is undefined or null. cannot process log';
      }
    } else {
      // Winston is undefined throw error
      throw 'Cannot une winston logger. instance is undefined or null';
    }
  } catch (e) {
    console.log(chalk.red([ '[ Logger.process ] -', e ].join(' ')));
  }
};

/**
 * Default function to change level of logs
 *
 * @method changeLevel
 *
 */
Logger.prototype.changeLevel = function (o, n, isless) {
  // All error
  var levels = [
    this.ERROR_LOG_LEVEL,
    this.WARNING_LOG_LEVEL,
    this.INFO_LOG_LEVEL,
    this.VERBOSE_LOG_LEVEL,
    this.DEBUG_LOG_LEVEL
  ];

  // Assign current level to current var
  this.logLevel = n;

  // Checking if new is not old level => the same => no changes needed
  if (o !== n) {
    // Test if is less and log if needed
    if (!_.isUndefined(isless) && _.isBoolean(isless) && isless) {
      this.info([
        '[ Logger.changeLevel ] - Try to change level from',
        levels[o - 1].name,
        'to',
        levels[n - 1].name
      ].join(' '));
    } else {
      this.info([
        '[ Logger.changeLevel ] - Try to change level from',
        levels[n - 1].name,
        'to',
        levels[o - 1].name
      ].join(' '));
    }
  } else {
    // Logging changes
    this.info([
      '[ Logger.changeLevel ] - Kepping level to',
      levels[this.logLevel - 1].name
    ].join(' '));
  }

  // Winston is here
  if (!_.isUndefined(this.winston.transports) || !_.isNull(this.winston.transports) &&
      _.isObject(this.winston.transports)) {

    _.each(this.winston.transports, function (transport) {
      if (_.has(transport, 'level')) {
        transport.level = levels[this.logLevel - 1].name;
      }
    }, this);
  }

  // Return current instance
  return this;
};

/**
 * Default function to change level of log to more level
 *
 * @method more
 */
Logger.prototype.more = function () {

  // Getting default value for log changing
  var o = this.logLevel;
  var n = o < 5 ? (o + 1) : o;

  // Show what we process
  this.info('[ Logger.more ] - Requesting more logs');
  // Changing level and returning instance
  return this.changeLevel(o, n);
};

/**
 * Default function to change level of log to less level
 *
 * @method less
 */
Logger.prototype.less = function () {
  // Getting default value for log changing
  var o = this.logLevel;
  var n = o > 1 ? (o - 1) : o;

  // Show what we process
  this.info('[ Logger.less ] - Requesting less logs');
  // Changing level and returning instance
  return this.changeLevel(o, n, true);
};

/**
 * Log message and metadata with the current verbose level
 *
 * @method verbose
 * @param {String} message message to send on logger
 * @param {Object} meta metadata to send on logger
 */
Logger.prototype.verbose = function (message, meta) {
  // call main log process with verbose level
  this.process(this.VERBOSE_LOG_LEVEL, message, meta);
};

/**
 * Log message and metadata with the current info level
 *
 * @method info
 * @param {String} message message to send on logger
 * @param {Object} meta metadata to send on logger
 */
Logger.prototype.info = function (message, meta) {
  // Call main log process with info level
  this.process(this.INFO_LOG_LEVEL, message, meta);
};

/**
 * Log message and metadata with the current warning level
 *
 * @method warning
 * @param {String} message message to send on logger
 * @param {Object} meta metadata to send on logger
 */
Logger.prototype.warning = function (message, meta) {
  // call main log process with warning level
  this.process(this.WARNING_LOG_LEVEL, message, meta);
};

/**
 * Log message and metadata with the current error level
 *
 * @method error
 * @param {String} message message to send on logger
 * @param {Object} meta metadata to send on logger
 */
Logger.prototype.error = function (message, meta) {
  // call main log process with error level
  this.process(this.ERROR_LOG_LEVEL, message, meta);
};

/**
 * Log message and metadata with the current debug level
 *
 * @method debug
 * @param {String} message message to send on logger
 * @param {Object} meta metadata to send on logger
 */
Logger.prototype.debug = function (message, meta) {
  // call main log process with debug level
  this.process(this.DEBUG_LOG_LEVEL, message, meta);
};

/**
 * Log a banner message on console
 *
 * @method banner
 * @param {String} message message to send on logger
 * @param {Object} cstyle style to use on banner based on chalk rules
 *
 * @example
 *
 *      // eample with custom style
 *      instance.banner('test message', { color : 'white', bgColor : 'bgRed' });
 *      // This will display "test message" with bgRed and white text  *
 */
Logger.prototype.banner = function (message, cstyle) {
  // default style
  var style = {
    color     : 'white',
    bgColor   : 'bgBlack',
    tDelim    : '-',
    bDelim    : '-',
    lDelim    : '|',
    rDelim    : '|'
  };

  // has custom style options with color and bgColor rules
  if (!_.isUndefined(cstyle) && _.has(cstyle, 'color') && _.has(cstyle, 'bgColor')) {

    // bg rules start by correct Prefix ?
    if (!_.startsWith('bg', cstyle.bgColor)) {
      cstyle.bgColor = [ 'bg',
        _.capitalize(cstyle.bgColor.toLowerCase())
      ].join('');
    }

    // extend obj
    _.extend(style, cstyle);
  }

  // build end message
  var endmessage  = [ style.lDelim, message, style.rDelim ].join(' ');

  // check properties
  if (_.has(chalk.styles, style.color) && _.has(chalk.styles, style.bgColor)) {
    // log full message
    console.log(chalk[style.color][style.bgColor](_.repeat(style.tDelim, endmessage.length)));
    console.log(chalk[style.color][style.bgColor](endmessage));
    console.log(chalk[style.color][style.bgColor](_.repeat(style.bDelim, endmessage.length)));
  } else {
    this.warning([
      '[ Logger.Banner ] - Cannot use custom style given style is invalid.',
      'Please read chalk documentation. Logging with current shell config.'
    ].join(' '));

    console.log(_.repeat(style.tDelim, endmessage.length));
    console.log(endmessage);
    console.log(_.repeat(style.bDelim, endmessage.length));
  }
};

/**
 * Export current logger to use it on node
 */
module.exports = new (Logger)();
