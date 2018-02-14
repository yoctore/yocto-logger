'use strict';

var winston       = require('winston');
var _             = require('lodash');
var chalk         = require('chalk');
var moment        = require('moment');
var format        = require('string-format');
var uuid          = require('uuid');
var fs            = require('fs');
var path          = require('path');
var Promise       = require('promise');
var rotate        = require('winston-daily-rotate-file');

// Must extend String.prottype for use format to a method mode
format.extend(String.prototype);

// Allow to display errors
winston.emitErrs = false;

/**
 * Yocto logger manager. Manage your own logger request
 *
 * @class Logger
 */
function Logger () {
  /**
   * @memberof Logger
   * @member {Integer} logLevel Default log level
   * @default 5
   */
  this.logLevel = 5;

  /**
   * @see https://www.npmjs.com/package/winston#console-transport
   * @memberof Logger
   * @member {String} TYPE_CONSOLE Default const to define console type
   * @default console
   * @const
   */
  this.TYPE_CONSOLE = 'console';

  /**
   * @see https://www.npmjs.com/package/winston#daily-rotate-file-transport
   * @memberof Logger
   * @member {String} TYPE_DAILY_ROTATE_FILE Default const to define daily rotate file
   * @default daily-rotate-file
   * @const
   */
  this.TYPE_DAILY_ROTATE_FILE = 'daily-rotate-file';

  /**
   * @memberof Logger
   * @member {Object} ERROR_LOG_LEVEL Default const to define error log level rules
   * @default { name : 'error', level : 0, fn : 'error' }
   * @const
   */
  this.ERROR_LOG_LEVEL = {
    name  : 'error',
    level : 0,
    fn    : 'error'
  };

  /**
   * @memberof Logger
   * @member {Object} WARNING_LOG_LEVEL Default const to define warning log level rules
   * @default { name : 'warning', level : 1, fn : 'warn' }
   * @const
   */
  this.WARNING_LOG_LEVEL = {
    name  : 'warning',
    level : 1,
    fn    : 'warn'
  };

  /**
   * @memberof Logger
   * @member {Object} INFO_LOG_LEVEL Default const to define info log level rules
   * @default { name : 'info',    level : 2, fn : 'info' }
   * @const
   */
  this.INFO_LOG_LEVEL = {
    name  : 'info',
    level : 2,
    fn    : 'info'
  };

  /**
   * @memberof Logger
   * @member {Object} VERBOSE_LOG_LEVEL Default const to define verbose log level rules
   * @default { name : 'verbose', level : 3, fn : 'verbose' }
   * @const
   */
  this.VERBOSE_LOG_LEVEL = {
    name  : 'verbose',
    level : 3,
    fn    : 'verbose'
  };

  /**
   * @memberof Logger
   * @member {Object} DEBUG_LOG_LEVEL Default const to define debug log level rules
   * @default { name : 'debug',   level : 4, fn : 'debug' }
   * @const
   */
  this.DEBUG_LOG_LEVEL = {
    name  : 'debug',
    level : 4,
    fn    : 'debug'
  };

  /**
   * @memberof Logger
   * @member {Object} SILLY_LOG_LEVEL Default const to define debug log level rules
   * @default { name : 'debug',   level : 5, fn : 'debug' }
   * @const
   */
  this.SILLY_LOG_LEVEL = {
    name  : 'silly',
    level : 5,
    fn    : 'silly'
  };

  /**
   * Default formatter. use all data to render the correct message format to the logger formatter
   *
   * @method
   * @memberof Logger
   * @param {Object} options default options to use
   * @param {Boolean} colorize if true enable colorize process, false otherwise
   * @return {String} the correct string to use on current transporter
   * @private
   */
  var transportFormatter = function (options, colorize) {
    // Setting up the colorize flag
    colorize = colorize || false;

    // Define date to use
    var date = null;

    // Check is function
    if (_.isFunction(options.timestamp)) {
      // Set fn
      date = options.timestamp();
    } else if (!_.isNull(options.timestamp)) {
      // Use moment
      date = moment().format();
    }


    // Build data to log
    var dataToLog = {
      level   : options.level,
      date    : date,
      message : !_.isUndefined(options.message) && !_.isEmpty(options.message) ?
        options.message : '',
      meta : !_.isUndefined(options.meta) && Object.keys(options.meta).length ?
        JSON.stringify(options.meta) : ''
    };

    // Has label property

    if (_.has(options, 'label') && _.isFunction(options.label)) {
      dataToLog.level = options.label(options.level.toUpperCase());
    }

    // Has options timestamp
    if (_.has(options, 'timestamp') && _.isFunction(options.timestamp)) {
      dataToLog.date = options.timestamp();
    }

    // Use colorize only on console mode
    if (colorize) {
      if (_.has(options, 'colorize') && _.isFunction(options.colorize)) {
        // Prepare value to use on logger
        colorize = options.colorize(options.level);

        // Set level
        dataToLog.level = chalk[colorize]('[{}]'.format(
          options.label(options.level.toUpperCase(), 4, ' '), 3, ' '));
      }
    }

    // Default format
    var dformat  = '{level}';

    // Date is not null ?
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
   * @method
   * @memberof Logger
   * @private
   * @return {String} formated string based on moment.js format
   */
  var timestampFormatter = function () {
    // Default statement
    return moment().format('YYYY/MM/DD HH:mm:ss');
  };

  /**
   * Default label function to retrive the correct label to display on logger
   *
   * @method
   * @private
   * @memberof Logger
   * @param {String} value value to check
   * @return {String} the correct value to display
   */
  var labelFormatter =  function (value) {
    var rules = [
      {
        info : 'info    '
      },
      {
        warn : 'warning '
      },
      {
        error : 'error   '
      },
      {
        debug : 'debug   '
      },
      {
        verbose : 'verbose '
      },
      {
        silly : 'silly'
      }
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
   * @method
   * @private
   * @memberof Logger
   * @param {String} level current level to use
   * @return {String} current color to use on chalk
   */
  var colorizeFormatter  = function (level) {
    var rules = [
      {
        info : 'green'
      },
      {
        warn : 'yellow'
      },
      {
        error : 'red'
      },
      {
        debug : 'blue'
      },
      {
        verbose : 'white'
      },
      {
        silly : 'magenta'
      }
    ];

    // Get index
    var index = _.findIndex(rules, level);

    // Check and return a correct value
    if (index >= 0) {
      // Get first item
      return _.first(_.values(rules[index]));
    }

    // Return default value
    return 'white';
  };

  /**
   * Default console formatter. use all data to render the correct message format to the logger formatter
   *
   * @public
   * @memberof Logger
   * @method consoleTransportFormatter
   * @param {Object} options default options to use
   * @return {String} the correct string to use on current transporter
   */
  this.consoleTransportFormatter = function (options) {
    // Default statement
    return transportFormatter(options, true);
  };

  /**
   * Default daily rotate file formatter. use all data to render the correct message format to the logger formatter
   *
   * @public
   * @memberof Logger
   * @method dailyRotateFileTransportFormatter
   * @param {Object} options default options to use
   * @return {String} the correct string to use on current transporter
   */
  this.dailyRotateFileTransportFormatter = function (options) {
    // Default statement
    return transportFormatter(options, false);
  };

  /**
   * Default console transporter configuration
   *
   * @public
   * @memberof Logger
   * @member {Object} defaultConsoleTransport Default console transport configuration
   */
  this.defaultConsoleTransport = {
    level                           : 'debug',
    handleExceptions                : true,
    humanReadableUnhandledException : true,
    json                            : false,
    showLevel                       : true,
    silent                          : false,
    label                           : labelFormatter,
    formatter                       : this.consoleTransportFormatter,
    timestamp                       : timestampFormatter,
    colorize                        : colorizeFormatter
  };

  /**
   * Default daily rotate transport file
   *
   * @public
   * @memberof Logger
   * @member {Object} defaultDailyRotateTransportFile
   */
  this.defaultDailyRotateTransportFile = {
    name                            : 'default-daily-rotate-transport',
    level                           : 'verbose',
    dirname                         : './',
    filename                        : uuid.v4(),
    handleExceptions                : true,
    humanReadableUnhandledException : true,
    json                            : false,
    maxsize                         : 5242880,
    maxFiles                        : 5,
    colorize                        : true,
    datePattern                     : '-yyyy-MM-dd.log',
    label                           : labelFormatter,
    formatter                       : this.dailyRotateFileTransportFormatter,
    timestamp                       : timestampFormatter
  };

  /**
   * Default winston instance logger
   *
   * @public
   * @memberof Logger
   * @member {Instance} winston
   */
  this.winston = new winston.Logger({
    transports : [
      new winston.transports.Console(_.clone(this.defaultConsoleTransport))
    ],
    exitOnError : false
  });
}

/**
 * Wrapper function to enable log on console
 *
 * @param {Boolean} status true if we need to enable false otherwise
 * @return {Boolean} true in case of success false otherwise
 */
Logger.prototype.enableConsole = function (status) {
  // Has a valid status
  status = _.isBoolean(status) ? status : true;

  // Define correct function
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

        // Return a valid statement
        return true;
      }
    }
  } else {
    // Default log
    console.log(chalk.red([ '[ Logger.', fnName, ' ] - winston doesn\'t exists.' ].join('')));
  }

  // Default statement
  return false;
};

