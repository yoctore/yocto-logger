[![NPM](https://nodei.co/npm/yocto-logger.png?downloads=true&downloadRank=true&stars=true)](https://nodei.co/npm/yocto-logger/)

![alt text](https://david-dm.org/yoctore/yocto-logger.svg "Dependencies Status")
[![Code Climate](https://codeclimate.com/github/yoctore/yocto-logger/badges/gpa.svg)](https://codeclimate.com/github/yoctore/yocto-logger)
[![Test Coverage](https://codeclimate.com/github/yoctore/yocto-logger/badges/coverage.svg)](https://codeclimate.com/github/yoctore/yocto-logger/coverage)
[![Issue Count](https://codeclimate.com/github/yoctore/yocto-logger/badges/issue_count.svg)](https://codeclimate.com/github/yoctore/yocto-logger)
[![Build Status](https://travis-ci.org/yoctore/yocto-logger.svg?branch=master)](https://travis-ci.org/yoctore/yocto-logger)


### Overview

This module manage logs for your node app.

This module his based on [winston](https://www.npmjs.com/package/winston) and [morgan](https://www.npmjs.com/package/morgan) packages.

### Before start

Please keep in mind this **is not a complete reimplantation of winston or morgan** we only use winston and morgan for the core process.

We build this module to adapt to our usage.

### Motivation

In all of our project we use a logger library like winston.

But all the time we need to configure again and again the same library. 

That why we decided to create your own logger.

This tool is designed to be a very very simple and pre-configured and ready to use tool
based on the universal logging library winston and morgan.

### Log levels

Logs levels is based on syslogs level define on winston. For mode details see [here](https://github.com/winstonjs/winston#logging-levels) 

By default we check <code>process.env.NODE_ENV</code> value.

If this value is set to <code>production</code> we set the level to <code>notice</code> otherwise <code>debug</code> level is set.

### How to create a logger

To create a logger instance just use this following code

```javascript
var logger = require('yocto-logger');
// Create your own logger here
logger = logger.create(); // Use it
```

By default console logger is defined.

### Add a daily rotate transport

By default depending your current environmment all logs are save on a combined logs file.

Daily rorate are configured with those values : 

- file size : **20m**
- delay : **14d**


To create a daily rotate file just following this code

```javascript
var logger = require('yocto-logger');
// Create your own logger here
logger = logger.create(); // Use it

// default options
var options = {
  changeChangeLevel : true, // indicates that dynamic level change is allowed
  extname : 'combined', // indicated the extention name of file by default <pattern>-<extname>.log
  destination : '.', // default destination of log file
  filename : '<pattern>-<extname>.log', // default file name with define structure <pattern>-<extname>.log
  pattern : YYYYMMDD, // default pattern of date for filename
  zipped : true, // define if log must be zipped
  size : '20m', // default size of file
  delay : '14d', // default delay of storage
  level :  'debug' // default log level
};

// add your daily rorate file
logger.addDailyRotateTransport(options);
```

### Enable web request logging

By default our logger do not log web request, but you can enable it.

Web requests will be log by [morgan](https://www.npmjs.com/package/morgan) package and data will be stream
on a specific winston transporter.

To create a web request daily rotate file just following this code.

```javascript
var logger = require('yocto-logger');
// Create your own logger here
logger = logger.create(); // Use it

// default options
var options = {
  changeChangeLevel : false, // indicates that dynamic level change is allowed
  extname : 'access', // indicated the extention name of file by default <pattern>-<extname>.log
  destination : '.', // default destination of log file
  filename : '<pattern>-<extname>.log', // default file name with define structure <pattern>-<extname>.log
  pattern : YYYYMMDD, // default pattern of date for filename
  zipped : true, // define if log must be zipped
  size : '20m', // default size of file
  delay : '14d', // default delay of storage
  level :  'info', // default log level
  xheaders : [] // default key for additionnal headers
};

// add your web daily rorate file
logger.enableRequestToDailyRotateFiles(options);
```

### Logging Methods

Default methods are : 
 
 - emergency
 - alert
 - critical
 - error
 - warning
 - notice
 - info
 - debug

Utility method are : 

- deprecated

```javascript
var logger = require('yocto-logger');
// Create your own logger here
logger = logger.create(); // Use it
logger.emergency('Hello world');
logger.alert('Hello world');
logger.critical('Hello world');
logger.error('Hello world');
logger.warning('Hello world');
logger.notice('Hello world');
logger.info('Hello world');
logger.debug('Hello world');
logger.deprecated('Old Method', 'NEw Method', 'extra message');
```

### Banner Method 

To display on console.log a more significant message we implemened a utility banner method.

```javascript
var logger = require('yocto-logger');
// Create your own logger here
logger = logger.create(); // Use it
// banner usage
logger.banner("Banner customized");
```

### Change levels

For some reason you want change dynamicly change levels of you transporters.

To do that use <code>changeLogLevel</code> method.

This process will check if property <code>changeChangeLevel</code> is set to true
and will process the needed change

For example if we need to set current logger instance to `error` level : 

```javascript
var logger = require('yocto-logger');
// Create your own logger here
logger = logger.create(); // Use it
logger.changeChangeLevel('error'); // Change log to error
```

### Utility Methods

For a better usage we can interact with all transport by utility methods.
Methods available are : 

- enableConsole : to enable console transport if is disable
- disableConsole : to disable console transport if is enable

```javascript
var logger = require('yocto-logger');
// Create your own logger here
logger = logger.create(); // Use it

// Others method
logger.enableConsole();
logger.disableConsole();
```

### Breaking Changes

The v4.0.0 was completely rewrite in ES6. Please read documentation before use the v4.0.0

#### Changes

- Create logger from <code>require('yocto-logger')</code> is deprecated. Use this code instead :

```javascript
var logger = require('yocto-logger');
// Create your own logger here
logger = logger.create(); // Use it
```

- Levels was changes to syslog levels so refer to new method for log.
- All previous usage of daily rotate method is not working. Refer to new documentation.