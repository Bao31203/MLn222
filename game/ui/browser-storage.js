(function (root, factory) {
  "use strict";
  var game = root.MLN222Game;
  if (!game || !game.hasModule("contracts") || !game.hasModule("campaign-save")) throw new Error("Load campaign save modules before browser-storage.js.");
  var api = game.registerModule("browser-storage", factory(game.contracts, game["campaign-save"]));
  if (typeof module === "object" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function (contracts, campaignSave) {
  "use strict";

  var UI_KEY = "mln222.campaign.ui.v1";

  function create(storage) {
    var lastError = null;
    var adapter = {
      getItem: function (key) { return storage.getItem(key); },
      setItem: function (key, value) { storage.setItem(key, value); },
      removeItem: function (key) { storage.removeItem(key); },
    };

    function writeUi(value) {
      try {
        storage.setItem(UI_KEY, JSON.stringify(value));
        lastError = null;
        return true;
      } catch (_caught) {
        lastError = "Không thể lưu trạng thái giao diện trên trình duyệt này.";
        return false;
      }
    }

    function readUi() {
      try {
        var raw = storage.getItem(UI_KEY);
        if (raw === null) {
          lastError = null;
          return null;
        }
        var parsed = JSON.parse(raw);
        if (!contracts.isPlainObject(parsed)) {
          lastError = "Trạng thái giao diện đã lưu không thể đọc được.";
          return null;
        }
        lastError = null;
        return parsed;
      } catch (_caught) {
        lastError = "Trạng thái giao diện đã lưu không thể đọc được.";
        return null;
      }
    }

    function hasCampaign() {
      try {
        return storage.getItem(campaignSave.STORAGE_KEY) !== null;
      } catch (_caught) {
        lastError = "Bộ nhớ trình duyệt không khả dụng.";
        return false;
      }
    }

    function clear() {
      try {
        storage.removeItem(campaignSave.STORAGE_KEY);
        storage.removeItem(UI_KEY);
        lastError = null;
        return true;
      } catch (_caught) {
        lastError = "Không thể xóa dữ liệu chiến dịch.";
        return false;
      }
    }

    return {
      adapter: adapter,
      uiKey: UI_KEY,
      writeUi: writeUi,
      readUi: readUi,
      hasCampaign: hasCampaign,
      clear: clear,
      lastError: function () { return lastError; },
    };
  }

  return { UI_KEY: UI_KEY, create: create };
});