/**
 * Wrapper function to disable log on console
 *
 * @return {Boolean} true in case of success false otherwise
 */
Logger.prototype.disableConsole = function () {
  // Log
  this.info('[ Logger.disableConsole ] - disable console on current logger');

  // Enable
  return this.enableConsole(false);
};

/**
 * Wrapper function to enable exceptions on transport
 *
 * @param {Boolean} status true if we need to enable false otherwise
 * @param {String} transportName name to use to find correct transport
 * @return {Boolean} true in case of success false otherwise
 */
Logger.prototype.enableExceptions = function (status, transportName) {
  // Has a valid status
  status = _.isBoolean(status) ? status : true;

  // Default name
  var fnName  = status ? 'enableExceptions' : 'disableExceptions';

  // Only if is enable status

  if (status) {
    // Log
    this.info('[ Logger.enableExceptions ] - Try to enable exceptions on logger');
  }

  // Check instance existence ??
  if (!_.isUndefined(this.winston.transports) || !_.isNull(this.winston.transports) &&
      _.isObject(this.winston.transports)) {
    // Get all keys transports
    var transports = Object.keys(this.winston.transports);

    // Get correct transports items

    transports = _.isString(transportName) && !_.isEmpty(transportName) ?
      _.filter(transports, function (transport) {
        return transport === transportName;
      }) : transports;

    // Parse each element before disable exceptions
    _.each(transports, function (key) {
      // Log message
      this.info([
        '[ Logger.',
        fnName,
        ' ] - ',
        fnName.replace('Exceptions', ' exceptions'),
        ' for transport ',
        key
      ].join(''));

      // Change item status
      this.winston.transports[key].handleExceptions = !status;

      // Return valid statement
      return true;
    }.bind(this));
  } else {
    console.log(chalk.red([ '[ Logger.', fnName, ' ] - winston doesn\t exists.' ].join('')));
  }

  // Default statement
  return false;
};

