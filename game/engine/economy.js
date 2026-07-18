(function (root, factory) {
  "use strict";
  var game = root.MLN222Game;
  if (!game || !game.hasModule("contracts") || !game.hasModule("population")) {
    throw new Error("Load contracts.js and population.js before economy.js.");
  }
  var api = game.registerModule("economy", factory(game.contracts, game.population));
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function (contracts, population) {
  "use strict";

  var PRODUCTION_FACTORS = Object.freeze([
    "agriculture",
    "coinEffects",
    "commerce",
    "foodEffects",
    "quiz",
    "stability",
  ]);
  var UNIT_STATUSES = Object.freeze(["field", "garrison", "training", "wounded"]);

  function requireNonNegativeInteger(value, name) {
    if (!Number.isSafeInteger(value) || value < 0) {
      throw new RangeError(name + " must be a non-negative safe integer.");
    }
    return value;
  }

  function requireNonNegativeNumber(value, name) {
    if (!Number.isFinite(value) || value < 0) {
      throw new RangeError(name + " must be non-negative and finite.");
    }
    return value;
  }

  function requireUnitState(value, unitId) {
    if (!contracts.isPlainObject(value)) {
      throw new TypeError("Unit state must be an object: " + unitId);
    }
    UNIT_STATUSES.forEach(function (status) {
      requireNonNegativeInteger(value[status], unitId + "." + status);
    });
  }

  function countMilitary(units) {
    if (!contracts.isPlainObject(units)) {
      throw new TypeError("Province units must be an object.");
    }
    var total = 0;
    Object.keys(units).sort().forEach(function (unitId) {
      requireUnitState(units[unitId], unitId);
      UNIT_STATUSES.forEach(function (status) {
        total += units[unitId][status];
        if (!Number.isSafeInteger(total)) {
          throw new RangeError("Military total exceeded the safe-integer range.");
        }
      });
    });
    return total;
  }

  function validateProductionConfig(config) {
    if (!contracts.isPlainObject(config)) {
      throw new TypeError("Production config must be an object.");
    }
    requireNonNegativeNumber(config.foodPerCivilian, "Food per civilian");
    requireNonNegativeNumber(config.coinPerCivilian, "Coin per civilian");
    requireNonNegativeNumber(config.mobilizationPenalty, "Mobilization productivity penalty");
    if (!Number.isFinite(config.minimumProductivity) || config.minimumProductivity < 0 || config.minimumProductivity > 1) {
      throw new RangeError("Minimum productivity must be between zero and one.");
    }
    if (typeof config.roundingMode !== "string") {
      throw new TypeError("Production rounding mode must be configured.");
    }
    contracts.roundInteger(0, config.roundingMode);
  }

  function productionFactors(input) {
    var factors = input === undefined ? {} : input;
    if (!contracts.isPlainObject(factors)) {
      throw new TypeError("Production factors must be an object.");
    }
    var result = {};
    PRODUCTION_FACTORS.forEach(function (field) {
      result[field] = factors[field] === undefined ? 1 : requireNonNegativeNumber(factors[field], field);
    });
    return result;
  }

  function calculateProductivity(populationState, config) {
    validateProductionConfig(config);
    var mobilization = population.mobilizationRatio(populationState);
    return {
      mobilization: mobilization,
      productivity: Math.max(
        config.minimumProductivity,
        1 - config.mobilizationPenalty * mobilization
      ),
    };
  }

  function calculateProduction(province, factors, config) {
    if (!contracts.isPlainObject(province)) {
      throw new TypeError("Province must be an object.");
    }
    var populationErrors = population.validatePopulation(province.population);
    if (populationErrors.length > 0) {
      throw new RangeError(populationErrors[0].message);
    }
    validateProductionConfig(config);
    var factorValues = productionFactors(factors);
    var productivity = calculateProductivity(province.population, config);
    var shared = productivity.productivity * factorValues.stability * factorValues.quiz;
    var rawFood = province.population.civilians
      * config.foodPerCivilian
      * factorValues.agriculture
      * factorValues.foodEffects
      * shared;
    var rawCoin = province.population.civilians
      * config.coinPerCivilian
      * factorValues.commerce
      * factorValues.coinEffects
      * shared;
    if (![rawFood, rawCoin].every(function (value) { return Number.isFinite(value) && value >= 0; })) {
      throw new RangeError("Calculated production must be non-negative and finite.");
    }
    return {
      food: contracts.roundInteger(rawFood, config.roundingMode),
      coin: contracts.roundInteger(rawCoin, config.roundingMode),
      rawFood: rawFood,
      rawCoin: rawCoin,
      civilians: province.population.civilians,
      mobilization: productivity.mobilization,
      productivity: productivity.productivity,
      factors: factorValues,
    };
  }

  function validateUpkeepConfig(config) {
    if (!contracts.isPlainObject(config) || !contracts.isPlainObject(config.unitUpkeep)) {
      throw new TypeError("Upkeep config must define unit costs.");
    }
    if (!contracts.isPlainObject(config.statusMultipliers)) {
      throw new TypeError("Upkeep config must define status multipliers.");
    }
    UNIT_STATUSES.forEach(function (status) {
      requireNonNegativeNumber(config.statusMultipliers[status], "Status multiplier " + status);
    });
    Object.keys(config.unitUpkeep).forEach(function (unitId) {
      var costs = config.unitUpkeep[unitId];
      if (!contracts.isPlainObject(costs)) {
        throw new TypeError("Unit upkeep must be an object: " + unitId);
      }
      requireNonNegativeNumber(costs.food, unitId + " food upkeep");
      requireNonNegativeNumber(costs.coin, unitId + " coin upkeep");
    });
    if (typeof config.roundingMode !== "string") {
      throw new TypeError("Upkeep rounding mode must be configured.");
    }
    contracts.roundInteger(0, config.roundingMode);
  }

  function calculateUpkeep(province, config) {
    if (!contracts.isPlainObject(province) || !contracts.isPlainObject(province.units)) {
      throw new TypeError("Province with unit state is required for upkeep.");
    }
    var populationErrors = population.validatePopulation(province.population);
    if (populationErrors.length > 0) {
      throw new RangeError(populationErrors[0].message);
    }
    validateUpkeepConfig(config);
    var representedMilitary = countMilitary(province.units);
    if (representedMilitary !== province.population.military) {
      throw new RangeError("Unit statuses must equal province military population.");
    }

    var rawFood = 0;
    var rawCoin = 0;
    var units = {};
    Object.keys(province.units).sort().forEach(function (unitId) {
      if (!Object.prototype.hasOwnProperty.call(config.unitUpkeep, unitId)) {
        throw new RangeError("Missing upkeep config for unit: " + unitId);
      }
      var unitState = province.units[unitId];
      var costs = config.unitUpkeep[unitId];
      var unitFood = 0;
      var unitCoin = 0;
      UNIT_STATUSES.forEach(function (status) {
        var multiplier = config.statusMultipliers[status];
        unitFood += unitState[status] * costs.food * multiplier;
        unitCoin += unitState[status] * costs.coin * multiplier;
      });
      rawFood += unitFood;
      rawCoin += unitCoin;
      units[unitId] = { rawFood: unitFood, rawCoin: unitCoin };
    });
    if (![rawFood, rawCoin].every(Number.isFinite)) {
      throw new RangeError("Calculated upkeep must be finite.");
    }
    return {
      food: contracts.roundInteger(rawFood, config.roundingMode),
      coin: contracts.roundInteger(rawCoin, config.roundingMode),
      rawFood: rawFood,
      rawCoin: rawCoin,
      military: representedMilitary,
      units: units,
    };
  }

  function validateShortageConfig(config) {
    if (!contracts.isPlainObject(config)) {
      throw new TypeError("Shortage config must be an object.");
    }
    [
      "supplyPenaltyAtFullShortage",
      "moralePenaltyAtFullShortage",
      "supplyRecovery",
      "moraleRecovery",
      "readinessMinimum",
      "readinessMaximum",
      "desertionAfterTurns",
    ].forEach(function (field) {
      requireNonNegativeInteger(config[field], field);
    });
    if (config.desertionAfterTurns < 1) {
      throw new RangeError("Desertion threshold must be a positive safe integer.");
    }
    if (!Number.isFinite(config.desertionRate) || config.desertionRate < 0 || config.desertionRate > 1) {
      throw new RangeError("Desertion rate cannot exceed one.");
    }
    if (config.readinessMaximum < config.readinessMinimum) {
      throw new RangeError("Readiness bounds are invalid.");
    }
    if (typeof config.penaltyRoundingMode !== "string" || typeof config.readinessRoundingMode !== "string") {
      throw new TypeError("Shortage rounding modes must be configured.");
    }
    contracts.roundInteger(0, config.penaltyRoundingMode);
    contracts.roundInteger(0, config.readinessRoundingMode);
  }

  function settleUpkeep(faction, demand, config) {
    if (!contracts.isPlainObject(faction)) {
      throw new TypeError("Faction must be an object.");
    }
    if (
      !contracts.isPlainObject(faction.resources) ||
      !contracts.isPlainObject(faction.crisis) ||
      !contracts.isPlainObject(faction.readiness) ||
      !contracts.isPlainObject(demand)
    ) {
      throw new TypeError("Faction economy state and upkeep demand must be objects.");
    }
    validateShortageConfig(config);
    ["food", "coin"].forEach(function (resource) {
      requireNonNegativeInteger(faction.resources[resource], "Faction resource " + resource);
      requireNonNegativeInteger(demand[resource], "Upkeep demand " + resource);
      requireNonNegativeInteger(faction.crisis[resource], "Crisis counter " + resource);
    });
    ["supply", "morale"].forEach(function (field) {
      requireNonNegativeInteger(faction.readiness[field], "Readiness " + field);
    });

    var next = contracts.cloneJson(faction);
    var foodPaid = Math.min(next.resources.food, demand.food);
    var coinPaid = Math.min(next.resources.coin, demand.coin);
    var foodShortage = demand.food - foodPaid;
    var coinShortage = demand.coin - coinPaid;
    next.resources.food -= foodPaid;
    next.resources.coin -= coinPaid;
    if (
      (foodShortage > 0 && !Number.isSafeInteger(next.crisis.food + 1)) ||
      (coinShortage > 0 && !Number.isSafeInteger(next.crisis.coin + 1))
    ) {
      throw new RangeError("Crisis counter exceeded the safe-integer range.");
    }
    next.crisis.food = foodShortage > 0 ? next.crisis.food + 1 : 0;
    next.crisis.coin = coinShortage > 0 ? next.crisis.coin + 1 : 0;

    var foodShortageRatio = demand.food === 0 ? 0 : foodShortage / demand.food;
    var coinShortageRatio = demand.coin === 0 ? 0 : coinShortage / demand.coin;
    var supplyDelta = foodShortage > 0
      ? -contracts.roundInteger(
        foodShortageRatio * config.supplyPenaltyAtFullShortage,
        config.penaltyRoundingMode
      )
      : config.supplyRecovery;
    var moraleDelta = coinShortage > 0
      ? -contracts.roundInteger(
        coinShortageRatio * config.moralePenaltyAtFullShortage,
        config.penaltyRoundingMode
      )
      : config.moraleRecovery;
    var previousSupply = next.readiness.supply;
    var previousMorale = next.readiness.morale;
    next.readiness.supply = contracts.roundInteger(contracts.clamp(
      next.readiness.supply + supplyDelta,
      config.readinessMinimum,
      config.readinessMaximum
    ), config.readinessRoundingMode);
    next.readiness.morale = contracts.roundInteger(contracts.clamp(
      next.readiness.morale + moraleDelta,
      config.readinessMinimum,
      config.readinessMaximum
    ), config.readinessRoundingMode);

    var crisisTurns = Math.max(next.crisis.food, next.crisis.coin);
    return {
      faction: next,
      breakdown: {
        demand: { food: demand.food, coin: demand.coin },
        paid: { food: foodPaid, coin: coinPaid },
        shortage: { food: foodShortage, coin: coinShortage },
        shortageRatio: { food: foodShortageRatio, coin: coinShortageRatio },
        readinessDelta: {
          supply: next.readiness.supply - previousSupply,
          morale: next.readiness.morale - previousMorale,
        },
        crisisTurns: crisisTurns,
        desertionRate: crisisTurns >= config.desertionAfterTurns ? config.desertionRate : 0,
      },
    };
  }

  function validateDesertionConfig(config) {
    if (!contracts.isPlainObject(config) || !Array.isArray(config.statuses) || config.statuses.length === 0) {
      throw new TypeError("Desertion config must define eligible statuses.");
    }
    config.statuses.forEach(function (status) {
      if (UNIT_STATUSES.indexOf(status) === -1) {
        throw new RangeError("Unknown desertion status: " + status);
      }
    });
    requireNonNegativeInteger(config.minimumDeserters, "Minimum deserters");
    if (typeof config.roundingMode !== "string") {
      throw new TypeError("Desertion rounding mode must be configured.");
    }
    contracts.roundInteger(0, config.roundingMode);
  }

  function applyDesertion(province, rate, config) {
    if (!Number.isFinite(rate) || rate < 0 || rate > 1) {
      throw new RangeError("Desertion rate must be between zero and one.");
    }
    validateDesertionConfig(config);
    var representedMilitary = countMilitary(province.units);
    if (representedMilitary !== province.population.military) {
      throw new RangeError("Unit statuses must equal province military population.");
    }
    var next = contracts.cloneJson(province);
    var entries = [];
    var eligibleTotal = 0;
    Object.keys(next.units).sort().forEach(function (unitId) {
      config.statuses.forEach(function (status, order) {
        var count = next.units[unitId][status];
        eligibleTotal += count;
        entries.push({ unitId: unitId, status: status, order: order, count: count, removed: 0, remainder: 0 });
      });
    });
    if (eligibleTotal === 0 || rate === 0) {
      return { province: next, breakdown: { eligible: eligibleTotal, deserters: 0, byUnit: {} } };
    }

    var roundedTarget = contracts.roundInteger(eligibleTotal * rate, config.roundingMode);
    var target = contracts.clamp(Math.max(config.minimumDeserters, roundedTarget), 0, eligibleTotal);
    var allocated = 0;
    entries.forEach(function (entry) {
      var exact = target * entry.count / eligibleTotal;
      entry.removed = Math.floor(exact);
      entry.remainder = exact - entry.removed;
      allocated += entry.removed;
    });
    entries.sort(function (left, right) {
      if (right.remainder !== left.remainder) {
        return right.remainder - left.remainder;
      }
      if (left.unitId !== right.unitId) {
        return left.unitId < right.unitId ? -1 : 1;
      }
      return left.order - right.order;
    });
    for (var remaining = target - allocated, index = 0; remaining > 0; index += 1) {
      var entry = entries[index % entries.length];
      if (entry.removed < entry.count) {
        entry.removed += 1;
        remaining -= 1;
      }
    }

    var byUnit = {};
    entries.forEach(function (entry) {
      next.units[entry.unitId][entry.status] -= entry.removed;
      byUnit[entry.unitId] = (byUnit[entry.unitId] || 0) + entry.removed;
    });
    next.population.military -= target;
    next.population.civilians += target;
    var populationErrors = population.validatePopulation(next.population);
    if (populationErrors.length > 0 || countMilitary(next.units) !== next.population.military) {
      throw new Error("Desertion produced an invalid province state.");
    }
    return {
      province: next,
      breakdown: { eligible: eligibleTotal, deserters: target, byUnit: byUnit },
    };
  }

  return {
    PRODUCTION_FACTORS: PRODUCTION_FACTORS,
    UNIT_STATUSES: UNIT_STATUSES,
    countMilitary: countMilitary,
    calculateProductivity: calculateProductivity,
    calculateProduction: calculateProduction,
    calculateUpkeep: calculateUpkeep,
    settleUpkeep: settleUpkeep,
    applyDesertion: applyDesertion,
  };
});
