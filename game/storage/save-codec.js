(function (root, factory) {
  "use strict";
  var game = root.MLN222Game;
  if (!game || !game.hasModule("contracts") || !game.hasModule("save-validation")) {
    throw new Error("Load core modules and save-validation.js before save-codec.js.");
  }
  var api = game.registerModule("save-codec", factory(game.contracts, game["save-validation"]));
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function (contracts, validation) {
  "use strict";

  var STORAGE_KEY = "mln222.game.v1";
  var MAX_SAVE_LENGTH = 5 * 1024 * 1024;

  function failure(code, message, raw) {
    return { ok: false, value: null, error: { code: code, message: message }, raw: raw === undefined ? null : raw };
  }

  function encodeSave(gameState) {
    return validation.canonicalize(validation.createEnvelope(gameState));
  }

  function decodeSave(raw) {
    if (typeof raw !== "string" || raw.length === 0) {
      return failure("SAVE_MISSING", "No save data is available.", raw);
    }
    if (raw.length > MAX_SAVE_LENGTH) {
      return failure("SAVE_SIZE", "Save data exceeds the supported size.", raw);
    }
    var parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (_caught) {
      return failure("SAVE_JSON", "Save data is not valid JSON.", raw);
    }
    var errors;
    try {
      errors = validation.validateEnvelope(parsed);
    } catch (_caught) {
      return failure("SAVE_INVALID", "Save data could not be validated.", raw);
    }
    if (errors.length > 0) {
      return failure(errors[0].code, errors[0].message, raw);
    }
    try {
      return { ok: true, value: contracts.cloneGameState(parsed.payload), error: null, raw: raw };
    } catch (_caught) {
      return failure("SAVE_CLONE", "Validated save payload could not be restored.", raw);
    }
  }

  function validateAdapter(adapter) {
    if (!adapter || typeof adapter.getItem !== "function" || typeof adapter.setItem !== "function") {
      throw new TypeError("Storage adapter must implement getItem and setItem.");
    }
  }

  function saveToAdapter(adapter, gameState, key) {
    validateAdapter(adapter);
    var storageKey = key === undefined ? STORAGE_KEY : key;
    if (typeof storageKey !== "string" || storageKey.length === 0) {
      throw new TypeError("Storage key must be a non-empty string.");
    }
    var raw = encodeSave(gameState);
    try {
      adapter.setItem(storageKey, raw);
      return { ok: true, value: raw, error: null };
    } catch (_caught) {
      return failure("SAVE_STORAGE_WRITE", "Storage adapter rejected the save.");
    }
  }

  function loadFromAdapter(adapter, key) {
    validateAdapter(adapter);
    var storageKey = key === undefined ? STORAGE_KEY : key;
    var raw;
    try {
      raw = adapter.getItem(storageKey);
    } catch (_caught) {
      return failure("SAVE_STORAGE_READ", "Storage adapter could not read the save.");
    }
    return decodeSave(raw);
  }

  function removeFromAdapter(adapter, key) {
    if (!adapter || typeof adapter.removeItem !== "function") {
      throw new TypeError("Storage adapter must implement removeItem.");
    }
    try {
      adapter.removeItem(key === undefined ? STORAGE_KEY : key);
      return { ok: true, error: null };
    } catch (_caught) {
      return { ok: false, error: { code: "SAVE_STORAGE_REMOVE", message: "Storage adapter could not remove the save." } };
    }
  }

  return {
    STORAGE_KEY: STORAGE_KEY,
    MAX_SAVE_LENGTH: MAX_SAVE_LENGTH,
    encodeSave: encodeSave,
    decodeSave: decodeSave,
    saveToAdapter: saveToAdapter,
    loadFromAdapter: loadFromAdapter,
    removeFromAdapter: removeFromAdapter,
  };
});
