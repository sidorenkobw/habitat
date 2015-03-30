var Mob = require('../Mob').Mob;
var Constants = require("../../../constants");

function AgentMob(options)
{
    Mob.call(this, options);
    if (typeof(options.client) != 'object') {
        throw Error('Agent should have client');
    }
    this.client = options.client;
    this.subClass = 'agent';
    if (typeof(options.family) == 'string') {
        this.family = options.family;
    }
}
AgentMob.prototype = new Mob({});

AgentMob.prototype.tick = function(environment)
{
    Mob.prototype.tick.call(this);
    var decision, object, actionOptions = {}, error = null;
    /**
     * Get decision from client
     */
    try {
        // Notify the agent that new tick has begun
        this.client.onNewTick(this._getClientData(environment));
        // Get agent's decision
        decision = this.client.decision();
    } catch (e) {
        decision = null;
    }
    /**
     * Validate and do action
     *
     */
    var sourcePos = {x: this.x, y: this.y};
    this.lastAction.source = sourcePos;
    if (typeof(decision) != 'object' || decision == null) {
        this.lastAction.action = Constants.ACTION_IDLE;
        this.idle(actionOptions);
    } else {
        if (typeof(decision.action) == 'undefined') {
            this.lastAction.action = Constants.ACTION_IDLE;
            this.idle(actionOptions);
        } else {
            decision.action = parseInt(decision.action);
            var targetPos = sourcePos;
            if (typeof(decision.dir) != 'undefined' && typeof(environment.dir[decision.dir]) != 'undefined') {
                targetPos = this._getPositionByDir(environment, decision.dir);
                actionOptions.dir = decision.dir;
            }
            this.lastAction.target = targetPos;
            switch (decision.action) {
                case Constants.ACTION_ATTACK:
                    this.lastAction.action = Constants.ACTION_ATTACK;
                    object = this._getTarget(environment.objects, {x: targetPos.x, y: targetPos.y, class: 'mob'});
                    if (this.age < Constants.balance.AGENT_AGE_TEEN) {
                        error = Constants.ERROR_ATTACK_TOO_YOUNG;
                    } else if (!object) {
                        error = Constants.ERROR_ATTACK_NO_AGENT;
                    } else {
                        actionOptions.target = object;
                        this.attack(actionOptions);
                        this.lastAction.target = targetPos;
                        this.lastAction.result = true;
                    }
                    break;
                case Constants.ACTION_MOVE:
                    this.lastAction.action = Constants.ACTION_MOVE;
                    this.lastAction.target = targetPos;
                    object = this._getTarget(environment.objects, {x: targetPos.x, y: targetPos.y, class: 'mob'});
                    if (object) {
                        error = Constants.ERROR_MOVE_CELL_OCCUPIED;
                    } else {
                        if (this._isDestinationPassable(environment, decision.dir)) {
                            actionOptions.target = targetPos;
                            this.move(actionOptions);
                            this.lastAction.result = true;
                        } else {
                            error = Constants.ERROR_MOVE_IMPASSABLE_TERRAIN;
                        }
                    }
                    break;
                case Constants.ACTION_EAT:
                    this.lastAction.action = Constants.ACTION_EAT;
                    object = this._getTarget(environment.objects, {class: 'food', x: targetPos.x, y: targetPos.y});
                    if (!object) {
                        error = Constants.ERROR_EAT_NO_FOOD;
                    } else if (this.satiety === this.maxSatiety) {
                        error = Constants.ERROR_EAT_STOMACH_FULL;
                    } else {
                        actionOptions.target = object;
                        this.eat(actionOptions);
                        this.lastAction.result = true;
                    }
                    break;
                case Constants.ACTION_IDLE:
                    this.lastAction.action = Constants.ACTION_IDLE;
                    this.idle(actionOptions);
                    this.lastAction.result = true;
                    break;
                default:
                    this.lastAction.action = Constants.ACTION_IDLE;
                    this.idle(actionOptions);
                    break;
            }
        }
    }
    //--------------------------------------------------------------------------------------------------------------
    if (error !== null) {
        this.client.onNotification(error);
    }
    return error || true;
};

AgentMob.prototype._getClientData = function(environment)
{
    var i, l, object, objectData, clientData = {
        health: this.health,
        maxHealth: this.maxHealth,
        satiety: this.satiety,
        maxSatiety: this.maxSatiety,
        "environment": {
            map: environment.map.slice,
            objects: []
        }
    };
    for (i = 0, l = environment.objects.length; i < l; i++) {
        object = environment.objects[i];
        if (object.id == this.id) {
            continue;
        }
        objectData = {
            class: object.class,
            impassable: object.impassable,
            x: object.x - this.x,
            y: object.y - this.y
        };
        if (object.class == 'mob') {
            objectData.class = 'agent';
            objectData.subClass = object.family;
            objectData.health = object.health;
            objectData.maxHealth = object.maxHealth;
        }
        clientData.environment.objects.push(objectData)
    }
    return clientData;
};

AgentMob.prototype._getPositionByDir = function(environment, dir)
{
    var rel_x = environment.dir[dir].x, rel_y = environment.dir[dir].y;

    if (rel_x > environment.map.width) {
        throw new Error('shift_x is bigger the map size');
    }

    if (rel_y > environment.map.height) {
        throw new Error('shift_y is bigger the map size');
    }

    var nx = this.x + rel_x;
    if (nx < 0) {
        nx = nx + environment.map.width;
    } else if (nx >= environment.map.width) {
        nx = nx - environment.map.width;
    }

    var ny = this.y + rel_y;
    if (ny < 0) {
        ny = ny + environment.map.height;
    } else if (ny >= environment.map.height) {
        ny = ny - environment.map.height;
    }

    return {x: nx, y: ny};
};

AgentMob.prototype._isDestinationPassable = function(environment, dir)
{
    var y = environment.map.slice.length ? ((environment.map.slice.length - 1) / 2) + environment.dir[dir].y : 0;
    var x = environment.map.slice.length ? ((environment.map.slice[0].length - 1) / 2) + environment.dir[dir].x : 0;
    var tile = environment.map.slice[y][x];
    for (var i = 0, l = environment.passableTiles.length; i < l; i++) {
        if (environment.passableTiles[i] == tile) {
            return true;
        }
    }
    return false;
};

AgentMob.prototype._getTarget = function(list, options)
{
    var i, l, object;
    for (i = 0, l = list.length; i < l; i++) {
        object = list[i];
        if (
            (typeof(options.id) == 'undefined' || object.id != options.id)
                && (typeof(options.x) == 'undefined' || object.x == options.x)
                && (typeof(options.y) == 'undefined' || object.y == options.y)
                && (typeof(options.impassable) == 'undefined' || object.impassable == options.impassable)
                && (typeof(options.class) == 'undefined' || object.class == options.class)
            ) {
            return object;
        }
    }
    return null;
};


module.exports.AgentMob = AgentMob;
