(function (root, factory) {
  "use strict";
  var game = root.MLN222Game;
  if (!game || !game.hasModule("rng")) {
    throw new Error("Load namespace.js and rng.js before contracts.js.");
  }
  var api = game.registerModule("contracts", factory(game.rng));
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function (rng) {
  "use strict";

  var SCHEMA_VERSION = 1;
  var PHASES = Object.freeze(["setup", "start", "action", "resolution", "quiz", "complete"]);
  var GAME_STATE_FIELDS = Object.freeze([
    "schemaVersion",
    "campaignId",
    "turn",
    "phase",
    "rng",
    "factions",
    "provinces",
    "battles",
    "quiz",
    "effects",
    "eventLog",
    "eventSequence",
  ]);
  function isDangerousKey(key) {
    return key === "__proto__" || key === "constructor" || key === "prototype";
  }

  function error(code, path, message) {
    return { code: code, path: path, message: message };
  }

  function isPlainObject(value) {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      return false;
    }
    var prototype = Object.getPrototypeOf(value);
    return prototype === Object.prototype || prototype === null;
  }

  function validateJsonValue(value, path, seen) {
    var currentPath = path || "$";
    var visited = seen || new WeakSet();
    var errors = [];

    if (value === null || typeof value === "string" || typeof value === "boolean") {
      return errors;
    }
    if (typeof value === "number") {
      if (!Number.isFinite(value)) {
        errors.push(error("JSON_NUMBER", currentPath, "JSON numbers must be finite."));
      }
      return errors;
    }
    if (typeof value !== "object") {
      return [error("JSON_TYPE", currentPath, "Value is not JSON serializable.")];
    }
    if (visited.has(value)) {
      return [error("JSON_CYCLE", currentPath, "Cyclic values are not supported.")];
    }
    visited.add(value);

    if (Array.isArray(value)) {
      value.forEach(function (item, index) {
        errors.push.apply(errors, validateJsonValue(item, currentPath + "[" + index + "]", visited));
      });
      visited.delete(value);
      return errors;
    }
    if (!isPlainObject(value)) {
      visited.delete(value);
      return [error("JSON_OBJECT", currentPath, "Objects must use a plain prototype.")];
    }

    Object.keys(value).sort().forEach(function (key) {
      if (isDangerousKey(key)) {
        errors.push(error("JSON_KEY", currentPath + "." + key, "Unsafe object key is not allowed."));
        return;
      }
      errors.push.apply(errors, validateJsonValue(value[key], currentPath + "." + key, visited));
    });
    visited.delete(value);
    return errors;
  }

  function cloneJson(value) {
    var errors = validateJsonValue(value);
    if (errors.length > 0) {
      throw new TypeError(errors[0].message + " Path: " + errors[0].path);
    }

    function clone(item) {
      if (item === null || typeof item !== "object") {
        return item;
      }
      if (Array.isArray(item)) {
        return item.map(clone);
      }
      var result = {};
      Object.keys(item).sort().forEach(function (key) {
        result[key] = clone(item[key]);
      });
      return result;
    }

    return clone(value);
  }

  function cloneGameState(value) {
    if (!isPlainObject(value)) {
      throw new TypeError("Game state must be an object.");
    }
    var own = Object.prototype.hasOwnProperty;
    Object.keys(value).forEach(function (key) {
      if (GAME_STATE_FIELDS.indexOf(key) === -1) {
        throw new TypeError("Unknown game-state field: " + key);
      }
    });
    var result = {};
    GAME_STATE_FIELDS.forEach(function (key) {
      if (!own.call(value, key)) {
        throw new TypeError("Missing game-state field: " + key);
      }
      result[key] = cloneJson(value[key]);
    });
    return result;
  }

  function isPhase(value) {
    return PHASES.indexOf(value) !== -1;
  }

  function createInitialState(options) {
    var input = options === undefined ? {} : options;
    if (!isPlainObject(input)) {
      throw new TypeError("Initial-state options must be an object.");
    }
    var campaignId = input.campaignId === undefined ? "campaign-1" : input.campaignId;
    var seed = input.seed === undefined ? "mln222-default-seed" : input.seed;
    var phase = input.phase === undefined ? "setup" : input.phase;
    if (typeof campaignId !== "string" || !/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,63}$/.test(campaignId)) {
      throw new TypeError("Campaign ID is invalid.");
    }
    if (!isPhase(phase)) {
      throw new TypeError("Initial phase is invalid.");
    }

    return {
      schemaVersion: SCHEMA_VERSION,
      campaignId: campaignId,
      turn: 1,
      phase: phase,
      rng: rng.createRngState(seed),
      factions: {},
      provinces: {},
      battles: {},
      quiz: null,
      effects: [],
      eventLog: [],
      eventSequence: 0,
    };
  }

  function validateAction(action) {
    var errors = [];
    if (!isPlainObject(action)) {
      return [error("ACTION_TYPE", "action", "Action must be an object.")];
    }
    if (typeof action.id !== "string" || !/^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,95}$/.test(action.id)) {
      errors.push(error("ACTION_ID", "action.id", "Action ID is invalid."));
    }
    if (typeof action.type !== "string" || !/^[A-Z][A-Z0-9_]{0,63}$/.test(action.type)) {
      errors.push(error("ACTION_NAME", "action.type", "Action type is invalid."));
    }
    if (!isPlainObject(action.payload)) {
      errors.push(error("ACTION_PAYLOAD", "action.payload", "Action payload must be an object."));
    } else {
      errors.push.apply(errors, validateJsonValue(action.payload, "action.payload"));
    }
    if (action.expectedPhase !== null && !isPhase(action.expectedPhase)) {
      errors.push(error("ACTION_PHASE", "action.expectedPhase", "Expected phase is invalid."));
    }
    return errors;
  }

  function createAction(input) {
    if (!isPlainObject(input)) {
      throw new TypeError("Action input must be an object.");
    }
    var action = {
      id: input.id,
      type: input.type,
      payload: input.payload === undefined ? {} : cloneJson(input.payload),
      expectedPhase: input.expectedPhase === undefined ? null : input.expectedPhase,
    };
    var errors = validateAction(action);
    if (errors.length > 0) {
      throw new TypeError(errors[0].message + " Path: " + errors[0].path);
    }
    return action;
  }

  function validateEventDraft(event) {
    var errors = [];
    if (!isPlainObject(event)) {
      return [error("EVENT_TYPE", "event", "Event draft must be an object.")];
    }
    Object.keys(event).sort().forEach(function (key) {
      if (key !== "type" && key !== "payload") {
        errors.push(error("EVENT_FIELD", "event." + key, "Unknown event-draft field."));
      }
    });
    if (typeof event.type !== "string" || !/^[A-Z][A-Z0-9_]{0,63}$/.test(event.type)) {
      errors.push(error("EVENT_NAME", "event.type", "Event type is invalid."));
    }
    if (!isPlainObject(event.payload)) {
      errors.push(error("EVENT_PAYLOAD", "event.payload", "Event payload must be an object."));
    } else {
      errors.push.apply(errors, validateJsonValue(event.payload, "event.payload"));
    }
    return errors;
  }

  function clamp(value, minimum, maximum) {
    if (![value, minimum, maximum].every(Number.isFinite) || maximum < minimum) {
      throw new RangeError("Clamp arguments are invalid.");
    }
    return Math.min(maximum, Math.max(minimum, value));
  }

  function roundInteger(value, mode) {
    var selectedMode = mode || "floor";
    if (!Number.isFinite(value)) {
      throw new TypeError("Rounded value must be finite.");
    }
    var operations = { floor: Math.floor, ceil: Math.ceil, round: Math.round, trunc: Math.trunc };
    if (!Object.prototype.hasOwnProperty.call(operations, selectedMode)) {
      throw new TypeError("Unknown integer rounding mode.");
    }
    var result = operations[selectedMode](value);
    if (!Number.isSafeInteger(result)) {
      throw new RangeError("Rounded value is outside the safe-integer range.");
    }
    return result;
  }

  function stableSort(values, compare) {
    if (!Array.isArray(values) || typeof compare !== "function") {
      throw new TypeError("Stable sort needs an array and comparator.");
    }
    return values.map(function (value, index) {
      return { value: value, index: index };
    }).sort(function (left, right) {
      var order = compare(left.value, right.value);
      if (!Number.isFinite(order)) {
        throw new TypeError("Comparator must return a finite number.");
      }
      return order === 0 ? left.index - right.index : order;
    }).map(function (entry) {
      return entry.value;
    });
  }

  return {
    SCHEMA_VERSION: SCHEMA_VERSION,
    PHASES: PHASES,
    GAME_STATE_FIELDS: GAME_STATE_FIELDS,
    isPlainObject: isPlainObject,
    validateJsonValue: validateJsonValue,
    cloneJson: cloneJson,
    cloneGameState: cloneGameState,
    isPhase: isPhase,
    createInitialState: createInitialState,
    validateAction: validateAction,
    createAction: createAction,
    validateEventDraft: validateEventDraft,
    clamp: clamp,
    roundInteger: roundInteger,
    stableSort: stableSort,
  };
});
