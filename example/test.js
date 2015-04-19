var logger = require('../index');

logger.banner('Adding new default transport');
logger.addDailyRotateTransport();


logger.banner('Adding new default transport - Test directory');
logger.addDailyRotateTransport(__dirname + '/test-directory');
logger.addDailyRotateTransport(undefined, undefined, { name : 'my-new-daily', level : 'debug' });
logger.addDailyRotateTransport(__dirname + '/test-directory/test-directory-no-access');
logger.addDailyRotateTransport(__dirname + '/test-directory', { filenameobj : ''});
logger.addDailyRotateTransport(__dirname + '/test-directory', '');
logger.addDailyRotateTransport(__dirname + '/test-directory', 'my-file-name');


// default loging
logger.banner('Default logging');
logger.info("logging a string");
logger.debug(["a", 1, 2, 3, 4]);
logger.warning({ tata : 'titi' });
logger.error("An error omg");
logger.verbose('laa');

// Loggin with meta
logger.banner("logging with meta");
logger.info('meta data info', { mymeta : "info" } );
logger.debug('meta data debug', { mymeta : "debug" } );
logger.warning('meta data warning', { mymeta : "warning" } );
logger.error('meta data error', { mymeta : "error" } );

logger.banner("Banner customized", { color : 'red', bgColor : 'white' });
logger.banner("Banner customized with invalid color", { color : 'red', bgColor : 'myColor' })