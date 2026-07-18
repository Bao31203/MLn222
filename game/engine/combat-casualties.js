(function (root, factory) {
  "use strict";
  var game = root.MLN222Game;
  if (!game || !game.hasModule("contracts")) {
    throw new Error("Load the core modules before combat-casualties.js.");
  }
  var api = game.registerModule("combat-casualties", factory(game.contracts));
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function (contracts) {
  "use strict";

  var CATEGORY_IDS = Object.freeze(["dead", "wounded", "routed", "captured"]);

  function requireCount(value, name) {
    if (!Number.isSafeInteger(value) || value < 0) {
      throw new RangeError(name + " must be a non-negative safe integer.");
    }
  }

  function countUnits(units) {
    if (!contracts.isPlainObject(units)) {
      throw new TypeError("Combat unit stacks must be an object.");
    }
    return Object.keys(units).reduce(function (total, unitId) {
      if (!/^[a-z][a-z0-9-]{0,47}$/.test(unitId)) {
        throw new RangeError("Combat unit ID is invalid: " + unitId);
      }
      requireCount(units[unitId], "units." + unitId);
      if (!Number.isSafeInteger(total + units[unitId])) {
        throw new RangeError("Combat unit total exceeded safe integer range.");
      }
      return total + units[unitId];
    }, 0);
  }

  function allocateInteger(total, weights) {
    requireCount(total, "allocation total");
    if (!contracts.isPlainObject(weights) || Object.keys(weights).length === 0) {
      throw new TypeError("Allocation weights must be a non-empty object.");
    }
    var keys = Object.keys(weights).sort();
    var weightTotal = 0;
    keys.forEach(function (key) {
      if (!Number.isFinite(weights[key]) || weights[key] < 0) {
        throw new RangeError("Allocation weight is invalid: " + key);
      }
      weightTotal += weights[key];
    });
    if (!Number.isFinite(weightTotal) || weightTotal <= 0) {
      throw new RangeError("Allocation weights must have a positive total.");
    }
    var result = {};
    var remainders = [];
    var assigned = 0;
    keys.forEach(function (key) {
      var raw = total * weights[key] / weightTotal;
      var base = Math.floor(raw);
      result[key] = base;
      assigned += base;
      remainders.push({ key: key, value: raw - base });
    });
    remainders.sort(function (left, right) {
      return right.value !== left.value ? right.value - left.value : left.key.localeCompare(right.key);
    });
    for (var index = 0; index < total - assigned; index += 1) {
      result[remainders[index % remainders.length].key] += 1;
    }
    return result;
  }

  function removeFromStacks(units, lossCount) {
    var active = countUnits(units);
    requireCount(lossCount, "lossCount");
    if (lossCount > active) {
      throw new RangeError("Combat losses cannot exceed active units.");
    }
    if (lossCount === 0) {
      return { units: contracts.cloneJson(units), removedByUnit: Object.fromEntries(Object.keys(units).map(function (id) { return [id, 0]; })) };
    }
    var removed = allocateInteger(lossCount, units);
    var next = contracts.cloneJson(units);
    Object.keys(next).forEach(function (unitId) { next[unitId] -= removed[unitId]; });
    return { units: next, removedByUnit: removed };
  }

  function validateCategoryConfig(config) {
    if (!contracts.isPlainObject(config)) {
      throw new TypeError("Casualty config must be an object.");
    }
    var total = 0;
    ["deadRate", "woundedRate", "routedRate"].forEach(function (field) {
      if (!Number.isFinite(config[field]) || config[field] < 0 || config[field] > 1) {
        throw new RangeError("Casualty rate is invalid: " + field);
      }
      total += config[field];
    });
    if (Math.abs(total - 1) > 1e-9) {
      throw new RangeError("Direct casualty rates must sum to one.");
    }
    if (!Number.isSafeInteger(config.woundedRecoveryTurns) || config.woundedRecoveryTurns < 1 || config.woundedRecoveryTurns > 20) {
      throw new RangeError("Wounded recovery duration is invalid.");
    }
  }

  function applyDirectLosses(participant, lossCount, config) {
    validateCategoryConfig(config);
    if (!contracts.isPlainObject(participant) || !contracts.isPlainObject(participant.units) || !contracts.isPlainObject(participant.casualties)) {
      throw new TypeError("Combat participant is invalid.");
    }
    var next = contracts.cloneJson(participant);
    var removal = removeFromStacks(next.units, lossCount);
    next.units = removal.units;
    var categories = allocateInteger(lossCount, {
      dead: config.deadRate,
      wounded: config.woundedRate,
      routed: config.routedRate,
    });
    ["dead", "wounded", "routed"].forEach(function (category) {
      requireCount(next.casualties[category], "casualties." + category);
      next.casualties[category] += categories[category];
    });
    if (categories.wounded > 0) {
      if (!Array.isArray(next.woundedQueue)) {
        throw new TypeError("Participant wounded queue must be an array.");
      }
      next.woundedQueue.push({
        units: allocateInteger(categories.wounded, removal.removedByUnit),
        remainingTurns: config.woundedRecoveryTurns,
      });
    }
    return {
      participant: next,
      breakdown: {
        total: lossCount,
        byUnit: removal.removedByUnit,
        dead: categories.dead,
        wounded: categories.wounded,
        routed: categories.routed,
        captured: 0,
      },
    };
  }

  function defeatRemaining(participant, capturedRate) {
    if (!Number.isFinite(capturedRate) || capturedRate < 0 || capturedRate > 1) {
      throw new RangeError("Captured rate must be between zero and one.");
    }
    var active = countUnits(participant.units);
    var next = contracts.cloneJson(participant);
    var removal = removeFromStacks(next.units, active);
    next.units = removal.units;
    var categories = allocateInteger(active, { captured: capturedRate, routed: 1 - capturedRate });
    next.casualties.captured += categories.captured;
    next.casualties.routed += categories.routed;
    return {
      participant: next,
      breakdown: {
        total: active,
        byUnit: removal.removedByUnit,
        dead: 0,
        wounded: 0,
        routed: categories.routed,
        captured: categories.captured,
      },
    };
  }

  function addReinforcement(participant, units) {
    countUnits(units);
    var next = contracts.cloneJson(participant);
    var added = 0;
    Object.keys(units).sort().forEach(function (unitId) {
      if (!Object.prototype.hasOwnProperty.call(next.units, unitId)) {
        next.units[unitId] = 0;
      }
      next.units[unitId] += units[unitId];
      added += units[unitId];
    });
    next.reinforcementsReceived += added;
    return { participant: next, added: added };
  }

  function advanceWoundedRecovery(participant) {
    if (!contracts.isPlainObject(participant) || !Array.isArray(participant.woundedQueue)) {
      throw new TypeError("Participant wounded queue is invalid.");
    }
    var next = contracts.cloneJson(participant);
    var pending = [];
    var recoveredByUnit = {};
    var recovered = 0;
    next.woundedQueue.forEach(function (entry) {
      if (!contracts.isPlainObject(entry) || !contracts.isPlainObject(entry.units)) {
        throw new TypeError("Wounded recovery entry is invalid.");
      }
      requireCount(entry.remainingTurns, "woundedQueue.remainingTurns");
      var count = countUnits(entry.units);
      if (entry.remainingTurns > 1) {
        pending.push({ units: contracts.cloneJson(entry.units), remainingTurns: entry.remainingTurns - 1 });
        return;
      }
      Object.keys(entry.units).forEach(function (unitId) {
        if (!Object.prototype.hasOwnProperty.call(next.units, unitId)) {
          next.units[unitId] = 0;
        }
        next.units[unitId] += entry.units[unitId];
        recoveredByUnit[unitId] = (recoveredByUnit[unitId] || 0) + entry.units[unitId];
      });
      recovered += count;
    });
    if (recovered > next.casualties.wounded) {
      throw new RangeError("Recovered wounded exceed the participant wounded total.");
    }
    next.casualties.wounded -= recovered;
    next.woundedQueue = pending;
    return {
      participant: next,
      breakdown: { recovered: recovered, byUnit: recoveredByUnit, pendingEntries: pending.length },
      events: recovered > 0 ? [{ type: "WOUNDED_RECOVERED", payload: { factionId: next.factionId, count: recovered, byUnit: recoveredByUnit } }] : [],
    };
  }

  function accountingTotal(participant) {
    var active = countUnits(participant.units);
    var casualties = CATEGORY_IDS.reduce(function (total, category) {
      requireCount(participant.casualties[category], "casualties." + category);
      return total + participant.casualties[category];
    }, 0);
    return active + casualties;
  }

  return {
    CATEGORY_IDS: CATEGORY_IDS,
    countUnits: countUnits,
    allocateInteger: allocateInteger,
    removeFromStacks: removeFromStacks,
    applyDirectLosses: applyDirectLosses,
    defeatRemaining: defeatRemaining,
    addReinforcement: addReinforcement,
    advanceWoundedRecovery: advanceWoundedRecovery,
    accountingTotal: accountingTotal,
  };
});
