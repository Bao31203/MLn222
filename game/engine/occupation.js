(function (root, factory) {
  "use strict";
  var game = root.MLN222Game;
  if (!game || !game.hasModule("contracts")) throw new Error("Load core modules before occupation.js.");
  var api = game.registerModule("occupation", factory(game.contracts));
  if (typeof module === "object" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function (contracts) {
  "use strict";

  function validateConfig(config) {
    if (!contracts.isPlainObject(config) || !Number.isSafeInteger(config.turns) || config.turns < 1 || !Array.isArray(config.productionMultipliers) || !Array.isArray(config.growthMultipliers) || config.productionMultipliers.length !== config.turns || config.growthMultipliers.length !== config.turns || typeof config.recruitmentBlocked !== "boolean") {
      throw new TypeError("Occupation config is invalid.");
    }
    config.productionMultipliers.concat(config.growthMultipliers).forEach(function (value) {
      if (!Number.isFinite(value) || value < 0 || value > 1) throw new RangeError("Occupation multiplier must be between zero and one.");
    });
    return true;
  }

  function startOccupation(province, occupierId, previousOwnerId, turn, config) {
    validateConfig(config);
    if (!contracts.isPlainObject(province) || typeof occupierId !== "string" || typeof previousOwnerId !== "string" || occupierId === previousOwnerId || !Number.isSafeInteger(turn) || turn < 1) {
      throw new RangeError("Occupation input is invalid.");
    }
    var next = contracts.cloneJson(province);
    next.ownerId = occupierId;
    next.occupation = {
      occupierId: occupierId,
      previousOwnerId: previousOwnerId,
      startedTurn: turn,
      remainingTurns: config.turns,
      totalTurns: config.turns,
    };
    return {
      province: next,
      event: { type: "OCCUPATION_STARTED", payload: { occupierId: occupierId, previousOwnerId: previousOwnerId, turn: turn, remainingTurns: config.turns } },
    };
  }

  function modifiers(province, config) {
    validateConfig(config);
    if (!contracts.isPlainObject(province)) throw new TypeError("Province is invalid.");
    if (province.occupation === null || province.occupation === undefined) {
      return { production: 1, growth: 1, recruitmentBlocked: false };
    }
    var occupation = province.occupation;
    if (!contracts.isPlainObject(occupation) || !Number.isSafeInteger(occupation.remainingTurns) || occupation.remainingTurns < 1 || occupation.remainingTurns > config.turns) {
      throw new RangeError("Province occupation state is invalid.");
    }
    var elapsed = config.turns - occupation.remainingTurns;
    return {
      production: config.productionMultipliers[elapsed],
      growth: config.growthMultipliers[elapsed],
      recruitmentBlocked: config.recruitmentBlocked,
    };
  }

  function advanceOccupations(state, config) {
    validateConfig(config);
    if (!contracts.isPlainObject(state) || !contracts.isPlainObject(state.provinces)) throw new TypeError("Campaign state is invalid.");
    var next = contracts.cloneGameState(state);
    var events = [];
    Object.keys(next.provinces).sort().forEach(function (provinceId) {
      var province = next.provinces[provinceId];
      if (province.occupation === null || province.occupation === undefined) return;
      if (!contracts.isPlainObject(province.occupation) || !Number.isSafeInteger(province.occupation.remainingTurns) || province.occupation.remainingTurns < 1) {
        throw new RangeError("Occupation state is invalid: " + provinceId);
      }
      province.occupation.remainingTurns -= 1;
      if (province.occupation.remainingTurns === 0) {
        var occupierId = province.occupation.occupierId;
        province.occupation = null;
        events.push({ type: "OCCUPATION_ENDED", payload: { provinceId: provinceId, occupierId: occupierId } });
      } else {
        events.push({ type: "OCCUPATION_ADVANCED", payload: { provinceId: provinceId, remainingTurns: province.occupation.remainingTurns } });
      }
    });
    return { state: next, events: events };
  }

  function validateProvince(province, path, config) {
    if (!contracts.isPlainObject(province)) return [{ code: "OCCUPATION_PROVINCE", path: path, message: "Province must be an object." }];
    if (province.occupation === null || province.occupation === undefined) return [];
    var value = province.occupation;
    var expected = ["occupierId", "previousOwnerId", "startedTurn", "remainingTurns", "totalTurns"];
    if (!contracts.isPlainObject(value) || JSON.stringify(Object.keys(value).sort()) !== JSON.stringify(expected.sort()) || value.occupierId !== province.ownerId || !Number.isSafeInteger(value.startedTurn) || value.startedTurn < 1 || !Number.isSafeInteger(value.remainingTurns) || value.remainingTurns < 1 || value.remainingTurns > config.turns || value.totalTurns !== config.turns) {
      return [{ code: "OCCUPATION_STATE", path: path + ".occupation", message: "Occupation state is invalid." }];
    }
    return [];
  }

  function createInvariant(config) {
    validateConfig(config);
    return function occupationInvariant(state) {
      var errors = [];
      if (!contracts.isPlainObject(state.provinces)) return [{ code: "OCCUPATION_MAP", path: "state.provinces", message: "Province map is invalid." }];
      Object.keys(state.provinces).sort().forEach(function (provinceId) {
        errors.push.apply(errors, validateProvince(state.provinces[provinceId], "state.provinces." + provinceId, config));
      });
      return errors;
    };
  }

  return {
    validateConfig: validateConfig,
    startOccupation: startOccupation,
    modifiers: modifiers,
    advanceOccupations: advanceOccupations,
    validateProvince: validateProvince,
    createInvariant: createInvariant,
  };
});
