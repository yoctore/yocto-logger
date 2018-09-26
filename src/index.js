'use strict';

const winston       = require('winston');
const _             = require('lodash');
const chalk         = require('chalk');
const moment        = require('moment');
const fs            = require('fs');
const path          = require('path');
const stackTrace    = require('stack-trace');
const morgan        = require('morgan');
const os            = require('os');

// To this require to extend main winston var
require('winston-daily-rotate-file');

/**
 *
 * This class manage all method to add or use a logger instance on your app.
 *
 * This module is based on <b><a class="blank" href="https://github.com/winstonjs/winston">winston</a></b>
 * for default logging and <b><a class="blank" href="https://github.com/expressjs/morgan">morgan</a></b> for request access logging.
 *
 * This module is not a complete re-implementation of winston or morgan, we only use needed functionnality on this two module to create your own.
 *
 * With this module we can create log on <code class="code">Console</code> and <code class="code">File</code> with a daily rotate management.
 *
 * This module use syslog levels for logging action for more details see <b><a class="blank" href="https://github.com/winstonjs/winston#logging-levels">here</a></b>
 *
 * @example
 * // require the module
 * const logger = require('yocto-logger');
 *
 * // create your logger
 * const log = logger.create();
 *
 * // At this point just use your logger
 *
 * @constructor
 */
class Logger {
  /**
   * Default constructor of Logger class.
   *
   * Don't use it directly, prefer use <code class="code">logger.create()</code> instead
   *
   * @constructor
   */
  constructor () {
    /**
     * Lists of logger levels custom for your own usage
     *
     * @memberof Logger
     * @member {Array} levels lists of remap syslog levels for current app
     */
    this.levels = _.map(winston.config.syslog.levels, function (level, key) {
      // Default statement
      return {
        level       : level,
        fn          : key,
        name        : key.replace(/^crit$/g, 'critical').replace(/^emerg$/g, 'emergency'),
        useCallback : level >= 0 && level < 3
      }
    });

    /**
     * Default log level set to use app.
     *
     * If <code>process.env.NODE_ENV</code> is set to <code>production</code> the <code>notice</code> level was used by default,
     * otherwise the <code>debug</code> level is used
     *
     * @memberof Logger
     * @member {Integer} logLevel default log level for current app
     */
    this.logLevel = _.find(this.levels,
      [ 'name', process.env.NODE_ENV === 'production' ? 'notice' : 'debug' ]);

    /**
     * Default transformer use by current logger
     *
     * @memberof Logger
     * @member {FormatWrap} defaultTransformer internal default transformer
     */
    this.defaultTransformer = winston.format(function (info) {
      // Replace some %s to "%s" for display formating
      if (_.isString(info.message)) {
        info.message = info.message.replace(/%s/g, '"%s"');
      }

      // Try to get stack trace to buld format
      const stack  = stackTrace.get();
      const caller = _.size(stack) >= 22 ? stack[22] : null;

      // Has specified method ?
      if (_.isFunction(caller.getMethodName) && _.isFunction(caller.getFileName)) {
        // Build default from
        info.from = caller.getMethodName() || caller.getFileName();

        // Remove working directory path to avoid long path in log
        info.from = info.from.replace(process.cwd(), '');

        // Typeame is a specific class ?
        if (!path.extname(info.from) && !_.includes(caller.getTypeName(), [ 'Object' ])) {
          // Append full path on log
          info.from = [ caller.getTypeName(), info.from ].join('.');
        }

        // Add line number to from
        info.from = [ info.from, caller.getLineNumber() ].join(':');
      }

      // Set level to uppercase and padded properly
      info.level = _.padEnd(info.level.toUpperCase(), 7, ' ');

      // Default statement
      return info;
    });

    /**
     * Default timestamp transformer use by current logger
     *
     * @memberof Logger
     * @member {FormatWrap} defaultTimestampFormat internal default transformer for timestamp
     */
    this.defaultTimestampFormat = winston.format(info =>{
      // Set locale with default system locale
      moment.locale(process.env.LC_ALL || process.env.LC_MESSAGES ||
                    process.env.LANG || process.env.LANGUAGE);

      // Set default timestamp format
      info.timestamp = moment(info.timestamp).format('L LTS');

      // Default statement
      return info;
    });

    /**
     * Define here default print transformer to display data like we need
     *
     * @memberof Logger
     * @member {FormatWrap} defaultPrintTranformer internal default print transformer
     */
    this.defaultPrintTranformer = winston.format.printf(info =>{
      // In case a label is defined
      if (!_.isUndefined(info.label)) {
        // Default statement
        return `[${info.timestamp}] -> ${info.level} - [${info.label}] : ${info.message}`;
      }

      // Default statement
      return `[${info.timestamp}] | ${info.level} -> [${info.from}] : ${info.message}`;
    });

    /**
     * Define here default print transformer for web access to display data like we need
     *
     * @memberof Logger
     * @member {FormatWrap} defaultWebPrintTranformer internal default print transformer for web request
     */
    this.defaultWebPrintTranformer = winston.format.printf(info =>info.message.replace(os.EOL, ''));

    /**
     * Default winston instance logger
     *
     * @memberof Logger
     * @member {Instance} winston internal winston instance
     */
    this.winston = winston.createLogger({
      transports : [
        new winston.transports.Console({
          handleExceptions : true,
          format           : winston.format.combine(
            this.defaultTransformer(),
            winston.format.timestamp(),
            this.defaultTimestampFormat(),
            winston.format.label(),
            winston.format.colorize(),
            winston.format.splat(),
            this.defaultPrintTranformer
          )
        })
      ],
      silent : false,
      levels : winston.config.syslog.levels,
      level  : this.logLevel.name
    });

    /**
     * Default morgan web logger instance
     *
     * @memberof Logger
     * @member {Instance} webLogger internal morgan instance
     */
    this.webLogger = winston.createLogger();
  }

