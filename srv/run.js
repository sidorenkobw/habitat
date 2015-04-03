var serverModule = require("./classes/Server"),
    mapGenerator = require("./classes/MapGenerator"),
    http = require('http');

(function () {

    function initAgent(name, params) {
        return {
            "module"    : require("./agents/" + name + ".js"),
            "class"     : name,
            "params"    : params
        };
    }

    var Map = require("./classes/Map").Map;
    var map = new Map();

    map.setSize(50, 50);
    map.map = mapGenerator.generate({
        'width': 50,
        'height': 50,
        'seed' : 'Woo!'
    });


    var agents = [
        initAgent("Straight"),
        initAgent("Foxel"),
        initAgent("Foxel"),
        initAgent("Foxel"),
        initAgent("Foxel"),
        initAgent("Foxel"),
        initAgent("Foxel"),
        initAgent("Dummy"),
        initAgent("VeryDummy"),
        initAgent("ReAgent")
    ];

    var srv = new serverModule.Server(agents, map);
    srv.run();
    var observerModule = require('./classes/WebObserver');
    var observer = new observerModule.WebObserver(srv, 8090);
    observer.run();
})();
