var _ = require("underscore");

function Map()
{
    this.width  = 0;
    this.height = 0;
    this.map    = [];
}

Map.prototype.setSize = function(x, y)
{
    this.width  = parseInt(x);
    this.height = parseInt(y);

    for (var y = 0; y < this.height; y++) {
        this.map[y] = [];
        for (var x = 0; x < this.width; x++) {
            this.map[y][x] = 1;
        }
    }
};

Map.prototype.getXYByRel = function(x, y, shift_x, shift_y)
{
    x = parseInt(x);
    y = parseInt(y);
    shift_x = parseInt(shift_x);
    shift_y = parseInt(shift_y);

    if (shift_x > this.width) {
        throw new Error('shift_x is bigger the map size');
    }

    if (shift_y > this.height) {
        throw new Error('shift_y is bigger the map size');
    }

    var nx = x + shift_x;
    if (nx < 0) {
        nx = nx + this.width;
    } else if (nx >= this.width) {
        nx = nx - this.width;
    }

    var ny = y + shift_y;
    if (ny < 0) {
        ny = ny + this.height;
    } else if (ny >= this.height) {
        ny = ny - this.height;
    }

    return {"x" : nx, "y" : ny};
};

Map.prototype.getTerrainTypeByXY = function(x, y)
{
    return this.map[y][x];
};

Map.prototype.getDirectionsMap = function () {
    var movementMap = [];

    movementMap[0] = { "x" :  0, "y" :  0 }; // Current cell
    movementMap[1] = { "x" :  0, "y" : -1 }; // N
    movementMap[2] = { "x" : +1, "y" : -1 }; // NE
    movementMap[3] = { "x" : +1, "y" :  0 }; // E
    movementMap[4] = { "x" : +1, "y" : +1 }; // SE
    movementMap[5] = { "x" :  0, "y" : +1 }; // S
    movementMap[6] = { "x" : -1, "y" : +1 }; // SW
    movementMap[7] = { "x" : -1, "y" :  0 }; // W
    movementMap[8] = { "x" : -1, "y" : -1 }; // NW

    return movementMap;
};

Map.prototype.getPossibleDirections = function () {
    var dirs = this.getDirectionsMap();
    dirs = _.map(dirs, function (dir, i) {
        return i;
    });
    return dirs;
}
exports.Map = Map;
