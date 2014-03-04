var util  = require("util"),
    _     = require("underscore"),
    fs    = require("fs");

var Agent = require("./Agent"),
    Food  = require("./Food");

var Server = function (agents, map) {
    this.agentsClasses  = agents;
    this.agents         = [];
    this.tickId         = 0;
    this.map            = map;
    this.lastAgentId    = 0;
    this.tickInterval   = 500;
    this.objects        = [];
    this.displayLogs    = true;
};

Server.prototype.initLog = function () {
    fs.writeFileSync("./var/log", "");
};

Server.prototype.log = function (msg) {
    if (this.displayLogs) {
        util.log(msg);
    }
    fs.appendFileSync("./var/log", this.tickId + " " + msg + "\n");
};

Server.prototype.stop = function () {
    this.log("Server stopped");
    process.exit();
};

Server.prototype.getRandomLocation = function () {
    return {
        "x" : Math.floor(Math.random() * this.map.width),
        "y" : Math.floor(Math.random() * this.map.height)
    };
};

Server.prototype.instantiateAgent = function (agentDefinition) {
    var agent, agentClient, agentIntroduction, coords;

    if (!("agentClass" in agentDefinition)) {
        throw new Error("exports.agentClass not found");
    }

    agentClient = new agentDefinition.agentClass();

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
    agent.client    = agentClient;
    agent.name      = agentIntroduction.name;
    agent.author    = agentIntroduction.author;

    do {
        coords = this.getRandomLocation();
    } while (this.getAgentByXY(coords.x, coords.y) || !agent.canMoveToTerrainType(this.map.getTerrainTypeByXY(coords.x, coords.y)));

    agent.setLocation(coords.x, coords.y);

    // Add food for the newborn agent
    var food = Food.create(5000);
    food.setLocation(agent.x, agent.y);
    this.objects.push(food);
    this.log("Food with richness: " + food.richness + " was generated at x:" + food.x + " y:" + food.y);

    return agent;
};

Server.prototype.initAgents = function () {
    this.agents = [];

    var agent;

    for (var i in this.agentsClasses) {
        agent = this.agentsClasses[i];
        try {
            agent = this.instantiateAgent(agent);
        } catch (e) {
            this.log("Agent(" + i + ") was not created because of error: " + e.message);
            continue;
        }

        this.log(agent.name + "(" + agent.id + ")" + " was born at x:" + agent.x + " y:" + agent.y);
        this.agents.push(agent);
    }
};

Server.prototype.generateFood = function () {
    var food, coords;

    do {
        coords = this.getRandomLocation();
    } while (!_.contains([1, 9, 10, 11, 12, 15, 16, 17, 18], this.map.getTerrainTypeByXY(coords.x, coords.y)));

    food = Food.create(Math.floor(Math.random() * 300) + 100);
    food.setLocation(coords.x, coords.y);
    this.log("Food with richness: " + food.richness + " was generated at x:" + food.x + " y:" + food.y);

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
            "class" : "agent",
            "x"     : shift_x,
            "y"     : shift_y
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
            return {
                "class" : obj.class,
                "x"     : shift_x,
                "y"     : shift_y
            };
        });
    }

    return objects;
}

Server.prototype.getEnvironmentForAgent = function(agent)
{
    var radius = 2, env, coords, terrain, row, agentObj, objects, shift_x, shift_y;
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
        "health"  : agent.health,
        "satiety" : agent.satiety,
        "environment" : this.getEnvironmentForAgent(agent)
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
    if (agent.satiety == 0) {
        agent.health = agent.health - 1;
    } else {
        agent.satiety--;
    }

    if (!agent.isAlive()) {
        this.log(agent.name + "(" + agent.id + ") [" + agent.health + "/" + agent.satiety +  "] has died at x:" + agent.x + " y:" + agent.y + " on tick " + this.tickId);

        // Create food instead of died agent
        var food = Food.create(2000);
        food.setLocation(agent.x, agent.y);
        this.objects.push(food);
        this.log("Food with richness: " + food.richness + " was created instead of died agent at x:" + food.x + " y:" + food.y);

        // Remove agent from server
        this.agents.splice(this.agents.indexOf(agent), 1);
    }
};

Server.prototype.sanitizeDecision = function (agent, decision) {
    try {
        if (decision !== Object(decision)) {
            throw new Error("decision returned not an object");
        }

        decision.action = parseInt(decision.action);

        if (decision.action === 0) { // Idle

            return {
                "isProcessed" : false,
                "action" : 0
            };

        } else if (decision.action === 1) { // Move
            decision.dir = parseInt(decision.dir);
            if (decision.dir === undefined || !_.contains(this.map.getPossibleDirections(), decision.dir)) {
                throw new Error("decision returned wrong direction code: " + decision.dir);
            }

            return {
                "isProcessed" : false,
                "action" : 1,
                "dir"    : decision.dir
            };

        } else if (decision.action === 2) { // Reserved

            throw new Error("action code: " + decision.action + " is reserved");

        } else if (decision.action === 4) { // Eat food

            decision.dir = parseInt(decision.dir);
            if (decision.dir === undefined || !_.contains(this.map.getPossibleDirections(), decision.dir)) {
                throw new Error("decision returned wrong direction code: " + decision.dir);
            }

            return {
                "isProcessed"   : false,
                "action"        : 4,
                "dir"           : decision.dir
            };

        } else {
            throw new Error("decision returned wrong action code: " + decision.action);
        }

    } catch (e) {
        agent.client.onNotification(1); // Notify agent that its decision has wrong format or params and will skip current tick
        throw e;
    }
};