  /**
   * Default method to create a logger instance.
   *
   * Use this method to get default logger instance
   *
   * @example
   * var logger = require('yocto-logger');
   * // Create your own logger here
   * logger = logger.create();
   *
   * @return {Logger} an instance of current logger
   */
  static create () {
    // New logger instance
    return new Logger();
  }

  /**
   * Enable log on console
   *
   * @param {Boolean} status true if we need to enable false otherwise
   * @return {Boolean} true in case of success false otherwise
   */
  enableConsole (status) {
    // Has a valid status
    status = _.isBoolean(status) ? status : true;

    // Parse all item
    _.each(this.winston.transports, transport =>{
      // Only in case of Console
      if (transport instanceof winston.transports.Console) {
        // Change transport silent status
        transport.silent = !status;
      }
    });

    // Default statement
    return false;
  }

  /**
   * Disable log on console
   *
   * @return {Boolean} true in case of success false otherwise
   */
  disableConsole () {
    // Log message
    this.info('[ Logger.disableConsole ] - Disabling console transport');

    // Do main process
    return this.enableConsole(false);
  }

  /**
   * Enable catching error on a daily rotate files
   *
   * @param {Object} options options to use for new transporter
   * @return {Boolean|Mixed} false in case of error otherwise winston.add return value
   */
  enableErrorToDailyRotateFiles (options = {}) {
    // Add default options
    options.extname = 'error';
    options.level = 'warning';
    options.canChangeLevel = false;

    // Default statement
    return this.addDailyRotateTransport(options);
  }

  /**
   * Enable morgan web logger and stream content to a rotate access log file
   *
   * @param {Object} options options to use on daily logger
   * @return {Boolean|Mixed} morgan instance in case of success or false in case of error
   */
  enableRequestToDailyRotateFiles (options = {}) {
    // Add default options
    options.extname = 'access';
    options.level = 'info';
    options.canChangeLevel = false;
    options.xheaders = options.xheaders || [];

    // Create a daily rotate file first
    if (this.addDailyRotateTransport(options, true)) {
      // Create a default stream to use with morgan
      this.webLogger.stream = {
        write : message =>{
          // Call web logger
          this.webLogger.info(message);
        }
      }

      // Default format to use
      const format = !options.xheaders ?
        'combined' : [ morgan['combined'], '- :xheaders' ].join(' ');

      // In some case we need to enable extra token on log
      if (options.xheaders) {
        // Build a dynamic token
        morgan.token('xheaders', function (req) {
          // Build xheader values
          const xheaders = _.compact(_.map(req.headers, (header, key) =>{
            // Current key is on defined list ?
            if (_.includes(options.xheaders, key)) {
              // Default statement
              return [ '(', key, ') ', header ].join('');
            }

            // In other case return invalid statement
            return false;
          }));

          // Default statement is we dont have token
          return xheaders.join(' - ');
        });
      }

      // Default statement
      return morgan(format, {
        stream : this.webLogger.stream
      });
    }

    // Default statement
    return false;
  }

