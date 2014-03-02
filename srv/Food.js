var Food = function (richness) {
    richness = parseInt(richness);
    this.class = "food";
    this.richness = richness ? richness : 100;
    this.x = null;
    this.y = null;
};

Food.prototype.setLocation = function (x, y)
{
    this.x = parseInt(x);
    this.y = parseInt(y);
};

exports.create = function (richness) {
    return new Food(richness);
};
