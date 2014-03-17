var util  = require("util"),
    _     = require("underscore"),
    fs    = require("fs");

var Agent = require("./Agent"),
    Food  = require("./Food"),
    Constants = require("./constants");

var Server = function (agents, map) {
    this.agentsClasses  = agents;
    this.agents         = [];
    this.tickId         = 0;
    this.map            = map;
    this.lastAgentId    = 0;
    this.tickInterval   = 500;
    this.objects        = [];
    this.displayLogs    = true;
	this.agentsActions  = [];
};

Server.prototype.initLog = function () {
//    fs.writeFileSync("../var/log", "");
};

Server.prototype.log = function (msg, level) {
    if (this.displayLogs) {
        if (level < 2) {
            util.log(msg);
        }
    }
    //fs.appendFileSync("../var/log", this.tickId + " " + msg + "\n");
};

Server.prototype.stop = function () {
    this.log("Server stopped", 1);
    process.exit();
};

Server.prototype.getRandomLocation = function () {
    return {
        "x" : Math.floor(Math.random() * this.map.width),
        "y" : Math.floor(Math.random() * this.map.height)
    };
};

Server.prototype.instantiateAgent = function (agentData) {
    var agentModule, params, agent, agentClient, agentIntroduction, coords;
    agentModule = agentData.module;
    params      = agentData.params;

    if (!("agentClass" in agentModule)) {
        throw new Error("exports.agentClass not found");
    }

    agentClient = new agentModule.agentClass(params);

    if (typeof agentClient.introduce !== 'function') {
        throw new Error("Agent has no method introduce");
    }
    agentIntroduction = agentClient.introduce();

    if (!(agentIntroduction instanceof Object)) {
        throw new Error("agent.introduce() returned not an object");
    }

    if (!("name" in agentIntroduction)) {
        throw new Error("agent.introduce() doesn't contain name");
    }

    if (!("author" in agentIntroduction)) {
        throw new Error("agent.introduce() doesn't contain author");
    }

    if (!("email" in agentIntroduction)) {
        throw new Error("agent.introduce() doesn't contain email");
    }

    if (typeof agentClient.onNewTick !== 'function') {
        throw new Error("Agent has no method onNewTick");
    }

    if (typeof agentClient.decision !== 'function') {
        throw new Error("Agent has no method decision");
    }

    if (typeof agentClient.onNotification !== 'function') {
        throw new Error("Agent has no method onNotification");
    }

    agent           = Agent.create();
    agent.id        = ++this.lastAgentId;
    agent.class     = agentData.class;
    agent.client    = agentClient;
    agent.name      = agentIntroduction.name;
    agent.author    = agentIntroduction.author;

    do {
        coords = this.getRandomLocation();
    } while (this.getAgentByXY(coords.x, coords.y) || !agent.canMoveToTerrainType(this.map.getTerrainTypeByXY(coords.x, coords.y)));

    agent.setLocation(coords.x, coords.y);
    if (typeof agentClient.init === "function") {
        agentClient.init(Constants);
    }

    return agent;
};

Server.prototype.initAgents = function (resetAgents) {
    if (resetAgents) {
        this.lastAgentId = 0;
        this.agents = [];
    }

    var agent;

    for (var i in this.agentsClasses) {
        agent = this.agentsClasses[i];
        try {
            agent = this.instantiateAgent(agent);
        } catch (e) {
            this.log("Agent(" + i + ") was not created because of error: " + e.message, 1);
            continue;
        }

        this.log(agent.name + "(" + agent.id + ")" + " was born at x:" + agent.x + " y:" + agent.y, 1);
        this.agents.push(agent);

        // Add food for the newborn agent
        var food = Food.create(Math.round(agent.maxSatiety / 2));
        food.setLocation(agent.x, agent.y);
        this.objects.push(food);
        this.log("Food with richness: " + food.richness + " was generated at x:" + food.x + " y:" + food.y, 2);

    }
};

Server.prototype.generateFood = function () {
    var food, coords;

    do {
        coords = this.getRandomLocation();
    } while (!_.contains([1, 2, 3], this.map.getTerrainTypeByXY(coords.x, coords.y)));

    food = Food.create(Math.floor(Math.random() * 300) + 100);
    food.setLocation(coords.x, coords.y);
    this.log("Food with richness: " + food.richness + " was generated at x:" + food.x + " y:" + food.y, 2);

    this.objects.push(food);
};

