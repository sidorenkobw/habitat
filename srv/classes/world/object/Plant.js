var objModule = require('../Object');

function Plant()
{
    objModule.Object.call(this);
    this.class = 'plant';
}
Plant.prototype = new objModule.Object();


module.exports.Plant = Plant;
