var _ = require("underscore");

function Map()
{
    this.width  = 0;
    this.height = 0;
    this.map    = [];
    this._cache = {
        'positionsByTerrain' : {},
        'tilesByClass': {},
        'possibleDirections': null
    };
}

Map.prototype.terrains =
{
    0: 'void',
    1: 'grass',
    2: 'steppe',
    3: 'desert',
    4: 'water',
    5: 'forest'
};

Map.prototype.terrainClasses =
{
    'land' : ['grass', 'steppe', 'desert'],
    'sea' : ['water']
};

Map.prototype.setSize = function(x, y)
{
    this.width  = parseInt(x);
    this.height = parseInt(y);

    for (var i = 0; i < this.height; i++) {
        this.map[i] = [];
        for (var j = 0; j < this.width; j++) {
            this.map[i][j] = 1;
        }
    }
};

Map.prototype.toJson = function()
{
    return {
        width: this.width,
        height: this.height,
        map: this.map
    }
};

Map.prototype.getTerrainTypeByXY = function(x, y)
{
    return this.map[y][x];
};

Map.prototype.getRectangle = function(minX, minY, maxX, maxY)
{
    var result = [], row, y, x, mapX, mapY;
    if (minX > maxX || minY > maxY) {
        throw Error('Invalid boundaries specified')
    }
    for (y = minY; y <= maxY; y++) {
        row = [];
        for (x = minX; x <= maxX; x++) {
            mapX = x < 0 ? x + this.width : (x >= this.width ? x - this.width : x);
            mapY = y < 0 ? y + this.height : (y >= this.height ? y - this.height : y);
            row.push(this.map[mapY][mapX]);
        }
        result.push(row);
    }
    return result;
};

Map.prototype._getPositionsByTerrain = function(terrains)
{
    if (typeof terrains === 'string') {
        terrains = [terrains];
    }
    terrains.sort();
    var s = ' ' + terrains.join(' ') + ' ';
    if (typeof (this._cache['positionsByTerrain'][s]) == 'undefined') {
        var result = [];
        for (var x = 0; x < this.width; x ++) {
            for (var y = 0; y < this.height; y++) {
                if (s.indexOf(' ' + this.terrains[this.map[y][x]] + ' ') >= 0) {
                    result.push({x: x, y: y});
                }
            }
        }
        this._cache['positionsByTerrain'][s] = result;
    }
    return this._cache['positionsByTerrain'][s];
};

Map.prototype.getTilesByTerrainClass = function(cls)
{
    if (typeof (this._cache['tilesByClass'][cls]) == 'undefined') {
        this._cache['tilesByClass'][cls] = [];
        var suitableTerrains = typeof(this.terrainClasses[cls]) == 'undefined' ? [] : this.terrainClasses[cls];
        for (var tile in this.terrains) {
            if (this.terrains.hasOwnProperty(tile)) {
                for (var i= 0, l = suitableTerrains.length; i < l; i++) {
                    if (suitableTerrains[i] == this.terrains[tile]) {
                        this._cache['tilesByClass'][cls].push(parseInt(tile));
                    }
                }
            }
        }
    }
    return this._cache['tilesByClass'][cls];
};

Map.prototype.getRandomPosition = function()
{
    var options = arguments.length ? arguments[0] : {};
    var positions = this.getPositions(options);
    return positions ? positions[Math.floor(Math.random() * positions.length)] : null;
};

Map.prototype.getPositions = function(options)
{
    var x, y, i, l, positions, result = [];
    if (options.class && options.terrains) {
        throw new Error('Invalid options: terrains and class are mutually exclusive options');
    }
    if (options.class) {
        positions = this._getPositionsByTerrain(this.terrainClasses[options.class]);
    }
    if (options.terrains) {
        positions = this._getPositionsByTerrain(options.terrains);
    }
    if (typeof(positions) == 'undefined') {
        positions = [];
        for (x = 0; x < this.width; x++) {
            for (y = 0; y < this.width; y++) {
                positions.push({x: x, y: y});
            }
        }
    }
    for (i = 0, l = result.length; i < l; i++) {
        if (this._filterPosition(positions[i], options)) {
            result.push(positions[i]);
        }
    }
    return result;
};

Map.prototype._filterPosition = function(p, filters) {
    return !!(
        (typeof(filters['minX']) == 'undefined' || p.x >= filters['minX'])
        && (typeof(filters['maxX']) == 'undefined' || p.x <= filters['maxX'])
        && (typeof(filters['minY']) == 'undefined' || p.y >= filters['minY'])
        && (typeof(filters['maxY']) == 'undefined' || p.y <= filters['maxY'])
        && (typeof(filters['xNot']) == 'undefined' || p.x != filters['xNot'])
        && (typeof(filters['yNot']) == 'undefined' || p.y != filters['yNot'])
    );
};

module.exports.Map = Map;