Server.prototype.initFood = function () {
    this.generateFood();
};

Server.prototype.getAgentByXY = function (x, y) {
    var agent;

    for (var i in this.agents) {
        agent = this.agents[i];

        if (agent.x === x && agent.y === y) {
            return agent;
        }
    }

    return null;
};

Server.prototype.getAgentForEnvironmentByXY = function (agent, x, y, shift_x, shift_y) {
    var tmpAgent, agentObj;

    tmpAgent = this.getAgentByXY(x, y);

    // Exclude current agents from agents list
    if (tmpAgent && tmpAgent !== agent) {
        agentObj = {
            "class"     : "agent",
            "subClass"  : tmpAgent.class,
            "health"    : tmpAgent.health,
            "maxHealth" : tmpAgent.maxHealth,
            "x"         : shift_x,
            "y"         : shift_y
        };

        return agentObj;
    }

    return null;
}

Server.prototype.getObjectsByXY = function (x, y) {
    return _.filter(this.objects, function (obj) {
        return obj.x === x && obj.y === y;
    });
};

Server.prototype.getObjectsForEnvironmentByXY = function (agent, x, y, shift_x, shift_y) {
    var objects = this.getObjectsByXY(x, y);

    if (objects.length) {
        objects = _.map(objects, function (obj) {
            obj = obj.toJson();
            obj.x = shift_x;
            obj.y = shift_y;
            return obj;
        });
    }

    return objects;
}

Server.prototype.getEnvironmentForAgent = function(agent)
{
    var radius = 4, env, coords, terrain, row, agentObj, objects, shift_x, shift_y;
    env = {
        "map"       : [],
        "objects"   : []
    };

    for (shift_y = -radius ; shift_y < radius + 1 ; shift_y++) {
        row = [];

        for (shift_x = -radius ; shift_x < radius + 1 ; shift_x++) {
            coords = this.map.getXYByRel(agent.x, agent.y, shift_x, shift_y);
            terrain = this.map.getTerrainTypeByXY(coords.x, coords.y);

            agentObj = this.getAgentForEnvironmentByXY(agent, coords.x, coords.y, shift_x, shift_y);
            if (agentObj) {
                env.objects.push(agentObj);
            }

            objects = this.getObjectsForEnvironmentByXY(agent, coords.x, coords.y, shift_x, shift_y);
            _.each(objects, function (obj) {
                env.objects.push(obj);
            });

            row.push(terrain);
        }

        env.map.push(row);
    }

    return env;
};

Server.prototype.getAgentStatus = function (agent) {
    var status = {
        "health"        : agent.health,
        "maxHealth"     : agent.maxHealth,
        "satiety"       : agent.satiety,
        "maxSatiety"    : agent.maxSatiety,
        "environment"   : this.getEnvironmentForAgent(agent)
    };

//    if (agent.id == 1) {
//        console.log(" ");
//        console.log("ID:" + agent.id + " HEALTH:" + agent.health + " SATIETY:" + agent.satiety);
//        console.log(status.environment.map);
//        console.log(status.environment.objects);
//    }
//
    return status;
};

Server.prototype.updateAgentStatus = function (agent) {
    agent.updateSatietyWith(-1);

    // Regeneration
    if (agent.lastDecision.action === Constants.ACTION_IDLE) {
        if (agent.satiety > Math.floor(agent.maxSatiety * Constants.balance.AGENT_SATIETY_LEVEL_REGENERATION)) {
            agent.health = agent.health + 1 > agent.maxHealth ? agent.maxHealth : agent.health + 1;
        }
    }

    // Starving
    if (agent.satiety == 0) {
        agent.health = agent.health - 1;
    }

    // Death
    if (!agent.isAlive()) {
        this.log(agent.name + "(" + agent.id + ") [" + agent.health + "/" + agent.satiety +  "] has died at x:" + agent.x + " y:" + agent.y + " on tick " + this.tickId, 1);

        // Create food instead of died agent
        var food = Food.create(Constants.balance.AGENT_DEAD_BODY_SATIETY);
        food.setLocation(agent.x, agent.y);
        this.objects.push(food);
        this.log("Food with richness: " + food.richness + " was created instead of died agent at x:" + food.x + " y:" + food.y, 2);

        // Remove agent from server
        this.agents.splice(this.agents.indexOf(agent), 1);
    }
};

