var util  = require("util"),
    Agent = require("./Agent"),
    fs    = require("fs");

var Server = function (agents, map) {
    this.agentsClasses  = agents;
    this.agents         = [];
    this.tickId         = 0;
    this.map            = map;
    this.lastAgentId    = 0;
    this.tickInterval   = 1000;
};

Server.prototype.stop = function () {
    util.log("Server stopped");
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

    agent           = Agent.new();
    agent.id        = ++this.lastAgentId;
    agent.client    = agentClient;
    agent.name      = agentIntroduction.name;
    agent.author    = agentIntroduction.author;

    do {
        coords = this.getRandomLocation();
    } while (this.getAgentByXY(coords.x, coords.y) || !agent.canMoveToTerrainType(this.map.getTerrainTypeByXY(coords.x, coords.y)));

    agent.x = coords.x;
    agent.y = coords.y;

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
            util.log("Agent(" + i + ") was not created because of error: " + e.message);
            continue;
        }

        util.log("Agent(" + agent.id + ") " + agent.name + " was born at x:" + agent.x + " y:" + agent.y);
        this.agents.push(agent);
    }
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

Server.prototype.getEnvironmentForAgent = function(agent)
{
    var radius = 2, env, coords, terrain, row, tmpAgent, agentObj, shift_x, shift_y;
    env = {
        "map"       : [],
        "objects"   : []
    };

    for (shift_y = -radius ; shift_y < radius + 1 ; shift_y++) {
        row = [];

        for (shift_x = -radius ; shift_x < radius + 1 ; shift_x++) {
            coords = this.map.getRelXY(agent.x, agent.y, shift_x, shift_y);
            terrain = this.map.getTerrainTypeByXY(coords.x, coords.y);

            tmpAgent = this.getAgentByXY(coords.x, coords.y);
            
            // Exclude current agents from agents list
            if (tmpAgent && tmpAgent !== agent) {
                agentObj = {
                    "class" : "agent",
                    "x"     : shift_x,
                    "y"     : shift_y
                };

                env.objects.push(agentObj);

//                // TODO: remove this view hack:
//                terrain = tmpAgent.id == 1 ? "@" : "#";
            }

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

    if (agent.id == 1) {
        console.log(" ");
        console.log(status.environment);
    }
    return status;
};

Server.prototype.updateAgentStatus = function (agent) {
    if (agent.satiety == 0) {
        agent.health = agent.health - 1;
    } else {
        agent.satiety--;
    }

    if (!agent.isAlive()) {
        util.log("Agent(" + agent.id + ") " + agent.name + " has died at x:" + agent.x + " y:" + agent.y + " on tick " + this.tickId);
        this.agents.splice(this.agents.indexOf(agent), 1);
    }
};

Server.prototype.sanitizeDecision = function (agent, decision) {
    try {
        if (decision !== Object(decision)) {
            throw new Error("decision returned not an object");
        }

        if (decision.action === 0) { // Idle

            return {
                "isProcessed" : false,
                "action" : 0
            };

        } else if (decision.action === 1) { // Move

            if (decision.dir === undefined || decision.dir < 0 || decision.dir > 7) {
                throw new Error("decision returned wrong direction code: " + decision.dir);
            }

            return {
                "isProcessed" : false,
                "action" : 1,
                "dir"    : parseInt(decision.dir)
            };

        } else if (decision.action === 2) { // Reserved

            throw new Error("action code: " + decision.action + " is reserved");

        } else if (decision.action === 3) { // Attack

            // TODO implement
            throw new Error("action code: " + decision.action + " is not implemented");
//            return {
//            "isProcessed" : false,
//                "action" : 3
//            };

        } else {
            throw new Error("decision returned wrong action code: " + decision.action);
        }

    } catch (e) {
        agent.client.onNotification(1); // Notify agent that its decision has wrong format or params and will skip current tick
        throw e;
    }
};

Server.prototype.processDecisionMove = function (decision) {
    var movementMap = [], relCoords, coords;

    movementMap[0] = { "x" :  0, "y" : -1 }; // N
    movementMap[1] = { "x" : +1, "y" : -1 }; // NE
    movementMap[2] = { "x" : +1, "y" :  0 }; // E
    movementMap[3] = { "x" : +1, "y" : +1 }; // SE
    movementMap[4] = { "x" :  0, "y" : +1 }; // S
    movementMap[5] = { "x" : -1, "y" : +1 }; // SW
    movementMap[6] = { "x" : -1, "y" :  0 }; // W
    movementMap[7] = { "x" : -1, "y" : -1 }; // NW

    relCoords = movementMap[decision.dir];
    coords = this.map.getRelXY(decision.agent.x, decision.agent.y, relCoords.x, relCoords.y);
    if (decision.agent.canMoveToTerrainType(this.map.getTerrainTypeByXY(coords.x, coords.y))) {
        decision.agent.x = coords.x;
        decision.agent.y = coords.y;
    } else {
        decision.agent.client.onNotification(21);
    }

    decision.isProcessed = true;
};

Server.prototype.processDecisions = function (decisions) {
    var decision;

    for (var i in decisions) {
        decision = decisions[i];

        if (decision.action === 1) {
            this.processDecisionMove(decision);
        }
    }
};

Server.prototype.tick = function () {
    var agent, decisions = [], decision;

    this.tickId++;

    for (var i in this.agents) {
        agent = this.agents[i];

        try {
            // Recalculate agent's characteristics (health, etc.)
            this.updateAgentStatus(agent);

            // Skip if agent is died after the recalculation
            if (!agent.isAlive()) {
                continue;
            }

            // Notify the agent that new tick has begun
            agent.client.onNewTick(this.getAgentStatus(agent));

            // Get and validate agent's decision
            decision = agent.client.decision();
            if (!decision) {
                // Skip if idle action
                continue;
            }

            decision = this.sanitizeDecision(agent, decision);
            if (!decision.action) {
                // Skip if idle action
                continue;
            }

            decision.agent = agent;

            // Collect all decisions
            decisions.push(decision);

        } catch (e) {
            util.log("Agent(" + agent.id + ") " + agent.name + " skipped on tick " + this.tickId + " because of error: " + e.message);
        }
    }

    this.processDecisions(decisions);

    this.saveServerState();

    if (!this.agents.length) {
        util.log("All agents died");
        this.stop();
    }

    var self = this;
    setTimeout(function () {
        self.tick.call(self);
    }, this.tickInterval);
};

Server.prototype.saveServerState = function () {
    var agent, state = {
        "tickId" : this.tickId,
        "map"    : {
            "width" : this.map.width,
            "height" : this.map.health,
            "map" : this.map.map
        },
        "agents" : [],
        "log"    : []
    };

    for (var i in this.agents) {
        agent = this.agents[i];
        state.agents.push({
            "id"        : agent.id,
            "name"      : agent.name,
            "author"    : agent.author,
            "x"         : agent.x,
            "y"         : agent.y,
            "health"    : agent.health,
            "satiety"   : agent.satiety
        });
    }

    fs.writeFileSync("./var/state.json", JSON.stringify(state));
};

Server.prototype.run = function () {
    util.log("Server started");

    this.initAgents();

    var self = this;
    setTimeout(function () {
        self.tick.call(self);
    }, this.tickInterval);
};

exports.Server = Server;
