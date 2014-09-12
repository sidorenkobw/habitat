var util = require("util"),
    _ = require("underscore"),
    fs = require("fs");

var World = require("./World"),
    Agent = require("./Agent"),
    Mob = require("./world/object/Mob").Mob,
    Food = require("./world/object/Food"),
    Constants = require("./constants");

var Server = function (agents, map) {
    this.agentsClasses = agents;
    this.agents = [];
    this.tickId = 0;
    this.tickInterval = 1000;
    this.displayLogs = true;
    this.world = World.create(map);

    this.agentFirstNames = ['Alice','Alex','Amelia','Bob','Cynthia','Celesta','Daria','Dorothy','Dan','Evan','Earl','Greg','Hanna','Ivan','Jack','John','Jane','Kim','Lisa','Luke','Mary','Max','Nino','Oleg','Olga','Pat','Queen','Rose','Rick','Stan','Tanya','Ted','Urist','Vix','Wendy','Yan','Zed'];
    this._names = [];
};

Server.prototype.initLog = function () {
//    fs.writeFileSync("../var/log", "");
};

Server.prototype.log = function (msg, level) {
    if (this.displayLogs) {
        if (level < 2) {
            util.log('Tick ' + this.tickId + ': ' + msg);
        }
    }
    //fs.appendFileSync("../var/log", this.tickId + " " + msg + "\n");
};

Server.prototype.stop = function () {
    this.log("Server stopped", 1);
    process.exit();
};

Server.prototype.instantiateAgent = function (agentData) {
    var agentModule, params, agent, agentClient, agentIntroduction;
    agentModule = agentData.module;
    params = agentData.params;

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
    if (this._names.length == 0) {
        for (var i = 0, l = this.agentFirstNames.length; i < l; i++) {
            this._names.push(this.agentFirstNames[i]);
        }
        _.shuffle(this._names);
    }
    var firstName = this._names.pop();

    agent = Agent.create();
    agent.class = agentData.class;
    agent.client = agentClient;
    agent.name = agentIntroduction.name;
    agent.author = agentIntroduction.author;
    var mob = this.world.spawnMob({
        name: firstName,
        subClass: 'agent',
        family: agentData.class,
        client: agentClient
    });
    mob.lifeTime = Constants.balance.AGENT_AGE_TEEN + Math.round(Math.random() * 20 - 5);
    if (typeof agentClient.init === "function") {
        agentClient.init(Constants);
    }

    return mob;
};

Server.prototype.initAgents = function (resetAgents) {
    if (resetAgents) {
        this.agents = [];
    }

    var agent, mob;

    for (var i = 0, l = this.agentsClasses.length; i < l; i++) {
        agent = this.agentsClasses[i];
        try {
            mob = this.instantiateAgent(agent);
        } catch (e) {
            this.log("Agent(" + i + ") was not created because of error: " + e.message, 1);
            continue;
        }

        this.log(mob.getName(true) + " was born at x:" + mob.x + " y:" + mob.y, 1);
        this.agents.push(mob);


        // Add food for the newborn agent
        var food = Food.create(Math.round(mob.maxSatiety / 2));
        this.world.spawnObject(food, {x:mob.x, y:mob.y});
        this.log("Food with richness: " + food.richness + " was generated at x:" + food.x + " y:" + food.y, 2);

    }
};

Server.prototype.generateFood = function () {
    var food, coords;

    do {
        coords = this.world.map.getRandomLocation({'class':'land'});
    } while (!_.contains([1, 2, 3], this.world.map.getTerrainTypeByXY(coords.x, coords.y)));

    food = Food.create(Math.floor(Math.random() * 300) + 100);
    this.world.spawnObject(food, coords);
    this.log("Food with richness: " + food.richness + " was generated at x:" + food.x + " y:" + food.y, 2);
};

Server.prototype.initFood = function () {
    this.generateFood();
};


