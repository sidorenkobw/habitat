var Constants = require("./constants");

var Agent = function () {
    this.id         = null;
    this.class      = null;
    this.client     = null;
    this.name       = null;
    this.author     = null;

    this.x          = null;
    this.y          = null;

    this.health     = Constants.balance.AGENT_MAX_HEALTH;
    this.maxHealth  = Constants.balance.AGENT_MAX_HEALTH;

    this.age        = 0;

    this.satiety    = 100;
    this.maxSatiety = Constants.balance.AGENT_MAX_SATIETY;

    this.lastDecision = null;

    this.terrainMovements = {
        0 : false,
        1 : true,
        2 : true,
        3 : true,
        4 : false,
        5 : false,
        6 : false,
        7 : false,
        8 : false,
        9 : false,
        10 : false,
        11 : false,
        12 : false,
        13 : false,
        14 : false,
        15 : false
    };
};

Agent.prototype.toJson = function () {
    return {
        "id"             : this.id,
        "class"          : this.class,
        //"client"         : this.client,
        "name"           : this.name,
        "author"         : this.author,
        "x"              : this.x,
        "y"              : this.y,
        "health"         : this.health,
        "maxHealth"      : this.maxHealth,
        "age"            : this.age,
        "agePhase"       : this.getAgePhase(),
        "healthPercent"  : Math.round(this.health * 100 / this.maxHealth),
        "satiety"        : this.satiety,
        "maxSatiety"     : this.maxSatiety,
        "satietyPercent" : Math.round(this.satiety * 100 / this.maxSatiety)
    };
};

Agent.prototype.getAgePhase = function() {
    if (this.age >= Constants.balance.AGENT_AGE_OLD) {
        return 'old';
    } else if (this.age >= Constants.balance.AGENT_AGE_ADULT) {
        return 'adult';
    } else if (this.age >= Constants.balance.AGENT_AGE_TEEN) {
        return 'teen';
    }
    return 'baby';
}

Agent.prototype.getName = function() {
    return this.class + '(' + this.id + ')';
}

Agent.prototype.getStatusString = function() {
    return 'HP:' + this.health + '/' + this.maxHealth +
        ' Sat:' + this.satiety + '/' + this.maxSatiety +
        ' Age:' + this.age + '/' + Constants.balance.AGENT_AGE_DEATH;
}

Agent.prototype.setLocation = function (x, y)
{
    this.x = parseInt(x);
    this.y = parseInt(y);

    return this;
};

Agent.prototype.isAlive = function () {
    return this.health > 0;
};

Agent.prototype.canMoveToTerrainType = function (terrainType) {
    return terrainType in this.terrainMovements && this.terrainMovements[terrainType];
};

Agent.prototype.updateSatietyWith = function (value) {
    var newVal = this.satiety + value;
    if (newVal > this.maxSatiety) {
        this.satiety = this.maxSatiety;
    } else if (newVal < 0) {
        this.satiety = 0;
    } else {
        this.satiety = newVal;
    }

    return this;
};

exports.create = function () {
    return new Agent();
};
