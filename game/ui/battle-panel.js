(function (root, factory) {
  "use strict";
  var game = root.MLN222Game;
  var required = ["contracts", "ui-utils", "combat-tactics", "combat-casualties"];
  if (!game || required.some(function (name) { return !game.hasModule(name); })) throw new Error("Load combat and UI utilities before battle-panel.js.");
  var api = game.registerModule("battle-panel", factory(game));
  if (typeof module === "object" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function (game) {
  "use strict";

  var contracts = game.contracts;
  var utils = game["ui-utils"];
  var tactics = game["combat-tactics"];
  var casualties = game["combat-casualties"];
  var PLAYER_ID = "player";

  var TACTIC_ERRORS = Object.freeze({
    TACTIC_ASSAULT_LOCKED: "Cần phá vỡ đủ công sự trước khi tổng công kích.",
    TACTIC_DEFENDER_SIEGE: "Bên phòng thủ không thể dùng chiến thuật công phá.",
    TACTIC_UNKNOWN: "Chiến thuật này không hợp lệ.",
  });

  function sumCasualties(participant) {
    return Object.keys(participant.casualties).reduce(function (total, key) {
      return total + participant.casualties[key];
    }, 0);
  }

  function sideForPlayer(battle) {
    if (battle.attacker.factionId === PLAYER_ID) return "attacker";
    if (battle.defender.factionId === PLAYER_ID) return "defender";
    return null;
  }

  function selectedTactic(snapshot, battle, side, config) {
    var selection = snapshot.tacticSelections && snapshot.tacticSelections[battle.id];
    if (typeof selection === "string") return { id: selection, explicit: true };
    if (contracts.isPlainObject(selection) && typeof selection.tactic === "string") return { id: selection.tactic, explicit: true };
    if (side === "defender") return { id: "engage", explicit: false };
    if (battle.breach >= config.fortification.assaultBreachThreshold) return { id: "assault", explicit: false };
    return { id: battle.fortification.current > 0 ? "siege" : "engage", explicit: false };
  }

  function unitSummary(units) {
    return Object.keys(units).filter(function (unitId) { return units[unitId] > 0; }).map(function (unitId) {
      return (utils.UNIT_LABELS[unitId] || unitId) + " " + utils.formatInteger(units[unitId]);
    }).join(", ");
  }

  function addStat(container, label, value) {
    var item = utils.element("div", "game-battle-stat");
    item.appendChild(utils.element("span", "", label));
    item.appendChild(utils.element("strong", "", String(value)));
    container.appendChild(item);
  }

  function addMeter(container, label, value, tone) {
    var bounded = Math.max(0, Math.min(100, Math.round(value)));
    var meter = utils.element("div", "game-battle-meter game-battle-meter-" + tone);
    var heading = utils.element("div", "game-battle-meter-label");
    heading.append(utils.element("span", "", label), utils.element("strong", "", bounded + "%"));
    var track = utils.element("div", "game-battle-meter-track");
    track.setAttribute("role", "progressbar");
    track.setAttribute("aria-label", label);
    track.setAttribute("aria-valuemin", "0");
    track.setAttribute("aria-valuemax", "100");
    track.setAttribute("aria-valuenow", String(bounded));
    var fill = utils.element("i");
    fill.style.width = bounded + "%";
    track.appendChild(fill);
    meter.append(heading, track);
    container.appendChild(meter);
  }

  function tacticDisabledReason(side, tacticId, battle, config) {
    var errors = tactics.validateSelection(
      side,
      tacticId,
      battle,
      config.tactics,
      config.fortification.assaultBreachThreshold
    );
    if (!errors.length) return "";
    return TACTIC_ERRORS[errors[0].code] || errors[0].message;
  }

  function create(options) {
    if (!contracts.isPlainObject(options) || !contracts.isPlainObject(options.data) || !options.controller) throw new TypeError("Battle panel options are invalid.");
    var data = options.data;
    var controller = options.controller;
    var onError = typeof options.onError === "function" ? options.onError : null;
    var panel = options.root || document.getElementById("gameBattlePanel");
    if (!panel) throw new Error("Battle panel container is missing.");
    if (!data.balance || !data.balance.combat) throw new TypeError("Battle panel combat data is missing.");
    var combatConfig = data.balance.combat;

    function run(operation) {
      try {
        return operation();
      } catch (caught) {
        if (onError) {
          onError(caught);
          return null;
        }
        throw caught;
      }
    }

    function createReinforcementControl(battle, side, action, pendingAction) {
      var group = utils.element("div", "game-action-group");
      group.appendChild(utils.element("h3", "", "Viện binh"));
      var list = utils.element("div", "game-action-list");
      var button = utils.element("button", "game-action-btn");
      button.type = "button";

      if (pendingAction) {
        button.disabled = true;
        button.classList.add("is-pending");
        button.appendChild(document.createTextNode("Đã xếp viện binh"));
        button.appendChild(utils.element("span", "", unitSummary(pendingAction.payload.units)));
      } else if (action) {
        var count = casualties.countUnits(action.payload.units);
        button.appendChild(document.createTextNode("Xếp " + utils.formatInteger(count) + " quân viện trợ"));
        button.appendChild(utils.element("span", "", unitSummary(action.payload.units) + " · đến ở hiệp " + (battle.turn + combatConfig.reinforcement.delayTurns + 1)));
        button.addEventListener("click", function () { run(function () { controller.stageAction(action); }); });
      } else {
        button.disabled = true;
        button.classList.add("is-disabled-with-reason");
        button.appendChild(document.createTextNode("Chưa thể điều viện binh"));
        button.appendChild(utils.element("span", "", "Không còn hạn mức, quân sẵn sàng hoặc điểm lệnh."));
      }
      list.appendChild(button);

      var queued = battle.reinforcementQueue.filter(function (entry) { return entry.side === side; });
      if (queued.length) {
        var queuedCount = queued.reduce(function (total, entry) { return total + casualties.countUnits(entry.units); }, 0);
        list.appendChild(utils.element("div", "game-status-line", utils.formatInteger(queuedCount) + " quân đang hành quân tới mặt trận."));
      }
      group.appendChild(list);
      return group;
    }

    function createBattleItem(snapshot, battle, reinforceActions) {
      var side = sideForPlayer(battle);
      var enemySide = side === "attacker" ? "defender" : "attacker";
      var own = battle[side];
      var enemy = battle[enemySide];
      var item = utils.element("article", "game-battle-item");
      var top = utils.element("div", "game-battle-top");
      var route = utils.provinceName(data, battle.sourceProvinceId) + " → " + utils.provinceName(data, battle.targetProvinceId);
      top.appendChild(utils.element("strong", "", route));
      top.appendChild(utils.element("span", "game-owner-label", side === "attacker" ? "Tiến công · hiệp " + battle.turn : "Phòng thủ · hiệp " + battle.turn));
      item.appendChild(top);

      var stats = utils.element("div", "game-battle-stats");
      addStat(stats, "Quân ta", utils.formatInteger(casualties.countUnits(own.units)));
      addStat(stats, "Quân địch", utils.formatInteger(casualties.countUnits(enemy.units)));
      addStat(stats, "Tổn thất", utils.formatInteger(sumCasualties(own)));
      item.appendChild(stats);

      var meters = utils.element("div", "game-battle-meters");
      addMeter(meters, "Tinh thần", own.morale, own.morale < 35 ? "danger" : "success");
      addMeter(meters, "Tiếp tế", own.supply, own.supply < 35 ? "danger" : "neutral");
      addMeter(meters, "Phá vỡ công sự", battle.breach, battle.breach >= combatConfig.fortification.assaultBreachThreshold ? "warning" : "neutral");
      item.appendChild(meters);

      var fortification = battle.fortification.maximum > 0
        ? "Công sự " + utils.formatInteger(battle.fortification.current) + "/" + utils.formatInteger(battle.fortification.maximum)
        : "Không có công sự";
      item.appendChild(utils.status("danger", utils.RELATION_LABELS.war || "Chiến tranh", fortification));

      var choice = selectedTactic(snapshot, battle, side, combatConfig);
      var tacticGroup = utils.element("div", "game-action-group");
      tacticGroup.appendChild(utils.element("h3", "", "Chiến thuật " + (choice.explicit ? "đã chọn" : "mặc định") + ": " + (utils.TACTIC_LABELS[choice.id] || choice.id)));
      var tacticList = utils.element("div", "game-tactics");
      var disabledReasons = [];
      tactics.TACTIC_IDS.forEach(function (tacticId) {
        var reason = tacticDisabledReason(side, tacticId, battle, combatConfig);
        var button = utils.element("button", "game-tactic-btn", utils.TACTIC_LABELS[tacticId] || tacticId);
        button.type = "button";
        button.disabled = Boolean(reason);
        button.classList.toggle("active", choice.id === tacticId);
        button.setAttribute("aria-pressed", String(choice.id === tacticId));
        if (reason) {
          button.title = reason;
          button.setAttribute("aria-description", reason);
          button.setAttribute("aria-label", (utils.TACTIC_LABELS[tacticId] || tacticId) + ". Không khả dụng: " + reason);
          if (disabledReasons.indexOf(reason) === -1) disabledReasons.push(reason);
        }
        button.addEventListener("click", function () { run(function () { controller.setTactic(battle.id, tacticId); }); });
        tacticList.appendChild(button);
      });
      tacticGroup.appendChild(tacticList);
      if (disabledReasons.length) tacticGroup.appendChild(utils.element("p", "game-action-help", disabledReasons.join(" ")));
      item.appendChild(tacticGroup);

      var pendingAction = (snapshot.pendingActions || []).find(function (action) {
        return action.type === "REINFORCE" && action.payload && action.payload.battleId === battle.id;
      });
      item.appendChild(createReinforcementControl(battle, side, reinforceActions[battle.id] || null, pendingAction || null));
      return item;
    }

    function addWarnings(snapshot) {
      var warnings = snapshot.state.effects.filter(function (effect) {
        return effect.type === "attack-warning" && (effect.attackerId === PLAYER_ID || effect.defenderId === PLAYER_ID);
      });
      if (!warnings.length) return;
      panel.appendChild(utils.element("h3", "", "Mặt trận sắp mở"));
      warnings.forEach(function (warning) {
        var direction = utils.provinceName(data, warning.sourceProvinceId) + " → " + utils.provinceName(data, warning.targetProvinceId);
        panel.appendChild(utils.status("warning", "Cảnh báo tiến công", direction + " · dự kiến lượt " + warning.executeTurn));
      });
    }

    function render(snapshot) {
      utils.clear(panel);
      panel.appendChild(utils.element("h2", "", "Mặt trận"));
      if (!snapshot || !snapshot.state) {
        panel.appendChild(utils.status("neutral", "Chưa có chiến dịch", "Bắt đầu hoặc tiếp tục chiến dịch để xem mặt trận."));
        return;
      }

      var reinforceActions = {};
      controller.legalActions().filter(function (action) { return action.type === "REINFORCE"; }).forEach(function (action) {
        reinforceActions[action.payload.battleId] = action;
      });
      var fronts = Object.keys(snapshot.state.battles).sort().map(function (battleId) {
        return snapshot.state.battles[battleId];
      }).filter(function (battle) {
        return battle.status === "active" && sideForPlayer(battle) !== null;
      });

      if (!fronts.length) panel.appendChild(utils.status("success", "Biên giới đang yên", "Không có mặt trận đang giao chiến."));
      fronts.forEach(function (battle) { panel.appendChild(createBattleItem(snapshot, battle, reinforceActions)); });
      addWarnings(snapshot);
    }

    return { render: render };
  }

  return { create: create };
});
