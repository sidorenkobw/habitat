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

/** @class */
var Pos = createClass({
    x: 0,
    y: 0,
    /** @constructs */
    initialize: function(x, y) {
        this.x = x || 0;
        this.y = y || 0;
    }
});

// CLASSES //
// memory store
/** @class */
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

/** @class */
var MapCell = createClass({
    blocked: false,
    lastSeen: 0,
    /** @constructs */
    'initialize': function(obj) {
        _.extend(this, obj);
    }
});

/** @class */
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
     * @return
     */
    'get': function(x, y) {
        var row = this._rows.get(y) || new InfiniteList();
        return row.get(x);
    },
    'getDims': function() {
        return _.clone(this._dims);
    },
    /**
     * @param x {Number}
     * @param y {Number}
     * @param cell
     */
    'set': function(x, y, cell) {
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
        var rel = movementMap[dir];
        if (sign(rel.x) == sign(toObj.x) && sign(rel.y) == sign(toObj.y)) {
            return dir;
        }
    }

    return 0;
};

var getDistance = function(pos1, pos2) {
    return Math.sqrt(Math.pow(pos1.x - pos2.x, 2) + Math.pow(pos1.y - pos2.y, 2));
};

var aStarNeightbours = function(map, x, y) {
//    if (!map.get(x, y)) {
//        return [];
//    }

    return _.chain(movementMap)
        .sortBy(function(el) {
            return Math.abs(el.x) + Math.abs(el.y);
        })
        .map(function(move) {
            if (!move.x && !move.y) {
                return null;
            }
            var cx = move.x + x;
            var cy = move.y + y;
            var dims = map.getDims();
            if (cx > dims.tx + 1 || cy > dims.ty + 1 || cx < dims.bx - 1 || cy < dims.by - 1) {
                return null;
            }

            var cell = map.get(cx, cy);
            return (!cell || !cell.blocked)
                ? new Pos(cx, cy)
                : null;
        })
        .filter(function(el) {
            return !!el;
        })
        .value();
};
var aStarAlgo = function(map, sPos, tPos) {
    var sx = sPos.x, sy = sPos.y, tx = tPos.x, ty = tPos.y;
    var parentMap = new InfiniteMap();
    var queue = [new Pos(sx, sy)];
    parentMap.set(sx, sy, true);

    while (queue.length) {
        var node = queue.shift();
        var neightbours = aStarNeightbours(map, node.x, node.y);
        for (var i = 0; i < neightbours.length; i++) {
            var nnode = neightbours[i];
            if (parentMap.get(nnode.x, nnode.y)) {
                continue;
            }
            parentMap.set(nnode.x, nnode.y, node);
            if (nnode.x == tx && nnode.y == ty) {
                var tnode = nnode;
                var path = [tnode];
                while (tnode = parentMap.get(tnode.x, tnode.y)) {
                    if (tnode === true) {
                        break;
                    }
                    path.push(tnode);
                }

                return path.reverse();
            }
            queue.push(nnode);
        }
    }

    return [];
};

