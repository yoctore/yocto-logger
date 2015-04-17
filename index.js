/**
 * Dependencies
 * @documentation : https://github.com/flatiron/winston
 * @see : http://tostring.it/2014/06/23/advanced-logging-with-nodejs/
 * @see : https://www.npmjs.org/package/winston
 https://www.npmjs.com/package/string-format
 
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
 * Setting up the rotate file log for the current app
 */
/*var transportFile = new winston.transports.DailyRotateFile({
  level             : config.logger.transports.transport.level            || 'info',
  dirname           : config.logger.transports.transport.dirname          || './',
  filename          : config.logger.transports.transport.filename         || (__filename + '.log'),
  handleExceptions  : config.logger.transports.transport.handleExceptions || true,
  json              : config.logger.transports.transport.json             || true,
  maxsize           : config.logger.transports.transport.maxsize          || 5242880,
  maxFiles          : config.logger.transports.transport.maxFiles         || 5,
  colorize          : config.logger.transports.transport.colorize         || true,
  datePattern       : config.logger.transports.transport.datePattern      || 'yyyy-MM-dd'
});
*/

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
      date     : _.isFunction(options.timestamp) ? options.timestamp() : moment().format(),
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
    var dformat  = '[{date}] {level} :';
    
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
  }

  /**
   * Default function to get a current date format
   * 
   * @method timestamp
   * @return {String} formated string based on moment.js format
   */
  var timestampFormatter = function() {
    return moment().format("DD/MM/YYYY HH:mm:ss");
  }

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
  }

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
    return "white";
  }

  /**
   * Default console formatter. use all data to render the correct message format to the logger formatter
   *
   * @method formatter
   * @param {Object} default options to use
   * @return {String} the correct string to use on current transporter
   */  
  this.consoleTransportFormatter = function(options) {
    return transportFormatter(options, true);
  }

  /**
   * Default daily rotate file formatter. use all data to render the correct message format to the logger formatter
   *
   * @method formatter
   * @param {Object} default options to use
   * @return {String} the correct string to use on current transporter
   */  
  this.dailyRotateFileTransportFormatter = function(options) {
    return transportFormatter(options, false);
  }

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
    timestamp         : timestampFormatter,
    colorize          : colorizeFormatter
  };

  /**
   * Default daily rotate transport file
   *
   * @property defaultDailyRotateTransportFile
   * @type Object 
   */
  this.defaultDailyRotateTransportFile = {
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
};

/**
 * Adding transport on logger module
 * 
 * @method addTransport
 * @param {String} path to use
 * @param {String) filename to use
 */
Logger.prototype.addDailyRotateTransport = function(fullpath, filename) {

  if (!_.isUndefined(fullpath)) {
    
  }
  // normalize path
  fullpath = path.normalize(fullpath);
  fullpath = path.resolve(fullpath);
  
  var context = this;
  
  // check file 
  fs.lstat(fullpath, function(err, stats) {

    // is directory ?    
    if (!stats || !stats.isDirectory()) {
      context.error('Directory path is invalid for new daily rotate. operation aborted !');
    } else {
      // check permission
      fs.access(fullpath, fs.F_OK | fs.R_OK | fs.W_OK, function(err) {

        // can read / write ??? 
        if (err) {
                    
        } else {
          // build object configuration
          var daily = _.clone(context.defaultDailyRotateTransportFile);
          
          // extend daily
          _.extend(daily, { dirname : fullpath });
          
          // check isf file is specified
          if (!_.isUndefined(filename) && !_.isEmpty(filename) && !_.isNull(fileName)) {
            
            if (_.isString(filename)) {
              _.extend(daily, { filename : filename });              
            } else {
              //context.warning(__function)
            }
          }

          // winston is available ?? 
          if (!_.isUndefined(context.winston)) {
            context.winston.add(winston.transports.DailyRotateFile, daily);
            context.info(['Adding new daily rotate file success. Datas are log on', [ fullpath, filename ].join('/') ].join(' '));
          } else {
            console.log(chalk.red('Cannot add daily rotate transport on winston. instance is invalid'));
          }
        }
      });
    }
  });
}

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
          if (!_.isUndefined(meta)) {
            this.winston.log(value.f, message, meta);                
          } else {
            this.winston.log(value.f, message);              
          }
        }
      }
    }
  }, this);
}

/**
 * Log message and metadata with the current verbose level
 *
 * @method verbose
 * @param {String} message to send on logger
 * @param {Object} metadata to send on logger
 */
Logger.prototype.verbose = function(message, meta) {
  this.process(this.VERBOSE_LOG_LEVEL.level, message, meta);
}


/**
 * Log message and metadata with the current info level
 *
 * @method verbose
 * @param {String} message to send on logger
 * @param {Object} metadata to send on logger
 */
Logger.prototype.info = function(message, meta) {
  this.process(this.INFO_LOG_LEVEL.level, message, meta);
}

/**
 * Log message and metadata with the current warning level
 *
 * @method verbose
 * @param {String} message to send on logger
 * @param {Object} metadata to send on logger
 */
Logger.prototype.warning = function(message, meta) {
  this.process(this.WARNING_LOG_LEVEL.level, message, meta);
}

/**
 * Log message and metadata with the current error level
 *
 * @method verbose
 * @param {String} message to send on logger
 * @param {Object} metadata to send on logger
 */
Logger.prototype.error = function(message, meta) {
  this.process(this.ERROR_LOG_LEVEL.level, message, meta);
}

/**
 * Log message and metadata with the current debug level
 *
 * @method verbose
 * @param {String} message to send on logger
 * @param {Object} metadata to send on logger
 */
Logger.prototype.debug = function(message, meta) {
  this.process(this.DEBUG_LOG_LEVEL.level, message, meta);
}

Logger.prototype.banner = function(message, leftDelimiter, topDelimiter, rightDelimiter, bottomDelimiter) {
  // setting up tje default banner delimiter
  leftDelimiter   = leftDelimiter     || '|';
  topDelimiter    = topDelimiter      || '_';
  rightDelimiter  = rightDelimiter    || '|';
  bottomDelimiter = bottomDelimiter   || '';
  
  // interval vars
  var header = [];
  var footer = [];

  // a delta chars for alignement
  var delta   = 3;  

  // message limit
  var limit   = message.length + delta;

  // generate header and footer
  for (var i = 0; i <= limit; i++) {
    header.push(topDelimiter);
    footer.push(bottomDelimiter);
  }

  var limitMessage = 

  message = [ leftDelimiter, message, rightDelimiter ];
  
  header  = header.join(topDelimiter);
  message = message.join(' ');
  footer  = footer.join(bottomDelimiter);

  // display
  //console.log(header);
  //console.log(message);
  //console.log(footer);
}



/**
 * Export current logger to use it on node
 */
module.exports  = new (Logger)();
