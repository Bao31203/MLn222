(function (root, factory) {
  "use strict";
  var game = root.MLN222Game;
  if (
    !game ||
    !game.hasModule("contracts") ||
    !game.hasModule("rng") ||
    !game.hasModule("combat-tactics") ||
    !game.hasModule("combat-casualties")
  ) {
    throw new Error("Load core, combat-tactics.js, and combat-casualties.js before combat.js.");
  }
  var api = game.registerModule("combat", factory(
    game.contracts,
    game.rng,
    game["combat-tactics"],
    game["combat-casualties"]
  ));
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function (contracts, rng, tactics, casualties) {
  "use strict";

  var ID_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9._-]{0,63}$/;
  var SIDES = Object.freeze(["attacker", "defender"]);
  var BATTLE_FIELDS = Object.freeze([
    "id", "status", "turn", "sourceProvinceId", "targetProvinceId", "terrain",
    "fortification", "breach", "attacker", "defender", "tactics",
    "reinforcementQueue", "winnerFactionId", "outcome",
  ]);
  var PARTICIPANT_FIELDS = Object.freeze([
    "factionId", "units", "initialForce", "reinforcementsReceived", "morale",
    "supply", "casualties", "woundedQueue",
  ]);

  function hasExactFields(value, fields) {
    return contracts.isPlainObject(value) &&
      JSON.stringify(Object.keys(value).sort()) === JSON.stringify(fields.slice().sort());
  }

  function clamp(value, minimum, maximum) {
    return Math.min(maximum, Math.max(minimum, value));
  }

  function requireFinite(value, name, minimum, maximum) {
    if (!Number.isFinite(value) || value < minimum || value > maximum) {
      throw new RangeError(name + " is outside its configured range.");
    }
  }

  function requirePositiveInteger(value, name) {
    if (!Number.isSafeInteger(value) || value < 1) {
      throw new RangeError(name + " must be a positive safe integer.");
    }
  }

  function validateConfig(config) {
    if (!contracts.isPlainObject(config)) {
      throw new TypeError("Combat config must be an object.");
    }
    ["unitPower", "terrain", "tactics", "power", "attrition", "morale", "supply", "fortification", "casualties", "reinforcement", "retreat", "phases"].forEach(function (field) {
      if (!contracts.isPlainObject(config[field])) {
        throw new TypeError("Combat config is missing " + field + ".");
      }
    });
    tactics.validateTacticsConfig(config.tactics);
    if (Object.keys(config.unitPower).length === 0 || Object.keys(config.terrain).length === 0) {
      throw new RangeError("Combat config requires unit power and terrain entries.");
    }
    Object.keys(config.unitPower).forEach(function (unitId) { requireFinite(config.unitPower[unitId], "unitPower." + unitId, 0.01, 100); });
    Object.keys(config.terrain).forEach(function (terrainId) { requireFinite(config.terrain[terrainId], "terrain." + terrainId, 0.25, 4); });
    requireFinite(config.power.minimumMoraleFactor, "power.minimumMoraleFactor", 0, 1);
    requireFinite(config.power.minimumSupplyFactor, "power.minimumSupplyFactor", 0, 1);
    requireFinite(config.power.fortificationDefenseBonus, "power.fortificationDefenseBonus", 0, 2);
    requireFinite(config.attrition.baseRate, "attrition.baseRate", 0.001, 0.5);
    requireFinite(config.attrition.varianceMin, "attrition.varianceMin", 0.5, 1.5);
    requireFinite(config.attrition.varianceMax, "attrition.varianceMax", config.attrition.varianceMin, 2);
    requireFinite(config.attrition.directLossCap, "attrition.directLossCap", 0.01, 0.15);
    ["start", "baseLoss", "lossRateFactor", "strengthPressureFactor", "strengthPressureCap", "fatiguePerTurn", "supplyPressureFactor", "assaultShock", "fortificationShield", "routThreshold"].forEach(function (field) {
      requireFinite(config.morale[field], "morale." + field, 0, field === "start" ? 100 : 200);
    });
    requirePositiveInteger(config.morale.fatigueStartTurn, "morale.fatigueStartTurn");
    ["start", "baseDrain", "lateDrain", "siegeDrain"].forEach(function (field) {
      requireFinite(config.supply[field], "supply." + field, 0, 100);
    });
    requirePositiveInteger(config.supply.lateTurn, "supply.lateTurn");
    requireFinite(config.fortification.assaultBreachThreshold, "fortification.assaultBreachThreshold", 0, 100);
    requireFinite(config.reinforcement.maxInitialRate, "reinforcement.maxInitialRate", 0, 1);
    requirePositiveInteger(config.reinforcement.delayTurns, "reinforcement.delayTurns");
    requireFinite(config.retreat.pursuitMinRate, "retreat.pursuitMinRate", 0, 0.15);
    requireFinite(config.retreat.pursuitMaxRate, "retreat.pursuitMaxRate", config.retreat.pursuitMinRate, 0.15);
    requireFinite(config.retreat.defenderCapturedRate, "retreat.defenderCapturedRate", 0, 1);
    if (typeof config.stream !== "string" || config.stream !== "combat") {
      throw new RangeError("Combat must use the combat RNG stream.");
    }
    ["action", "resolution", "postPulse"].forEach(function (field) {
      if (typeof config.phases[field] !== "string") {
        throw new TypeError("Combat phase config is invalid.");
      }
    });
    return true;
  }

  function validateUnits(units, config) {
    var total = casualties.countUnits(units);
    Object.keys(units).forEach(function (unitId) {
      if (!Object.prototype.hasOwnProperty.call(config.unitPower, unitId)) {
        throw new RangeError("Combat unit has no configured power: " + unitId);
      }
    });
    if (total <= 0) {
      throw new RangeError("Combat participant must have active units.");
    }
    return total;
  }

  function createParticipant(input, config) {
    if (!contracts.isPlainObject(input) || typeof input.factionId !== "string" || !ID_PATTERN.test(input.factionId)) {
      throw new TypeError("Combat participant input is invalid.");
    }
    var initialForce = validateUnits(input.units, config);
    var morale = input.morale === undefined ? config.morale.start : input.morale;
    var supply = input.supply === undefined ? config.supply.start : input.supply;
    requireFinite(morale, "participant.morale", 0, 100);
    requireFinite(supply, "participant.supply", 0, 100);
    return {
      factionId: input.factionId,
      units: contracts.cloneJson(input.units),
      initialForce: initialForce,
      reinforcementsReceived: 0,
      morale: morale,
      supply: supply,
      casualties: { dead: 0, wounded: 0, routed: 0, captured: 0 },
      woundedQueue: [],
    };
  }

  function createBattle(input, config) {
    validateConfig(config);
    if (!contracts.isPlainObject(input)) {
      throw new TypeError("Battle input must be an object.");
    }
    ["id", "sourceProvinceId", "targetProvinceId", "terrain"].forEach(function (field) {
      if (typeof input[field] !== "string" || !ID_PATTERN.test(input[field])) {
        throw new RangeError("Battle " + field + " is invalid.");
      }
    });
    if (input.sourceProvinceId === input.targetProvinceId) {
      throw new RangeError("Battle source and target provinces must differ.");
    }
    if (!Object.prototype.hasOwnProperty.call(config.terrain, input.terrain)) {
      throw new RangeError("Battle terrain is unknown.");
    }
    var maximumFortification = input.fortification === undefined ? 100 : input.fortification;
    requireFinite(maximumFortification, "battle.fortification", 0, 1000000);
    var battle = {
      id: input.id,
      status: "active",
      turn: 0,
      sourceProvinceId: input.sourceProvinceId,
      targetProvinceId: input.targetProvinceId,
      terrain: input.terrain,
      fortification: { current: maximumFortification, maximum: maximumFortification },
      breach: maximumFortification === 0 ? 100 : 0,
      attacker: createParticipant(input.attacker, config),
      defender: createParticipant(input.defender, config),
      tactics: { attacker: "engage", defender: "engage" },
      reinforcementQueue: [],
      winnerFactionId: null,
      outcome: null,
    };
    validateBattle(battle, config);
    return battle;
  }

  function validateParticipant(participant, side, config) {
    var errors = [];
    if (!contracts.isPlainObject(participant)) {
      return [{ code: "BATTLE_PARTICIPANT", path: side, message: "Battle participant must be an object." }];
    }
    if (!hasExactFields(participant, PARTICIPANT_FIELDS)) {
      errors.push({ code: "BATTLE_PARTICIPANT_FIELDS", path: side, message: "Battle participant has unknown or missing fields." });
    }
    if (typeof participant.factionId !== "string" || !ID_PATTERN.test(participant.factionId)) {
      errors.push({ code: "BATTLE_FACTION_ID", path: side + ".factionId", message: "Battle faction ID is invalid." });
    }
    try {
      var active = casualties.countUnits(participant.units);
      if (!Number.isSafeInteger(participant.initialForce) || participant.initialForce < 1 || !Number.isSafeInteger(participant.reinforcementsReceived) || participant.reinforcementsReceived < 0) {
        errors.push({ code: "BATTLE_FORCE", path: side + ".initialForce", message: "Battle force counters are invalid." });
      }
      if (!hasExactFields(participant.casualties, ["dead", "wounded", "routed", "captured"])) {
        errors.push({ code: "BATTLE_CASUALTY_FIELDS", path: side + ".casualties", message: "Battle casualty fields are invalid." });
      }
      if (casualties.accountingTotal(participant) !== participant.initialForce + participant.reinforcementsReceived) {
        errors.push({ code: "BATTLE_CONSERVATION", path: side, message: "Battle participant accounting is not conserved." });
      }
      if (active > 0) {
        Object.keys(participant.units).forEach(function (unitId) {
          if (!Object.prototype.hasOwnProperty.call(config.unitPower, unitId)) {
            errors.push({ code: "BATTLE_UNIT_UNKNOWN", path: side + ".units." + unitId, message: "Battle unit is unknown." });
          }
        });
      }
    } catch (caught) {
      errors.push({ code: "BATTLE_UNIT_STATE", path: side + ".units", message: caught.message });
    }
    if (!Number.isFinite(participant.morale) || participant.morale < 0 || participant.morale > 100 || !Number.isFinite(participant.supply) || participant.supply < 0 || participant.supply > 100) {
      errors.push({ code: "BATTLE_READINESS", path: side, message: "Battle morale or supply is invalid." });
    }
    if (!Array.isArray(participant.woundedQueue)) {
      errors.push({ code: "BATTLE_WOUNDED_QUEUE", path: side + ".woundedQueue", message: "Wounded queue must be an array." });
    } else {
      var queuedWounded = 0;
      participant.woundedQueue.forEach(function (entry, index) {
        var path = side + ".woundedQueue[" + index + "]";
        if (!hasExactFields(entry, ["units", "remainingTurns"]) || !Number.isSafeInteger(entry.remainingTurns) || entry.remainingTurns < 1) {
          errors.push({ code: "BATTLE_WOUNDED_ENTRY", path: path, message: "Wounded recovery entry is invalid." });
          return;
        }
        try {
          queuedWounded += casualties.countUnits(entry.units);
        } catch (caught) {
          errors.push({ code: "BATTLE_WOUNDED_UNITS", path: path + ".units", message: caught.message });
        }
      });
      if (contracts.isPlainObject(participant.casualties) && queuedWounded !== participant.casualties.wounded) {
        errors.push({ code: "BATTLE_WOUNDED_TOTAL", path: side + ".woundedQueue", message: "Wounded queue must account for all wounded soldiers." });
      }
    }
    return errors;
  }

  function validateBattle(battle, config) {
    var errors = [];
    if (!contracts.isPlainObject(battle)) {
      return [{ code: "BATTLE_STATE", path: "battle", message: "Battle state must be an object." }];
    }
    if (!hasExactFields(battle, BATTLE_FIELDS)) {
      errors.push({ code: "BATTLE_FIELDS", path: "battle", message: "Battle has unknown or missing fields." });
    }
    ["id", "sourceProvinceId", "targetProvinceId"].forEach(function (field) {
      if (typeof battle[field] !== "string" || !ID_PATTERN.test(battle[field])) {
        errors.push({ code: "BATTLE_ID", path: "battle." + field, message: "Battle identifier is invalid." });
      }
    });
    if (battle.sourceProvinceId === battle.targetProvinceId) {
      errors.push({ code: "BATTLE_PROVINCES", path: "battle.targetProvinceId", message: "Battle source and target must differ." });
    }
    if (!Object.prototype.hasOwnProperty.call(config.terrain, battle.terrain)) {
      errors.push({ code: "BATTLE_TERRAIN", path: "battle.terrain", message: "Battle terrain is unknown." });
    }
    if (!Number.isSafeInteger(battle.turn) || battle.turn < 0 || ["active", "attacker-victory", "defender-victory", "attacker-retreated", "mutual-rout"].indexOf(battle.status) === -1) {
      errors.push({ code: "BATTLE_STATUS", path: "battle.status", message: "Battle status or turn is invalid." });
    }
    SIDES.forEach(function (side) { errors.push.apply(errors, validateParticipant(battle[side], side, config)); });
    if (!Array.isArray(battle.reinforcementQueue)) {
      errors.push({ code: "BATTLE_REINFORCEMENTS", path: "battle.reinforcementQueue", message: "Battle reinforcement queue must be an array." });
    } else {
      var requestIds = Object.create(null);
      battle.reinforcementQueue.forEach(function (entry, index) {
        var path = "battle.reinforcementQueue[" + index + "]";
        if (!hasExactFields(entry, ["requestId", "side", "arrivalTurn", "units"])) {
          errors.push({ code: "BATTLE_REINFORCEMENT_FIELDS", path: path, message: "Reinforcement entry fields are invalid." });
          return;
        }
        if (typeof entry.requestId !== "string" || !ID_PATTERN.test(entry.requestId) || requestIds[entry.requestId]) {
          errors.push({ code: "BATTLE_REINFORCEMENT_ID", path: path + ".requestId", message: "Reinforcement request ID is invalid or duplicated." });
        }
        requestIds[entry.requestId] = true;
        if (SIDES.indexOf(entry.side) === -1 || !Number.isSafeInteger(entry.arrivalTurn) || entry.arrivalTurn <= battle.turn) {
          errors.push({ code: "BATTLE_REINFORCEMENT_STATE", path: path, message: "Reinforcement side or arrival turn is invalid." });
        }
        try {
          validateUnits(entry.units, config);
        } catch (caught) {
          errors.push({ code: "BATTLE_REINFORCEMENT_UNITS", path: path + ".units", message: caught.message });
        }
      });
    }
    if (!hasExactFields(battle.fortification, ["current", "maximum"]) || !Number.isFinite(battle.fortification.current) || !Number.isFinite(battle.fortification.maximum) || battle.fortification.current < 0 || battle.fortification.current > battle.fortification.maximum) {
      errors.push({ code: "BATTLE_FORTIFICATION", path: "battle.fortification", message: "Battle fortification is invalid." });
    }
    if (!Number.isFinite(battle.breach) || battle.breach < 0 || battle.breach > 100) {
      errors.push({ code: "BATTLE_BREACH", path: "battle.breach", message: "Battle breach is invalid." });
    }
    if (!hasExactFields(battle.tactics, ["attacker", "defender"]) || SIDES.some(function (side) { return tactics.TACTIC_IDS.indexOf(battle.tactics[side]) === -1; })) {
      errors.push({ code: "BATTLE_TACTICS", path: "battle.tactics", message: "Battle tactics state is invalid." });
    }
    if (battle.status === "active") {
      if (battle.winnerFactionId !== null || battle.outcome !== null) {
        errors.push({ code: "BATTLE_ACTIVE_OUTCOME", path: "battle.outcome", message: "Active battle cannot have a winner or outcome." });
      }
    } else {
      if (!contracts.isPlainObject(battle.outcome)) {
        errors.push({ code: "BATTLE_OUTCOME", path: "battle.outcome", message: "Completed battle requires an outcome." });
      }
      var attackerId = contracts.isPlainObject(battle.attacker) ? battle.attacker.factionId : null;
      var defenderId = contracts.isPlainObject(battle.defender) ? battle.defender.factionId : null;
      var expectedWinner = battle.status === "attacker-victory" ? attackerId :
        (battle.status === "defender-victory" || battle.status === "attacker-retreated" ? defenderId : null);
      if (battle.winnerFactionId !== expectedWinner) {
        errors.push({ code: "BATTLE_WINNER", path: "battle.winnerFactionId", message: "Battle winner does not match status." });
      }
    }
    return errors;
  }

  function assertBattle(battle, config) {
    var errors = validateBattle(battle, config);
    if (errors.length > 0) {
      throw new TypeError(errors[0].code + ": " + errors[0].message);
    }
  }

  function moraleFactor(value, minimum) {
    return value <= 0 ? 0 : minimum + (1 - minimum) * value / 100;
  }

  function effectivePower(participant, side, battle, tactic, config) {
    var base = Object.keys(participant.units).reduce(function (total, unitId) {
      return total + participant.units[unitId] * config.unitPower[unitId];
    }, 0);
    if (base <= 0 || participant.morale <= config.morale.routThreshold) {
      return 0;
    }
    var terrainFactor = side === "defender" ? config.terrain[battle.terrain] : 1;
    var fortificationRatio = battle.fortification.maximum === 0 ? 0 : battle.fortification.current / battle.fortification.maximum;
    var fortificationFactor = side === "defender" ? 1 + fortificationRatio * config.power.fortificationDefenseBonus : 1;
    return base *
      moraleFactor(participant.morale, config.power.minimumMoraleFactor) *
      moraleFactor(participant.supply, config.power.minimumSupplyFactor) *
      terrainFactor * fortificationFactor * tactic.power;
  }

  function drawVariance(rngState, config) {
    var draw = rng.nextFloat(rngState, config.stream);
    return {
      rngState: draw.state,
      value: config.attrition.varianceMin + draw.value * (config.attrition.varianceMax - config.attrition.varianceMin),
    };
  }

  function lossRate(selfPower, enemyPower, selfTactic, enemyTactic, variance, config) {
    if (selfPower <= 0 || enemyPower <= 0) {
      return 0;
    }
    var raw = config.attrition.baseRate * Math.sqrt(enemyPower / selfPower) * selfTactic.exposure * enemyTactic.damage * variance;
    return clamp(raw, selfTactic.minLoss, Math.min(selfTactic.maxLoss, config.attrition.directLossCap));
  }

  function lossCount(active, rate, cap) {
    if (active <= 0 || rate <= 0) {
      return 0;
    }
    var maximum = Math.max(1, Math.floor(active * cap));
    return Math.min(active, maximum, Math.max(1, Math.round(active * rate)));
  }

  function deliverReinforcements(battle, nextTurn) {
    var next = contracts.cloneJson(battle);
    var delivered = [];
    var pending = [];
    next.reinforcementQueue.forEach(function (entry) {
      if (entry.arrivalTurn <= nextTurn) {
        var result = casualties.addReinforcement(next[entry.side], entry.units);
        next[entry.side] = result.participant;
        delivered.push({ side: entry.side, requestId: entry.requestId, count: result.added });
      } else {
        pending.push(entry);
      }
    });
    next.reinforcementQueue = pending;
    return { battle: next, delivered: delivered };
  }

  function queueReinforcement(battle, side, units, requestId, config) {
    assertBattle(battle, config);
    if (battle.status !== "active") {
      throw new RangeError("Cannot reinforce a completed battle.");
    }
    if (SIDES.indexOf(side) === -1 || typeof requestId !== "string" || !ID_PATTERN.test(requestId)) {
      throw new RangeError("Reinforcement side or request ID is invalid.");
    }
    var count = validateUnits(units, config);
    var arrivalTurn = battle.turn + config.reinforcement.delayTurns + 1;
    var queuedForTurn = battle.reinforcementQueue.filter(function (entry) {
      return entry.side === side && entry.arrivalTurn === arrivalTurn;
    }).reduce(function (total, entry) { return total + casualties.countUnits(entry.units); }, 0);
    var limit = Math.floor(battle[side].initialForce * config.reinforcement.maxInitialRate);
    if (count + queuedForTurn > limit) {
      throw new RangeError("Reinforcement exceeds the per-turn initial-force limit.");
    }
    if (battle.reinforcementQueue.some(function (entry) { return entry.requestId === requestId; })) {
      throw new RangeError("Reinforcement request ID already exists.");
    }
    var next = contracts.cloneJson(battle);
    next.reinforcementQueue.push({ requestId: requestId, side: side, arrivalTurn: arrivalTurn, units: contracts.cloneJson(units) });
    return next;
  }

  function updateFortification(battle, attackerTactic, rngState, config) {
    if (battle.fortification.current <= 0 || attackerTactic.breachMax <= 0) {
      return { battle: battle, rngState: rngState, breachDamage: 0 };
    }
    var minimum = Math.round(attackerTactic.breachMin);
    var maximum = Math.round(attackerTactic.breachMax);
    var draw = rng.nextInt(rngState, config.stream, minimum, maximum);
    var next = contracts.cloneJson(battle);
    var damage = Math.min(next.fortification.current, draw.value);
    next.fortification.current -= damage;
    next.breach = next.fortification.maximum === 0 ? 100 : Math.round((1 - next.fortification.current / next.fortification.maximum) * 10000) / 100;
    return { battle: next, rngState: draw.state, breachDamage: damage };
  }

  function moraleLoss(side, rate, selfPower, enemyPower, participant, battle, selfTactic, enemyTactic, config) {
    var strengthRatio = selfPower <= 0 ? 4 : enemyPower / selfPower;
    var strengthPressure = clamp(Math.max(0, strengthRatio - 1) * config.morale.strengthPressureFactor, 0, config.morale.strengthPressureCap);
    var fatigue = Math.max(0, battle.turn - config.morale.fatigueStartTurn) * config.morale.fatiguePerTurn;
    var supplyPressure = (100 - participant.supply) * config.morale.supplyPressureFactor;
    var shock = enemyTactic === config.tactics.assault ? config.morale.assaultShock : 0;
    var fortificationRatio = battle.fortification.maximum === 0 ? 0 : battle.fortification.current / battle.fortification.maximum;
    var shield = side === "defender" ? fortificationRatio * config.morale.fortificationShield : 0;
    return Math.max(0, config.morale.baseLoss + rate * config.morale.lossRateFactor + strengthPressure + fatigue + supplyPressure + shock - shield - selfTactic.moraleRecovery);
  }

  function settleReadiness(participant, rate, tactic, turn, enemyTacticId, side, battle, selfPower, enemyPower, config) {
    var next = contracts.cloneJson(participant);
    var enemyTactic = config.tactics[enemyTacticId];
    var amount = moraleLoss(side, rate, selfPower, enemyPower, participant, battle, tactic, enemyTactic, config);
    next.morale = Math.round(clamp(next.morale - amount, 0, 100) * 100) / 100;
    var lateDrain = turn >= config.supply.lateTurn ? config.supply.lateDrain : 0;
    var siegeDrain = side === "defender" && enemyTacticId === "siege" ? config.supply.siegeDrain : 0;
    next.supply = Math.round(clamp(next.supply - config.supply.baseDrain - lateDrain - siegeDrain, 0, 100) * 100) / 100;
    return { participant: next, moraleLoss: amount, supplyDrain: config.supply.baseDrain + lateDrain + siegeDrain };
  }

  function finishBattle(battle, winnerSide, reason, config) {
    var loserSide = winnerSide === "attacker" ? "defender" : "attacker";
    var capturedRate = loserSide === "defender" ? config.retreat.defenderCapturedRate : 0;
    var defeated = casualties.defeatRemaining(battle[loserSide], capturedRate);
    var next = contracts.cloneJson(battle);
    next[loserSide] = defeated.participant;
    next.status = winnerSide + "-victory";
    next.winnerFactionId = next[winnerSide].factionId;
    next.outcome = { winnerSide: winnerSide, reason: reason, defeated: defeated.breakdown };
    return next;
  }

  function finishMutualRout(battle, config) {
    var attackerDefeat = casualties.defeatRemaining(battle.attacker, 0);
    var defenderDefeat = casualties.defeatRemaining(battle.defender, 0);
    var next = contracts.cloneJson(battle);
    next.attacker = attackerDefeat.participant;
    next.defender = defenderDefeat.participant;
    next.status = "mutual-rout";
    next.winnerFactionId = null;
    next.outcome = {
      winnerSide: null,
      reason: "mutual-rout",
      attackerDefeated: attackerDefeat.breakdown,
      defenderDefeated: defenderDefeat.breakdown,
    };
    return next;
  }

  function resolveRetreat(battle, retreatingSide, rngState, config) {
    var pursuingSide = retreatingSide === "attacker" ? "defender" : "attacker";
    var retreating = battle[retreatingSide];
    var retreatTactic = config.tactics.retreat;
    var pursuingTactic = config.tactics[battle.tactics[pursuingSide]];
    var selfPower = effectivePower(retreating, retreatingSide, battle, retreatTactic, config);
    var enemyPower = effectivePower(battle[pursuingSide], pursuingSide, battle, pursuingTactic, config);
    var draw = drawVariance(rngState, config);
    var ratio = selfPower <= 0 ? 4 : Math.sqrt(enemyPower / selfPower);
    var rate = enemyPower <= 0 ? 0 : clamp(config.retreat.pursuitMinRate * ratio * draw.value, config.retreat.pursuitMinRate, config.retreat.pursuitMaxRate);
    var count = lossCount(casualties.countUnits(retreating.units), rate, config.attrition.directLossCap);
    var loss = casualties.applyDirectLosses(retreating, count, config.casualties);
    var next = contracts.cloneJson(battle);
    next[retreatingSide] = loss.participant;
    next.turn += 1;
    var withdrawnUnits = contracts.cloneJson(next[retreatingSide].units);
    if (retreatingSide === "attacker") {
      next.status = "attacker-retreated";
      next.winnerFactionId = next.defender.factionId;
      next.outcome = { winnerSide: "defender", reason: "retreat", pursuit: loss.breakdown, withdrawnUnits: withdrawnUnits };
    } else {
      next.status = "attacker-victory";
      next.winnerFactionId = next.attacker.factionId;
      next.outcome = { winnerSide: "attacker", reason: "defender-retreat", pursuit: loss.breakdown, withdrawnUnits: withdrawnUnits };
    }
    return {
      battle: next,
      rngState: draw.rngState,
      report: { turn: next.turn, retreatingSide: retreatingSide, pursuitLosses: count },
      events: [
        { type: "BATTLE_RETREAT_RESOLVED", payload: { battleId: next.id, side: retreatingSide, losses: count } },
        { type: "BATTLE_ENDED", payload: { battleId: next.id, winnerFactionId: next.winnerFactionId, reason: next.outcome.reason } },
      ],
    };
  }

  function resolvePulse(battle, action, rngState, config) {
    validateConfig(config);
    assertBattle(battle, config);
    if (battle.status !== "active") {
      throw new RangeError("Cannot resolve a completed battle.");
    }
    if (!contracts.isPlainObject(action)) {
      throw new TypeError("Battle action must be an object.");
    }
    var attackerTacticId = action.attackerTactic;
    var defenderTacticId = action.defenderTactic;
    var selectionErrors = tactics.validateSelection("attacker", attackerTacticId, battle, config.tactics, config.fortification.assaultBreachThreshold)
      .concat(tactics.validateSelection("defender", defenderTacticId, battle, config.tactics, config.fortification.assaultBreachThreshold));
    if (selectionErrors.length > 0) {
      throw new RangeError(selectionErrors[0].code + ": " + selectionErrors[0].message);
    }
    var delivered = deliverReinforcements(battle, battle.turn + 1);
    var working = delivered.battle;
    working.tactics = { attacker: attackerTacticId, defender: defenderTacticId };
    if (attackerTacticId === "retreat" && defenderTacticId === "retreat") {
      throw new RangeError("Both battle participants cannot retreat in the same pulse.");
    }
    if (attackerTacticId === "retreat") {
      return resolveRetreat(working, "attacker", rngState, config);
    }
    if (defenderTacticId === "retreat") {
      return resolveRetreat(working, "defender", rngState, config);
    }
    var attackerTactic = config.tactics[attackerTacticId];
    var defenderTactic = config.tactics[defenderTacticId];
    var attackerPower = effectivePower(working.attacker, "attacker", working, attackerTactic, config);
    var defenderPower = effectivePower(working.defender, "defender", working, defenderTactic, config);
    var attackerVariance = drawVariance(rngState, config);
    var defenderVariance = drawVariance(attackerVariance.rngState, config);
    var attackerLossRate = lossRate(attackerPower, defenderPower, attackerTactic, defenderTactic, attackerVariance.value, config);
    var defenderLossRate = lossRate(defenderPower, attackerPower, defenderTactic, attackerTactic, defenderVariance.value, config);
    var attackerActive = casualties.countUnits(working.attacker.units);
    var defenderActive = casualties.countUnits(working.defender.units);
    var attackerLossCount = lossCount(attackerActive, attackerLossRate, config.attrition.directLossCap);
    var defenderLossCount = lossCount(defenderActive, defenderLossRate, config.attrition.directLossCap);
    var attackerLoss = casualties.applyDirectLosses(working.attacker, attackerLossCount, config.casualties);
    var defenderLoss = casualties.applyDirectLosses(working.defender, defenderLossCount, config.casualties);
    working.attacker = attackerLoss.participant;
    working.defender = defenderLoss.participant;
    working.turn += 1;
    var fortification = updateFortification(working, attackerTactic, defenderVariance.rngState, config);
    working = fortification.battle;
    var attackerReadiness = settleReadiness(working.attacker, attackerLossRate, attackerTactic, working.turn, defenderTacticId, "attacker", working, attackerPower, defenderPower, config);
    var defenderReadiness = settleReadiness(working.defender, defenderLossRate, defenderTactic, working.turn, attackerTacticId, "defender", working, defenderPower, attackerPower, config);
    working.attacker = attackerReadiness.participant;
    working.defender = defenderReadiness.participant;
    var attackerDefeated = casualties.countUnits(working.attacker.units) === 0 || working.attacker.morale <= config.morale.routThreshold;
    var defenderDefeated = casualties.countUnits(working.defender.units) === 0 || working.defender.morale <= config.morale.routThreshold;
    if (attackerDefeated || defenderDefeated) {
      var winnerSide;
      if (attackerDefeated && defenderDefeated) {
        working = finishMutualRout(working, config);
      } else {
        winnerSide = defenderDefeated ? "attacker" : "defender";
        working = finishBattle(working, winnerSide, "rout", config);
      }
    }
    assertBattle(working, config);
    var report = {
      turn: working.turn,
      tactics: { attacker: attackerTacticId, defender: defenderTacticId },
      power: { attacker: attackerPower, defender: defenderPower },
      lossRates: { attacker: attackerLossRate, defender: defenderLossRate },
      losses: { attacker: attackerLoss.breakdown, defender: defenderLoss.breakdown },
      moraleLoss: { attacker: attackerReadiness.moraleLoss, defender: defenderReadiness.moraleLoss },
      supplyDrain: { attacker: attackerReadiness.supplyDrain, defender: defenderReadiness.supplyDrain },
      breachDamage: fortification.breachDamage,
      deliveredReinforcements: delivered.delivered,
    };
    var events = [
      { type: "BATTLE_PULSE_RESOLVED", payload: {
        battleId: working.id,
        turn: working.turn,
        attackerTactic: attackerTacticId,
        defenderTactic: defenderTacticId,
        attackerLosses: attackerLossCount,
        defenderLosses: defenderLossCount,
      } },
    ];
    delivered.delivered.forEach(function (entry) {
      events.push({ type: "BATTLE_REINFORCEMENT_ARRIVED", payload: { battleId: working.id, side: entry.side, count: entry.count, requestId: entry.requestId } });
    });
    if (working.status !== "active") {
      events.push({ type: "BATTLE_ENDED", payload: { battleId: working.id, winnerFactionId: working.winnerFactionId, reason: working.outcome.reason } });
      if (working.status === "attacker-victory") {
        events.push({ type: "PROVINCE_CAPTURED", payload: { battleId: working.id, provinceId: working.targetProvinceId, newOwnerId: working.attacker.factionId, previousOwnerId: working.defender.factionId } });
      }
    }
    return { battle: working, rngState: fortification.rngState, report: report, events: events };
  }

  function createHandlers(config) {
    validateConfig(config);
    return {
      QUEUE_BATTLE_REINFORCEMENT: function queueBattleReinforcementHandler(draft, action) {
        var payload = action.payload;
        if (draft.phase !== config.phases.action && draft.phase !== config.phases.resolution) {
          throw new RangeError("Battle reinforcement is not available in the current phase.");
        }
        if (!contracts.isPlainObject(payload) || !Object.prototype.hasOwnProperty.call(draft.battles, payload.battleId)) {
          throw new RangeError("Reinforcement references an unknown battle.");
        }
        draft.battles[payload.battleId] = queueReinforcement(draft.battles[payload.battleId], payload.side, payload.units, action.id, config);
        return { events: [{ type: "BATTLE_REINFORCEMENT_QUEUED", payload: { battleId: payload.battleId, side: payload.side, requestId: action.id } }] };
      },
      RESOLVE_BATTLE_PULSE: function resolveBattlePulseHandler(draft, action) {
        var payload = action.payload;
        if (draft.phase !== config.phases.action && draft.phase !== config.phases.resolution) {
          throw new RangeError("Battle resolution is not available in the current phase.");
        }
        if (!contracts.isPlainObject(payload) || !Object.prototype.hasOwnProperty.call(draft.battles, payload.battleId)) {
          throw new RangeError("Battle resolution references an unknown battle.");
        }
        var result = resolvePulse(draft.battles[payload.battleId], payload, draft.rng, config);
        draft.battles[payload.battleId] = result.battle;
        draft.rng = result.rngState;
        draft.phase = config.phases.postPulse;
        return { events: result.events };
      },
    };
  }

  function createInvariant(config) {
    validateConfig(config);
    return function validateCombatState(state) {
      var errors = [];
      if (!contracts.isPlainObject(state) || !contracts.isPlainObject(state.battles)) {
        return [{ code: "BATTLE_MAP", path: "state.battles", message: "Battle map must be an object." }];
      }
      Object.keys(state.battles).sort().forEach(function (battleId) {
        validateBattle(state.battles[battleId], config).forEach(function (item) {
          errors.push({ code: item.code, path: "state.battles." + battleId + item.path.slice("battle".length), message: item.message });
        });
      });
      return errors;
    };
  }

  return {
    validateConfig: validateConfig,
    createParticipant: createParticipant,
    createBattle: createBattle,
    validateBattle: validateBattle,
    effectivePower: effectivePower,
    queueReinforcement: queueReinforcement,
    resolvePulse: resolvePulse,
    createHandlers: createHandlers,
    createInvariant: createInvariant,
  };
});
