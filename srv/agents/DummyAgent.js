var Constants = {};

var DummyAgent = function (args) {
    var status;
};

/**
 * Introduces agent to server. Should return simple object with the following members: name, author, email
 *
 * @returns {{}}
 */
DummyAgent.prototype.introduce = function () {
    return {
        "name"   : "Dummy",
        "author" : "Andrew Sidorenko",
        "email"  : "sidorenkobw@gmail.com"
    };
};

DummyAgent.prototype.init = function (constants) {
    Constants = constants;
};

/**
 * This method is called when new tick is started
 *
 * @param status    contains object with information about agent current status
 *
 * Status structure:
 * {
 *     "health" : 100, // 1 - 100
 *     "satiety" : 20, // 0 - 1000
 *     "environment" : {
 *          "map" : [
 *              [1,1,1,1,1,1,1,1,1],
 *              [1,1,1,1,1,1,1,1,1],
 *              [1,1,1,1,1,1,1,1,1],
 *              [1,1,1,1,1,1,1,1,1],
 *              [1,1,1,1,1,1,1,1,1],
 *              [1,1,1,1,1,1,1,1,1],
 *              [1,1,1,1,1,1,1,1,1],
 *              [1,1,1,1,1,1,1,1,1],
 *              [1,1,1,1,1,1,1,1,1]
 *          ],
 *          "objects" : [
 *              {
 *                  "class"     : "agent",
 *                  "health"    : 98,
 *                  "maxHealth" : 100,
 *                  "x"         : 0, // Coordinates relative to the agent (agent's location is in the center)
 *                  "y"         : 1  // Coordinates relative to the agent (agent's location is in the center)
 *              },
 *              {
 *                  "class" : "food",
 *                  "x" : 0, // Coordinates relative to the agent (agent's location is in the center)
 *                  "y" : 1  // Coordinates relative to the agent (agent's location is in the center)
 *              }
 *          ]
 *     }
 * }
 */
DummyAgent.prototype.onNewTick = function (status) {
    this.status = status;
};

/**
 * This will be called after onNewTick and should return object an like this:
 * {
 *     "action" : SOME_ACTION
 *     // options as other hash keys
 * }
 *
 * If this method returns something different from object or wrong object then the agent will skip current tick
 *
 * Actions:
 * 0 - stay idle (do nothing. the same as return null|false|0|...)
 * 1 - move
 * 2 - reserved
 * 3 - attack
 * 4 - eat food
 *
 * Movement, eat, attack options:
 * key: dir - movement direction
 * values:
 *  0 - don't move/eat from current cell/attack myself
 *  1 - go to N (North)
 *  2 - go to NE
 *  3 - go to E
 *  4 - go to SE
 *  5 - go to S
 *  6 - go to SW
 *  7 - go to W
 *  8 - go to NW
 *
 * Example:
 * return {
 *      "action" : 1
 *      "dir"    : 0
 * }; // go to the north
 *
 * @returns {{}}
 */
DummyAgent.prototype.decision = function () {
    var rel, movementMap = [];

    movementMap[0] = { "x" :  0, "y" :  0 }; // Idle
    movementMap[1] = { "x" :  0, "y" : -1 }; // N
    movementMap[2] = { "x" : +1, "y" : -1 }; // NE
    movementMap[3] = { "x" : +1, "y" :  0 }; // E
    movementMap[4] = { "x" : +1, "y" : +1 }; // SE
    movementMap[5] = { "x" :  0, "y" : +1 }; // S
    movementMap[6] = { "x" : -1, "y" : +1 }; // SW
    movementMap[7] = { "x" : -1, "y" :  0 }; // W
    movementMap[8] = { "x" : -1, "y" : -1 }; // NW

    // Scan surrounding cells (all directions) for food and make decision to eat it if found
    for (var dir in movementMap) {
        rel = movementMap[dir];
        for (var i in this.status.environment.objects) {
            var obj = this.status.environment.objects[i];
            if (obj.x === rel.x && obj.y === rel.y) {
                if (obj.class === "food") {
                    return {
                        "action" : Constants.ACTION_EAT,
                        "dir"    : dir
                    };
                }

                if (obj.class === "agent") {
                    return {
                        "action" : Constants.ACTION_ATTACK,
                        "dir"    : dir
                    };
                }
            }
        }
    }

    // Otherwise move in random direction
    return {
        "action" : Constants.ACTION_MOVE,
        "dir"    : Math.floor(Math.random() * 9)
    };
};

/**
 * Is called when agent performed wrong action or action is impossible
 *
 * @param notificationCode
 *
 * Notification codes:
 * 1 - decision error (wrong format or codes)
 * 21 - movement is impossible (can not move to terrain type)
 * 22 - movement is impossible (another agent is in the cell)
 * 41 - can't eat food (no food in the cell)
 * 42 - can't eat more food (your stomach is full)
 */
DummyAgent.prototype.onNotification = function (notificationCode) {

};

exports.agentClass = DummyAgent;
