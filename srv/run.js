var serverModule = require("./Server"),
    http = require('http');

(function () {
    var mapModule = require("./Map");
    var map = new mapModule.Map();
    map.setSize(40, 30);
    map.map = [
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
        [1,13,13,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,12,12,12,12,12,1,1,1,1,1,1],
        [1,1,13,13,1,1,1,17,17,17,17,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,12,12,3,8,3,8,3,12,12,1,1,1,1],
        [1,1,1,1,1,1,17,14,14,14,14,16,1,1,1,1,1,1,1,1,1,1,1,1,1,1,9,3,3,6,36,35,35,8,3,3,12,12,1,1],
        [1,1,1,1,1,15,14,14,28,31,14,16,1,1,1,1,1,13,1,1,1,1,1,1,1,9,3,3,6,35,35,35,36,35,5,3,4,3,10,1],
        [1,1,1,1,1,15,14,28,0,25,14,16,1,1,1,1,1,1,1,1,1,1,1,1,1,9,3,3,4,6,35,36,35,35,5,3,3,3,10,1],
        [1,1,1,1,1,15,14,22,25,14,14,16,1,1,1,1,1,1,1,1,1,1,1,1,1,9,4,3,3,6,35,7,7,7,3,3,11,11,1,1],
        [1,1,1,1,1,15,14,14,14,14,18,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,11,11,3,3,7,3,4,3,11,11,1,1,1,1],
        [1,1,1,1,1,1,18,18,18,18,1,1,1,1,1,1,1,1,1,1,1,1,1,1,13,1,1,9,3,3,3,11,11,11,1,1,1,1,1,1],
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,11,11,11,1,1,1,1,1,1,1,1,1],
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,13,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,17,17,17,17,17,16,1,1],
        [1,1,1,1,1,1,1,1,1,1,1,1,13,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,17,17,17,14,14,14,14,14,14,16,1],
        [1,1,1,13,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,17,17,17,14,14,14,14,14,14,28,31,14,14,16],
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,17,17,17,14,14,14,14,14,14,28,27,27,0,0,31,14,16],
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,17,17,14,14,14,14,14,28,27,27,27,0,0,0,0,0,25,14,16],
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,15,14,14,14,28,27,27,27,0,0,0,0,21,21,21,21,25,14,14,16],
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,15,14,14,28,27,0,0,0,0,0,21,21,25,14,14,14,14,14,14,16,1],
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,14,14,14,20,0,0,0,0,21,25,14,14,14,14,14,18,18,18,18,1,1],
        [1,1,1,1,1,1,1,1,1,1,1,1,1,13,1,1,1,1,17,14,14,28,0,0,0,0,25,14,14,14,14,18,18,18,1,1,1,1,1,1],
        [1,1,1,1,1,13,1,1,1,1,1,1,1,1,1,1,1,17,14,14,28,0,0,39,0,25,14,14,14,14,16,1,1,1,1,1,1,1,1,1],
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,15,14,14,28,0,0,0,0,23,14,14,14,14,16,1,1,1,1,1,1,1,1,1,1],
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,15,14,28,0,0,0,0,0,25,14,14,14,16,1,1,1,1,1,1,1,1,1,1,1],
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,15,14,14,20,0,0,0,0,25,14,14,14,16,1,1,1,1,1,1,1,1,1,1,1,1],
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,15,14,14,20,0,0,0,23,14,14,14,14,16,1,1,1,1,1,1,1,13,1,1,1,1],
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,15,14,14,14,22,0,0,21,25,14,14,14,16,1,1,1,1,1,1,1,1,1,1,1,1,1],
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,15,14,14,14,14,22,25,14,14,14,14,14,16,1,1,1,1,1,13,1,1,1,1,1,1,1],
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,15,14,14,14,14,14,14,14,14,14,14,16,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,18,18,18,18,18,18,18,18,18,18,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
    ];

    var agents = [
        require("./agents/DummyAgent"),
        require("./agents/DummyAgent"),
        require("./agents/VeryDummy")
    ];

    var srv = new serverModule.Server(agents, map);
    srv.run();
    var observerModule = require('./WebObserver');
    var observer = new observerModule.WebObserver(srv, 8090);
    observer.run();
})();