/**
 * Wrapper function to disable exception on transport
 *
 * @param {String} transportName name to use to find correct transport
 * @return {Boolean} true in case of success false otherwise
 */
Logger.prototype.disableExceptions = function (transportName) {
  // Log
  this.info('[ Logger.disableExceptions ] - Try to disable exceptions on logger');

  // Enable
  return this.enableExceptions(false, transportName);
};

/**
 * Adding transport on logger module
 *
 * @param {String} fullpath path to use
 * @param {String} filename filename to use
 * @param {Object} options override options value on daily rotate
 * @return {Object} default instance of promise to use for catching response
 */
Logger.prototype.addDailyRotateTransport = function (fullpath, filename, options) {
  // Path is valid type ? transform to default value if not
  if (_.isUndefined(fullpath) || !_.isString(fullpath) || _.isNull(fullpath)) {
    fullpath = './';

    // Warning message
    this.warning(
      '[ Logger.addDailyRotateTransport ] - Invalid path given. Using default path \'./\''
    );
  }

  // Normalize path
  fullpath = path.normalize(fullpath);
  fullpath = path.resolve(fullpath);

  // Default message data for event dispatch
  var message;

  // Return promise statement
  return new Promise(function (fulfill, reject) {
    // Check file
    fs.lstat(fullpath, function (err, stats) {
      // Is directory ?
      if (!stats || !stats.isDirectory()) {
        message = [ '[ Logger.addDailyRotateTransport ] - Directory path : [',
          fullpath, '] is invalid.', err, 'Operation aborted !' ].join(' ');

        // Log message
        this.error(message);

        // Failed so reject
        reject(message);
      } else {
        // Check permission
        fs.access(fullpath, fs.F_OK || fs.R_OK || fs.W_OK, function (err) {
          // Can read / write ???
          if (err) {
            message = [ '[ Logger.addDailyRotateTransport ] - Cannot read and write on',
              fullpath, ' - operation aborted !' ].join(' ');

            // Log message
            this.error(message);

            // Failed so reject
            reject(message);
          } else {
            // Build object configuration
            var daily = _.clone(this.defaultDailyRotateTransportFile);

            // Extend daily
            _.extend(daily, {
              dirname : fullpath
            });

            // Is a valid options ?
            if (!_.isUndefined(options) && !_.isNull(options) && _.isObject(options)) {
              _.extend(daily, options);
            }

            // Check if file is specified
            if (!_.isUndefined(filename) && !_.isEmpty(filename) && !_.isNull(filename)) {
              // Is a valid file name
              if (_.isString(filename) && !_.isEmpty(filename)) {
                // Process default extend
                _.extend(daily, {
                  filename : filename
                });
              } else {
                this.warning([
                  '[ Logger.addDailyRotateTransport ] -',
                  'filename is not a string. restore filename to',
                  daily.filename
                ].join(' '));
              }
            }

            // Winston is available ??
            if (!_.isUndefined(this.winston)) {
              // Transport already exists ?
              if (_.has(this.winston.transports, daily.name)) {
                this.warning([
                  '[ Logger.addDailyRotateTransport ] - A transport with the name',
                  daily.name,
                  'already exists. Removing current before adding new transport'
                ].join(' '));

                // Remove existing
                this.winston.remove(daily.name);
              }

              // Add new
              this.winston.add(rotate, daily);

              // Build name for logging message
              filename = [
                fullpath,
                '/',
                daily.filename,
                moment().format(daily.datePattern.replace('.log', '').toUpperCase()),
                '.log'
              ].join('');

              // Log
              this.info([
                '[ Logger.addDailyRotateTransport ] - Success ! Datas are logged in',
                filename
              ].join(' '));

              // Change transport default property
              this.winston.transports[daily.name].isDefault = !(!_.isUndefined(options) &&
                _.isString(options.name) && !_.isEmpty(options.name) &&
                  options.name !== this.defaultDailyRotateTransportFile.name);

              // Emit sucess event
              fulfill(_.get(this.winston.transports, daily.name));
            } else {
              message = [ '[ Logger.addDailyRotateTransport ] -',
                'Cannot add new transport. instance is invalid' ].join(' ');

              // Log message
              this.error(message);

              // Emit failure event
              reject(message);
            }
          }
        }.bind(this));
      }
    }.bind(this));
  }.bind(this));
};