Server.prototype.tick = function () {
    //var agents = _.shuffle(this.agents);

    this.tickId++;

    var freeFoodFrequency = 350 / ((Constants.balance.AGENT_MOVE_COST_STRAIGHT + Constants.balance.AGENT_MOVE_COST_DIAGONAL) / 2 * this.agents.length);
    if (!(this.tickId % parseInt(freeFoodFrequency))) {
        this.generateFood();
    }
//    _.each(this.agents, function (agent) {
//        try {
//            // Notify the agent that new tick has begun
//            agent.client.onNewTick(this.getAgentStatus(agent));
//
//            // Get and validate agent's decision
//            var decision = agent.client.decision();
//
//            decision = this.sanitizeDecision(agent, decision);
//            decision.agent = agent;
//
//        } catch (e) {
//            this.log(agent.getName() + " skipped because of error: " + e.message, 1);
//            decision = this.getEmptyDecision();
//        }
//
//        var mobName = agent.getName() + " [" + agent.mob.health + "/" + agent.mob.satiety + "]";
//        var result = this.world.registerAction(agent.mob.id, decision.action, decision);
//        if (result) {
//            switch (result) {
//                case Constants.ERROR_ATTACK_NO_AGENT:
//                    this.log(mobName + " can't attack (no agent in cell)", 4);
//                    break;
//                case Constants.ERROR_ATTACK_TOO_YOUNG:
//                    this.log(mobName + " can't attack (too young)", 4);
//                    break;
//                case Constants.ERROR_MOVE_IMPASSABLE_TERRAIN:
//                    this.log(mobName + " can't move (impassible terrain)", 4);
//                    break;
//                case Constants.ERROR_MOVE_CELL_OCCUPIED:
//                    this.log(mobName + " can't move (cell is occupied)", 4);
//                    break;
//                case Constants.ERROR_EAT_NO_FOOD:
//                    this.log(mobName + " can't eat food (no food in cell)", 4);
//                    break;
//                case Constants.ERROR_EAT_STOMACH_FULL:
//                    this.log(mobName + " can't eat food (stomach is full)", 4);
//                    break;
//                default:
//                    break;
//            }
//            agent.client.onNotification(result);
//        } else {
//            switch(decision.action) {
//                case Constants.ACTION_IDLE:
//                    break;
//                case Constants.ACTION_MOVE:
//                    this.log(mobName + " moved to x:" + agent.mob.x + " y:" + agent.mob.y + " dir:" + decision.dir, 2);
//                    break;
//                case Constants.ACTION_EAT:
//                    this.log(mobName + " ate food", 2);
//                    break;
//                case Constants.ACTION_ATTACK:
//                    this.log(mobName + " attacked mob", 2);
//                    break;
//                default:
//                    break;
//            }
//        }
//
//    }, this);
//    this.mobActions = this.world.mobActionsLog;

    this.world.tick();

    // Check died agents
    _.each(this.agents, function (mob) {
        if (!mob.isAlive()) {
            var deathReason = (mob.satiety <= 0 ? 'starvation' : (mob.lifeTime >= Constants.balance.AGENT_AGE_DEATH ? 'oldness' : 'wounds'));
            this.log(mob.getName() + " has died (" + deathReason + ") at x:" + mob.x + " y:" + mob.y, 1);
            // Remove agent from server
            this.agents.splice(this.agents.indexOf(mob), 1);
        }
    }, this);

    if (!(this.tickId % 50)) {
        this.saveServerState();
    }

    this.saveServerState();
    //this.printWorld();

    if (this.agents.length == 1) {
        this.log("The one who survived: " + this.agents[0].getName(), 1);
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

Server.prototype.getServerState = function () {
    var state = {
        "tickId": this.tickId,
        "map": this.world.map.toJson(),
        "mobs": [],
        "objects": [],
        "log": this.world.mobLastActions
    };

    state.mobs = _.map(this.world.getObjects({class:'mob'}), function (mob) {
        return mob.toJson();
    });

    state.objects = _.map(this.world.getObjects({classNot:'mob'}), function (obj) {
        return obj.toJson();
    });
    return state;
};

Server.prototype.saveServerState = function () {
    var state = this.getServerState();
//    fs.writeFileSync("../var/state.json", JSON.stringify(state));
};

Server.prototype.run = function () {
    this.initLog();

    this.log("Server started", 1);

    this.initAgents(true);
    this.initFood();

    this.tick();
};

exports.Server = Server;
