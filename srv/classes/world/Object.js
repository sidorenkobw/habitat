function WorldObject()
{
    this.lifeTime = 0;
    this.x = null;
    this.y = null;
    this.class = 'object';
    this.impassable = false;
}

WorldObject.prototype.tick = function()
{
    this.lifeTime++;
};

WorldObject.prototype.isAlive = function()
{
    return true;
};

WorldObject.prototype.toJson = function()
{
    return {
        'x' : this.x,
        'y' : this.y,
        'class' : this.class
    };
};

WorldObject.prototype.setLocation = function (x, y)
{
    this.x = parseInt(x);
    this.y = parseInt(y);
};

module.exports.Object = WorldObject;
