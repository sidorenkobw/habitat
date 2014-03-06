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
    this.tickInterval   = 300;
    this.objects        = [];
    this.displayLogs    = true;
};

Server.prototype.initLog = function () {
    fs.writeFileSync("./var/log", "");
};

Server.prototype.log = function (msg, level) {
    if (this.displayLogs) {
        if (level < 3) {
            util.log(msg);
        }
    }
    fs.appendFileSync("./var/log", this.tickId + " " + msg + "\n");
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

Server.prototype.encapsulatedCall = function (client, method, args) {
    return client[method].apply(client, args);
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
    if (typeof agentClient.init === "function") {
        this.encapsulatedCall(agentClient, "init", [Constants]);
    }

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
    } while (!_.contains([1, 9, 10, 11, 12, 15, 16, 17, 18], this.map.getTerrainTypeByXY(coords.x, coords.y)));

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
    agent.satiety = agent.satiety - 1 < 0 ? 0 : agent.satiety - 1;

    if (agent.satiety > Math.floor(agent.maxSatiety * 0.8)) {
        agent.health = agent.health + 1 > agent.maxHealth ? agent.maxHealth : agent.health + 1;
    } else if (agent.satiety == 0) {
        agent.health = agent.health - 1;
    }

    if (!agent.isAlive()) {
        this.log(agent.name + "(" + agent.id + ") [" + agent.health + "/" + agent.satiety +  "] has died at x:" + agent.x + " y:" + agent.y + " on tick " + this.tickId, 1);

        // Create food instead of died agent
        var food = Food.create(1000);
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
        this.encapsulatedCall(agent.client, "onNotification", [1]); // Notify agent that its decision has wrong format or params and will skip current tick
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

    if (tmpAgent && tmpAgent !== agent) {
        this.log(agent.name + "(" + agent.id + ") [" + agent.health + "/" + agent.satiety + "] was notified with (22)", 4);
        this.encapsulatedCall(agent.client, "onNotification", [22]);
    } else {
        if (agent.canMoveToTerrainType(this.map.getTerrainTypeByXY(coords.x, coords.y))) {
            agent.x = coords.x;
            agent.y = coords.y;

            this.log(agent.name + "(" + agent.id + ") [" + agent.health + "/" + agent.satiety + "] moved to x:" + agent.x + " y:" + agent.y + " dir:" + decision.dir, 2);
        } else {
            this.log(agent.name + "(" + agent.id + ") [" + agent.health + "/" + agent.satiety + "] was notified with (21)", 4);
            this.encapsulatedCall(agent.client, "onNotification", [21]);
        }
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
        this.log(agent.name + "(" + agent.id + ") [" + agent.health + "/" + agent.satiety + "] was notified with (41)", 4);
        this.encapsulatedCall(agent.client, "onNotification", [41]);
    } else if (agent.satiety === agent.maxSatiety) {
        this.log(agent.name + "(" + agent.id + ") [" + agent.health + "/" + agent.satiety + "] was notified with (42)", 4);
        this.encapsulatedCall(agent.client, "onNotification", [42]);
    } else {
        this.log(agent.name + "(" + agent.id + ") [" + agent.health + "/" + agent.satiety + "] ate food from x:" + coords.x + " y:" + coords.y
            + " satiety: (+" + food.richness + ")", 2);

        agent.satiety = (agent.satiety + food.richness > agent.maxSatiety) ? agent.maxSatiety : agent.satiety + food.richness;

        // Remove food
        this.objects.splice(this.objects.indexOf(food), 1);
    }

    decision.isProcessed = true;
};

Server.prototype.processDecisionAttack = function (decision) {
    var movementMap = this.map.getDirectionsMap(),
        agent = decision.agent,
        relCoords, coords, tmpAgent, damage;

    relCoords = movementMap[decision.dir];
    coords = this.map.getXYByRel(agent.x, agent.y, relCoords.x, relCoords.y);
    tmpAgent = this.getAgentByXY(coords.x, coords.y);

    if (!tmpAgent) {
        this.log(agent.name + "(" + agent.id + ") [" + agent.health + "/" + agent.satiety + "] was notified with (" + Constants.ERROR_ATTACK_NO_AGENT + ")", 4);
        this.encapsulatedCall(agent.client, "onNotification", [Constants.ERROR_ATTACK_NO_AGENT]);
    } else {
        damage = Math.floor(Math.random() * 3);
        if (agent.satiety > Math.floor(agent.maxSatiety * 0.2) && agent.satiety < Math.floor(agent.maxSatiety * 0.9)) {
            damage += 2;
        }

        tmpAgent.health -= damage;

        this.log(agent.name + "(" + agent.id + ") [" + agent.health + "/" + agent.satiety + "] attacked: " +
            tmpAgent.name + "(" + tmpAgent.id + ") [" + tmpAgent.health + "/" + tmpAgent.satiety + "] on x:" +
            coords.x + " y:" + coords.y + " with damage: " + damage, 2);
    }

    decision.isProcessed = true;
};

Server.prototype.processDecision = function (decision) {
    if (decision.action === Constants.ACTION_MOVE) {
        this.processDecisionMove(decision);
    } else if (decision.action === Constants.ACTION_ATTACK) {
        this.processDecisionAttack(decision);
    } else if (decision.action === Constants.ACTION_EAT) {
        this.processDecisionEatFood(decision);
    }
};

Server.prototype.tick = function () {
    var agents = _.shuffle(this.agents);

    this.tickId++;

    if (!(this.tickId % 100)) {
        this.generateFood();
    }

    _.each(agents, function (agent) {
        try {

            // Notify the agent that new tick has begun
            this.encapsulatedCall(agent.client, "onNewTick", [this.getAgentStatus(agent)]);

            // Get and validate agent's decision
            var decision = this.encapsulatedCall(agent.client, "decision", [this.getAgentStatus(agent)]);

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
        "log"     : []
    };

    state.agents = _.map(this.agents, function (agent) {
        return {
            "id"            : agent.id,
            "name"          : agent.name,
            "author"        : agent.author,
            "x"             : agent.x,
            "y"             : agent.y,
            "health"        : agent.health,
            "maxHealth"     : agent.maxHealth,
            "satiety"       : agent.satiety,
            "maxSatiety"    : agent.maxSatiety
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

    this.log("Server started", 1);

    this.initAgents();
    this.initFood();

    var self = this;
    setTimeout(function () {
        self.tick.call(self);
    }, this.tickInterval);
};

exports.Server = Server;
