var constants = {
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

    "ERROR_WRONG_FORMAT"            : 1,

    "ERROR_MOVE_IMPASSABLE_TERRAIN" : 21,
    "ERROR_MOVE_AGENT_IN_CELL"      : 22,

    "ERROR_ATTACK_NO_AGENT"         : 31,

    "ERROR_EAT_NO_FOOD"             : 41,
    "ERROR_EAT_STOMACH_FULL"        : 42
};

module.exports = Object.freeze(constants);
