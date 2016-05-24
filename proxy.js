'use strict';

var http = require('http');
var https = require('https');
var url = require('url');

function createProxy () {
    var proxy = function (options) {
        var server;

        logging = options.logging;
        origin = options.origin;

        if (options.secure) {
            server = https.createServer(options.cert, handleRequest).listen(options.port);
        } else {
            server = http.createServer(handleRequest).listen(options.port);
        }
    },
    logging,
    origin;

    function handleRequest (request, response) {
        var uri = url.parse(request.url);
        if (uri.pathname === '/proxy') {
            var method = request.method.toLowerCase();
            if (method === 'options') {
                response.writeHead(200, {
                    'Access-Control-Allow-Origin': origin,
	                'Access-Control-Allow-Methods': 'OPTIONS, POST',
	                'Access-Control-Allow-Headers': 'Content-Type'
                });
                response.end();
            } else if (method === 'post') {
                proxyRequest(request, response);
            } else {
                response.writeHead(405);
                response.write(JSON.stringify({
                    message: 'The requested resource only supports http method \'OPTIONS\' and \'POST\'.'
                }));
                response.end();
            }
        } else if (uri.pathname.toLowerCase() === '/proxy') {
            response.writeHead(307, {
                Location: '/proxy'
            });
            response.end();
        } else {
            response.writeHead(404);
            response.end();
        }
    }

    function proxyRequest (request, response) {
        var buffer = '';

        request.on('data', function (data) {
            buffer += data;
        });

        request.on('end', function () {
            var obj = parseRequest(buffer),
            req = createRequest(obj, function (res) {
                buffer = '';
                res.on('data', function (data) {
                    buffer += data;
                });

                res.on('end', function () {
                    var headers = res.headers;
                    headers['Access-Control-Allow-Origin'] = origin;
                    headers['Access-Control-Allow-Methods'] = 'OPTIONS, POST';
                    headers['Access-Control-Allow-Headers'] = 'Content-Type';
                    response.writeHead(res.statusCode, headers);
                    response.write(buffer);
                    response.end();
                });
            });

            if (obj.data) {
                req.write(obj.data, 'utf8');
            }

            req.on('error', function (error) {
                req.abort();
                response.writeHead(404);
                response.end();
            });

            req.end();
        });
    }

    function parseRequest (data) {
        var obj = JSON.parse(data),
        length = 0,
        contentType;

        obj.uri = url.parse(obj.url);
        obj.method = obj.method;
        obj.hostname = obj.uri.hostname;
        obj.path = obj.uri.path;
        obj.port = obj.uri.port;

        if (!obj.headers) {
            obj.headers = {};
        }

        obj.rejectUnauthorized = false;

        if (!obj.data) {
            processHeader(obj.headers, 'delete', 'content-type');
            processHeader(obj.headers, 'delete', 'content-length');
        } else {
            contentType = processHeader(obj.headers, 'get', 'content-type');
            length = obj.data.length;

            if (!contentType) {
                processHeader(obj.headers, 'set', 'content-type', 'application/json');
                contentType = processHeader(obj.headers, 'get', 'content-type');
            }

            if (contentType === 'application/json') {
                obj.data = JSON.stringify(obj.data);
            }

            length = obj.data.length;

            processHeader(obj.headers, 'set', 'content-length', length);
        }

        processHeader(obj.headers, 'delete', 'accept-encoding');
        processHeader(obj.headers, 'delete', 'host');

        logObject(JSON.stringify(obj));

        return obj;
    }

    function processHeader (headers, action, name, value) {
        for (var i in headers) {
            if (i.toLowerCase() === name.toLowerCase()) {
                switch (action) {
                    case 'get':
                        return headers[i];
                    case 'set':
                        headers[i] = value;
                        return;
                    case 'delete':
                        delete headers[i];
                        return;
                }
            }
        }

        if (action === 'set') {
            headers[name.toLowerCase()] = value;
        }
    }

    function logObject (item) {
        if (logging) {
            console.log(item);
        }
    }

    function createRequest (obj, callback) {
        var request,
        protocol = obj.uri.protocol;

        delete obj.uri;

        if (protocol === 'https:') {
            request = https.request(obj, callback);
        } else {
            request = http.request(obj, callback);
        }

        return request;
    }

    return proxy;
}

module.exports = createProxy();