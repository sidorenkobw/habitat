var Agent = function () {
    this.id         = null;
    this.class      = null;
    this.client     = null;
    this.name       = null;
    this.author     = null;

    this.x          = null;
    this.y          = null;

    this.health     = 100;
    this.maxHealth  = 100;

    this.satiety    = 100;
    this.maxSatiety = 3000;

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
        "client"         : this.client,
        "name"           : this.name,
        "author"         : this.author,
        "x"              : this.x,
        "y"              : this.y,
        "health"         : this.health,
        "maxHealth"      : this.maxHealth,
        "healthPercent"  : Math.round(this.health * 100 / this.maxHealth),
        "satiety"        : this.satiety,
        "maxSatiety"     : this.maxSatiety,
        "satietyPercent" : Math.round(this.satiety * 100 / this.maxSatiety)
    };
};

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