/**
 * Default log function. This method call winston logger with correct level of logs.
 * Specific transport can be used in last param to use a specific transport.
 *
 * @param {Integer} level level to use on current log level
 * @param {String} message default message to display
 * @param {Object} meta default meta to send on logger
 * @param {String} transportName name to use to find correct transport
 * @return {Boolean|EventEmitter} false in case of error an event eventEmitter in case of success
 */
Logger.prototype.process = function (level, message, meta, transportName) {
  // Default try/catch process
  try {
    // Check instance before process
    if (!_.isUndefined(this.winston) && !_.isNull(this.winston)) {
      // Has function ?
      if (_.has(level, 'fn')) {
        // Default transport
        var transport   = this.winston;

        // Parse all transports
        var transports  = this.winston.transports;

        // A correct specific transport name is defined ?
        if (_.isString(transportName) && !_.isEmpty(transportName) &&
          _.has(transports, transportName)) {
          // Change default transport
          transport = _.get(transports, transportName);
        }

        // Default statement
        return !_.isUndefined(meta) ?
          transport.log(level.fn, message, meta) :
          transport.log(level.fn, message);
      }

      // Search function is undefined throw error
      throw 'Fn function is undefined or null. cannot process log';
    } else {
      // Winston is undefined throw error
      throw 'Cannot une winston logger. instance is undefined or null';
    }
  } catch (e) {
    // Default log
    console.log(chalk.red([ '[ Logger.process ] -', e ].join(' ')));
  }

  // Default statement
  return false;
};

/**
 * Default function to change level of logs
 *
 * @param {Integer} o the current offset level
 * @param {Integer} n the new offset level
 * @param {Boolean} isless true if is for a less request false otherwise
 * @param {String} transportName name to use to find correct transport
 * @return {Object} current instance for chaining
 */
