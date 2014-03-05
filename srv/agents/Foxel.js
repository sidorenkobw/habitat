/**
 * Created by kupreychik_af on 05.03.14.
 */

var _ = require('underscore');

// helper
var createClass = function(proto) {
    var child = function() {
        this.initialize && this.initialize.apply(this, arguments);
    };

    _.isObject(proto) && _.extend(child.prototype, proto);

    return child;
};

var sign = function(x) {
    return x == 0 ? 0 : Math.round(x/Math.abs(x));
}

// CLASSES //
// memory store
var InfiniteList = createClass({
    /** @type {Array} */
    _storage: null,
    /** @type {Number} */
    _shift: 0,
    /** @constructs */
    'initialize': function() {
        this._storage = [];
    },
    'set': function(idx, val) {
        if (idx < 0) {
            while (this._shift < -idx) {
                this._storage.unshift(null);
                this._shift++;
            }
        }
        this._storage[idx+this._shift] = val;
        return this;
    },
    'get': function(idx) {
        if (idx < -this._shift) {
            return undefined;
        }
        return this._storage[idx+this._shift];
    },
    'push': function() {
        return this._storage.push.apply(this._storage, arguments);
    },
    'unshift': function() {
        this._shift+= arguments.length;
        return this._storage.unshift.apply(this._storage, arguments);
    },
    'each': function(callback) {
        _.each(this._storage, function(item, idx) {
            callback(item, idx - this._shift);
        }, this);
        return this;
    }
});

var MapCell = createClass({
    blocked: false,
    lastSeen: 0,
    /** @constructs */
    'initialize': function(obj) {
        _.extend(this, obj);
    }
});

var InfiniteMap = createClass({
    /** @type {InfiniteList} */
    _rows: null,
    _dims: null,
    /** @constructs */
    'initialize': function() {
        this._rows = new InfiniteList();
        this._dims = {
            bx: 0, tx: 0,
            by: 0, ty: 0
        }
    },
    /**
     * @param x {Number}
     * @param y {Number}
     * @return {MapCell}
     */
    'getCell': function(x, y) {
        var row = this._rows.get(y) || new InfiniteList();
        return row.get(x);
    },
    /**
     * @param x {Number}
     * @param y {Number}
     * @param cell {MapCell}
     */
    'setCell': function(x, y, cell) {
        this._rows.get(y) || this._rows.set(y, new InfiniteList());
        this._rows.get(y).set(x, cell);

        if (x > this._dims.tx) {
            this._dims.tx = x;
        } else if (x < this._dims.bx) {
            this._dims.bx = x;
        }
        if (y > this._dims.ty) {
            this._dims.ty = y;
        } else if (y < this._dims.by) {
            this._dims.by = y;
        }
        return this;
    },
    'each': function(callback) {
        this._rows.each(function(row, y) {
            row && row.each(function(cell, x) {
                cell && callback(cell, x, y);
            });
        });
        return this;
    },
    'toString': function() {
        var s = '';
        for (var i = this._dims.by; i <= this._dims.ty; i++) {
            for (var j = this._dims.bx; j <= this._dims.tx; j++) {
                var cell = this.getCell(j, i);
                if (cell) {
                    s+= cell.blocked ? 'X' : ' ';
                } else {
                    s+= '?';
                }
            }
            s+= "\n";
        }

        return s;
    },
    'getNearestUnknownCoords': function(pos) {
        var posDiff = Infinity, centerDiff = Infinity, tx = pos.x, ty = pos.y;
        for (var y = this._dims.by-1; y <= this._dims.ty+1; y++) {
            for (var x = this._dims.bx-1; x <= this._dims.tx+1; x++) {
                var cell = this.getCell(x, y);
                if (!cell) {
                    var newPosDiff = Math.sqrt(Math.pow(pos.x - x, 2) + Math.pow(pos.y - y, 2));
                    var newCenterDiff = Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2));
                    if (newCenterDiff < centerDiff || (newCenterDiff < centerDiff+1 && newPosDiff <= posDiff)) {
                        tx = x; ty = y;
                        posDiff = newPosDiff;
                        centerDiff = newCenterDiff;
                    }
                }
            }
        }

        return {x: tx, y: ty};
    }
});

// todo: remove
var terrainMovements = {
    0 : false,
    1 : true,
    2 : true,
    3 : true,
    4 : false,
    5 : true,
    6 : true,
    7 : true,
    8 : true,
    9 : true,
    10 : true,
    11 : true,
    12 : true,
    13 : false,
    14 : true,
    15 : true,
    16 : true,
    17 : true,
    18 : true,
    19 : false,
    20 : false,
    21 : false,
    22 : false,
    23 : false,
    24 : false,
    25 : false,
    26 : false,
    27 : false,
    28 : false,
    29 : false,
    30 : false,
    31 : false,
    32 : false,
    33 : false,
    34 : false,
    35 : true,
    36 : false,
    37 : false,
    38 : false,
    39 : false
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
        rel = movementMap[dir];
        if (sign(rel.x) == sign(toObj.x) && sign(rel.y) == sign(toObj.y)) {
            return dir;
        }
    }

    return 0;
};

// AGENT
var FoxelAgent = createClass({
    status: null,
    memMap: null,
    myPos: null,
    oldPos: null,

    /** @constructs */
    'initialize': function() {
        this.status = {};
        this.memMap = new InfiniteMap();
        this.myPos = {x: 0, y: 0};
        this.oldPos = {x: 0, y: 0};
    },

    'introduce': function () {
        return {
            "name"   : "Foxel",
            "author" : "Andrey F. Kupreychik",
            "email"  : "foxel@quickfox.ru"
        };
    },

    'onNewTick': function (status) {
        _.extend(this.oldPos, this.myPos);
        this.memMap.each(function(cell) {
            cell.lastSeen++;
        });

        status.environment.map.forEach(function(col, y) {
            col.forEach(function(c, x) {
                this.memMap.setCell(x - 4 + this.myPos.x, y - 4 + this.myPos.y, new MapCell({
                    blocked: !terrainMovements[c]
                }));
            }, this)
        }, this);

        this.status = status;

//        console.log(this.status);
        console.log(this.memMap.toString());
    },

    'decision': function () {
        var rel;

        // default movement
        var myTarget = this.memMap.getNearestUnknownCoords(this.myPos);
        myTarget.x-= this.myPos.x;
        myTarget.y-= this.myPos.y;
        var direction = getMovement(myTarget);

        // Scan surrounding cells (all directions) for food and make decision to eat it if found
        for (var i in this.status.environment.objects) {
            var obj = this.status.environment.objects[i];
            if (obj.class !== "food") {
                continue;
            }

            direction = getMovement(obj);

            if (Math.abs(obj.x) <= 1 && Math.abs(obj.y) <= 1) {
                return {
                    "action" : 4,
                    "dir"    : direction
                };
            }
        }

        var myStep, myStepCell;

        while (
            (myStep = movementMap[direction]) &&
            (myStepCell = this.memMap.getCell(this.myPos.x + myStep.x, this.myPos.y + myStep.y)) &&
            myStepCell.blocked
        ) {
            direction = Math.floor(Math.random()*movementMap.length);
        }

        // Otherwise move in desired direction
        this.myPos.x += movementMap[direction].x;
        this.myPos.y += movementMap[direction].y;
        return {
            "action" : 1,
            "dir"    : direction
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
        _.extend(this.myPos, this.oldPos);
    }
});

exports.agentClass = FoxelAgent;
