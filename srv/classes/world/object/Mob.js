var objModule = require('../Object');
var Constants = require("../../constants");

function Mob(options)
{
//    if (typeof (options) != 'object') {
//        options = {};
//    }
    objModule.Object.call(this);
    this.class = 'mob';
    this.subClass = 'unknown';
    this.family = 'undefined';
    this.impassable = true;

    this.id = null;

    this.name = typeof(options.name) != 'undefined' ? options.name : 'Mob';

    this.health = 0;
    this.maxHealth = 0;

    this.satiety = 0;
    this.maxSatiety = 0;

    this.lastAction = null;
}
Mob.prototype = new objModule.Object();

Mob.prototype.updateSatietyWith = function(value)
{
    var newVal = this.satiety + value;
    if (newVal > this.maxSatiety) {
        this.satiety = this.maxSatiety;
    } else if (newVal < 0) {
        this.satiety = 0;
    } else {
        this.satiety = newVal;
    }
    return true;
};

Mob.prototype.updateHealthWith = function(value)
{
    if (this.health <= 0) {
        return false;
    }
    var newVal = this.health + value;
    if (newVal > this.maxHealth) {
        this.health = this.maxHealth;
    } else if (newVal < 0) {
        this.health = 0;
    } else {
        this.health = newVal;
    }
    return true;
};

Mob.prototype.isAlive = function()
{
    return this.health > 0;
};

Mob.prototype.attack = function(options)
{
    if (
        typeof(options.target) == 'undefined'
            || typeof(options.target.class) == 'undefined'
            || options.target.class != 'mob'
            || typeof(options.dir) == 'undefined'
        ) {
        return false;
    }
    if (options.dir % 2) {
        // straight direction
        this.updateSatietyWith(-Constants.balance.AGENT_ATTACK_COST_STRAIGHT);
    } else {
        this.updateSatietyWith(-Constants.balance.AGENT_ATTACK_COST_DIAGONAL);
    }
    var damage = Math.floor(Math.random() * Constants.balance.AGENT_BASE_DAMAGE);
    if (this.satiety > Math.floor(this.maxSatiety * Constants.balance.AGENT_HUNGRY_FACTOR) && this.satiety < Math.floor(this.maxSatiety * Constants.balance.AGENT_BLOATED_FACTOR)) {
        damage += Constants.balance.AGENT_BONUS_DAMAGE_SATIETY_NORMAL;
    }
    if (this.lifeTime >= Constants.balance.AGENT_AGE_ADULT && this.lifeTime < Constants.balance.AGENT_AGE_OLD) {
        damage += Constants.balance.AGENT_BONUS_DAMAGE_AGE_ADULT;
    }

    options.target.updateHealthWith(-damage);
    return true;
};

Mob.prototype.move = function(options)
{
    if (
        typeof(options.target) == 'undefined'
            || typeof(options.target.x) == 'undefined'
            || typeof(options.target.y) == 'undefined'
            || typeof(options.dir) == 'undefined'
        ) {
        return false;
    }
    if (options.dir % 2) {
        // straight direction
        this.updateSatietyWith(-Constants.balance.AGENT_MOVE_COST_STRAIGHT);
    } else {
        this.updateSatietyWith(-Constants.balance.AGENT_MOVE_COST_DIAGONAL);
    }
    this.x = options.target.x;
    this.y = options.target.y;
    return true;
};

Mob.prototype.eat = function(options)
{
    if (
        typeof(options.target) == 'undefined'
            || typeof(options.target.class) == 'undefined'
            || options.target.class != 'food'
        ) {
        return false;
    }
    var value = Constants.balance.AGENT_EAT_AMOUNT;
    if (options.target.richness < value) {
        value = options.target.richness;
    } else if ((this.maxSatiety - this.satiety) < value) {
        value = this.maxSatiety - this.satiety;
    }
    this.updateSatietyWith(value);
    options.target.richness -= value;

    return true;
};

Mob.prototype.idle = function(options)
{
    // Regeneration
    if (this.satiety > Math.floor(this.maxSatiety * Constants.balance.AGENT_SATIETY_LEVEL_REGENERATION)) {
        this.updateHealthWith(Constants.balance.AGENT_IDLE_REGENERATION_AMOUNT);
    }
    return true;
};

Mob.prototype.tick = function(environment)
{
    this.lastAction = {
        'mobId' : this.id,
        'action': null,
        'result': false,
        'target': null,
        'source': null
    };
    objModule.Object.prototype.tick.call(this);
    this.updateSatietyWith(-1);
    // Starving
    if (this.satiety == 0) {
        this.updateHealthWith(-Constants.balance.AGENT_STARVATION_DAMAGE);
    }
    // Dying by age
    if (this.age > Constants.balance.AGENT_AGE_DEATH) {
        this.updateHealthWith(-Constants.balance.AGENT_OLDNESS_DAMAGE);
    }
};

Mob.prototype.toJson = function()
{
    var json = objModule.Object.prototype.toJson.call(this);
    var agePhase = 'baby';
    if (this.lifeTime >= Constants.balance.AGENT_AGE_OLD) {
        agePhase = 'old';
    } else if (this.lifeTime >= Constants.balance.AGENT_AGE_ADULT) {
        agePhase = 'adult';
    } else if (this.lifeTime >= Constants.balance.AGENT_AGE_TEEN) {
        agePhase = 'teen';
    }
    json.id = this.id;
    json.class = 'mob';
    json.name = this.getName(false);
    json.health = this.health;
    json.maxHealth = this.maxHealth;
    json.age = this.lifeTime;
    json.agePhase = agePhase;
    json.healthPercent = Math.round(this.health * 100 / this.maxHealth);
    json.satiety = this.satiety;
    json.maxSatiety = this.maxSatiety;
    json.satietyPercent = Math.round(this.satiety * 100 / this.maxSatiety);
    return json
};

Mob.prototype.getName = function(withId)
{
    return this.name + ' ' + this.family + (withId ? ' (' + this.id + ')' : '');
};

module.exports.Mob = Mob;
