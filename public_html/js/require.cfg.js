requirejs.config({
    baseUrl : "/js",
    shim : {
        backbone : {
            deps : ["jquery","underscore"],
            exports : "Backbone"
        },
        underscore : {
            exports : "_"
        },
        bootstrap : {
            deps    : ["jquery"],
            exports : "Bootstrap"
        }
    },
    paths : {
        jquery     : "/libs/jquery/jquery-1.10.2",
        underscore : "/libs/underscore/underscore",
        backbone   : "/libs/backbone/backbone",
        bootstrap  : "/libs/bootstrap/js/bootstrap",
        text       : "/libs/require/plugins/text"
    }
});