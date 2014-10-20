var constants = Object.freeze({
    "DIR_CURRENT"   : 0,
    "DIR_N"         : 1,
    "DIR_NE"        : 2,
    "DIR_E"         : 3,
    "DIR_SE"        : 4,
    "DIR_S"         : 5,
    "DIR_SW"        : 6,
    "DIR_W"         : 7,
    "DIR_NW"        : 8,

    "ACTION_IDLE"   : 0,
    "ACTION_MOVE"   : 1,
    "ACTION_ATTACK" : 3,
    "ACTION_EAT"    : 4,

    'DIRECTIONS': {
        '0' : {x:  0, y: -1},
        '1' : {x:  1, y: -1},
        '2' : {x:  1, y:  0},
        '3' : {x:  1, y:  1},
        '4' : {x:  0, y:  1},
        '5' : {x: -1, y:  1},
        '6' : {x: -1, y:  0},
        '7' : {x: -1, y: -1},
        '8' : {x:  0, y:  0}
    },

    "ERROR_WRONG_FORMAT"            : 1,

    "ERROR_MOVE_IMPASSABLE_TERRAIN" : 21,
    "ERROR_MOVE_CELL_OCCUPIED"      : 22,

    "ERROR_ATTACK_NO_AGENT"         : 31,
    "ERROR_ATTACK_TOO_YOUNG"        : 32,

    "ERROR_EAT_NO_FOOD"             : 41,
    "ERROR_EAT_STOMACH_FULL"        : 42,
	
	balance: Object.freeze({
        "AGENT_MAX_HEALTH" : 100,
        "AGENT_MAX_SATIETY" : 3000,

		"AGENT_EAT_AMOUNT" : 100,
		"AGENT_BLOATED_FACTOR": 0.9,
		"AGENT_HUNGRY_FACTOR": 0.2,
		"AGENT_SATIETY_LEVEL_REGENERATION": 0.5,

        "AGENT_IDLE_REGENERATION_AMOUNT" : 3,
		"AGENT_DEAD_BODY_SATIETY": 1000,
		
		"AGENT_MOVE_COST_STRAIGHT": 2,
		"AGENT_MOVE_COST_DIAGONAL": 3,
		
		"AGENT_ATTACK_COST_STRAIGHT" : 5,
		"AGENT_ATTACK_COST_DIAGONAL": 6,
		
		"AGENT_BASE_DAMAGE": 3,
        "AGENT_BONUS_DAMAGE_SATIETY_NORMAL": 2,
        "AGENT_BONUS_DAMAGE_AGE_ADULT" : 1,
        "AGENT_OLDNESS_DAMAGE": 5,
        "AGENT_STARVATION_DAMAGE": 1,

        "AGENT_AGE_TEEN"  : 250,
        "AGENT_AGE_ADULT" : 700,
        "AGENT_AGE_OLD"   : 1500,
        "AGENT_AGE_DEATH" : 2000
	})
});

module.exports = constants;