Server.prototype.getEmptyDecision = function () {
    return {
        "isProcessed" : false,
        "action" : Constants.ACTION_IDLE
    };
};

Server.prototype.sanitizeDecisionDirection = function (decision) {
    decision.dir = parseInt(decision.dir);
    if (decision.dir === undefined || !_.contains(this.map.getPossibleDirections(), decision.dir)) {
        throw new Error("decision returned wrong direction code: " + decision.dir);
    }
};

Server.prototype.sanitizeDecision = function (agent, decision) {
    try {
        if (decision !== Object(decision)) {
            this.log(agent.name + "(" + agent.id + ") [" + agent.health + "/" + agent.satiety + "] decided to stay idle", 3);
            return this.getEmptyDecision();
        }

        decision.action = parseInt(decision.action);

        if (decision.action === Constants.ACTION_IDLE) {

            this.log(agent.name + "(" + agent.id + ") [" + agent.health + "/" + agent.satiety + "] decided to stay idle", 3);
            return this.getEmptyDecision();

        } else if (decision.action === Constants.ACTION_MOVE) {
            this.sanitizeDecisionDirection(decision);

            if (decision.dir === Constants.DIR_CURRENT) {
                this.log(agent.name + "(" + agent.id + ") [" + agent.health + "/" + agent.satiety + "] decided to stay idle", 3);
                return this.getEmptyDecision();
            }

            this.log(agent.name + "(" + agent.id + ") [" + agent.health + "/" + agent.satiety + "] decided to go to " + decision.dir, 3);

            return {
                "isProcessed"   : false,
                "action"        : Constants.ACTION_MOVE,
                "dir"           : decision.dir
            };

        } else if (decision.action === 2) { // Reserved

            throw new Error("action code: " + decision.action + " is reserved");

        } else if (decision.action === Constants.ACTION_ATTACK) {

            this.sanitizeDecisionDirection(decision);

            this.log(agent.name + "(" + agent.id + ") [" + agent.health + "/" + agent.satiety + "] decided to attack in direction: " + decision.dir, 3);

            return {
                "isProcessed"   : false,
                "action"        : Constants.ACTION_ATTACK,
                "dir"           : decision.dir
            };

        } else if (decision.action === Constants.ACTION_EAT) {
            this.sanitizeDecisionDirection(decision);

            this.log(agent.name + "(" + agent.id + ") [" + agent.health + "/" + agent.satiety + "] decided to eat food from " + decision.dir, 3);

            return {
                "isProcessed"   : false,
                "action"        : Constants.ACTION_EAT,
                "dir"           : decision.dir
            };

        } else {
            throw new Error("decision returned wrong action code: " + decision.action);
        }

    } catch (e) {
        this.log(agent.name + "(" + agent.id + ") [" + agent.health + "/" + agent.satiety + "] was notified with (1)", 4);
        agent.client.onNotification(Constants.ERROR_WRONG_FORMAT);
        throw e;
    }
};

Server.prototype.processDecisionMove = function (decision) {
    var movementMap = this.map.getDirectionsMap(),
        agent = decision.agent,
        relCoords, coords, tmpAgent;

    relCoords = movementMap[decision.dir];
    coords = this.map.getXYByRel(agent.x, agent.y, relCoords.x, relCoords.y);
    tmpAgent = this.getAgentByXY(coords.x, coords.y);
	var actionLogRecord = {
			'tickId' : this.tickId,
			'agentId' : agent.id,
			'action' : Constants.ACTION_MOVE,
			'result' : false,
			'target' : coords,
	};
    if (decision.dir % 2) {
        // straight direction
        agent.updateSatietyWith(-Constants.balance.AGENT_MOVE_COST_STRAIGHT);
    } else {
        agent.updateSatietyWith(-Constants.balance.AGENT_MOVE_COST_DIAGONAL);
    }

    if (tmpAgent && tmpAgent !== agent) {
        this.log(agent.name + "(" + agent.id + ") [" + agent.health + "/" + agent.satiety + "] can't move (cell is occupied)", 4);
        agent.client.onNotification(Constants.ERROR_MOVE_CELL_OCCUPIED);
    } else {
        if (agent.canMoveToTerrainType(this.map.getTerrainTypeByXY(coords.x, coords.y))) {
            agent.x = coords.x;
            agent.y = coords.y;

            this.log(agent.name + "(" + agent.id + ") [" + agent.health + "/" + agent.satiety + "] moved to x:" + agent.x + " y:" + agent.y + " dir:" + decision.dir, 2);
			actionLogRecord.result = true;
        } else {
            this.log(agent.name + "(" + agent.id + ") [" + agent.health + "/" + agent.satiety + "] can't move (impassible terrain)", 4);
            agent.client.onNotification(Constants.ERROR_MOVE_IMPASSABLE_TERRAIN);
        }
    }
	this.agentsActions.push(actionLogRecord);
};

