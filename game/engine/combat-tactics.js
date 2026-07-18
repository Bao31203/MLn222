(function (root, factory) {
  "use strict";
  var game = root.MLN222Game;
  if (!game || !game.hasModule("contracts")) {
    throw new Error("Load the core modules before combat-tactics.js.");
  }
  var api = game.registerModule("combat-tactics", factory(game.contracts));
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function (contracts) {
  "use strict";

  var TACTIC_IDS = Object.freeze(["siege", "engage", "assault", "consolidate", "retreat"]);
  var NUMERIC_FIELDS = Object.freeze(["damage", "exposure", "power", "minLoss", "maxLoss", "breachMin", "breachMax", "moraleRecovery"]);

  function validateTacticsConfig(config) {
    if (!contracts.isPlainObject(config)) {
      throw new TypeError("Combat tactics config must be an object.");
    }
    var keys = Object.keys(config).sort();
    if (JSON.stringify(keys) !== JSON.stringify(TACTIC_IDS.slice().sort())) {
      throw new RangeError("Combat tactics config must define exactly the supported tactics.");
    }
    TACTIC_IDS.forEach(function (id) {
      var spec = config[id];
      if (!contracts.isPlainObject(spec)) {
        throw new TypeError("Combat tactic must be an object: " + id);
      }
      NUMERIC_FIELDS.forEach(function (field) {
        if (!Number.isFinite(spec[field]) || spec[field] < 0) {
          throw new RangeError("Invalid " + id + "." + field + " tactic value.");
        }
      });
      if (spec.maxLoss < spec.minLoss || spec.maxLoss > 0.15 || spec.breachMax < spec.breachMin) {
        throw new RangeError("Combat tactic bounds are invalid: " + id);
      }
    });
    return true;
  }

  function getTactic(id, config) {
    validateTacticsConfig(config);
    if (TACTIC_IDS.indexOf(id) === -1) {
      throw new RangeError("Unknown combat tactic: " + String(id));
    }
    return config[id];
  }

  function validateSelection(side, tacticId, battle, config, assaultBreachThreshold) {
    var errors = [];
    if (side !== "attacker" && side !== "defender") {
      return [{ code: "TACTIC_SIDE", path: "side", message: "Combat side is invalid." }];
    }
    if (TACTIC_IDS.indexOf(tacticId) === -1 || !Object.prototype.hasOwnProperty.call(config, tacticId)) {
      errors.push({ code: "TACTIC_UNKNOWN", path: side + "Tactic", message: "Combat tactic is unknown." });
      return errors;
    }
    if (tacticId === "assault" && battle.breach < assaultBreachThreshold) {
      errors.push({ code: "TACTIC_ASSAULT_LOCKED", path: side + "Tactic", message: "Assault requires a sufficient fortification breach." });
    }
    if (side === "defender" && tacticId === "siege") {
      errors.push({ code: "TACTIC_DEFENDER_SIEGE", path: "defenderTactic", message: "Defender cannot use siege." });
    }
    return errors;
  }

  return {
    TACTIC_IDS: TACTIC_IDS,
    validateTacticsConfig: validateTacticsConfig,
    getTactic: getTactic,
    validateSelection: validateSelection,
  };
});
