(function (root, factory) {
  "use strict";
  var game = root.MLN222Game;
  if (!game || game.__brand !== "MLN222Game") {
    throw new Error("Load namespace.js before rng.js.");
  }
  var api = game.registerModule("rng", factory());
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  var UINT32_RANGE = 4294967296;
  var ALGORITHM = "fnv1a-mix32-v1";
  var DEFAULT_STREAMS = Object.freeze(["ai", "combat", "events", "quiz"]);

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

  function isStreamName(value) {
    return typeof value === "string" && /^[a-z][a-z0-9-]{0,47}$/.test(value);
  }

  function normalizeSeed(seed) {
    if (typeof seed === "string" && seed.length > 0 && seed.length <= 256) {
      return seed;
    }
    if (Number.isSafeInteger(seed)) {
      return String(seed);
    }
    throw new TypeError("RNG seed must be a non-empty string or safe integer.");
  }

  function hashString(value) {
    var hash = 2166136261;
    for (var index = 0; index < value.length; index += 1) {
      hash ^= value.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
  }

  function mix32(value) {
    var mixed = value >>> 0;
    mixed ^= mixed >>> 16;
    mixed = Math.imul(mixed, 2246822507);
    mixed ^= mixed >>> 13;
    mixed = Math.imul(mixed, 3266489909);
    mixed ^= mixed >>> 16;
    return mixed >>> 0;
  }

  function createRngState(seed, streams) {
    var normalizedSeed = normalizeSeed(seed);
    var requested = streams === undefined ? DEFAULT_STREAMS : streams;
    if (!Array.isArray(requested) || requested.length === 0) {
      throw new TypeError("RNG streams must be a non-empty array.");
    }

    var counters = {};
    requested.slice().sort().forEach(function (stream) {
      if (!isStreamName(stream)) {
        throw new TypeError("Invalid RNG stream: " + String(stream));
      }
      if (Object.prototype.hasOwnProperty.call(counters, stream)) {
        throw new Error("Duplicate RNG stream: " + stream);
      }
      counters[stream] = 0;
    });
    DEFAULT_STREAMS.forEach(function (stream) {
      if (!Object.prototype.hasOwnProperty.call(counters, stream)) {
        throw new TypeError("Required RNG stream is missing: " + stream);
      }
    });

    return {
      algorithm: ALGORITHM,
      seed: normalizedSeed,
      counters: counters,
    };
  }

  function validateRngState(state, path) {
    var basePath = path || "rng";
    var errors = [];
    if (!isPlainObject(state)) {
      return [error("RNG_STATE_TYPE", basePath, "RNG state must be an object.")];
    }
    if (state.algorithm !== ALGORITHM) {
      errors.push(error("RNG_ALGORITHM", basePath + ".algorithm", "Unsupported RNG algorithm."));
    }
    if (typeof state.seed !== "string" || state.seed.length === 0 || state.seed.length > 256) {
      errors.push(error("RNG_SEED", basePath + ".seed", "RNG seed is invalid."));
    }
    if (!isPlainObject(state.counters)) {
      errors.push(error("RNG_COUNTERS_TYPE", basePath + ".counters", "RNG counters must be an object."));
      return errors;
    }

    var names = Object.keys(state.counters).sort();
    if (names.length === 0) {
      errors.push(error("RNG_COUNTERS_EMPTY", basePath + ".counters", "At least one RNG stream is required."));
    }
    names.forEach(function (name) {
      if (!isStreamName(name)) {
        errors.push(error("RNG_STREAM_NAME", basePath + ".counters." + name, "RNG stream name is invalid."));
      }
      if (!Number.isSafeInteger(state.counters[name]) || state.counters[name] < 0) {
        errors.push(error("RNG_COUNTER", basePath + ".counters." + name, "RNG counter must be a non-negative safe integer."));
      }
    });
    DEFAULT_STREAMS.forEach(function (name) {
      if (!Object.prototype.hasOwnProperty.call(state.counters, name)) {
        errors.push(error(
          "RNG_STREAM_REQUIRED",
          basePath + ".counters." + name,
          "Required RNG stream is missing."
        ));
      }
    });
    return errors;
  }

  function cloneRngState(state) {
    var errors = validateRngState(state);
    if (errors.length > 0) {
      throw new TypeError(errors[0].message);
    }
    return {
      algorithm: state.algorithm,
      seed: state.seed,
      counters: Object.assign({}, state.counters),
    };
  }

  function drawUint32(state, stream) {
    var nextState = cloneRngState(state);
    if (!Object.prototype.hasOwnProperty.call(nextState.counters, stream)) {
      throw new Error("Unknown RNG stream: " + String(stream));
    }

    var counter = nextState.counters[stream];
    if (!Number.isSafeInteger(counter + 1)) {
      throw new RangeError("RNG counter exceeded the safe-integer range.");
    }
    var input = nextState.seed + "\u0000" + stream + "\u0000" + String(counter);
    var value = mix32(hashString(input));
    nextState.counters[stream] = counter + 1;
    return { state: nextState, value: value };
  }

  function nextFloat(state, stream) {
    var draw = drawUint32(state, stream);
    return { state: draw.state, value: draw.value / UINT32_RANGE };
  }

  function nextInt(state, stream, minimum, maximum) {
    if (!Number.isSafeInteger(minimum) || !Number.isSafeInteger(maximum) || maximum < minimum) {
      throw new RangeError("Integer RNG bounds are invalid.");
    }
    var span = maximum - minimum + 1;
    if (!Number.isSafeInteger(span) || span <= 0 || span > UINT32_RANGE) {
      throw new RangeError("Integer RNG span must be between 1 and 2^32.");
    }
    var draw = drawUint32(state, stream);
    var value = minimum + Math.floor((draw.value / UINT32_RANGE) * span);
    return { state: draw.state, value: value };
  }

  function shuffle(state, stream, values) {
    if (!Array.isArray(values)) {
      throw new TypeError("Shuffle input must be an array.");
    }
    var result = values.slice();
    var nextState = cloneRngState(state);
    for (var index = result.length - 1; index > 0; index -= 1) {
      var draw = nextInt(nextState, stream, 0, index);
      nextState = draw.state;
      var temporary = result[index];
      result[index] = result[draw.value];
      result[draw.value] = temporary;
    }
    return { state: nextState, value: result };
  }

  function weightedChoice(state, stream, entries) {
    if (!Array.isArray(entries) || entries.length === 0) {
      throw new TypeError("Weighted choices must be a non-empty array.");
    }
    var total = 0;
    entries.forEach(function (entry) {
      if (!isPlainObject(entry) || !Number.isFinite(entry.weight) || entry.weight < 0) {
        throw new TypeError("Each weighted choice needs a non-negative finite weight.");
      }
      total += entry.weight;
    });
    if (!Number.isFinite(total) || total <= 0) {
      throw new RangeError("Weighted choices need a positive finite total.");
    }

    var draw = nextFloat(state, stream);
    var target = draw.value * total;
    var cumulative = 0;
    var lastPositiveIndex = -1;
    for (var index = 0; index < entries.length; index += 1) {
      if (entries[index].weight > 0) {
        lastPositiveIndex = index;
      }
      cumulative += entries[index].weight;
      if (entries[index].weight > 0 && target < cumulative) {
        return { state: draw.state, value: entries[index].value, index: index };
      }
    }
    return {
      state: draw.state,
      value: entries[lastPositiveIndex].value,
      index: lastPositiveIndex,
    };
  }

  return {
    ALGORITHM: ALGORITHM,
    DEFAULT_STREAMS: DEFAULT_STREAMS,
    createRngState: createRngState,
    validateRngState: validateRngState,
    cloneRngState: cloneRngState,
    drawUint32: drawUint32,
    nextFloat: nextFloat,
    nextInt: nextInt,
    shuffle: shuffle,
    weightedChoice: weightedChoice,
  };
});
