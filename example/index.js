var logger = require("../src");
logger = logger.create();
logger.info('test message %s, %s', 'first', 'second', { number: 123 });
logger.enableConsole();
logger.addDailyRotateTransport({
  destination : './examplaae'
});
logger.enableErrorToDailyRotateFiles({
  destination : './example'
});
//logger.changeLogLevel('error');
logger.banner("Adding new default transport with handle success & failure");
logger.info('test after change to error');
logger.enableConsole();
logger.emergency('EMERGENCY TEST');
logger.alert('ALERT TEST');
logger.critical('CRITICAL TEST');
logger.error('ERROR TEST');
logger.warning('WARNING TEST');
logger.notice('NOTICE TEST');
logger.info('INFO TEST');
logger.debug('DEBUG TEST');

var express = require('express')
var app = express();

var webLogger = logger.enableRequestToDailyRotateFiles({
  destination : './example',
  xheaders    : [ 'x-jwt', 'x-another' ]
});
if (webLogger) {
  console.log('enable web logger');
  app.use(webLogger);
}
 
app.get('/', function (req, res) {
  res.send('hello, world!')
})

app.listen(3000);