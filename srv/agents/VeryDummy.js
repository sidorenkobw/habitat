var DummyAgent = function () {
    this.Constants = {};
};

DummyAgent.prototype.introduce = function () {
    return {
        "name"   : "Very Dummy",
        "author" : "Andrew Sidorenko",
        "email"  : "sidorenkobw@gmail.com"
    };
};

DummyAgent.prototype.init = function (constants) {
    this.Constants = constants;
};


DummyAgent.prototype.onNewTick = function (status) {

};


DummyAgent.prototype.decision = function () {
    return {
        action: this.Constants.ACTION_IDLE
    };
};

DummyAgent.prototype.onNotification = function (notificationCode) {

};

exports.agentClass = DummyAgent;
