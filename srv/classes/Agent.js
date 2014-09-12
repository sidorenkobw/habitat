var Constants = require("./constants");

var Agent = function ()
{
    this.id         = null;
    this.class      = null;
    this.client     = null;
    this.name       = null;
    this.author     = null;

    this.mob        = null;

};

Agent.prototype.toJson = function ()
{
    var agePhase = 'baby';
    if (this.mob.lifeTime >= Constants.balance.AGENT_AGE_OLD) {
        agePhase = 'old';
    } else if (this.mob.lifeTime >= Constants.balance.AGENT_AGE_ADULT) {
        agePhase = 'adult';
    } else if (this.mob.lifeTime >= Constants.balance.AGENT_AGE_TEEN) {
        agePhase = 'teen';
    }
    return {
        "id"             : this.mob.id,
        "class"          : this.class,
        //"client"         : this.client,
        "name"           : this.name,
        "author"         : this.author,
        "x"              : this.mob.x,
        "y"              : this.mob.y,
        "health"         : this.mob.health,
        "maxHealth"      : this.mob.maxHealth,
        "age"            : this.mob.lifeTime,
        "agePhase"       : agePhase,
        "healthPercent"  : Math.round(this.mob.health * 100 / this.mob.maxHealth),
        "satiety"        : this.mob.satiety,
        "maxSatiety"     : this.mob.maxSatiety,
        "satietyPercent" : Math.round(this.mob.satiety * 100 / this.mob.maxSatiety)
    };
};

Agent.prototype.getName = function()
{
    return this.class + '(' + this.mob.id + ')';
};

Agent.prototype.isAlive = function ()
{
    return this.mob.health > 0;
};

/**
 *
 * @returns {Agent}
 */
exports.create = function () {
    return new Agent();
};
