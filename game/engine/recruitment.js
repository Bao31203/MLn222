(function (root, factory) {
  "use strict";
  var game = root.MLN222Game;
  if (
    !game ||
    !game.hasModule("contracts") ||
    !game.hasModule("population") ||
    !game.hasModule("economy")
  ) {
    throw new Error("Load population and economy modules before recruitment.js.");
  }
  var api = game.registerModule("recruitment", factory(
    game.contracts,
    game.population,
    game.economy
  ));
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function (contracts, population, economy) {
  "use strict";

  var ACTION_ID_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,95}$/;
  var STABLE_ID_PATTERN = /^[a-z][a-z0-9-]{0,63}$/;

  function error(code, path, message) {
    return { code: code, path: path, message: message };
  }

  function failure(province, faction, errors) {
    return {
      ok: false,
      province: province,
      faction: faction,
      event: null,
      errors: errors,
    };
  }

  function success(province, faction, event) {
    return {
      ok: true,
      province: province,
      faction: faction,
      event: event,
      errors: [],
    };
  }

  function isNonNegativeInteger(value) {
    return Number.isSafeInteger(value) && value >= 0;
  }

  function emptyUnitState() {
    return { field: 0, garrison: 0, training: 0, wounded: 0 };
  }

  function validateRecruitmentConfig(config) {
    if (!contracts.isPlainObject(config) || !contracts.isPlainObject(config.unitCosts)) {
      throw new TypeError("Recruitment config must define unit costs.");
    }
    if (typeof config.actionPhase !== "string") {
      throw new TypeError("Recruitment config must define the action phase.");
    }
    ["maxBatchSize", "trainingTurns", "actionPointCost"].forEach(function (field) {
      if (!Number.isSafeInteger(config[field]) || config[field] < 1) {
        throw new RangeError("Recruitment config field must be a positive safe integer: " + field);
      }
    });
    Object.keys(config.unitCosts).forEach(function (unitId) {
      var costs = config.unitCosts[unitId];
      if (!STABLE_ID_PATTERN.test(unitId) || !contracts.isPlainObject(costs)) {
        throw new TypeError("Recruitment unit cost entry is invalid: " + unitId);
      }
      ["food", "coin"].forEach(function (resource) {
        if (!Number.isFinite(costs[resource]) || costs[resource] < 0) {
          throw new RangeError("Recruitment cost must be non-negative and finite.");
        }
      });
    });
    if (typeof config.costRoundingMode !== "string") {
      throw new TypeError("Recruitment cost rounding mode must be configured.");
    }
    contracts.roundInteger(0, config.costRoundingMode);
  }

  function validateFactionForRecruitment(faction) {
    if (!contracts.isPlainObject(faction)) {
      return [error("RECRUIT_FACTION", "faction", "Faction must be an object.")];
    }
    var errors = [];
    if (!contracts.isPlainObject(faction.resources)) {
      errors.push(error("RECRUIT_RESOURCES", "faction.resources", "Faction resources are required."));
    } else {
      ["food", "coin"].forEach(function (resource) {
        if (!isNonNegativeInteger(faction.resources[resource])) {
          errors.push(error("RECRUIT_RESOURCE_VALUE", "faction.resources." + resource, "Resources must be non-negative safe integers."));
        }
      });
    }
    if (!isNonNegativeInteger(faction.actionPoints)) {
      errors.push(error("RECRUIT_ACTION_POINTS", "faction.actionPoints", "Action points must be a non-negative safe integer."));
    }
    if (!Array.isArray(faction.unlockedUnits) || faction.unlockedUnits.some(function (unitId) {
      return !STABLE_ID_PATTERN.test(unitId);
    })) {
      errors.push(error("RECRUIT_UNLOCKS", "faction.unlockedUnits", "Unlocked units must be a stable-ID array."));
    }
    return errors;
  }

  function calculateRecruitmentCost(count, unitId, config) {
    validateRecruitmentConfig(config);
    if (!Number.isSafeInteger(count) || count < 1 || count > config.maxBatchSize) {
      throw new RangeError("Recruitment count is outside the configured batch range.");
    }
    if (!Object.prototype.hasOwnProperty.call(config.unitCosts, unitId)) {
      throw new RangeError("Unknown recruitable unit: " + unitId);
    }
    var unitCost = config.unitCosts[unitId];
    var rawFood = count * unitCost.food;
    var rawCoin = count * unitCost.coin;
    if (!Number.isFinite(rawFood) || !Number.isFinite(rawCoin)) {
      throw new RangeError("Recruitment cost exceeded the finite numeric range.");
    }
    return {
      food: contracts.roundInteger(rawFood, config.costRoundingMode),
      coin: contracts.roundInteger(rawCoin, config.costRoundingMode),
      rawFood: rawFood,
      rawCoin: rawCoin,
    };
  }

  function queueRecruitment(province, faction, request, context, config) {
    validateRecruitmentConfig(config);
    var errors = [];
    if (!contracts.isPlainObject(province)) {
      return failure(province, faction, [error("RECRUIT_PROVINCE", "province", "Province must be an object.")]);
    }
    if (!contracts.isPlainObject(request) || !contracts.isPlainObject(context)) {
      return failure(province, faction, [error("RECRUIT_REQUEST", "request", "Recruitment request and context are required.")]);
    }
    errors.push.apply(errors, validateFactionForRecruitment(faction));
    errors.push.apply(errors, population.validatePopulation(province.population, "province.population"));
    if (!contracts.isPlainObject(province.units) || !Array.isArray(province.recruitmentQueue)) {
      errors.push(error("RECRUIT_PROVINCE_STATE", "province", "Province units and recruitment queue are required."));
    }
    if (!ACTION_ID_PATTERN.test(request.actionId || "")) {
      errors.push(error("RECRUIT_ACTION_ID", "request.actionId", "Recruitment action ID is invalid."));
    }
    if (!STABLE_ID_PATTERN.test(request.unitId || "")) {
      errors.push(error("RECRUIT_UNIT_ID", "request.unitId", "Recruitment unit ID is invalid."));
    }
    if (!Number.isSafeInteger(request.count) || request.count < 1 || request.count > config.maxBatchSize) {
      errors.push(error("RECRUIT_COUNT", "request.count", "Recruitment count is outside the configured batch range."));
    }
    if (!STABLE_ID_PATTERN.test(context.factionId || "") || !STABLE_ID_PATTERN.test(context.provinceId || "")) {
      errors.push(error("RECRUIT_CONTEXT_ID", "context", "Recruitment context IDs are invalid."));
    }
    if (errors.length > 0) {
      return failure(province, faction, errors);
    }

    var representedMilitary;
    try {
      representedMilitary = economy.countMilitary(province.units);
    } catch (caught) {
      return failure(province, faction, [error("RECRUIT_UNIT_STATE", "province.units", caught.message)]);
    }
    if (representedMilitary !== province.population.military) {
      return failure(province, faction, [error("RECRUIT_MILITARY_TOTAL", "province.units", "Unit statuses must equal military population.")]);
    }
    if (context.phase !== config.actionPhase) {
      errors.push(error("RECRUIT_PHASE", "context.phase", "Recruitment is only available during the action phase."));
    }
    if (province.ownerId !== context.factionId) {
      errors.push(error("RECRUIT_OWNER", "province.ownerId", "Faction does not own the recruitment province."));
    }
    if (!Object.prototype.hasOwnProperty.call(config.unitCosts, request.unitId)) {
      errors.push(error("RECRUIT_UNIT_UNKNOWN", "request.unitId", "Unit has no recruitment cost config."));
    }
    if (faction.unlockedUnits.indexOf(request.unitId) === -1) {
      errors.push(error("RECRUIT_UNIT_LOCKED", "request.unitId", "Unit is not unlocked."));
    }
    if (province.population.civilians < request.count) {
      errors.push(error("RECRUIT_CIVILIANS", "request.count", "Province does not have enough civilians."));
    }
    if (faction.actionPoints < config.actionPointCost) {
      errors.push(error("RECRUIT_ACTION_POINTS", "faction.actionPoints", "Faction does not have enough action points."));
    }
    if (province.recruitmentQueue.some(function (entry) { return entry.id === request.actionId; })) {
      errors.push(error("RECRUIT_QUEUE_ID", "request.actionId", "Recruitment queue ID already exists."));
    }

    var cost;
    if (Object.prototype.hasOwnProperty.call(config.unitCosts, request.unitId)) {
      try {
        cost = calculateRecruitmentCost(request.count, request.unitId, config);
      } catch (caught) {
        errors.push(error("RECRUIT_COST", "request.count", caught.message));
      }
    }
    if (cost && faction.resources.food < cost.food) {
      errors.push(error("RECRUIT_FOOD", "faction.resources.food", "Faction does not have enough food."));
    }
    if (cost && faction.resources.coin < cost.coin) {
      errors.push(error("RECRUIT_COIN", "faction.resources.coin", "Faction does not have enough coin."));
    }
    if (errors.length > 0) {
      return failure(province, faction, errors);
    }

    var nextProvince = contracts.cloneJson(province);
    var nextFaction = contracts.cloneJson(faction);
    if (!Object.prototype.hasOwnProperty.call(nextProvince.units, request.unitId)) {
      nextProvince.units[request.unitId] = emptyUnitState();
    }
    nextProvince.population.civilians -= request.count;
    nextProvince.population.military += request.count;
    nextProvince.units[request.unitId].training += request.count;
    nextProvince.recruitmentQueue.push({
      id: request.actionId,
      unitId: request.unitId,
      count: request.count,
      remainingTurns: config.trainingTurns,
    });
    nextFaction.resources.food -= cost.food;
    nextFaction.resources.coin -= cost.coin;
    nextFaction.actionPoints -= config.actionPointCost;

    if (
      population.validatePopulation(nextProvince.population).length > 0 ||
      economy.countMilitary(nextProvince.units) !== nextProvince.population.military
    ) {
      throw new Error("Recruitment produced an invalid province state.");
    }
    return success(nextProvince, nextFaction, {
      type: "RECRUITMENT_QUEUED",
      payload: {
        factionId: context.factionId,
        provinceId: context.provinceId,
        unitId: request.unitId,
        count: request.count,
        remainingTurns: config.trainingTurns,
        cost: { food: cost.food, coin: cost.coin },
      },
    });
  }

  function processRecruitmentQueue(province) {
    if (!contracts.isPlainObject(province) || !Array.isArray(province.recruitmentQueue)) {
      throw new TypeError("Province recruitment queue is required.");
    }
    var beforeTotal = economy.countMilitary(province.units);
    if (beforeTotal !== province.population.military) {
      throw new RangeError("Unit statuses must equal military population.");
    }
    var next = contracts.cloneJson(province);
    var pending = [];
    var events = [];
    next.recruitmentQueue.forEach(function (entry, index) {
      if (
        !contracts.isPlainObject(entry) ||
        !ACTION_ID_PATTERN.test(entry.id || "") ||
        !STABLE_ID_PATTERN.test(entry.unitId || "") ||
        !Number.isSafeInteger(entry.count) ||
        entry.count < 1 ||
        !Number.isSafeInteger(entry.remainingTurns) ||
        entry.remainingTurns < 1
      ) {
        throw new RangeError("Invalid recruitment queue entry at index " + index + ".");
      }
      if (!Object.prototype.hasOwnProperty.call(next.units, entry.unitId)) {
        throw new RangeError("Recruitment queue references unknown unit state: " + entry.unitId);
      }
      var remainingTurns = entry.remainingTurns - 1;
      if (remainingTurns > 0) {
        entry.remainingTurns = remainingTurns;
        pending.push(entry);
        return;
      }
      if (next.units[entry.unitId].training < entry.count) {
        throw new RangeError("Recruitment queue exceeds training unit count.");
      }
      next.units[entry.unitId].training -= entry.count;
      next.units[entry.unitId].garrison += entry.count;
      events.push({
        type: "RECRUITMENT_COMPLETED",
        payload: { queueId: entry.id, unitId: entry.unitId, count: entry.count },
      });
    });
    next.recruitmentQueue = pending;
    if (economy.countMilitary(next.units) !== beforeTotal) {
      throw new Error("Recruitment completion changed military population.");
    }
    return { province: next, events: events };
  }

  function validateUnlockSpec(spec, unitId) {
    if (!contracts.isPlainObject(spec)) {
      throw new TypeError("Unlock config must be an object: " + unitId);
    }
    ["coinCost", "actionPointCost", "minTurn", "minProvinces"].forEach(function (field) {
      if (!isNonNegativeInteger(spec[field])) {
        throw new RangeError("Unlock config field must be a non-negative safe integer: " + field);
      }
    });
    if (!Array.isArray(spec.prerequisites) || spec.prerequisites.some(function (id) {
      return !STABLE_ID_PATTERN.test(id);
    })) {
      throw new TypeError("Unlock prerequisites must be a stable-ID array.");
    }
  }

  function unlockUnit(faction, request, context, config) {
    var errors = validateFactionForRecruitment(faction);
    if (!contracts.isPlainObject(request) || !contracts.isPlainObject(context) || !contracts.isPlainObject(config)) {
      return failure(null, faction, [error("UNLOCK_REQUEST", "request", "Unlock request, context, and config are required.")]);
    }
    if (!ACTION_ID_PATTERN.test(request.actionId || "") || !STABLE_ID_PATTERN.test(request.unitId || "")) {
      errors.push(error("UNLOCK_ID", "request", "Unlock action and unit IDs are invalid."));
    }
    if (context.phase !== config.actionPhase) {
      errors.push(error("UNLOCK_PHASE", "context.phase", "Unit unlock is only available during the action phase."));
    }
    if (!isNonNegativeInteger(context.turn) || context.turn < 1 || !isNonNegativeInteger(context.ownedProvinceCount)) {
      errors.push(error("UNLOCK_CONTEXT", "context", "Unlock turn and province count are invalid."));
    }
    if (!contracts.isPlainObject(config.unlocks) || !Object.prototype.hasOwnProperty.call(config.unlocks, request.unitId)) {
      errors.push(error("UNLOCK_UNKNOWN", "request.unitId", "Unit has no unlock config."));
    }
    if (!contracts.isPlainObject(config.unitCosts) || !Object.prototype.hasOwnProperty.call(config.unitCosts, request.unitId)) {
      errors.push(error("UNLOCK_UNIT_UNKNOWN", "request.unitId", "Unlocked unit has no recruitment cost config."));
    }
    if (errors.length > 0) {
      return failure(null, faction, errors);
    }

    var spec = config.unlocks[request.unitId];
    try {
      validateUnlockSpec(spec, request.unitId);
    } catch (caught) {
      return failure(null, faction, [error("UNLOCK_CONFIG", "config.unlocks." + request.unitId, caught.message)]);
    }
    if (faction.unlockedUnits.indexOf(request.unitId) !== -1) {
      errors.push(error("UNLOCK_DUPLICATE", "request.unitId", "Unit is already unlocked."));
    }
    if (context.turn < spec.minTurn) {
      errors.push(error("UNLOCK_TURN", "context.turn", "Campaign turn requirement is not met."));
    }
    if (context.ownedProvinceCount < spec.minProvinces) {
      errors.push(error("UNLOCK_PROVINCES", "context.ownedProvinceCount", "Province requirement is not met."));
    }
    spec.prerequisites.forEach(function (unitId) {
      if (faction.unlockedUnits.indexOf(unitId) === -1) {
        errors.push(error("UNLOCK_PREREQUISITE", "faction.unlockedUnits", "Missing prerequisite unit: " + unitId));
      }
    });
    if (faction.resources.coin < spec.coinCost) {
      errors.push(error("UNLOCK_COIN", "faction.resources.coin", "Faction does not have enough coin."));
    }
    if (faction.actionPoints < spec.actionPointCost) {
      errors.push(error("UNLOCK_ACTION_POINTS", "faction.actionPoints", "Faction does not have enough action points."));
    }
    if (errors.length > 0) {
      return failure(null, faction, errors);
    }

    var nextFaction = contracts.cloneJson(faction);
    nextFaction.resources.coin -= spec.coinCost;
    nextFaction.actionPoints -= spec.actionPointCost;
    nextFaction.unlockedUnits.push(request.unitId);
    nextFaction.unlockedUnits.sort();
    return success(null, nextFaction, {
      type: "UNIT_UNLOCKED",
      payload: {
        factionId: context.factionId,
        unitId: request.unitId,
        coinCost: spec.coinCost,
      },
    });
  }

  function throwResultError(result) {
    var first = result.errors[0];
    var caught = new Error(first.code + ": " + first.message);
    caught.code = first.code;
    throw caught;
  }

  function createHandlers(config) {
    validateRecruitmentConfig(config);
    if (!contracts.isPlainObject(config.unlocks)) {
      throw new TypeError("Recruitment config must define unit unlocks.");
    }
    Object.keys(config.unlocks).forEach(function (unitId) {
      validateUnlockSpec(config.unlocks[unitId], unitId);
      if (!Object.prototype.hasOwnProperty.call(config.unitCosts, unitId)) {
        throw new RangeError("Unlock unit has no recruitment cost config: " + unitId);
      }
    });
    return {
      RECRUIT_UNITS: function recruitUnitsHandler(draft, action, runtimeContext) {
        var payload = action.payload;
        if (!contracts.isPlainObject(payload)) {
          throw new TypeError("Recruitment payload must be an object.");
        }
        if (
          !STABLE_ID_PATTERN.test(payload.factionId || "") ||
          !STABLE_ID_PATTERN.test(payload.provinceId || "") ||
          !Object.prototype.hasOwnProperty.call(draft.factions, payload.factionId) ||
          !Object.prototype.hasOwnProperty.call(draft.provinces, payload.provinceId)
        ) {
          throw new Error("Recruitment payload references an unknown faction or province.");
        }
        var result = queueRecruitment(
          draft.provinces[payload.provinceId],
          draft.factions[payload.factionId],
          { actionId: action.id, unitId: payload.unitId, count: payload.count },
          {
            phase: draft.phase,
            factionId: payload.factionId,
            provinceId: payload.provinceId,
          },
          config
        );
        if (!result.ok) {
          throwResultError(result);
        }
        draft.provinces[payload.provinceId] = result.province;
        draft.factions[payload.factionId] = result.faction;
        runtimeContext.emit(result.event.type, result.event.payload);
      },
      UNLOCK_UNIT: function unlockUnitHandler(draft, action, runtimeContext) {
        var payload = action.payload;
        if (!contracts.isPlainObject(payload)) {
          throw new TypeError("Unlock payload must be an object.");
        }
        if (
          !STABLE_ID_PATTERN.test(payload.factionId || "") ||
          !Object.prototype.hasOwnProperty.call(draft.factions, payload.factionId)
        ) {
          throw new Error("Unlock payload references an unknown faction.");
        }
        var ownedProvinceCount = Object.keys(draft.provinces).filter(function (provinceId) {
          return draft.provinces[provinceId].ownerId === payload.factionId;
        }).length;
        var result = unlockUnit(
          draft.factions[payload.factionId],
          { actionId: action.id, unitId: payload.unitId },
          {
            phase: draft.phase,
            turn: draft.turn,
            ownedProvinceCount: ownedProvinceCount,
            factionId: payload.factionId,
          },
          config
        );
        if (!result.ok) {
          throwResultError(result);
        }
        draft.factions[payload.factionId] = result.faction;
        runtimeContext.emit(result.event.type, result.event.payload);
      },
    };
  }

  return {
    emptyUnitState: emptyUnitState,
    calculateRecruitmentCost: calculateRecruitmentCost,
    queueRecruitment: queueRecruitment,
    processRecruitmentQueue: processRecruitmentQueue,
    unlockUnit: unlockUnit,
    createHandlers: createHandlers,
  };
});
