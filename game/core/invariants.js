(function (root, factory) {
  "use strict";
  var game = root.MLN222Game;
  if (!game || !game.hasModule("rng") || !game.hasModule("contracts")) {
    throw new Error("Load namespace.js, rng.js, and contracts.js before invariants.js.");
  }
  var api = game.registerModule("invariants", factory(game.contracts, game.rng));
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function (contracts, rng) {
  "use strict";

  function error(code, path, message) {
    return { code: code, path: path, message: message };
  }

  function isNonNegativeInteger(value) {
    return Number.isSafeInteger(value) && value >= 0;
  }

  function validateIdentifierMap(value, path) {
    var errors = [];
    if (!contracts.isPlainObject(value)) {
      return [error("STATE_MAP", path, "State collection must be an object.")];
    }
    Object.keys(value).sort().forEach(function (key) {
      if (!/^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,95}$/.test(key)) {
        errors.push(error("STATE_MAP_KEY", path + "." + key, "Collection key is invalid."));
      }
      if (!contracts.isPlainObject(value[key])) {
        errors.push(error("STATE_ENTITY", path + "." + key, "Collection entry must be an object."));
      }
    });
    return errors;
  }

  function validatePopulation(province, path) {
    if (!contracts.isPlainObject(province) || province.population === undefined) {
      return [];
    }
    var population = province.population;
    if (!contracts.isPlainObject(population)) {
      return [error("POPULATION_TYPE", path + ".population", "Population must be an object.")];
    }

    var errors = [];
    ["capacity", "civilians", "military"].forEach(function (field) {
      if (!isNonNegativeInteger(population[field])) {
        errors.push(error(
          "POPULATION_VALUE",
          path + ".population." + field,
          "Population values must be non-negative safe integers."
        ));
      }
    });
    if (
      isNonNegativeInteger(population.capacity) &&
      isNonNegativeInteger(population.civilians) &&
      isNonNegativeInteger(population.military) &&
      population.civilians + population.military > population.capacity
    ) {
      errors.push(error(
        "POPULATION_CAPACITY",
        path + ".population",
        "Civilian and military population cannot exceed capacity."
      ));
    }
    return errors;
  }

  function validateResources(faction, path) {
    if (!contracts.isPlainObject(faction) || faction.resources === undefined) {
      return [];
    }
    var resources = faction.resources;
    if (!contracts.isPlainObject(resources)) {
      return [error("RESOURCES_TYPE", path + ".resources", "Resources must be an object.")];
    }

    var errors = [];
    ["food", "coin"].forEach(function (field) {
      if (!isNonNegativeInteger(resources[field])) {
        errors.push(error(
          "RESOURCE_VALUE",
          path + ".resources." + field,
          "Core resources must be non-negative safe integers."
        ));
      }
    });
    return errors;
  }

  function validateEvents(state) {
    var errors = [];
    if (!Array.isArray(state.eventLog)) {
      return [error("EVENT_LOG_TYPE", "state.eventLog", "Event log must be an array.")];
    }
    if (!isNonNegativeInteger(state.eventSequence)) {
      errors.push(error(
        "EVENT_SEQUENCE_VALUE",
        "state.eventSequence",
        "Event sequence must be a non-negative safe integer."
      ));
    }

    var previousSequence = 0;
    state.eventLog.forEach(function (event, index) {
      var path = "state.eventLog[" + index + "]";
      if (!contracts.isPlainObject(event)) {
        errors.push(error("EVENT_TYPE", path, "Logged event must be an object."));
        return;
      }
      Object.keys(event).sort().forEach(function (key) {
        if (["sequence", "actionId", "turn", "type", "payload"].indexOf(key) === -1) {
          errors.push(error("EVENT_FIELD", path + "." + key, "Unknown committed-event field."));
        }
      });
      if (!Number.isSafeInteger(event.sequence) || event.sequence !== previousSequence + 1) {
        errors.push(error("EVENT_ORDER", path + ".sequence", "Event sequences must be contiguous and increasing."));
      }
      if (Number.isSafeInteger(event.sequence)) {
        previousSequence = event.sequence;
      }
      if (typeof event.actionId !== "string" || !/^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,95}$/.test(event.actionId)) {
        errors.push(error("EVENT_ACTION", path + ".actionId", "Event action ID is invalid."));
      }
      if (!Number.isSafeInteger(event.turn) || event.turn < 1) {
        errors.push(error("EVENT_TURN", path + ".turn", "Event turn must be a positive safe integer."));
      }
      errors.push.apply(errors, contracts.validateEventDraft({
        type: event.type,
        payload: event.payload,
      }).map(function (item) {
        return error(item.code, path + item.path.slice("event".length), item.message);
      }));
    });

    if (isNonNegativeInteger(state.eventSequence) && state.eventSequence !== previousSequence) {
      errors.push(error(
        "EVENT_SEQUENCE_MISMATCH",
        "state.eventSequence",
        "Event sequence must match the last logged event."
      ));
    }
    return errors;
  }

  function normalizeAdditionalErrors(result, index) {
    if (!Array.isArray(result)) {
      return [error(
        "INVARIANT_RESULT",
        "additionalChecks[" + index + "]",
        "Additional invariant must return an array."
      )];
    }
    return result.map(function (item, errorIndex) {
      if (
        !contracts.isPlainObject(item) ||
        typeof item.code !== "string" ||
        typeof item.path !== "string" ||
        typeof item.message !== "string"
      ) {
        return error(
          "INVARIANT_ERROR_SHAPE",
          "additionalChecks[" + index + "][" + errorIndex + "]",
          "Invariant errors require code, path, and message strings."
        );
      }
      return { code: item.code, path: item.path, message: item.message };
    });
  }

  function validateState(state, additionalChecks) {
    var errors = [];
    if (!contracts.isPlainObject(state)) {
      return [error("STATE_TYPE", "state", "Game state must be an object.")];
    }

    errors.push.apply(errors, contracts.validateJsonValue(state, "state"));
    Object.keys(state).sort().forEach(function (key) {
      if (contracts.GAME_STATE_FIELDS.indexOf(key) === -1) {
        errors.push(error("STATE_FIELD", "state." + key, "Unknown game-state field."));
      }
    });
    contracts.GAME_STATE_FIELDS.forEach(function (key) {
      if (!Object.prototype.hasOwnProperty.call(state, key)) {
        errors.push(error("STATE_FIELD_MISSING", "state." + key, "Required game-state field is missing."));
      }
    });
    if (state.schemaVersion !== contracts.SCHEMA_VERSION) {
      errors.push(error("SCHEMA_VERSION", "state.schemaVersion", "Unsupported game-state schema version."));
    }
    if (typeof state.campaignId !== "string" || !/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,63}$/.test(state.campaignId)) {
      errors.push(error("CAMPAIGN_ID", "state.campaignId", "Campaign ID is invalid."));
    }
    if (!Number.isSafeInteger(state.turn) || state.turn < 1) {
      errors.push(error("TURN_VALUE", "state.turn", "Turn must be a positive safe integer."));
    }
    if (!contracts.isPhase(state.phase)) {
      errors.push(error("PHASE_VALUE", "state.phase", "Game phase is invalid."));
    }
    errors.push.apply(errors, rng.validateRngState(state.rng, "state.rng"));
    errors.push.apply(errors, validateIdentifierMap(state.factions, "state.factions"));
    errors.push.apply(errors, validateIdentifierMap(state.provinces, "state.provinces"));
    errors.push.apply(errors, validateIdentifierMap(state.battles, "state.battles"));

    if (state.quiz !== null && !contracts.isPlainObject(state.quiz)) {
      errors.push(error("QUIZ_TYPE", "state.quiz", "Quiz state must be null or an object."));
    }
    if (!Array.isArray(state.effects)) {
      errors.push(error("EFFECTS_TYPE", "state.effects", "Effects must be an array."));
    }
    errors.push.apply(errors, validateEvents(state));

    if (contracts.isPlainObject(state.provinces)) {
      Object.keys(state.provinces).sort().forEach(function (provinceId) {
        errors.push.apply(errors, validatePopulation(
          state.provinces[provinceId],
          "state.provinces." + provinceId
        ));
      });
    }
    if (contracts.isPlainObject(state.factions)) {
      Object.keys(state.factions).sort().forEach(function (factionId) {
        errors.push.apply(errors, validateResources(
          state.factions[factionId],
          "state.factions." + factionId
        ));
      });
    }

    var checks = additionalChecks === undefined ? [] : additionalChecks;
    if (!Array.isArray(checks)) {
      errors.push(error("INVARIANT_CHECKS", "additionalChecks", "Additional checks must be an array."));
    } else {
      checks.forEach(function (check, index) {
        if (typeof check !== "function") {
          errors.push(error(
            "INVARIANT_CHECK",
            "additionalChecks[" + index + "]",
            "Additional invariant must be a function."
          ));
          return;
        }
        try {
          errors.push.apply(errors, normalizeAdditionalErrors(check(state), index));
        } catch (caught) {
          errors.push(error(
            "INVARIANT_EXCEPTION",
            "additionalChecks[" + index + "]",
            caught && caught.message ? caught.message : "Additional invariant failed."
          ));
        }
      });
    }

    function compareText(left, right) {
      return left < right ? -1 : left > right ? 1 : 0;
    }
    return contracts.stableSort(errors, function (left, right) {
      var pathOrder = compareText(left.path, right.path);
      return pathOrder !== 0 ? pathOrder : compareText(left.code, right.code);
    });
  }

  return {
    validateState: validateState,
  };
});
