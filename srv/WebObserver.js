var url  = require('url'),
    fs   = require('fs'),
    _    = require('underscore'),
    mime = require('node-mime'),
    http = require('http');

var WebObserver = function(serverObject, port) {
    this.server = serverObject;
    this.port = port;
    this.staticDir = '../public_html';
    this.uriMap = {
        '^/state.json$' : this.processServerState,
        '^/map.json$' : this.processServerMap,
        '^/.*$' : this.processStatic
    };
};
WebObserver.prototype.processRequest = function(request, response) {
    var uri = url.parse(request.url).pathname;
    var processed = false;
    for(regexp in this.uriMap) {
        if (uri.match(regexp)) {
            if (this.uriMap[regexp].apply(this, [request, response])) {
                processed = true;
                break;
            }
        }
    }
    if (!processed) {
        this.set404(response);
    }
};
WebObserver.prototype.set404 = function(response) {
    response.writeHead(404, {'content-type': 'text/plain'})
    response.write("404 Not Found\n");
    response.end();
};
WebObserver.prototype.processServerState = function(request, response) {
    var state = this.server.getServerState();
    delete state.map;
    var str = JSON.stringify(state);
    response.writeHead(200, {'Content-Type':'text/javascript'})
    response.write(str, 'utf8');
    response.end();
    return true;
};
WebObserver.prototype.processServerMap = function(request, response) {
    var str = JSON.stringify(this.server.map.getMap());
    response.writeHead(200, {'Content-Type':'text/javascript'})
    response.write(str, 'utf8');
    response.end();
    return true;
};
WebObserver.prototype.processStatic = function(request, response) {
    var uri = url.parse(request.url).pathname;
    if (uri.indexOf('..') != -1) {
        return false;
    }
    var filename = this.staticDir + uri;
    if (!fs.existsSync(filename)) {
        return false;
    }
    var file = fs.readFileSync(filename, "binary");
    var mimetype = mime.lookup(filename);
    response.writeHead(200, {"Content-Type": mimetype});
    response.write(file, "binary");
    response.end();
    return true;
};
WebObserver.prototype.run = function() {
    var server = http.createServer(_.bind(this.processRequest, this));
    server.listen(this.port);
};

exports.WebObserver = WebObserver;
