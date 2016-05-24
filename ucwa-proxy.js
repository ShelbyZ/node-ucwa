'use strict';

var fs = require('fs');
var argv = require('minimist')(process.argv.slice(2), {
    string: ['pfx', 'passphrase', 'origin'],
    boolean: ['secure', 'logging'],
    default: {
        port: 4666,
        secure: true,
        pfx: __dirname + '\\certs\\node-ucwa.pfx',
        passphrase: '',
        logging: false,
        origin: '*'
    }
});
var ucwaproxy = require('./proxy');

function parseArgs () {
    var options = {
        port: argv.port,
        secure: argv.secure,
        cert: {
            pfx: argv.pfx,
            passphrase: argv.passphrase
        },
        logging: argv.logging,
        origin: argv.origin
    };

    if (options.secure === false) {
        delete options.cert;
    } else if (options.secure === true && (!options.cert.pfx)) {
        throw new Error('When using secure (Https) pfx is required!');
    } else if (options.secure === true && !fs.existsSync(options.cert.pfx)) {
        throw new Error('Unable to find certificate specified at path: ' + options.cert.pfx);
    }

    if (options.cert) {
        options.cert.pfx = fs.readFileSync(options.cert.pfx);

        if (options.cert.passphrase === '') {
            delete options.cert.passphrase;
        }
    }

    return options;
}

var options = parseArgs();
var proxy = ucwaproxy(options);