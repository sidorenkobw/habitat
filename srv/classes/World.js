var Constants = require("./constants");
var Food = require("./world/object/Food").Food;
var Mob = require("./world/object/Mob").Mob;
var AgentMob = require("./world/object/mob/AgentMob").AgentMob;

function World(map)
{
    this.map = map;
    /**
     * @deprecated
     * @type {Array}
     */
    this.objects = [];
    this._objectsIdSeq = 1;
    /**
     * @deprecated
     * @type {Array}
     */
    this.mobs = [];
    this._mobsIdSeq = 1;
    this._cache = {
        'directionsMap': null,
        'mobsById': {}
    };
    this.mobLastActions = [];
    this._objects = [];
}

World.prototype.spawn = function(object)
{
    object.id = this._objectsIdSeq++;
    this._objects.push(object);
    return object;
};

World.prototype.spawnMob = function(options)
{
    var mob = null;
    if (typeof(options.client) != 'undefined') {
        mob = new AgentMob(options)
    } else {
        mob = new Mob(options);
    }
    if (typeof(options.x) != 'undefined' && typeof(options.y) != 'undefined') {
        mob.setLocation(options.x, options.y);
    } else {
        var position = this.getRandomFreePosition({class:'land'});
        mob.setLocation(position.x, position.y);
    }
    mob.health = parseInt(Constants.balance.AGENT_MAX_HEALTH * 0.9);
    mob.maxHealth = Constants.balance.AGENT_MAX_HEALTH;
    mob.satiety = parseInt(Constants.balance.AGENT_MAX_SATIETY * 0.5);
    mob.maxSatiety = Constants.balance.AGENT_MAX_SATIETY;

    return this.spawn(mob);
};

World.prototype.spawnObject = function(object, options)
{
    if (typeof(options.x) != 'undefined' && typeof(options.y) != 'undefined') {
        object.setLocation(options.x, options.y);
    } else {
        var pos = this.map.getRandomLocation({class:'land'});
        object.setLocation(pos.x, pos.y);
    }
    return this.spawn(object);
};

World.prototype.getObjects = function(options)
{
    var i, l, object, result = [];
    for (i = 0, l = this._objects.length; i < l; i++) {
        object = this._objects[i];
        if (
            (typeof(options.id) == 'undefined' || object.id != options.id)
            && (typeof(options.x) == 'undefined' || object.x == options.x)
            && (typeof(options.y) == 'undefined' || object.y == options.y)
            && (typeof(options.min_x) == 'undefined' || object.x >= options.min_x)
            && (typeof(options.min_y) == 'undefined' || object.y >= options.min_y)
            && (typeof(options.max_x) == 'undefined' || object.x <= options.max_x)
            && (typeof(options.max_y) == 'undefined' || object.y <= options.max_y)
            && (typeof(options.class) == 'undefined' || object.class == options.class)
            && (typeof(options.classNot) == 'undefined' || object.class != options.classNot)
        ) {
            result.push(object);
        }
    }
    return result;
};

World.prototype.getObject = function(options)
{
    var result = this.getObjects(options);
    return result.length ? result[0] : null;
};

World.prototype.getDirectionsMap = function () {
    if (this._cache['directionsMap'] === null) {
        this._cache['directionsMap'] = [];
        this._cache['directionsMap'][0] = {x:  0, y:  0 }; // Current cell
        this._cache['directionsMap'][1] = {x:  0, y: -1 }; // N
        this._cache['directionsMap'][2] = {x: +1, y: -1 }; // NE
        this._cache['directionsMap'][3] = {x: +1, y:  0 }; // E
        this._cache['directionsMap'][4] = {x: +1, y: +1 }; // SE
        this._cache['directionsMap'][5] = {x:  0, y: +1 }; // S
        this._cache['directionsMap'][6] = {x: -1, y: +1 }; // SW
        this._cache['directionsMap'][7] = {x: -1, y:  0 }; // W
        this._cache['directionsMap'][8] = {x: -1, y: -1 }; // NW
    }
    return this._cache['directionsMap'];
};


World.prototype.getRandomFreePosition = function(options)
{
    var pos = this.map.getPositionsByTerrainClass(options.class);
    var occ = this.getOccupiedPositions({sort:true});
    var freePositions = [];
    for (var idxPos = 0, idxOcc = 0, lenPos = pos.length, lenOcc = occ.length; idxPos < lenPos; idxPos++) {
        if (idxOcc < lenOcc && occ[idxOcc].x == pos[idxPos].x && occ[idxOcc].y == pos[idxPos].y) {
            idxOcc++;
        } else {
            freePositions.push(pos[idxPos]);
        }
    }
    return freePositions[Math.floor(Math.random() * freePositions.length)];
};

World.prototype.getOccupiedPositions = function(options)
{
    var positions = [];
    for (var i = 0, l = this._objects.length; i < l; i++) {
        if (this._objects.impassable) {
            positions.push({x: this._objects[i].x, y: this._objects[i].y});
        }
    }
    if (options.sort) {
        positions.sort(function(a, b) {return a.x > b.x ? 1 : a.x < b.x ? -1 : a.y > b.y ? 1 : a.y < b.y ? -1 : 0;});
    }
    return positions;
};

World.prototype.tick = function()
{
    var i, l, object;

    this.mobLastActions = [];

    /**
     * Process world objects
     */
    for (i = 0, l = this._objects.length; i < l; i++) {
        object = this._objects[i];

        object.tick(this.getEnvironmentForObject(object));
        if (object.class == 'mob') {
            this.mobLastActions.push(object.lastAction);
        }
        if (!object.isAlive()) {
            if (object.class == 'mob') {
                // Create food instead of died mob
                this.spawnObject(new Food(Constants.balance.AGENT_DEAD_BODY_SATIETY), {x: object.x, y: object.y});
            }
            // Remove object from world
            this._objects.splice(i, 1); l--;
        }
    }
};

World.prototype.getEnvironmentForObject = function (object)
{
    var environment = {};
    if (object.class == 'mob') {
        var radius = 4;
        var filter = {
            min_x: object.x - radius,
            max_x: object.x + radius,
            min_y: object.y - radius,
            max_y: object.y + radius
        };
        environment.map = {
            width: this.map.width,
            height: this.map.height,
            slice: this.map.getRectangle(filter.min_x, filter.min_y, filter.max_x, filter.max_y)
        };
        environment.dir = this.getDirectionsMap();
        environment.passableTiles = this.map.getTilesByTerrainClass('land');
        environment.objects = this.getObjects(filter);
    }
    return environment;
};

module.exports.create = function(map) {
    return new World(map);
};