// AGENT
var FoxelAgent = createClass({
    status: null,
    memMap: null,
    myPos: null,
    myPath: null,
    oldPos: null,
    options: null,
    memFood: null,
    hungry: false,

    forgetAfter: 300,
    hungerThreshold: 0.7,
    satietyThreshold: 0.95,

    'getNearestUnknownCoords': function(pos) {
        var bestDistance = Infinity,
            tx = pos.x,
            ty = pos.y,
            center = this.getKnownCenter(),
            dims = this.memMap.getDims();

        for (var y = dims.by-1; y <= dims.ty+1; y++) {
            for (var x = dims.bx-1; x <= dims.tx+1; x++) {
                var cell = this.memMap.get(x, y);
                if (!cell || (!cell.blocked && cell.lastSeen > this.forgetAfter)) {
                    var newDistance = getDistance(center, new Pos(x, y)) + getDistance(pos, new Pos(x, y))/2;
                    if (newDistance <= bestDistance) {
                        tx = x; ty = y;
                        bestDistance = newDistance;
                    }
                }
            }
        }

        return new Pos(tx, ty);
    },
    'getKnownCenter': function() {
        var xa = 0, ya = 0, cnt = 0,
            dims = this.memMap.getDims();
        for (var y = dims.by-1; y <= dims.ty+1; y++) {
            for (var x = dims.bx-1; x <= dims.tx+1; x++) {
                var cell = this.memMap.get(x, y);
                if (cell && cell.lastSeen > this.forgetAfter) {
                    xa += x;
                    ya += y;
                    cnt++;
                }
            }
        }

        return (cnt > 0)
            ? new Pos(Math.round(xa/cnt), Math.round(ya/cnt))
            : new Pos();
    },
    'getMapString': function() {
        var s = '',
            dims = this.memMap.getDims();
        for (var y = dims.by; y <= dims.ty; y++) {
            for (var x = dims.bx; x <= dims.tx; x++) {
                if (!!_.find(this.myPath, function(pos) {
                    return pos.x == x && pos.y == y;
                })) {
                    s+= '*';
                    continue;
                }

                if (!!_.find(this.memFood, function(pos) {
                    return pos.x == x && pos.y == y;
                })) {
                    s+= '@';
                    continue;
                }

                if (x == this.myPos.x && y == this.myPos.y) {
                    s+= '+';
                    continue;
                }
                var cell = this.memMap.get(x, y);
                if (cell) {
                    if (cell.lastSeen > this.forgetAfter) {
                        s+= cell.blocked ? '"' : '.';
                    } else {
                        s+= cell.blocked ? 'X' : ' ';
                    }
                } else {
                    s+= '?';
                }
            }
            s+= "\n";
        }

        return s;
    },

    /** @constructs */
    'initialize': function() {
        this.status = {};
        this.memMap = new InfiniteMap();
        this.myPos  = new Pos();
        this.oldPos = new Pos();
        this.myPath = [];
        this.memFood = [];
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
                this.memMap.set(x - 4 + this.myPos.x, y - 4 + this.myPos.y, new MapCell({
                    blocked: !terrainMovements[c]
                }));
            }, this)
        }, this);

        this.memFood = _.filter(this.memFood, function(pos) {
            return Math.abs(pos.x - this.myPos.x) > 4 || Math.abs(pos.y - this.myPos.y) > 4;
        }, this);

//        status.environment.objects.forEach(function(obj) {
//            if (obj.class !== "food") {
//                this.memMap.get(obj.x, obj.y).blocked = true;
//            }
//        }, this);

        status.environment.objects.forEach(function(obj) {
            if (obj.class == "food") {
                this.memFood.push(new Pos(obj.x + this.myPos.x, obj.y + this.myPos.y));
            }
        }, this);

        this.status = status;

//        console.log(this.status);
//        console.log(this.getMapString());
    },

    'decision': function () {
        // default movement
        var myTarget, direction, doPathShift = true;

        // Scan surrounding cells (all directions) for food and make decision to eat it if found
        if (this.status.satiety < this.hungerThreshold * this.status.maxSatiety) {
            this.hungry = true;
        } else if (this.status.satiety > this.satietyThreshold * this.status.maxSatiety) {
            this.hungry = false;
        }

        if (this.hungry) {
            for (var i = 0; i < this.status.environment.objects.length; i++) {
                var obj = this.status.environment.objects[i];
                if (obj.class !== "food") {
                    continue;
                }

                if (Math.abs(obj.x) <= 1 && Math.abs(obj.y) <= 1) {
                    this.myPath = [];
                    return {
                        "action" : 4,
                        "dir"    : getMovement(obj)
                    };
                }
            }

            var foodPos = _.sortBy(this.memFood, function(pos) {
                return getDistance(pos, this.myPos)
            }, this).shift();

            if (foodPos)
            {
                var pathToFood = aStarAlgo(this.memMap, this.myPos, foodPos);
                if (pathToFood.length > 1) {
                    this.myPath = pathToFood.slice(1);
                }
            }
        }

        if (this.myPath.length) {
            myTarget = this.myPath[0];
        } else {
            myTarget = this.getNearestUnknownCoords(this.myPos);
            var pathToTarget = aStarAlgo(this.memMap, this.myPos, myTarget);
            if (pathToTarget.length > 1) {
                this.myPath = pathToTarget.slice(1);
                myTarget = this.myPath[0];
            }
        }

        myTarget.x-= this.myPos.x;
        myTarget.y-= this.myPos.y;
        direction = getMovement(myTarget);

        var myStep, myStepCell;
        myStep = movementMap[direction];
        myStepCell = this.memMap.get(this.myPos.x + myStep.x, this.myPos.y + myStep.y);

        if (myStepCell && myStepCell.blocked) {
            direction = 0;
            doPathShift = false;
            this.myPath = [];
        }

        // Otherwise move in desired direction
        if (doPathShift) {
            this.myPath.shift();
        }
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
        console.error('Error: '+notificationCode);
        this.myPath = [];
    }
});

exports.agentClass = FoxelAgent;
