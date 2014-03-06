/**
 * Created by kupreychik_af on 05.03.14.
 */

var _ = require('underscore');

// helper
var createClass = function(protoProps, staticProps) {
    var child = function() {
        this.initialize && this.initialize.apply(this, arguments);
    };

    _.isObject(protoProps)  && _.extend(child.prototype, protoProps);
    _.isObject(staticProps) && _.extend(child, staticProps);

    return child;
};

var sign = function(x) {
    return x == 0 ? 0 : Math.round(x/Math.abs(x));
};

var movementMap = [
    { "x" :  0, "y" :  0 }, // Idle
    { "x" :  0, "y" : -1 }, // N
    { "x" : +1, "y" : -1 }, // NE
    { "x" : +1, "y" :  0 }, // E
    { "x" : +1, "y" : +1 }, // SE
    { "x" :  0, "y" : +1 }, // S
    { "x" : -1, "y" : +1 }, // SW
    { "x" : -1, "y" :  0 }, // W
    { "x" : -1, "y" : -1 } // NW
];

var getMovement = function(toObj) {
    for (var dir =0; dir < movementMap.length; dir++) {
        var rel = movementMap[dir];
        if (sign(rel.x) == sign(toObj.x) && sign(rel.y) == sign(toObj.y)) {
            return dir;
        }
    }

    return 0;
};

// AGENT
var StraighOne = createClass({
    direction: 1,
    'introduce': function () {
        return {
            "name"   : "Straight One",
            "author" : "Andrey F. Kupreychik",
            "email"  : "foxel@quickfox.ru"
        };
    },

    'onNewTick': function (status) {
        this.status = status;
    },

    'decision': function () {
        // Scan surrounding cells (all directions) for food and make decision to eat it if found
        for (var i = 0; i < this.status.environment.objects.length; i++) {
            var obj = this.status.environment.objects[i];
            if (obj.class !== "food") {
                continue;
            }

            return {
                "action" : (Math.abs(obj.x) <= 1 && Math.abs(obj.y) <= 1) ? 4 : 1,
                "dir"    : getMovement(obj)
            };
        }
        return {
            "action" : 1,
            "dir"    : this.direction
        };
    },

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
    'onNotification': function (notificationCode) {
        this.direction = Math.round(Math.random()*movementMap.length) || 1;
    }
});

exports.agentClass = StraighOne;