  /**
   * Add a new daily transport file to logger module
   *
   * @example
   * var logger = require('yocto-logger');
   *  // Create your own logger here
   * logger = logger.create(); // Use it
   *
   * // default options
   * var options = {
   *  changeChangeLevel : true, // indicates that dynamic level change is allowed
   *  extname : 'combined', // indicated the extention name of file by default <pattern>-<extname>.log
   *  destination : '.', // default destination of log file
   *  filename : '<pattern>-<extname>.log', // default file name with define structure <pattern>-<extname>.log
   *  pattern : YYYYMMDD, // default pattern of date for filename
   *  zipped : true, // define if log must be zipped
   *  size : '20m', // default size of file
   *  delay : '14d', // default delay of storage
   *  level :  'debug' // default log level
   * };
   *
   * // add your daily rorate file
   * logger.addDailyRotateTransport(options);
   *
   * @param {Object} options override options value on daily rotate
   * @param {Object} isWeb true if is for a web request logger (morgan) false otherwie
   * @return {Boolean|Mixed} false in case of error otherwise winston.add return value
   */
  addDailyRotateTransport (options = {}, isWeb = false) {
    // Try to normalize options
    _.set(options, 'changeChangeLevel', options.canChangeLevel || true);
    _.set(options, 'extname', options.extname || 'combined');
    _.set(options, 'destination',
      path.resolve((options.destination || '.').replace(/\/+/g, '/').replace(/\/$/, '')));
    _.set(options, 'filename', [
      _.compact([ '%DATE%', options.filename || '', options.extname ]).join('-'), 'log'
    ].join('.'));
    _.set(options, 'pattern', options.pattern || 'YYYYMMDD');
    _.set(options, 'zipped', options.zipped || true);
    _.set(options, 'size', options.size || '20m');
    _.set(options, 'delay', options.delay || '14d');
    _.set(options, 'level', options.level || 'debug');

    // Default try catch
    try {
      // Need to check if given path is writable
      if (fs.lstatSync(options.destination).isDirectory()) {
        // Add new daily rotate file
        const transport = new winston.transports.DailyRotateFile({
          dirname          : options.destination,
          filename         : options.filename,
          datePattern      : options.pattern,
          zippedArchive    : options.zipped,
          maxSize          : options.size,
          maxFiles         : options.delay,
          handleExceptions : !isWeb,
          colorize         : false,
          level            : options.level,
          canChangeLevel   : options.changeChangeLevel,
          format           : winston.format.combine(
            this.defaultTransformer(),
            winston.format.timestamp(),
            this.defaultTimestampFormat(),
            winston.format.label(),
            winston.format.splat(),
            isWeb ? this.defaultWebPrintTranformer : this.defaultPrintTranformer
          )
        });

        // In case of web Logger needed
        if (isWeb) {
          // Add to the web logrer
          return this.webLogger.add(transport);
        }

        // Add to the default logger
        return this.winston.add(transport);
      }

      // Do a warning message in this case
      this.warning('Cannot create daily rotate file log handler. Path %s is not a directory.',
        options.destination);
    } catch (e) {
      // To an error message in this case
      this.error('Cannot add a new daily rotate file : %s', e.message);
    }

    // Default statement
    return false;
  }

  /**
   * Change log level manually
   *
   * @param {String} name name of level
   */
  changeLogLevel (name) {
    // Search data
    const search   = _.find(this.levels, [ 'name', name ]);

    // Parse all transport and update value
    _.each(this.winston.transports, function (transport) {
      // Only in this case
      if (transport.name === 'console') {
        // And if can change level is set
        if (_.has(transport, 'options.canChangeLevel') &&
          _.get(transport, 'options.canChangeLevel')) {
          // Get previous value for log message
          transport.previousLevel = transport.level || transport.parent.level;

          // Update level of each transport
          transport.level = !_.isUndefined(search) ? search.name : null;

          // Do a notice message
          this.notice('Level change from %s to %s form transport %s',
            transport.previousLevel, transport.level, transport.name);
        }
      }
    }.bind(this));

    // In case of undefined we set each level to null to keep parent level do his job
    // but we notify on console after the process
    if (_.isUndefined(search)) {
      // Log a notice message
      this.notice('Invalid level value. The defaut value %s was used.', this.winston.level);
    }
  }

  /**
   * Default log function. This method call winston logger with correct level of logs.
   *
   * Specific transport can be used in last param to use a specific transport.
   *
   * @param {Integer} level level to use on current log level
   * @param {String} message default message to display
   * @param {Object} meta default meta to send on logger
   * @return {DerivedLogger} instance of derived logger
   */
  process (level, message, meta) {
    // Try to find correct level
    level = _.find(this.levels, [ 'name', level ]);

    // Level allow callback usage ?
    if (level.useCallback) {
      // Is a callback if defined call this with message and level
      if (this.callback && _.isFunction(this.callback)) {
        // Default callback action
        return callback(level, message, meta);
      }
    }

    // Tranform data to string
    if (_.isObject(message) || _.isArray(message)) {
      message = JSON.stringify(message);
    }

    // Default log process
    return this.winston.log(level.fn, message, ... meta);
  }

