var seedrandom = require('seedrandom');

function MapGenerator(options)
{
    var seed = (typeof options.seed == 'undefined') ? Math.random() : options.seed;
    this.random = new seedrandom(seed);
    this.width = (typeof options.width == 'undefined') ? 20 : options.width;
    this.height = (typeof options.height == 'undefined') ? 20 : options.height;
}

MapGenerator.prototype.generate = function()
{
    var x, y,
        map = this._generatePerlinNoise(this._generateWhiteNoise(this.width, this.height), 4),
        width = map.length,
        height = width ? map[0].length : 0
        ;
    var tileMapping = [0, 4, 3, 2, 2, 1, 5, 5, 5];
    for (x = 0; x < width; x ++) {
        for (y = 0; y < height; y++) {
            map[x][y] = tileMapping[parseInt(map[x][y] * tileMapping.length - 1) + 1];
        }
    }

    return map;
};

MapGenerator.prototype._getEmptyArray = function(width, height)
{
    var x, y, row, map = [];
    for (x = 0; x < width; x++) {
        row = [];
        for (y = 0; y < height; y++) {
            row[y] = 0;
        }
        map[x] = row;
    }
    return map;
};

MapGenerator.prototype._generateWhiteNoise = function(width, height)
{
    var x, y, map = this._getEmptyArray(width, height);
    for (x = 0; x < width; x++) {
        for (y = 0; y < height; y++) {
            map[x][y] = this.random();
        }
    }
    return map;
};

MapGenerator.prototype._generateSmoothNoise = function(baseNoise, octave)
{
    var x, sample_x0, sample_x1, horizontal_blend,
        y, sample_y0, sample_y1, vertical_blend,
        top, bottom,
        width = baseNoise.length,
        height = width ? baseNoise[0].length : 0,
        map = this._getEmptyArray(width, height),
        samplePeriod = 1 << octave,
        sampleFrequency = 1.0 / samplePeriod
        ;
    for (x = 0; x < width; x++) {
        //calculate the horizontal sampling indices
        sample_x0 = (Math.floor(x / samplePeriod)) * samplePeriod;
        sample_x1 = (sample_x0 + samplePeriod) % width; //wrap around
        horizontal_blend = (x - sample_x0) * sampleFrequency;
        for (y = 0; y < height; y++) {
            //calculate the vertical sampling indices
            sample_y0 = (Math.floor(y / samplePeriod)) * samplePeriod;
            sample_y1 = (sample_y0 + samplePeriod) % height; //wrap around
            vertical_blend = (y - sample_y0) * sampleFrequency;

            //blend the top two corners
            top = this._interpolate(baseNoise[sample_x0][sample_y0],
                baseNoise[sample_x1][sample_y0], horizontal_blend);

            //blend the bottom two corners
            bottom = this._interpolate(baseNoise[sample_x0][sample_y1],
                baseNoise[sample_x1][sample_y1], horizontal_blend);

            //final blend
            map[x][y] = this._interpolate(top, bottom, vertical_blend);
        }
    }
    return map;
};

MapGenerator.prototype._interpolate = function(a, b, alpha)
{
    return a * (1 - alpha) + alpha * b;
};

MapGenerator.prototype._generatePerlinNoise = function(baseNoise, octaveCount)
{
    var x, y, octave, smoothNoise = [],
        width = baseNoise.length,
        height = width ? baseNoise[0].length : 0,
        map = this._getEmptyArray(width, height),
        persistence = 0.35,
        amplitude = 1.0,
        totalAmplitude = 0.0
        ;

    //generate smooth noise
    for (x = 0; x < octaveCount; x++) {
        smoothNoise[x] = this._generateSmoothNoise(baseNoise, x);
    }

    //blend noise together
    for (octave = octaveCount - 1; octave >= 0; octave--) {
        amplitude *= persistence;
        totalAmplitude += amplitude;

        for (x = 0; x < width; x++) {
            for (y = 0; y < height; y++) {
                map[x][y] += smoothNoise[octave][x][y] * amplitude;
            }
        }
    }

    //normalisation
    for (x = 0; x < width; x++) {
        for (y = 0; y < height; y++) {
            map[x][y] = map[x][y] / totalAmplitude;
        }
    }
    return map;
};

module.exports.generate = function(options)
{
    var generator = new MapGenerator(options);
    return generator.generate();
};
