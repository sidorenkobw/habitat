var DummyAgent = function () {

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

/**
 * This method is called when new tick is started
 *
 * @param status    contains object with information about agent current status
 *
 * Status structure:
 * {
 *     "health" : 100, // 0 - 100
 *     "satiety" : 20, // 0 - 10000
 *     "environment" : {
 *          "map" : [
 *              [1,1,1,1,1],
 *              [1,1,1,1,1],
 *              [1,1,1,1,1],
 *              [1,1,1,1,1],
 *              [1,1,1,1,1],
 *          ],
 *          "objects" : [
 *              {
 *                  "class" : "agent,
 *                  "x" : 0, // Coordinates relative to the agent (agent's location is in the center)
 *                  "y" : 1  // Coordinates relative to the agent (agent's location is in the center)
 *              }
 *          ]
 *     }
 * }
 */
DummyAgent.prototype.onNewTick = function (status) {

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
 *
 * Movement options:
 * key: dir - movement direction
 * values:
 *  0 - go to N (North)
 *  1 - go to NE
 *  2 - go to E
 *  3 - go to SE
 *  4 - go to S
 *  5 - go to SW
 *  6 - go to W
 *  7 - go to NW
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
    return {
        "action" : 1,
        "dir"    : Math.floor(Math.random() * 8)
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
 * TODO
 */
DummyAgent.prototype.onNotification = function (notificationCode) {

};

exports.agentClass = DummyAgent;