Server.prototype.processDecisionEatFood = function (decision) {
    var movementMap = this.map.getDirectionsMap(),
        agent = decision.agent,
        relCoords, coords, food, value;
    relCoords = movementMap[decision.dir];
    coords = this.map.getXYByRel(agent.x, agent.y, relCoords.x, relCoords.y);
    food = _.first(_.filter(this.getObjectsByXY(coords.x, coords.y), function (obj) {
        return obj.class === "food";
    }));
	var actionLogRecord = {
			'tickId' : this.tickId,
			'agentId' : agent.id,
			'action' : Constants.ACTION_EAT,
			'result' : false,
			'target' : coords,
	};
    if (!food) {
        this.log(agent.name + "(" + agent.id + ") [" + agent.health + "/" + agent.satiety + "] can't eat food (no food in cell)", 4);
        agent.client.onNotification(Constants.ERROR_EAT_NO_FOOD);
    } else if (agent.satiety === agent.maxSatiety) {
        this.log(agent.name + "(" + agent.id + ") [" + agent.health + "/" + agent.satiety + "] can't eat food (stomach is full)", 4);
        agent.client.onNotification(Constants.ERROR_EAT_STOMACH_FULL);
    } else {
        value = Constants.balance.AGENT_EAT_AMOUNT;
        if (food.richness < value) {
            value = food.richness;
        } else if ((agent.maxSatiety - agent.satiety) < value) {
            value = agent.maxSatiety - agent.satiety;
        }

        this.log(agent.name + "(" + agent.id + ") [" + agent.health + "/" + agent.satiety + "] ate food from x:" + coords.x + " y:" + coords.y
            + " satiety: (+" + value + ")", 2);

        agent.updateSatietyWith(value);
        food.richness -= value;
        if (food.richness < 1) {
            // Remove food
            this.objects.splice(this.objects.indexOf(food), 1);
        }
		actionLogRecord.result = true;
    }
	this.agentsActions.push(actionLogRecord);
};

Server.prototype.processDecisionIdle = function (decision) {
	// TODO: Move regeneration here?
	var actionLogRecord = {
			'tickId' : this.tickId,
			'agentId' : decision.agent.id,
			'action' : Constants.ACTION_IDLE,
			'result' : true,
			'target' : {x : decision.agent.x, y : decision.agent.y},
	};
	this.agentsActions.push(actionLogRecord);
};

Server.prototype.processDecisionAttack = function (decision) {
    var movementMap = this.map.getDirectionsMap(),
        agent = decision.agent,
        relCoords, coords, tmpAgent, damage;

    relCoords = movementMap[decision.dir];
    coords = this.map.getXYByRel(agent.x, agent.y, relCoords.x, relCoords.y);
    tmpAgent = this.getAgentByXY(coords.x, coords.y);
	var actionLogRecord = {
			'tickId' : this.tickId,
			'agentId' : agent.id,
			'action' : Constants.ACTION_ATTACK,
			'result' : false,
			'target' : coords,
	};
    if (decision.dir % 2) {
        // straight direction
        agent.updateSatietyWith(-Constants.balance.AGENT_ATTACK_COST_STRAIGHT);
    } else {
        agent.updateSatietyWith(-Constants.balance.AGENT_ATTACK_COST_DIAGONAL);
    }

    if (!tmpAgent) {
        this.log(agent.name + "(" + agent.id + ") [" + agent.health + "/" + agent.satiety + "] can't attack (no agent in cell)", 4);
        agent.client.onNotification(Constants.ERROR_ATTACK_NO_AGENT);
    } else {
        damage = Math.floor(Math.random() * Constants.balance.AGENT_BASE_DAMAGE);
        if (agent.satiety > Math.floor(agent.maxSatiety * Constants.balance.AGENT_HUNGRY_FACTOR) && agent.satiety < Math.floor(agent.maxSatiety * Constants.balance.AGENT_BLOATED_FACTOR)) {
            damage += 2;
        }

        tmpAgent.health -= damage;

        this.log(agent.name + "(" + agent.id + ") [" + agent.health + "/" + agent.satiety + "] attacked: " +
            tmpAgent.name + "(" + tmpAgent.id + ") [" + tmpAgent.health + "/" + tmpAgent.satiety + "] on x:" +
            coords.x + " y:" + coords.y + " with damage: " + damage, 2);
		actionLogRecord.result = true;
    }
	this.agentsActions.push(actionLogRecord);
};

