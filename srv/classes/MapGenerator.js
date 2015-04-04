var seedrandom = require('seedrandom');

function MapGenerator(options)
{
    var seed = (typeof options.seed == 'undefined') ? Math.random() : options.seed;
    this.random = new seedrandom(seed);
    this.width = (typeof options.width == 'undefined') ? 20 : options.width;
    this.height = (typeof options.height == 'undefined') ? 20 : options.height;
}

MapGenerator.prototype.generatePerlin = function()
{
    var x, y,
        map = this._generatePerlinNoise()
        ;
    var tileMapping = [0, 4, 3, 2, 2, 1, 5, 5, 5];
    for (x = 0; x < this.width; x ++) {
        for (y = 0; y < this.height; y++) {
            map[x][y] = tileMapping[parseInt(map[x][y] * tileMapping.length - 1) + 1];
        }
    }

    return map;
};

MapGenerator.prototype._getEmptyArray = function()
{
    var x, y, row, map = [];
    for (x = 0; x < this.width; x++) {
        row = [];
        for (y = 0; y < this.height; y++) {
            row[y] = 0;
        }
        map[x] = row;
    }
    return map;
};

MapGenerator.prototype._interpolate = function(a, b, alpha)
{
    return a * (1 - alpha) + alpha * b;
};

MapGenerator.prototype._generatePerlinNoise = function()
{
    var x, y, octave, smoothNoise = [],
        baseNoise = this._getEmptyArray(),
        map = this._getEmptyArray(),
        persistence = 0.35,
        amplitude = 1.0,
        totalAmplitude = 0.0,
        octaveCount = 4
        ;
    var sample_x0, sample_x1, horizontal_blend,
        sample_y0, sample_y1, vertical_blend,
        top, bottom,
        samplePeriod,
        sampleFrequency
        ;
    // generate base noise
    for (x = 0; x < this.width; x++) {
        for (y = 0; y < this.height; y++) {
            baseNoise[x][y] = this.random();
        }
    }
    // smooth base noise and blend into result
    for (octave = octaveCount - 1; octave >= 0; octave--) {
        amplitude *= persistence;
        totalAmplitude += amplitude;
        samplePeriod = 1 << octave;
        sampleFrequency = 1.0 / samplePeriod;
        for (x = 0; x < this.width; x++) {
            //calculate the horizontal sampling indices
            sample_x0 = (Math.floor(x / samplePeriod)) * samplePeriod;
            sample_x1 = (sample_x0 + samplePeriod) % this.width; //wrap around
            horizontal_blend = (x - sample_x0) * sampleFrequency;
            for (y = 0; y < this.height; y++) {
                //calculate the vertical sampling indices
                sample_y0 = (Math.floor(y / samplePeriod)) * samplePeriod;
                sample_y1 = (sample_y0 + samplePeriod) % this.height; //wrap around
                vertical_blend = (y - sample_y0) * sampleFrequency;

                //blend the top two corners
                top = this._interpolate(baseNoise[sample_x0][sample_y0],
                    baseNoise[sample_x1][sample_y0], horizontal_blend);

                //blend the bottom two corners
                bottom = this._interpolate(baseNoise[sample_x0][sample_y1],
                    baseNoise[sample_x1][sample_y1], horizontal_blend);

                //final blend
                map[x][y] += this._interpolate(top, bottom, vertical_blend) * amplitude;
            }
        }
    }

    //normalisation
    for (x = 0; x < this.width; x++) {
        for (y = 0; y < this.height; y++) {
            map[x][y] = map[x][y] / totalAmplitude;
        }
    }
    return map;
};

MapGenerator.prototype.generateVoronoi = function()
{
    var x, y, i, f, distance, selectedDistance, selectedPoint,
        map = this._getEmptyArray(),
        pointsCount = Math.ceil(this.width * this.height / 20),
        points = []
        ;
    for (x = 0; x < pointsCount; x++) {
        f = false;
        points[x] = {
            x: 0,
            y: 0,
            tile: parseInt(this.random() * 5) + 1
        };
        while(!f) {
            points[x].x = parseInt(this.random() * this.width);
            points[x].y = parseInt(this.random() * this.height);
            f = true;
            for (y = 0; y < x; y++) {
                if (points[y].x == points[x].x && points[y].y == points[x].y) {
                    f = false;
                }
            }
        }
    }
    for (x = 0; x < this.width; x++) {
        for (y = 0; y < this.height; y++) {
            selectedDistance = this._distance(x, y, points[0].x, points[0].y);
            selectedPoint = 0;
            for (i = 1; i < pointsCount; i++) {
                distance = this._distance(x, y, points[i].x, points[i].y);
                if (distance < selectedDistance) {
                    selectedPoint = i;
                    selectedDistance = distance;
                }
            }
            map[x][y] = points[selectedPoint].tile;
        }
    }
    return map;
};

MapGenerator.prototype._distance = function(x1, y1, x2, y2)
{
    return Math.sqrt((x2 - x1)*(x2 - x1) + (y2 - y1)*(y2 - y1));
};

module.exports.generate = function(options)
{
    var
        generator = new MapGenerator(options),
        method = '',
        methods = ['Perlin', 'Voronoi'],
        map = []
        ;
    if (typeof options['method'] == 'undefined') {
        method = methods[parseInt(generator.random() * 2)];
    } else {
        method = options['method'];
        generator.random();
    }
    if (typeof generator['generate' + method] == 'undefined') {
        throw new Error('Unknown generation method specified');
    }
    return generator['generate' + method]();
};