Logger.prototype.changeLevel = function (o, n, isless, transportName) {
  // All error
  var levels = [
    this.ERROR_LOG_LEVEL,
    this.WARNING_LOG_LEVEL,
    this.INFO_LOG_LEVEL,
    this.VERBOSE_LOG_LEVEL,
    this.DEBUG_LOG_LEVEL,
    this.SILLY_LOG_LEVEL
  ];

  // Assign current level to current var
  this.logLevel = n;

  // Checking if new is not old level => the same => no changes needed
  if (o !== n) {
    // Test if is less and log if needed
    if (!_.isUndefined(isless) && _.isBoolean(isless) && isless) {
      this.info([
        '[ Logger.changeLevel ] - Try to change level from',
        levels[o].name,
        'to',
        levels[n].name
      ].join(' '));
    } else {
      this.info([
        '[ Logger.changeLevel ] - Try to change level from',
        levels[o].name,
        'to',
        levels[n].name
      ].join(' '));
    }

    // Winston is here
    if (!_.isUndefined(this.winston.transports) || !_.isNull(this.winston.transports) &&
        _.isObject(this.winston.transports)) {
      // Parse all transports
      var transports  = this.winston.transports;

      // A correct specific transport name is defined ?
      if (_.isString(transportName) && !_.isEmpty(transportName) &&
        _.has(transports, transportName)) {
        // Change default transport
        transports = [ _.get(transports, transportName) ];
      }

      // Parse all transport
      _.each(transports, function (transport) {
        // Has level property
        if (_.has(transport, 'level')) {
          // Get level method for winston
          transport.level = levels[this.logLevel].fn;

          // Info
          this.info([ '[ Logger.changeLevel ] - Level was changed to',
            levels[this.logLevel].name, 'for', transport.name ].join(' '));
        }
      }.bind(this));
    } else {
      // Error message
      this.error('[ Logger.changeLevel ] - Cannot change level. Transport is not defined');
    }
  } else {
    // Logging changes
    this.info([
      '[ Logger.changeLevel ] - Unchange level to',
      levels[this.logLevel].name
    ].join(' '));
  }

  // Return current instance
  return this;
};

/**
 * Change log level manually
 *
 * @param {String} name name of level
 * @param {String} transportName name to use to find correct transport
 * @return {Boolean|Object} false if error occured otherwise current instance for chaining
 */
Logger.prototype.setLogLevel = function (name, transportName) {
  // All error
  var levels = [
    this.ERROR_LOG_LEVEL,
    this.WARNING_LOG_LEVEL,
    this.INFO_LOG_LEVEL,
    this.VERBOSE_LOG_LEVEL,
    this.DEBUG_LOG_LEVEL,
    this.SILLY_LOG_LEVEL
  ];

  // Search data
  var current   = _.find(levels, [ 'level', this.logLevel ]);

  // Search data
  var searched  = _.find(levels, [ 'name', name ]);

  // Value was founded ?
  if (!_.isUndefined(searched) && _.has(searched, 'level') && _.isNumber(searched.level) &&
      !_.isUndefined(current) && _.has(current, 'level') && _.isNumber(current.level)) {
    // Assing value
    return this.changeLevel(this.logLevel, searched.level,
      current.level > searched.level, transportName);
  }

  // Warning message
  this.warning([ '[ Logger.setLogLevel ] - Cannot change log level manually.',
    'Given level [', name, '] was not founded.' ].join(' '));


  // Default statement
  return false;
};

/**
 * Default function to change level of log to more level
 *
 * @param {String} transportName name to use to find correct transport
 * @return {Object} current instance for chaining
 */
Logger.prototype.more = function (transportName) {
  // Getting default value for log changing
  var o = this.logLevel;
  var n = o < 5 ? o + 1 : o;

  // Show what we process
  this.info('[ Logger.more ] - Requesting more logs');

  // Changing level and returning instance
  return this.changeLevel(o, n, false, transportName);
};

/**
 * Default function to change level of log to less level
 *
 * @param {String} transportName name to use to find correct transport
 * @return {Object} current instance for chaining
 */
Logger.prototype.less = function (transportName) {
  // Getting default value for log changing
  var o = this.logLevel;
  var n = o > 0 ? o - 1 : o;

  // Show what we process
  this.info('[ Logger.less ] - Requesting less logs');

  // Changing level and returning instance
  return this.changeLevel(o, n, true, transportName);
};

/**
 * Log message and metadata with the current verbose level
 *
 * @param {String} message message to send on logger
 * @param {Object} meta metadata to send on logger
 * @param {String} transportName name to use to find correct transport
 * @return {Boolean|EventEmitter} false in case of error an event eventEmitter in case of success
 */
