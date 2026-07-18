(function (root, factory) {
  "use strict";
  var game = root.MLN222Game;
  if (
    !game ||
    !game.hasModule("contracts") ||
    !game.hasModule("population") ||
    !game.hasModule("economy") ||
    !game.hasModule("recruitment")
  ) {
    throw new Error("Load the economy engine modules before turn-economy.js.");
  }
  var api = game.registerModule("turn-economy", factory(
    game.contracts,
    game.population,
    game.economy,
    game.recruitment
  ));
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function (
  contracts,
  population,
  economy,
  recruitment
) {
  "use strict";

  function isNonNegativeInteger(value) {
    return Number.isSafeInteger(value) && value >= 0;
  }

  function safeAdd(left, right, name) {
    if (!isNonNegativeInteger(left) || !isNonNegativeInteger(right)) {
      throw new RangeError(name + " values must be non-negative safe integers.");
    }
    var result = left + right;
    if (!Number.isSafeInteger(result)) {
      throw new RangeError(name + " exceeded the safe-integer range.");
    }
    return result;
  }

  function validateConfig(config) {
    if (!contracts.isPlainObject(config)) {
      throw new TypeError("Turn economy config must be an object.");
    }
    if (typeof config.startPhase !== "string" || typeof config.actionPhase !== "string") {
      throw new TypeError("Turn economy phases must be strings.");
    }
    if (!Number.isSafeInteger(config.actionPointsPerTurn) || config.actionPointsPerTurn < 0) {
      throw new RangeError("Action points per turn must be a non-negative safe integer.");
    }
    ["population", "production", "upkeep", "shortage", "desertion"].forEach(function (field) {
      if (!contracts.isPlainObject(config[field])) {
        throw new TypeError("Turn economy config is missing: " + field);
      }
    });
  }

  function validateInputs(input, state) {
    var values = input === undefined ? {} : input;
    if (!contracts.isPlainObject(values)) {
      throw new TypeError("Turn economy inputs must be an object.");
    }
    var provinceFactors = values.provinceFactors === undefined ? {} : values.provinceFactors;
    var tradeCoinByFaction = values.tradeCoinByFaction === undefined ? {} : values.tradeCoinByFaction;
    if (!contracts.isPlainObject(provinceFactors) || !contracts.isPlainObject(tradeCoinByFaction)) {
      throw new TypeError("Turn economy factor and trade inputs must be objects.");
    }
    Object.keys(provinceFactors).forEach(function (provinceId) {
      if (!Object.prototype.hasOwnProperty.call(state.provinces, provinceId)) {
        throw new RangeError("Factors reference an unknown province: " + provinceId);
      }
      var factors = provinceFactors[provinceId];
      if (!contracts.isPlainObject(factors)) {
        throw new TypeError("Province factors must be an object: " + provinceId);
      }
      ["growth", "production"].forEach(function (field) {
        if (factors[field] !== undefined && !contracts.isPlainObject(factors[field])) {
          throw new TypeError("Province factor group must be an object: " + field);
        }
      });
    });
    Object.keys(tradeCoinByFaction).forEach(function (factionId) {
      if (!Object.prototype.hasOwnProperty.call(state.factions, factionId)) {
        throw new RangeError("Trade input references an unknown faction: " + factionId);
      }
      if (!isNonNegativeInteger(tradeCoinByFaction[factionId])) {
        throw new RangeError("Trade coin must be a non-negative safe integer.");
      }
    });
    return {
      provinceFactors: provinceFactors,
      tradeCoinByFaction: tradeCoinByFaction,
    };
  }

  function emptyFactionReport() {
    return {
      production: { food: 0, coin: 0 },
      tradeCoin: 0,
      upkeep: { food: 0, coin: 0 },
      shortage: null,
      deserters: 0,
    };
  }

  function appendProvinceEvent(events, eventDraft, provinceId) {
    var event = contracts.cloneJson(eventDraft);
    event.payload.provinceId = provinceId;
    events.push(event);
  }

  function startTurn(state, input, config) {
    validateConfig(config);
    if (
      !contracts.isPlainObject(state) ||
      !contracts.isPlainObject(state.factions) ||
      !contracts.isPlainObject(state.provinces)
    ) {
      throw new TypeError("Turn economy state must contain faction and province maps.");
    }
    if (state.phase !== config.startPhase) {
      throw new RangeError("Turn economy can only run during the configured start phase.");
    }
    var inputs = validateInputs(input, state);
    var next = contracts.cloneGameState(state);
    var events = [];
    var report = {
      turn: state.turn,
      order: ["training", "growth", "production", "trade", "upkeep", "shortage", "desertion", "actions"],
      provinces: {},
      factions: {},
    };
    var factionIds = Object.keys(next.factions).sort();
    var provinceIds = Object.keys(next.provinces).sort();
    factionIds.forEach(function (factionId) {
      report.factions[factionId] = emptyFactionReport();
    });

    provinceIds.forEach(function (provinceId) {
      var province = next.provinces[provinceId];
      if (
        !contracts.isPlainObject(province) ||
        typeof province.ownerId !== "string" ||
        !Object.prototype.hasOwnProperty.call(next.factions, province.ownerId)
      ) {
        throw new RangeError("Province has an unknown owner: " + provinceId);
      }
      var queueResult = recruitment.processRecruitmentQueue(province);
      next.provinces[provinceId] = queueResult.province;
      queueResult.events.forEach(function (eventDraft) {
        appendProvinceEvent(events, eventDraft, provinceId);
      });
    });

    provinceIds.forEach(function (provinceId) {
      var province = next.provinces[provinceId];
      var factorGroups = inputs.provinceFactors[provinceId] || {};
      var growthResult = population.applyGrowth(
        province.population,
        factorGroups.growth || {},
        config.population
      );
      province.population = growthResult.population;
      var productionResult = economy.calculateProduction(
        province,
        factorGroups.production || {},
        config.production
      );
      report.provinces[provinceId] = {
        growth: growthResult.breakdown,
        production: productionResult,
        upkeep: null,
        desertion: null,
      };
      var factionReport = report.factions[province.ownerId];
      factionReport.production.food = safeAdd(
        factionReport.production.food,
        productionResult.food,
        "Faction food production"
      );
      factionReport.production.coin = safeAdd(
        factionReport.production.coin,
        productionResult.coin,
        "Faction coin production"
      );
      events.push({
        type: "POPULATION_GREW",
        payload: { provinceId: provinceId, delta: growthResult.breakdown.delta },
      });
      events.push({
        type: "RESOURCES_PRODUCED",
        payload: { provinceId: provinceId, food: productionResult.food, coin: productionResult.coin },
      });
    });

    factionIds.forEach(function (factionId) {
      var faction = next.factions[factionId];
      var factionReport = report.factions[factionId];
      factionReport.tradeCoin = inputs.tradeCoinByFaction[factionId] || 0;
      faction.resources.food = safeAdd(
        faction.resources.food,
        factionReport.production.food,
        "Faction food stock"
      );
      faction.resources.coin = safeAdd(
        faction.resources.coin,
        safeAdd(factionReport.production.coin, factionReport.tradeCoin, "Faction coin income"),
        "Faction coin stock"
      );
    });

    provinceIds.forEach(function (provinceId) {
      var province = next.provinces[provinceId];
      var upkeep = economy.calculateUpkeep(province, config.upkeep);
      report.provinces[provinceId].upkeep = upkeep;
      var factionUpkeep = report.factions[province.ownerId].upkeep;
      factionUpkeep.food = safeAdd(factionUpkeep.food, upkeep.food, "Faction food upkeep");
      factionUpkeep.coin = safeAdd(factionUpkeep.coin, upkeep.coin, "Faction coin upkeep");
    });

    factionIds.forEach(function (factionId) {
      var settled = economy.settleUpkeep(
        next.factions[factionId],
        report.factions[factionId].upkeep,
        config.shortage
      );
      next.factions[factionId] = settled.faction;
      report.factions[factionId].shortage = settled.breakdown;
      events.push({
        type: "UPKEEP_SETTLED",
        payload: {
          factionId: factionId,
          foodShortage: settled.breakdown.shortage.food,
          coinShortage: settled.breakdown.shortage.coin,
        },
      });

      if (settled.breakdown.desertionRate > 0) {
        provinceIds.forEach(function (provinceId) {
          var province = next.provinces[provinceId];
          if (province.ownerId !== factionId) {
            return;
          }
          var desertion = economy.applyDesertion(
            province,
            settled.breakdown.desertionRate,
            config.desertion
          );
          next.provinces[provinceId] = desertion.province;
          report.provinces[provinceId].desertion = desertion.breakdown;
          report.factions[factionId].deserters = safeAdd(
            report.factions[factionId].deserters,
            desertion.breakdown.deserters,
            "Faction deserters"
          );
          if (desertion.breakdown.deserters > 0) {
            events.push({
              type: "DESERTION_OCCURRED",
              payload: {
                factionId: factionId,
                provinceId: provinceId,
                count: desertion.breakdown.deserters,
              },
            });
          }
        });
      }
      next.factions[factionId].actionPoints = config.actionPointsPerTurn;
    });

    next.phase = config.actionPhase;
    events.push({
      type: "TURN_ECONOMY_COMPLETED",
      payload: { turn: next.turn, actionPoints: config.actionPointsPerTurn },
    });
    return { state: next, report: report, events: events };
  }

  function createHandlers(config) {
    validateConfig(config);
    return {
      START_TURN_ECONOMY: function startTurnEconomyHandler(draft, action) {
        var result = startTurn(draft, action.payload, config);
        return { state: result.state, events: result.events };
      },
    };
  }

  return {
    startTurn: startTurn,
    createHandlers: createHandlers,
  };
});
