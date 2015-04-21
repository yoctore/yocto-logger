'use strict';
/**
 * Yocto logger.
 *
 * A custom logger wrapper based on winston for nodejs
 * 
 * For more details on these dependencies read links below :
 *  - Winston : https://github.com/flatiron/winston
 *  - LodAsh :
 *  - Chalk : 
 *  - momentjs : 
 *  - string-format : https://www.npmjs.com/package/string-format
 *  - uuid :
 *  - fs :
 *  - path :
 *
 * By default a console is configured with default options (cf winston documentation for more details)
 * Possibility to use the logger with these levels :
 *  - error
 *  - warning
 *  - info
 *  - debug
 *  - verbose
 *
 * A Banner function is available to display on console.log a more significant message.
 *
 * For each examples, please read file on example directory.
 *
 * @date : 21/04/2015
 * @author :  Mathieu ROBERT <mathieu@yocto.re>
 * @copyright : Yocto SAS, All right reserved
 */

var winston       = require('winston');
var _             = require('lodash');
var chalk         = require('chalk');
var moment        = require('moment');
var format        = require('string-format');
var uuid          = require('uuid');
var fs            = require('fs');
var path          = require('path');

// must extend String.prottype for use format to a method mode
format.extend(String.prototype);

// Allow to display errors
winston.emitErrs  = false;

/**
 * Custom logger manager
 * Manage your own logger request
 *
 * @class logger
 */
