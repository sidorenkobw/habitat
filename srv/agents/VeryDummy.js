var DummyAgent = function () {

};

DummyAgent.prototype.introduce = function () {
    return {
        "name"   : "Very Dummy",
        "author" : "Andrew Sidorenko",
        "email"  : "sidorenkobw@gmail.com"
    };
};

DummyAgent.prototype.onNewTick = function (status) {

};


DummyAgent.prototype.decision = function () {
    return null;
};

DummyAgent.prototype.onNotification = function (notificationCode) {

};

exports.agentClass = DummyAgent;
