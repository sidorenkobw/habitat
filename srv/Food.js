var Food = function (richness) {
    richness = parseInt(richness);
    this.class = "food";
    this.richness = richness ? richness : 100;
    this.maxRichness = this.richness;
    this.x = null;
    this.y = null;
};

Food.prototype.toJson = function () {
    return {
        "class"             : this.class,
        "x"                 : this.x,
        "y"                 : this.y,
        "richness"          : this.richness,
        "maxRichness"       : this.maxRichness,
        "richnessPercent"   : Math.round(this.richness * 100 / this.maxRichness)
    };
};

Food.prototype.setLocation = function (x, y)
{
    this.x = parseInt(x);
    this.y = parseInt(y);
};

exports.create = function (richness) {
    return new Food(richness);
};