function Logger() {

  /**
   * Default log level
   * @property logLevel
   * @type Integer
   * @default 5
   */
  this.logLevel                 = 5;
  
  /**
   * Default const to define console type
   * see : https://www.npmjs.com/package/winston#console-transport
   *
   * @property TYPE_CONSOLE
   * @type String
   * @default console
   */
  this.TYPE_CONSOLE             = "console";

  /**
   * Default const to define daily rotate file 
   * see : https://www.npmjs.com/package/winston#daily-rotate-file-transport
   * 
   * @property TYPE_DAILY_ROTATE_FILE
   * @type String
   * @default console
   */
  this.TYPE_DAILY_ROTATE_FILE   = "daily-rotate-file";
  
  /**
   * Default const to define error log level rules on current class
   * 
   * @property ERROR_LOG_LEVEL
   * @type Object
   */
  this.ERROR_LOG_LEVEL          = { name : 'error',   level : 1, f : 'error'   };

  /**
   * Default const to define warning log level rules on current class
   * 
   * @property WARNING_LOG_LEVEL
   * @type Object
   */
  this.WARNING_LOG_LEVEL        = { name : 'warning', level : 2, f : 'warn'    };

  /**
   * Default const to define info log level rules on current class
   * 
   * @property INFO_LOG_LEVEL
   * @type Object
   */  
  this.INFO_LOG_LEVEL           = { name : 'info',    level : 3, f : 'info'    };

  /**
   * Default const to define debug log level rules on current class
   * 
   * @property DEBUG_LOG_LEVEL
   * @type Object
   */
  this.DEBUG_LOG_LEVEL          = { name : 'debug',   level : 4, f : 'debug'   };

  /**
   * Default const to define verbose log level rules on current class
   * 
   * @property VERBOSE_LOG_LEVEL
   * @type Object
   */
  this.VERBOSE_LOG_LEVEL        = { name : 'verbose', level : 5, f : 'verbose' };
  

  /**
   * Default formatter. use all data to render the correct message format to the logger formatter
   *
   * @method formatter
   * @param {Object} default options to use
   * @param {Boolean} if truen enable colorize process, false otherwise
   * @return {String} the correct string to use on current transporter
   */  
  var transportFormatter = function(options, colorize) {        
    // setting up the colorize flag
    colorize = colorize || false;

    // build data to log
    var dataToLog = {
      level    : options.level,
      date     : _.isFunction(options.timestamp) ? options.timestamp() : (_.isNull(options.timestamp) ? null : moment().format()),
      message  : (!_.isUndefined(options.message) && !_.isEmpty(options.message) ? options.message : ''),
      meta     : (!_.isUndefined(options.meta) && Object.keys(options.meta).length ? JSON.stringify(options.meta) : '')
    };

    if (_.has(options, 'label') && _.isFunction(options.label)) {
      dataToLog.level = options.label(options.level.toLowerCase());      
    }
    
    if (_.has(options, 'timestamp') && _.isFunction(options.timestamp)) {
      dataToLog.date =  options.timestamp();      
    }    

    // use colorize only on console mode
    if (colorize) {
      if (_.has(options, 'colorize') && _.isFunction(options.colorize)) {
        // prepare value to use on logger
        colorize = options.colorize(options.level);
        
        dataToLog.level = chalk[colorize]('{}'.format(options.label(options.level.toLowerCase())));  
      }
    }

    // default format    
    var dformat  = '{level} :';
    
    if (!_.isNull(dataToLog.date)) {
      dformat = [ '[{date}]', dformat ].join(' ');
    }
    
    
    // check if we have message
    if (!_.isUndefined(dataToLog.message) && !_.isEmpty(dataToLog.message)) {
      dformat = [ dformat, '{message}'].join(' ');
    }

    // check if we have meta
    if (!_.isUndefined(dataToLog.meta) && !_.isEmpty(dataToLog.meta)) {
      dformat = [ dformat, '{meta}'].join(' ');
    }

    // returning the correct message format
    return dformat.format(dataToLog);
  };

  /**
   * Default function to get a current date format
   * 
   * @method timestamp
   * @return {String} formated string based on moment.js format
   */
  var timestampFormatter = function() {
    return moment().format("DD/MM/YYYY HH:mm:ss");
  };

  /**
   * Default label function to retrive the correct label to display on logger
   *
   * @method labelFormatter
   * @param {String} value to check
   * @return {String} the correct value to display
   */  
  var labelFormatter =  function(value) {
    var rules = [
      { info     : 'info    '  },
      { warn     : 'warning '  },
      { error    : 'error   '  },
      { debug    : 'debug   '  },
      { verbose  : 'verbose '  }
    ];
    
    // get index 
    var index = _.findIndex(rules, value);

    // check and return a correct value
    if (index >= 0) {
      return _.first(_.values(rules[index]));
    }

    // return correct value
    return value;
  };

  /**
   * Default function to colorize the log level with chalk
   * 
   * @method colorize
   * @param (String) current level to use
   * @return (String) current color to use on chalk
   */
  var colorizeFormatter  = function(level) {
    var rules = [
      { info     : 'green'  },
      { warn     : 'yellow' },
      { error    : 'red'    },
      { debug    : 'blue'   },
      { verbose  : 'white'  }
    ];
    
    // get index 
    var index = _.findIndex(rules, level);

    // check and return a correct value
    if (index >= 0) {
      return _.first(_.values(rules[index]));
    }

    // return default value
    return 'white';
  };

  /**
   * Default console formatter. use all data to render the correct message format to the logger formatter
   *
   * @method formatter
   * @param {Object} default options to use
   * @return {String} the correct string to use on current transporter
   */  
  this.consoleTransportFormatter = function(options) {
    return transportFormatter(options, true);
  };

  /**
   * Default daily rotate file formatter. use all data to render the correct message format to the logger formatter
   *
   * @method formatter
   * @param {Object} default options to use
   * @return {String} the correct string to use on current transporter
   */  
  this.dailyRotateFileTransportFormatter = function(options) {
    return transportFormatter(options, false);
  };

  /**
   * Default console transport
   *
   * @property defaultConsoleTransport
   * @type Object 
   */
  this.defaultConsoleTransport = {
    level             : 'verbose',
    handleExceptions  : true,
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
    transports  : [ new (winston.transports.Console)(_.clone(this.defaultConsoleTransport)) ],
    exitOnError : false
  });  
}

/**
 * Adding transport on logger module
 * 
 * @method addTransport
 * @param {String} path to use
 * @param {String} filename to use
 * @param {Object} Override options on daily rotate
 */
