(function (root, factory) {
  "use strict";
  var game = root.MLN222Game;
  if (!game || !game.hasModule("ui-utils")) throw new Error("Load UI utilities before province-panel.js.");
  var api = game.registerModule("province-panel", factory(game["ui-utils"]));
  if (typeof module === "object" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function (utils) {
  "use strict";

  var TERRAIN_LABELS = Object.freeze({
    mountain: "Miền núi",
    mixed: "Hỗn hợp",
    delta: "Châu thổ",
    coastal: "Duyên hải",
    urban: "Đô thị",
    highland: "Cao nguyên",
  });
  var TRAIT_LABELS = Object.freeze({
    fortified: "Phòng thủ",
    agrarian: "Nông nghiệp",
    commercial: "Thương mại",
    populous: "Đông dân",
  });
  var REGION_LABELS = Object.freeze({
    "bac-bo": "Bắc Bộ",
    "bac-trung-bo": "Bắc Trung Bộ",
    "nam-trung-bo": "Nam Trung Bộ",
    "tay-nguyen": "Tây Nguyên",
    "dong-nam-bo": "Đông Nam Bộ",
    "tay-nam-bo": "Tây Nam Bộ",
  });
  var PROVINCE_ACTION_TYPES = Object.freeze(["RECRUIT", "UNLOCK", "MOVE", "WARN_ATTACK"]);

  function findElement(scope, id, required) {
    var node = typeof scope.getElementById === "function"
      ? scope.getElementById(id)
      : scope.querySelector("#" + id);
    if (!node && required) throw new Error("Campaign province element is missing: " + id);
    return node;
  }

  function unitName(data, unitId) {
    var definitions = data.units && Array.isArray(data.units.units) ? data.units.units : [];
    var definition = definitions.find(function (unit) { return unit.id === unitId; });
    return definition ? definition.name : (utils.UNIT_LABELS[unitId] || unitId);
  }

  function appendDetails(parent, entries) {
    var list = utils.element("dl", "game-detail-list");
    entries.forEach(function (entry) {
      list.append(utils.element("dt", "", entry[0]), utils.element("dd", "", entry[1]));
    });
    parent.append(list);
  }

  function appendEmpty(parent, message) {
    parent.append(utils.status("neutral", "Chưa có thao tác", message));
  }

  function renderUnitTable(parent, province, data) {
    var group = utils.element("section", "game-action-group");
    group.append(utils.element("h3", "", "Đơn vị"));
    var table = utils.element("table", "game-unit-table");
    var head = document.createElement("thead");
    var headRow = document.createElement("tr");
    ["Đơn vị", "Dã chiến", "Trú phòng", "Đào tạo", "Bị thương"].forEach(function (label) {
      var cell = utils.element("th", "", label);
      cell.scope = "col";
      headRow.append(cell);
    });
    head.append(headRow);
    table.append(head);

    var body = document.createElement("tbody");
    var orderedIds = (data.units && Array.isArray(data.units.units) ? data.units.units : [])
      .map(function (unit) { return unit.id; })
      .filter(function (unitId) { return Object.prototype.hasOwnProperty.call(province.units, unitId); });
    Object.keys(province.units).sort().forEach(function (unitId) {
      if (orderedIds.indexOf(unitId) === -1) orderedIds.push(unitId);
    });
    orderedIds.forEach(function (unitId) {
      var unit = province.units[unitId];
      var row = document.createElement("tr");
      row.append(
        utils.element("th", "", unitName(data, unitId)),
        utils.element("td", "", utils.formatInteger(unit.field)),
        utils.element("td", "", utils.formatInteger(unit.garrison)),
        utils.element("td", "", utils.formatInteger(unit.training)),
        utils.element("td", "", utils.formatInteger(unit.wounded))
      );
      row.firstChild.scope = "row";
      body.append(row);
    });
    table.append(body);
    group.append(table);
    parent.append(group);
  }

  function renderRecruitmentQueue(parent, province, data) {
    if (!Array.isArray(province.recruitmentQueue) || province.recruitmentQueue.length === 0) return;
    var group = utils.element("section", "game-action-group");
    group.append(utils.element("h3", "", "Đang huấn luyện"));
    province.recruitmentQueue.forEach(function (entry) {
      var row = utils.element("div", "game-relation-row");
      row.classList.add("is-pending");
      row.append(
        utils.element("strong", "", unitName(data, entry.unitId) + " × " + utils.formatInteger(entry.count)),
        utils.element("span", "game-relation-state", "Còn " + utils.formatInteger(entry.remainingTurns) + " lượt")
      );
      group.append(row);
    });
    parent.append(group);
  }

  function actionRelatesToProvince(action, provinceId, province) {
    if (!action || PROVINCE_ACTION_TYPES.indexOf(action.type) === -1 || !action.payload) return false;
    if (action.type === "RECRUIT") return action.payload.provinceId === provinceId;
    if (action.type === "UNLOCK") return province.ownerId === "player";
    return action.payload.sourceProvinceId === provinceId || action.payload.targetProvinceId === provinceId;
  }

  function discountedUnlockCost(state, data, unitId) {
    var recruitment = data.balance && data.balance.economy && data.balance.economy.recruitment;
    var spec = recruitment && recruitment.unlocks ? recruitment.unlocks[unitId] : null;
    if (!spec) return null;
    var factor = (state.effects || []).filter(function (effect) {
      return effect.type === "quiz-unlock-discount" && effect.factionId === "player";
    }).reduce(function (result, effect) { return result * effect.multiplier; }, 1);
    return Math.ceil(spec.coinCost * factor);
  }

  function describeAction(action, provinceId, state, data) {
    var payload = action.payload;
    var unit = payload.unitId ? unitName(data, payload.unitId) : "";
    if (action.type === "RECRUIT") {
      var recruitment = data.balance && data.balance.economy && data.balance.economy.recruitment;
      var unitCost = recruitment && recruitment.unitCosts ? recruitment.unitCosts[payload.unitId] : null;
      var costText = unitCost
        ? Math.ceil(payload.count * unitCost.food) + " lương thực · " + Math.ceil(payload.count * unitCost.coin) + " tiền"
        : "1 điểm lệnh";
      return {
        label: "Tuyển " + utils.formatInteger(payload.count) + " " + unit,
        detail: costText + " · hoàn tất sau 1 lượt",
      };
    }
    if (action.type === "UNLOCK") {
      var coinCost = discountedUnlockCost(state, data, payload.unitId);
      return {
        label: "Mở khóa " + unit,
        detail: coinCost === null ? "Dùng 1 điểm lệnh" : utils.formatInteger(coinCost) + " tiền · dùng 1 điểm lệnh",
      };
    }
    if (action.type === "MOVE") {
      var sourceName = utils.provinceName(data, payload.sourceProvinceId);
      var targetName = utils.provinceName(data, payload.targetProvinceId);
      return {
        label: payload.sourceProvinceId === provinceId
          ? "Điều " + utils.formatInteger(payload.count) + " " + unit + " đến " + targetName
          : "Nhận " + utils.formatInteger(payload.count) + " " + unit + " từ " + sourceName,
        detail: sourceName + " → " + targetName,
      };
    }
    var ratio = Number.isFinite(payload.strengthRatio) ? " · tương quan " + payload.strengthRatio.toFixed(2) + "×" : "";
    return {
      label: "Cảnh báo tiến công " + utils.provinceName(data, payload.targetProvinceId),
      detail: "Xuất quân từ " + utils.provinceName(data, payload.sourceProvinceId) + ratio,
    };
  }

  function create(options) {
    if (!options || !options.data || !options.controller || typeof options.controller.legalActions !== "function" || typeof options.controller.stageAction !== "function") {
      throw new TypeError("Province panel options are invalid.");
    }
    var data = options.data;
    var controller = options.controller;
    var onError = typeof options.onError === "function" ? options.onError : null;
    var scope = options.root || document;
    var panel = findElement(scope, "gameProvincePanel", true);
    var liveStatus = findElement(scope, "gameLiveStatus", false);

    function notifyError(caught) {
      if (onError) {
        onError(caught);
        return;
      }
      if (!liveStatus) return;
      liveStatus.textContent = caught && caught.message ? caught.message : "Không thể xếp lệnh này.";
    }

    function stage(action) {
      try {
        controller.stageAction({ type: action.type, payload: utils.clone(action.payload) });
      } catch (caught) {
        notifyError(caught);
      }
    }

    function renderActions(snapshot, province) {
      var state = snapshot.state;
      var actions;
      try {
        actions = controller.legalActions().filter(function (action) {
          return actionRelatesToProvince(action, snapshot.selectedProvinceId, province);
        });
      } catch (caught) {
        actions = [];
        notifyError(caught);
      }
      var group = utils.element("section", "game-action-group");
      group.append(utils.element("h3", "", "Lệnh hợp lệ"));
      if (actions.length === 0) {
        var player = state.factions.player;
        var pendingCount = Array.isArray(snapshot.pendingActions) ? snapshot.pendingActions.length : 0;
        var message = state.phase !== "action"
          ? "Lệnh chỉ khả dụng trong pha hành động."
          : player && pendingCount >= player.actionPoints
            ? "Đã dùng hết điểm lệnh của lượt này."
            : "Không có lệnh phù hợp với tỉnh đang chọn.";
        appendEmpty(group, message);
        panel.append(group);
        return;
      }

      var pendingKeys = new Set((snapshot.pendingActions || []).map(utils.actionKey));
      var list = utils.element("div", "game-action-list");
      actions.forEach(function (action) {
        var copy = { type: action.type, payload: utils.clone(action.payload) };
        var description = describeAction(copy, snapshot.selectedProvinceId, state, data);
        var pending = pendingKeys.has(utils.actionKey(copy));
        var button = utils.element("button", "game-action-btn", description.label);
        button.type = "button";
        button.disabled = pending;
        button.classList.toggle("is-pending", pending);
        button.title = pending ? "Lệnh này đã được xếp." : description.label;
        button.append(utils.element("span", "", description.detail + (pending ? " · Đã xếp" : "")));
        button.addEventListener("click", function () { stage(copy); });
        list.append(button);
      });
      group.append(list);
      panel.append(group);
    }

    function render(snapshot) {
      utils.clear(panel);
      var state = snapshot && snapshot.state;
      var provinceId = snapshot && snapshot.selectedProvinceId;
      var province = state && state.provinces ? state.provinces[provinceId] : null;
      if (!province) {
        appendEmpty(panel, "Chọn một tỉnh trên bản đồ để xem chi tiết.");
        return;
      }

      var definition = utils.provinceDefinition(data, provinceId);
      var header = utils.element("div", "game-panel-header");
      var title = document.createElement("div");
      title.append(
        utils.element("p", "game-eyebrow", "Tỉnh đang chọn"),
        utils.element("h2", "", definition ? definition.display.name : provinceId)
      );
      var ownerText = province.ownerId === "player" ? "Tỉnh của bạn" : utils.factionName(data, province.ownerId);
      header.append(title, utils.element("div", "game-owner-label", ownerText));
      panel.append(header);

      var statusParts = [
        REGION_LABELS[province.region] || province.region,
        TERRAIN_LABELS[province.terrain] || province.terrain,
        TRAIT_LABELS[province.trait] || province.trait,
      ];
      if (province.occupation) statusParts.push("Chiếm đóng còn " + utils.formatInteger(province.occupation.remainingTurns) + " lượt");
      panel.append(utils.element("div", "game-status-line", statusParts.join(" · ")));
      if (province.occupation) {
        panel.append(utils.status(
          "warning",
          "Đang ổn định quyền kiểm soát",
          "Còn " + utils.formatInteger(province.occupation.remainingTurns) + " lượt; tuyển quân tạm khóa tại tỉnh này."
        ));
      }

      var population = province.population;
      var freeCapacity = Math.max(0, population.capacity - population.civilians - population.military);
      var queued = (province.recruitmentQueue || []).reduce(function (total, entry) { return total + entry.count; }, 0);
      renderActions(snapshot, province);
      appendDetails(panel, [
        ["Dân thường", utils.formatInteger(population.civilians)],
        ["Quân đội", utils.formatInteger(population.military)],
        ["Sức chứa", utils.formatInteger(population.capacity)],
        ["Chỗ trống", utils.formatInteger(freeCapacity)],
        ["Đang tuyển", utils.formatInteger(queued)],
        ["Thủ phủ", definition ? definition.display.capital : "—"],
      ]);
      renderRecruitmentQueue(panel, province, data);
      renderUnitTable(panel, province, data);
    }

    return { render: render, update: render };
  }

  return { create: create };
});