Logger.prototype.verbose = function (message, meta, transportName) {
  // Call main log process with verbose level
  return this.process(this.VERBOSE_LOG_LEVEL, message, meta, transportName);
};

/**
 * Log message and metadata with the current info level
 *
 * @param {String} message message to send on logger
 * @param {Object} meta metadata to send on logger
 * @param {String} transportName name to use to find correct transport
 * @return {Boolean|EventEmitter} false in case of error an event eventEmitter in case of success
 */
Logger.prototype.info = function (message, meta, transportName) {
  // Call main log process with info level
  return this.process(this.INFO_LOG_LEVEL, message, meta, transportName);
};

/**
 * Log message and metadata with the current warning level
 *
 * @param {String} message message to send on logger
 * @param {Object} meta metadata to send on logger
 * @param {String} transportName name to use to find correct transport
 * @return {Boolean|EventEmitter} false in case of error an event eventEmitter in case of success
 */
Logger.prototype.warning = function (message, meta, transportName) {
  // Call main log process with warning level
  return this.process(this.WARNING_LOG_LEVEL, message, meta, transportName);
};

/**
 * Log message and metadata with the current error level
 *
 * @param {String} message message to send on logger
 * @param {Object} meta metadata to send on logger
 * @param {String} transportName name to use to find correct transport
 * @return {Boolean|EventEmitter} false in case of error an event eventEmitter in case of success
 */
Logger.prototype.error = function (message, meta, transportName) {
  // Call main log process with error level
  return this.process(this.ERROR_LOG_LEVEL, message, meta, transportName);
};

/**
 * Log message and metadata with the current debug level
 *
 * @param {String} message message to send on logger
 * @param {Object} meta metadata to send on logger
 * @param {String} transportName name to use to find correct transport
 * @return {Boolean|EventEmitter} false in case of error an event eventEmitter in case of success
 */
Logger.prototype.debug = function (message, meta, transportName) {
  // Call main log process with debug level
  return this.process(this.DEBUG_LOG_LEVEL, message, meta, transportName);
};

/**
 * Log message and metadata with the current silly level
 *
 * @param {String} message message to send on logger
 * @param {Object} meta metadata to send on logger
 * @param {String} transportName name to use to find correct transport
 * @return {Boolean|EventEmitter} false in case of error an event eventEmitter in case of success
 */
Logger.prototype.silly = function (message, meta, transportName) {
  // Call main log process with debug level
  return this.process(this.SILLY_LOG_LEVEL, message, meta, transportName);
};

/**
 * Log a banner message on console
 *
 * @param {String} message message to send on logger
 * @param {Object} cstyle style to use on banner based on chalk rules
 * @return {Boolean} true when process is ok
 */
Logger.prototype.banner = function (message, cstyle) {
  // Default style
  var style = {
    color   : 'white',
    bgColor : 'bgBlack',
    tDelim  : '-',
    bDelim  : '-',
    lDelim  : '|',
    rDelim  : '|'
  };

  // Has custom style options with color and bgColor rules
  if (!_.isUndefined(cstyle) && _.has(cstyle, 'color') && _.has(cstyle, 'bgColor')) {
    // Bg rules start by correct Prefix ?
    if (!_.startsWith('bg', cstyle.bgColor)) {
      cstyle.bgColor = [ 'bg',
        _.capitalize(cstyle.bgColor.toLowerCase())
      ].join('');
    }

    // Extend obj
    _.extend(style, cstyle);
  }

  // Build end message
  var endmessage  = [ style.lDelim, message, style.rDelim ].join(' ');

  try {
    console.log(chalk[style.color][style.bgColor](_.repeat(style.tDelim, endmessage.length)));
    console.log(chalk[style.color][style.bgColor](endmessage));
    console.log(chalk[style.color][style.bgColor](_.repeat(style.bDelim, endmessage.length)));
  } catch (error) {
    this.warning([
      '[ Logger.Banner ] - error when write log : ' + error + ' . Logging with current shell value.'
    ].join(' '));

    console.log(_.repeat(style.tDelim, endmessage.length));
    console.log(endmessage);
    console.log(_.repeat(style.bDelim, endmessage.length));
  }

  // Default statement
  return true;
};

/**
 * Export current logger to use it on node
 */
module.exports = new Logger();