Logger.prototype.addDailyRotateTransport = function(fullpath, filename, options) {
  
  // path is valid type ? transform to default value if not
  if (_.isUndefined(fullpath) || !_.isString(fullpath) || _.isNull(fullpath)) {
    fullpath = './';   
    this.warning('[ Add New Daily Rotate Transport ] - Invalid path given. Using default path "./"');
  }
  
  // normalize path
  fullpath = path.normalize(fullpath);
  fullpath = path.resolve(fullpath);
  
  // save current context
  var context = this;
  
  // check file 
  fs.lstat(fullpath, function(err, stats) {

    // is directory ?    
    if (!stats || !stats.isDirectory()) {
      context.error([ '[ Add New Daily Rotate Transport ] - Directory path : [', fullpath, '] is invalid. Operation aborted !' ].join(' '));
    } else {
      // check permission
      fs.access(fullpath, fs.F_OK | fs.R_OK | fs.W_OK, function(err) {

        // can read / write ??? 
        if (err) {
          context.error([ '[ Add New Daily Rotate Transport ] - Cannot read and write on', fullpath, ' - operation aborted !' ].join(' '));     
        } else {
          // build object configuration
          var daily = _.clone(context.defaultDailyRotateTransportFile);
          
          // extend daily
          _.extend(daily, { dirname : fullpath });
          
          // is a valid options ?
          if (!_.isUndefined(options) && !_.isNull(options) && _.isObject(options)) {
            _.extend(daily, options);
          }
          
          // check if file is specified
          if (!_.isUndefined(filename) && !_.isEmpty(filename) && !_.isNull(filename)) {
            
            // is a valid file name 
            if (_.isString(filename) && !_.isEmpty(filename)) {
              _.extend(daily, { filename : filename });              
            } else {
              context.warning([ '[ Add New Daily Rotate Transport ] - filename is not a string. retore filename to ', daily.filename ].join(' '));
            }
          }

          // winston is available ?? 
          if (!_.isUndefined(context.winston)) {
            // transport already exists ?
            if (_.has(context.winston.transports, daily.name)) {              
              context.warning([ '[ Add New Daily Rotate Transport ] - A transport with the name', daily.name, 'already exists. Removing current before adding new transport' ].join(' '));
              context.winston.remove(daily.name);
            }
            
            // add new
            context.winston.add(winston.transports.DailyRotateFile, daily);
            
            // build name for logging message
            filename = [ fullpath, daily.filename, moment().format(daily.datePattern.replace('.log', '').toUpperCase()), '.log' ].join('');
            // log            
            context.info([ '[ Add New Daily Rotate Transport ] - Success ! Datas are logged in', filename ].join(' '));

          } else {
            console.log(chalk.red('[ Add New Daily Rotate Transport ] - Cannot add new transport. instance is invalid'));
          }
        }
      });
    }
  });
};

/**
 * Default process function, get the current level and log our own message and metdata
 *
 * @method process
 * @param (Integer), level, the current log level
 * @param (Mixed), messsagen the current message to display
 */
Logger.prototype.process = function(level, message, meta) {
  // Mixing all error object
  var all       = [ this.VERBOSE_LOG_LEVEL, this.INFO_LOG_LEVEL, this.WARNING_LOG_LEVEL, this.ERROR_LOG_LEVEL, this.DEBUG_LOG_LEVEL ];

  // setting up the max level to log
  var maxLevel  = this.logLevel || 5;

  // need a reference for test
  var ref       = maxLevel;

  // parse all log object to get the correct reference
  _.each(all, function(value, key, list) {
    if (_.isString(maxLevel)) {
      if (maxLevel === value.name) {
        ref = value.level;
      }
    }
  });

  // save the main scope to use it 
  var $this = this;

  // parse again and call the specific function
  _.each(all, function(value, key, list) {
    if (_.isNumber(ref)) {
      if (level <= ref) {
        if (value.level == level) {
          if (!_.isUndefined(this.winston) && !_.isNull(this.winston) && _) {
            if (!_.isUndefined(meta)) {
              this.winston.log(value.f, message, meta);                
            } else {
              this.winston.log(value.f, message);              
            }            
          } else {
            console.log(chalk.red('[ Logger.process ] - Cannot une winston logger. instance is undefined or null'));
          }
        }
      }
    }
  }, this);
};

