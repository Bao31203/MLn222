(function (root, factory) {
  "use strict";
  var game = root.MLN222Game;
  if (!game || !game.hasModule("contracts") || !game.hasModule("save-codec") || !game.hasModule("campaign")) {
    throw new Error("Load contracts, save codec, and campaign modules before campaign-save.js.");
  }
  var api = game.registerModule("campaign-save", factory(game.contracts, game["save-codec"], game.campaign));
  if (typeof module === "object" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function (contracts, codec, campaign) {
  "use strict";

  var STORAGE_KEY = "mln222.campaign.v1";

  function failure(code, message, raw, errors) {
    return { ok: false, value: null, error: { code: code, message: message }, errors: errors || [], raw: raw === undefined ? null : raw };
  }

  function validateState(state, deps) {
    var errors = campaign.validateCampaignState(state, deps);
    if (errors.length > 0) throw new TypeError(errors[0].code + ": " + errors[0].message + " Path: " + errors[0].path);
    return true;
  }

  function encodeSave(state, deps) {
    validateState(state, deps);
    return codec.encodeSave(state);
  }

  function decodeSave(raw, deps) {
    var decoded = codec.decodeSave(raw);
    if (!decoded.ok) return decoded;
    var errors;
    try {
      errors = campaign.validateCampaignState(decoded.value, deps);
    } catch (caught) {
      return failure("CAMPAIGN_SAVE_INVALID", caught.message, raw);
    }
    if (errors.length > 0) return failure(errors[0].code, errors[0].message, raw, errors);
    return { ok: true, value: contracts.cloneGameState(decoded.value), error: null, errors: [], raw: raw };
  }

  function validateAdapter(adapter) {
    if (!adapter || typeof adapter.getItem !== "function" || typeof adapter.setItem !== "function") throw new TypeError("Storage adapter must implement getItem and setItem.");
  }

  function saveToAdapter(adapter, state, deps, key) {
    validateAdapter(adapter);
    var raw = encodeSave(state, deps);
    try {
      adapter.setItem(key || STORAGE_KEY, raw);
      return { ok: true, value: raw, error: null };
    } catch (_caught) {
      return failure("CAMPAIGN_SAVE_STORAGE_WRITE", "Storage adapter rejected the campaign save.", raw);
    }
  }

  function loadFromAdapter(adapter, deps, key) {
    validateAdapter(adapter);
    var raw;
    try {
      raw = adapter.getItem(key || STORAGE_KEY);
    } catch (_caught) {
      return failure("CAMPAIGN_SAVE_STORAGE_READ", "Storage adapter could not read the campaign save.");
    }
    return decodeSave(raw, deps);
  }

  function removeFromAdapter(adapter, key) {
    if (!adapter || typeof adapter.removeItem !== "function") throw new TypeError("Storage adapter must implement removeItem.");
    try {
      adapter.removeItem(key || STORAGE_KEY);
      return { ok: true, error: null };
    } catch (_caught) {
      return { ok: false, error: { code: "CAMPAIGN_SAVE_STORAGE_REMOVE", message: "Storage adapter could not remove the campaign save." } };
    }
  }

  return {
    STORAGE_KEY: STORAGE_KEY,
    validateState: validateState,
    encodeSave: encodeSave,
    decodeSave: decodeSave,
    saveToAdapter: saveToAdapter,
    loadFromAdapter: loadFromAdapter,
    removeFromAdapter: removeFromAdapter,
  };
});
