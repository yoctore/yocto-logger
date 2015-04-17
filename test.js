var l = require('./index');

l.addDailyRotateTransport('./tests');

l.info("toto");
l.debug(["a", 1, 2, 3, 4]);
l.warning({ tata : 'titi' });
l.error("An error omg");
l.banner("my banner message");
l.banner("my banner message custimized");
l.verbose('laa');



l.info('meta data info', { mymeta : "info" } );
l.debug('meta data debug', { mymeta : "debug" } );
l.warning('meta data warning', { mymeta : "warning" } );
l.error('meta data error', { mymeta : "error" } );