/**
 * Log message and metadata with the current verbose level
 *
 * @method verbose
 * @param {String} message to send on logger
 * @param {Object} metadata to send on logger
 */
Logger.prototype.verbose = function(message, meta) {
  // call main log process with verbose level
  this.process(this.VERBOSE_LOG_LEVEL.level, message, meta);
};

/**
 * Log message and metadata with the current info level
 *
 * @method verbose
 * @param {String} message to send on logger
 * @param {Object} metadata to send on logger
 */
Logger.prototype.info = function(message, meta) {
  // call main log process with info level
  this.process(this.INFO_LOG_LEVEL.level, message, meta);
};

/**
 * Log message and metadata with the current warning level
 *
 * @method verbose
 * @param {String} message to send on logger
 * @param {Object} metadata to send on logger
 */
Logger.prototype.warning = function(message, meta) {
  // call main log process with warning level
  this.process(this.WARNING_LOG_LEVEL.level, message, meta);
};

/**
 * Log message and metadata with the current error level
 *
 * @method verbose
 * @param {String} message to send on logger
 * @param {Object} metadata to send on logger
 */
Logger.prototype.error = function(message, meta) {
    // call main log process with error level
  this.process(this.ERROR_LOG_LEVEL.level, message, meta);
};

/**
 * Log message and metadata with the current debug level
 *
 * @method verbose
 * @param {String} message to send on logger
 * @param {Object} metadata to send on logger
 */
Logger.prototype.debug = function(message, meta) {
    // call main log process with debug level
  this.process(this.DEBUG_LOG_LEVEL.level, message, meta);
};

/**
 * Log a banner message on console
 *
 * @method banner
 * @param {String} message to send on logger
 * @param {Object} cstyle style to use on banner based on chalk rules
 *
 * @example
 * 
 *      // eample with custom style
 *      instance.banner('test message', { color : 'white', bgColor : 'bgRed' });
 *      // This will display "test message" with bgRed and white text 
 *  
 */
Logger.prototype.banner = function(message, cstyle) {
  // default style
  var style = {
    color           : 'white',
    bgColor         : 'bgBlack',
    topDelimiter    : '-',
    bottomDelimiter : '-',
    leftDelimiter   : '|',
    rightDelimiter  : '|'        
  };

  // has custom style options with color and bgColor rules
  if (!_.isUndefined(cstyle) && _.has(cstyle, 'color') && _.has(cstyle, 'bgColor')) {

    // bg rules start by correct Prefix ?
    if (!_.startsWith('bg', cstyle.bgColor)) {
      cstyle.bgColor = [ 'bg', _.capitalize(cstyle.bgColor.toLowerCase()) ].join('');
    }

    // extend obj    
    _.extend(style, cstyle);
  }

  // build end message
  var endmessage  = [ style.leftDelimiter, message, style.rightDelimiter ].join(' '); 

  if (_.has(chalk.styles, style.color) && _.has(chalk.styles, style.bgColor)) {
    // log full message
    console.log(chalk[style.color][style.bgColor](_.repeat(style.topDelimiter, endmessage.length)));  
    console.log(chalk[style.color][style.bgColor](endmessage));
    console.log(chalk[style.color][style.bgColor](_.repeat(style.bottomDelimiter, endmessage.length)));      
  } else {
      this.warning('[ Logger.Banner ] - Cannot use custom style given style is invalid. please read chalk documentation. Logging with current shell config.');  
      console.log(_.repeat(style.topDelimiter, endmessage.length));  
      console.log(endmessage);
      console.log(_.repeat(style.bottomDelimiter, endmessage.length));      
  }
};

/**
 * Export current logger to use it on node
 */
module.exports  = new (Logger)();
