'use strict';

var http = require('http');
var https = require('https');
var express = require('express');
var url = require('url');

function createPlatform () {
    var platform = function (options) {
        var app = express();
        var server;

        setupExpress(app, options.port, options.logging);

        if (options.secure) {
            server = https.createServer(options.cert, app).listen(options.port);
        } else {
            server = http.createServer(app).listen(options.port);
        }
    };

    function setupExpress (app, port, logging) {
        var endpoints = {};

        function logObject (item) {
            if (logging) {
                console.log(item);
            }
        }

        function getHeader (headers, name) {
            for (var i in headers) {
                if (i.toLowerCase() === name.toLowerCase()) {
                    return headers[i];
                }
            }
        }

        function setHeader (headers, name, value) {
            for (var i in headers) {
                if (i.toLowerCase() === name.toLowerCase()) {
                    headers[i] = value;
                    return;
                }
            }

            headers[name.toLowerCase()] = value;
        }

        function deleteHeader (headers, name) {
            for (var i in headers) {
                if (i.toLowerCase() === name.toLowerCase()) {
                    delete headers[i];
                    break;
                }
            }
        }

        function createRequest (uri, obj, callback) {
            var request;

            obj.hostname = uri.hostname;
            obj.path = uri.path;
            obj.port = uri.port;

            if (uri.protocol === 'https:') {
                request = https.request(obj, callback);
            } else {
                request = http.request(obj, callback);
            }

            return request;
        }

        app.post('/proxy', function (request, response) {
            request.setEncoding('utf8');
            request.on('data', function (data) {
                var obj = JSON.parse(data);
                var uri = url.parse(obj.url);
                var length = 0;
                var contentType;
                obj.method = obj.method;

                if (!obj.headers) {
                    obj.headers = {};
                }

                obj.rejectUnauthorized = false;

                if (!obj.data) {
                    deleteHeader(obj.headers, 'content-type');
                    deleteHeader(obj.headers, 'content-length');
                } else {
                    contentType = getHeader(obj.headers, 'content-type');
                    length = obj.data.length;

                    if (!contentType) {
                        setHeader(obj.headers, 'content-type', 'application/json');
                        contentType = getHeader(obj.headers, 'content-type');
                    }

                    if (contentType === 'application/json') {
                        obj.data = JSON.stringify(obj.data);
                    }

                    length = obj.data.length;

                    setHeader(obj.headers, 'content-length', length);
                }

                deleteHeader(obj.headers, 'accept-encoding');
                deleteHeader(obj.headers, 'host');

                logObject(JSON.stringify(obj));

                var req = createRequest(uri, obj, function (res) {
                    var body = '';
                    res.on('data', function (d) {
                        body += d;
                    });

                    res.on('end', function () {
                        response.writeHead(res.statusCode, res.headers);
                        response.write(body);
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
        });
    }

    return platform;
}

module.exports = createPlatform();