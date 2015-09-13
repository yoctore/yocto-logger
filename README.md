# Overwiew

This module manage your own logger request on your node app.

This module his based on winston for node js package : https://github.com/flatiron/winston

## Motivation

This module was created to obtain an ready to use and pre-configured logger tools.

## Default Configuration
  
By default a console is configured with default options (cf winston documentation for more details)
 
Possibility to use the logger with these levels :
  - error
  - warning
  - info
  - debug
  - verbose
  
A Banner function is available to display on console.log a more significant message.

## Examples : 


#### Adding new transport with banner usage

```javascript
var logger = require('yocto-logger');

logger.banner("Adding new default transport");
logger.addDailyRotateTransport();
```

#### Adding new transport with some tests on directory

```javascript
var logger = require('yocto-logger');

logger.banner("Adding new default transport - Test directory");
logger.addDailyRotateTransport(__dirname+"/test-directory");
logger.addDailyRotateTransport(void 0,void 0,{name:"my-new-daily",level:"debug"});
logger.addDailyRotateTransport(__dirname+"/test-directory/test-directory-no-access");
logger.addDailyRotateTransport(__dirname+"/test-directory",{filenameobj:""});
logger.addDailyRotateTransport(__dirname+"/test-directory","");
logger.addDailyRotateTransport(__dirname+"/test-directory","my-file-name");
```

#### Default login usage examples

```javascript
var logger = require('yocto-logger');
logger.banner("Default logging");
logger.info("logging a string");
logger.debug(["a",1,2,3,4]);
logger.warning({tata:"titi"});
logger.error("An error omg");
logger.verbose("laa");
logger.banner("logging with meta");
logger.info("meta data info",{mymeta:"info"});
logger.debug("meta data debug",{mymeta:"debug"});
logger.warning("meta data warning",{mymeta:"warning"});
logger.error("meta data error",{mymeta:"error"});
logger.banner("Banner customized",{color:"red",bgColor:"white"});
logger.banner("Banner customized with invalid color",{color:"red",bgColor:"myColor"});
```

##### Handle success and failure event on daily transport

```javascript
logger.addDailyRotateTransport().success(function() {
  // process here
});

logger.addDailyRotateTransport().failure(function() {
  // process here
});

```