  /**
   * Log message and metadata with the current emergency level
   *
   * @param {String} message message to send on logger
   * @param {Object} meta metadata to send on logger
   * @return {DerivedLogger} instance of derived logger
   */
  emergency (message, ... meta) {
    // Call main log process with emergency level
    return this.process('emergency', message, meta);
  }

  /**
   * Log message and metadata with the current alert level
   *
   * @param {String} message message to send on logger
   * @param {Object} meta metadata to send on logger
   * @return {DerivedLogger} instance of derived logger
   */
  alert (message, ... meta) {
    // Call main log process with alert level
    return this.process('alert', message, meta);
  }

  /**
   * Log message and metadata with the current critical level
   *
   * @param {String} message message to send on logger
   * @param {Object} meta metadata to send on logger
   * @return {DerivedLogger} instance of derived logger
   */
  critical (message, ... meta) {
    // Call main log process with critical level
    return this.process('critical', message, meta);
  }

  /**
   * Log message and metadata with the current error level
   *
   * @param {String} message message to send on logger
   * @param {Object} meta metadata to send on logger
   * @return {DerivedLogger} instance of derived logger
   */
  error (message, ... meta) {
    // Call main log process with error level
    return this.process('error', message, meta);
  }

  /**
   * Log message and metadata with the current warning level
   *
   * @param {String} message message to send on logger
   * @param {Object} meta metadata to send on logger
   * @return {DerivedLogger} instance of derived logger
   */
  warning (message, ... meta) {
    // Call main log process with warning level
    return this.process('warning', message, meta);
  }

  /**
   * Log message and metadata with the current notice level
   *
   * @param {String} message message to send on logger
   * @param {Object} meta metadata to send on logger
   * @return {DerivedLogger} instance of derived logger
   */
  notice (message, ... meta) {
    // Call main log process with notice level
    return this.process('notice', message, meta);
  }

  /**
   * Log message and metadata with the current info level
   *
   * @param {String} message message to send on logger
   * @param {Object} meta metadata to send on logger
   * @return {DerivedLogger} instance of derived logger
   */
  info (message, ... meta) {
    // Call main log process with info level
    return this.process('info', message, meta);
  }

  /**
   * Log message and metadata with the current debug level
   *
   * @param {String} message message to send on logger
   * @param {Object} meta metadata to send on logger
   * @return {DerivedLogger} instance of derived logger
   */
  debug (message, ... meta) {
    // Call main log process with debug level
    return this.process('debug', message, meta);
  }

  /**
   * Log a banner message on console
   *
   * @param {String} message message to send on logger
   * @param {Object} meta metadata to send on logger
   * @return {DerivedLogger} instance of derived logger
   */
  banner (message, ... meta) {
    // Default step value
    const step = 20;

    // Define separtor element
    const separator = {
      horizontal : '-',
      begin      : '|',
      end        : '|'
    };

    // Only if message is define

    if (message) {
      // Format banner message before send to notice method
      const line = [ _.repeat(separator.horizontal, _.size(message) + step * 2) ].join('');

      // Print first line

      if (this.process('info', line, meta)) {
        // Format message
        message = [ separator.begin,
          _.repeat(' ', (step * 2 - 2) / 2),
          _.toUpper(message),
          _.repeat(' ', (step * 2 - 2) / 2),
          separator.end
        ].join('');

        // Default message print
        if (this.process('info', message, meta)) {
          // Print last line
          return this.process('info', line, meta);
        }
      }
    }

    // Default statement
    return this.process('info', message || '', meta);
  }

  /**
   * Utility message to provide deprectated log format
   *
   * @param {String} sourceMethod default deprectated source method
   * @param {String} newMethod new method name to use
   * @param {String} extraMessage an extra message to add to current log
   * @return {DerivedLogger} instance of derived logger
   */
  deprecated (sourceMethod, newMethod, extraMessage = '') {
    // Default statement
    return this.process('notice', [
      chalk.yellow('[DEPRECATED]'), `Method %s is depreacted. Prefere use %s. ${extraMessage}`
    ].join(' '), [ sourceMethod, newMethod ]);
  }
}

/**
 * Export current logger to use it on node
 */
module.exports = Logger;