Server.prototype.processDecision = function (decision) {
    decision.isProcessed = true;
    decision.agent.lastDecision = decision;

    if (decision.action === Constants.ACTION_MOVE) {
        this.processDecisionMove(decision);
    } else if (decision.action === Constants.ACTION_ATTACK) {
        this.processDecisionAttack(decision);
    } else if (decision.action === Constants.ACTION_EAT) {
        this.processDecisionEatFood(decision);
    } else if (decision.action === Constants.ACTION_IDLE) {
		this.processDecisionIdle(decision);
	}
};

Server.prototype.tick = function () {
    var agents = _.shuffle(this.agents);

    this.tickId++;

    if (!(this.tickId % 100)) {
        this.generateFood();
    }
	this.agentsActions = [];
    _.each(agents, function (agent) {
        try {

            // Notify the agent that new tick has begun
            agent.client.onNewTick(this.getAgentStatus(agent));

            // Get and validate agent's decision
            var decision = agent.client.decision();

            decision = this.sanitizeDecision(agent, decision);
            decision.agent = agent;

        } catch (e) {
            this.log(agent.name + "(" + agent.id + ")" + " skipped on tick " + this.tickId + " because of error: " + e.message, 1);
            decision = this.getEmptyDecision();
        }

        this.processDecision(decision);

    }, this);

    // Recalculate agent's characteristics (health, etc.), remove died
    _.each(this.agents, function (agent) {
        this.updateAgentStatus(agent);
    }, this);

    if (!(this.tickId % 50)) {
        this.saveServerState();
    }

    this.saveServerState();
    //this.printWorld();

    if (this.agents.length == 1) {
        this.log("The one who survived: " + this.agents[0].class, 1);
        this.initAgents(false);
    }

    if (!this.agents.length) {
        this.log("All agents died", 1);
        this.stop();
    }

    var self = this;
    setTimeout(function () {
        self.tick.call(self);
    }, this.tickInterval);
};

Server.prototype.getServerState = function() {
    var state = {
        "tickId" : this.tickId,
        "map"    : this.map.getMap(),
        "agents"  : [],
        "objects" : [],
        "log"     : this.agentsActions
    };

    state.agents = _.map(this.agents, function (agent) {
        return agent.toJson();
    });

    state.objects = _.map(this.objects, function (obj) {
        return obj.toJson();
    });
    return state;
};

Server.prototype.saveServerState = function () {
    var state = this.getServerState();
//    fs.writeFileSync("../var/state.json", JSON.stringify(state));
};

Server.prototype.printWorld = function () {
    process.stdout.write("\n");
    process.stdout.write(""+this.tickId);
    process.stdout.write("\n");
    for (var y = 0 ; y < this.map.height ; y++) {
        for (var x = 0 ; x < this.map.width ; x++) {
            if (this.getAgentByXY(x, y)) {
                process.stdout.write("@");
            } else if (this.getObjectsByXY(x, y).length) {
                process.stdout.write("#");
            } else {
                process.stdout.write(_.contains([1,2,3,5,6,7,8,9,10,11,12,14,15,16,17,18,35], this.map.getTerrainTypeByXY(x, y)) ? " " : ".");
            }
        }
        process.stdout.write("\n");
    }

    for (var x = 0 ; x < this.map.width ; x++) {
        process.stdout.write("-");
    }
    process.stdout.write("\n");
};

Server.prototype.run = function () {
    this.initLog();

    this.log("Server started", 1);

    this.initAgents(true);
    this.initFood();

    var self = this;
    setTimeout(function () {
        self.tick.call(self);
    }, this.tickInterval);
};

exports.Server = Server;
