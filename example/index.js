var logger = require("../src");

logger.setLogLevel('debug');
logger.banner("Adding new default transport with handle success & failure");

logger.verbose('TEST verbose');
logger.error('TEST verbosevdvd');
logger.debug('test debug');
logger.info('test info');
logger.warning('test warning');
logger.error('test error');
logger.more();
logger.debug('aaa');
logger.less();
logger.debug('bbb');
logger.verbose('bbb');
logger.less();
logger.verbose('ccc');
logger.info('ccc');
logger.less();

// chaining
logger.more().more().more();
logger.addDailyRotateTransport(null, 'test.log', { name : 'test' }).then(function(success) {
  //console.log(success);
  //logger.disableConsole();
  logger.info("logging a string a", {} , 'test');
  logger.banner("Adding new default transport - Test directory");
  logger.enableConsole();
  logger.info("logging a string b", {}, 'test');
  logger.setLogLevel('error', 'test');
  logger.disableExceptions('default-daily-rotate-transport'); 
  logger.enableExceptions();
}, function(error) {
  //console.log(error);
});
logger.disableConsole();
logger.banner("Adding new default transport - Test directory");
logger.enableConsole();
logger.addDailyRotateTransport(__dirname+"/test-directory");
logger.addDailyRotateTransport(void 0,void 0,{name:"my-new-daily",level:"debug"});
logger.addDailyRotateTransport(__dirname+"/test-directory/test-directory-no-access");
logger.addDailyRotateTransport(__dirname+"/test-directory",{filenameobj:""});
logger.addDailyRotateTransport(__dirname+"/test-directory","");
logger.addDailyRotateTransport(__dirname+"/test-directory","my-file-name");
logger.banner("Default logging");
logger.info("logging a string c");
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