Server.prototype.processDecisionMove = function (decision) {
    var movementMap = this.map.getDirectionsMap(),
        agent = decision.agent,
        relCoords, coords;

    relCoords = movementMap[decision.dir];
    coords = this.map.getXYByRel(agent.x, agent.y, relCoords.x, relCoords.y);
    if (agent.canMoveToTerrainType(this.map.getTerrainTypeByXY(coords.x, coords.y))) {
        agent.x = coords.x;
        agent.y = coords.y;

        this.log(agent.name + "(" + agent.id + ") [" + agent.health + "/" + agent.satiety + "] moved to x:" + agent.x + " y:" + agent.y);
    } else {
        agent.client.onNotification(21);
    }

    decision.isProcessed = true;
};

Server.prototype.processDecisionEatFood = function (decision) {
    var movementMap = this.map.getDirectionsMap(),
        agent = decision.agent,
        relCoords, coords, food;

    relCoords = movementMap[decision.dir];
    coords = this.map.getXYByRel(agent.x, agent.y, relCoords.x, relCoords.y);
    food = _.first(_.filter(this.getObjectsByXY(coords.x, coords.y), function (obj) {
        return obj.class === "food";
    }));

    if (!food) {
        agent.client.onNotification(41);
    } else if (agent.satiety === 10000) {
        agent.client.onNotification(42);
    } else {
        this.log(agent.name + "(" + agent.id + ") [" + agent.health + "/" + agent.satiety + "] ate food from x:" + coords.x + " y:" + coords.y
            + " satiety: (+" + food.richness + ")");

        agent.satiety = (agent.satiety + food.richness > 10000) ? 10000 : agent.satiety + food.richness;

        // Remove food
        this.objects.splice(this.objects.indexOf(food), 1);
    }

    decision.isProcessed = true;
};

Server.prototype.processDecisions = function (decisions) {
    var decision;

    for (var i in decisions) {
        decision = decisions[i];

        if (decision.action === 1) {
            this.processDecisionMove(decision);
        } else if (decision.action === 4) {
            this.processDecisionEatFood(decision);
        }
    }
};

Server.prototype.tick = function () {
    var decisions = [], decision;

    this.tickId++;
    if (!(this.tickId % 100)) {
        this.generateFood();
    }

    _.each(this.agents, function (agent) {
        // Recalculate agent's characteristics (health, etc.), remove died
        this.updateAgentStatus(agent);
    }, this);

    _.each(this.agents, function (agent) {
        try {

            // Skip if agent is died after the recalculation
            if (!agent.isAlive()) {
                return;
            }

            // Notify the agent that new tick has begun
            agent.client.onNewTick(this.getAgentStatus(agent));

            // Get and validate agent's decision
            decision = agent.client.decision();
            if (!decision) {
                // Skip if idle action
                return;
            }

            decision = this.sanitizeDecision(agent, decision);
            if (!decision.action) {
                // Skip if idle action
                return;
            }

            decision.agent = agent;

            // Collect all decisions
            decisions.push(decision);

        } catch (e) {
            this.log(agent.name + "(" + agent.id + ")" + " skipped on tick " + this.tickId + " because of error: " + e.message);
        }
    }, this);

    this.processDecisions(decisions);

    this.saveServerState();
    //this.printWorld();

    if (!this.agents.length) {
        this.log("All agents died");
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
        "log"     : []
    };

    state.agents = _.map(this.agents, function (agent) {
        return {
            "id"        : agent.id,
            "name"      : agent.name,
            "author"    : agent.author,
            "x"         : agent.x,
            "y"         : agent.y,
            "health"    : agent.health,
            "satiety"   : agent.satiety
        };
    });

    state.objects = _.map(this.objects, function (obj) {
        return {
            "class" : obj.class,
            "x"     : obj.x,
            "y"     : obj.y
        };
    });
    return state;
};

Server.prototype.saveServerState = function () {
    var state = this.getServerState();
    fs.writeFileSync("./var/state.json", JSON.stringify(state));
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

    this.log("Server started");

    this.initAgents();
    this.initFood();

    var self = this;
    setTimeout(function () {
        self.tick.call(self);
    }, this.tickInterval);
};

exports.Server = Server;
