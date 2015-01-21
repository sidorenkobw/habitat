var objModule = require('../Object');

var Food = function (richness)
{
    objModule.Object.call(this);
    richness = parseInt(richness);
    this.class = "food";
    this.richness = richness ? richness : 100;
    this.maxRichness = this.richness;
};
Food.prototype = new objModule.Object();

Food.prototype.isAlive = function()
{
    return this.richness > 0;
};

Food.prototype.toJson = function ()
{
    var json = objModule.Object.prototype.toJson.call(this);
    json['richness'] = this.richness;
    json['maxRichness'] = this.maxRichness;
    return json;
};

exports.create = function (richness)
{
    return new Food(richness);
};
module.exports.Food = Food;
