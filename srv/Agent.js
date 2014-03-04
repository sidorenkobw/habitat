var Agent = function () {
    this.id         = null;
    this.client     = null;
    this.name       = null;
    this.author     = null;

    this.x          = null;
    this.y          = null;

    this.health     = 100;
    this.maxHealth  = 100;

    this.satiety    = 100;
    this.maxSatiety = 10000;

    this.terrainMovements = {
        0 : false,
        1 : true,
        2 : true,
        3 : true,
        4 : false,
        5 : true,
        6 : true,
        7 : true,
        8 : true,
        9 : true,
        10 : true,
        11 : true,
        12 : true,
        13 : false,
        14 : true,
        15 : true,
        16 : true,
        17 : true,
        18 : true,
        19 : false,
        20 : false,
        21 : false,
        22 : false,
        23 : false,
        24 : false,
        25 : false,
        26 : false,
        27 : false,
        28 : false,
        29 : false,
        30 : false,
        31 : false,
        32 : false,
        33 : false,
        34 : false,
        35 : true,
        36 : false,
        37 : false,
        38 : false,
        39 : false
    };
};

Agent.prototype.setLocation = function (x, y)
{
    this.x = parseInt(x);
    this.y = parseInt(y);
};

Agent.prototype.isAlive = function () {
    return this.health > 0;
};

Agent.prototype.canMoveToTerrainType = function (terrainType) {
    return terrainType in this.terrainMovements && this.terrainMovements[terrainType];
};

exports.create = function () {
    return new Agent();
};
