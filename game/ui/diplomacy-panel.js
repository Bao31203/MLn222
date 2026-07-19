(function (root, factory) {
  "use strict";
  var game = root.MLN222Game;
  if (!game || !game.hasModule("ui-utils") || !game.hasModule("context-action-model")) throw new Error("Load UI action utilities before diplomacy-panel.js.");
  var api = game.registerModule("diplomacy-panel", factory(game["ui-utils"], game["context-action-model"]));
  if (typeof module === "object" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function (utils, actionModel) {
  "use strict";

  var DIPLOMACY_ACTION_TYPES = Object.freeze(["TRADE", "TREATY", "PROPOSE_TREATY", "RESPOND_TREATY"]);
  var STATUS_PRIORITY = Object.freeze({ war: 0, alliance: 1, "non-aggression": 2, neutral: 3 });

  function findElement(scope, id, required) {
    var node = typeof scope.getElementById === "function"
      ? scope.getElementById(id)
      : scope.querySelector("#" + id);
    if (!node && required) throw new Error("Campaign diplomacy element is missing: " + id);
    return node;
  }

  function relationLabel(status) {
    return utils.RELATION_LABELS[status] || status;
  }

  function treatyLabel(type) {
    return type === "alliance" ? "liên minh" : "hiệp ước không xâm phạm";
  }

  function factionName(data, factionId) {
    return factionId ? utils.factionName(data, factionId) : "Không rõ";
  }

  function appendEmpty(parent, message) {
    parent.append(utils.status("neutral", "Chưa có diễn biến", message));
  }

  function createGroup(title) {
    var group = utils.element("section", "game-action-group");
    group.append(utils.element("h3", "", title));
    return group;
  }

  function routePartner(route) {
    return route.fromFactionId === "player" ? route.toFactionId : route.fromFactionId;
  }

  function proposalPartner(proposal) {
    return proposal.fromFactionId === "player" ? proposal.toFactionId : proposal.fromFactionId;
  }

  function playerWarnings(state) {
    return (state.effects || []).filter(function (effect) {
      return effect.type === "attack-warning" && (effect.attackerId === "player" || effect.defenderId === "player");
    });
  }

  function uniqueProposals(player) {
    var seen = Object.create(null);
    return (player.treatyProposals || []).filter(function (proposal) {
      if (seen[proposal.id]) return false;
      seen[proposal.id] = true;
      return true;
    });
  }

  function routeLimit(state, data) {
    var diplomacy = data.balance && data.balance.diplomacy;
    var campaign = data.balance && data.balance.campaign;
    if (!diplomacy || !campaign) return null;
    var owned = Object.keys(state.provinces || {}).filter(function (provinceId) {
      return state.provinces[provinceId].ownerId === "player";
    }).length;
    return Math.min(
      diplomacy.maxTradeRoutes,
      campaign.baseTradeRoutes + Math.floor(owned / campaign.provincesPerTradeRoute)
    );
  }

  function renderWarnings(panel, warnings, data) {
    if (warnings.length === 0) return;
    var group = createGroup("Cảnh báo quân sự");
    warnings.forEach(function (warning) {
      var outgoing = warning.attackerId === "player";
      var counterpart = outgoing ? warning.defenderId : warning.attackerId;
      var route = utils.provinceName(data, warning.sourceProvinceId) + " → " + utils.provinceName(data, warning.targetProvinceId);
      group.append(utils.status(
        "warning",
        (outgoing ? "Bạn cảnh báo " : "Cảnh báo từ ") + factionName(data, counterpart),
        route + " · dự kiến lượt " + utils.formatInteger(warning.executeTurn)
      ));
    });
    panel.append(group);
  }

  function renderProposals(panel, proposals, data) {
    if (proposals.length === 0) return;
    var group = createGroup("Đề nghị hiệp ước");
    proposals.forEach(function (proposal) {
      var incoming = proposal.toFactionId === "player";
      var row = utils.element("div", "game-relation-row");
      row.classList.add("is-pending");
      row.append(
        utils.element("strong", "", treatyLabel(proposal.type)),
        utils.element(
          "span",
          "game-relation-state",
          (incoming ? "Nhận từ " : "Đã gửi đến ") + factionName(data, proposalPartner(proposal)) + " · lượt " + utils.formatInteger(proposal.turn)
        )
      );
      group.append(row);
    });
    panel.append(group);
  }

  function renderRoutes(panel, routes, data) {
    var group = createGroup("Tuyến thương mại");
    if (routes.length === 0) {
      appendEmpty(group, "Chưa có tuyến thương mại.");
      panel.append(group);
      return;
    }
    routes.slice().sort(function (left, right) { return left.id < right.id ? -1 : left.id > right.id ? 1 : 0; }).forEach(function (route) {
      var row = utils.element("div", "game-relation-row");
      var path = utils.provinceName(data, route.sourceProvinceId) + " ↔ " + utils.provinceName(data, route.targetProvinceId);
      row.append(
        utils.element("strong", "", factionName(data, routePartner(route))),
        utils.element("span", "game-relation-state", path + " · " + (route.active ? "Đang hoạt động" : "Gián đoạn"))
      );
      group.append(row);
    });
    panel.append(group);
  }

  function renderTreaties(panel, player, data, targetFactionId) {
    var treatyIds = Object.keys(player.relations || {}).filter(function (factionId) {
      return player.relations[factionId].status !== "neutral" && (!targetFactionId || factionId === targetFactionId);
    }).sort(function (leftId, rightId) {
      var statusDifference = STATUS_PRIORITY[player.relations[leftId].status] - STATUS_PRIORITY[player.relations[rightId].status];
      if (statusDifference !== 0) return statusDifference;
      return leftId < rightId ? -1 : leftId > rightId ? 1 : 0;
    });
    var group = createGroup("Hiệp ước và xung đột");
    if (treatyIds.length === 0) {
      appendEmpty(group, "Chưa có hiệp ước hoặc xung đột đang hoạt động.");
      panel.append(group);
      return;
    }
    treatyIds.forEach(function (factionId) {
      var relation = player.relations[factionId];
      var expiry = relation.untilTurn === null ? "" : " · đến lượt " + utils.formatInteger(relation.untilTurn);
      var row = utils.element("div", "game-relation-row");
      row.append(
        utils.element("strong", "", factionName(data, factionId)),
        utils.element("span", "game-relation-state", relationLabel(relation.status) + expiry)
      );
      group.append(row);
    });
    panel.append(group);
  }

  function renderRelations(panel, state, player, data, targetFactionId) {
    var factionIds = Object.keys(player.relations || {}).filter(function (factionId) {
      return !targetFactionId || factionId === targetFactionId;
    }).sort(function (leftId, rightId) {
      var left = player.relations[leftId];
      var right = player.relations[rightId];
      var priorityDifference = STATUS_PRIORITY[left.status] - STATUS_PRIORITY[right.status];
      if (priorityDifference !== 0) return priorityDifference;
      if (right.score !== left.score) return right.score - left.score;
      return leftId < rightId ? -1 : leftId > rightId ? 1 : 0;
    });
    var group = createGroup("Quan hệ các thế lực");
    factionIds.forEach(function (factionId) {
      var relation = player.relations[factionId];
      var score = relation.score > 0 ? "+" + relation.score : String(relation.score);
      var lock = relation.betrayalUntilTurn === null ? "" : " · khóa đến lượt " + utils.formatInteger(relation.betrayalUntilTurn);
      var eliminated = state.factions[factionId] && state.factions[factionId].eliminated ? " · đã bị loại" : "";
      var row = utils.element("div", "game-relation-row");
      row.append(
        utils.element("strong", "", factionName(data, factionId)),
        utils.element("span", "game-relation-state", relationLabel(relation.status) + " · " + score + lock + eliminated)
      );
      group.append(row);
    });
    panel.append(group);
  }

  function actionPartner(action, proposals) {
    if (!action || !action.payload) return null;
    if (action.payload.partnerId) return action.payload.partnerId;
    var proposal = proposals.find(function (entry) { return entry.id === action.payload.proposalId; });
    return proposal ? proposalPartner(proposal) : null;
  }

  function create(options) {
    if (!options || !options.data || !options.controller || typeof options.controller.legalActions !== "function" || typeof options.controller.stageAction !== "function") {
      throw new TypeError("Diplomacy panel options are invalid.");
    }
    var data = options.data;
    var controller = options.controller;
    var onError = typeof options.onError === "function" ? options.onError : null;
    var scope = options.root || document;
    var panel = findElement(scope, "gameDiplomacyPanel", true);
    var liveStatus = findElement(scope, "gameLiveStatus", false);

    function notifyError(caught) {
      if (onError) {
        onError(caught);
        return;
      }
      if (!liveStatus) return;
      liveStatus.textContent = caught && caught.message ? caught.message : "Không thể xếp lệnh ngoại giao này.";
    }

    function stage(action) {
      try {
        controller.stageAction({ type: action.type, payload: utils.clone(action.payload) });
      } catch (caught) {
        notifyError(caught);
      }
    }

    function renderActions(snapshot, proposals, targetFactionId) {
      var actions;
      try {
        actions = controller.legalActions().filter(function (action) {
          return DIPLOMACY_ACTION_TYPES.indexOf(action.type) !== -1 && (!targetFactionId || actionPartner(action, proposals) === targetFactionId);
        });
      } catch (caught) {
        actions = [];
        notifyError(caught);
      }
      var group = createGroup("Lệnh ngoại giao hợp lệ");
      if (actions.length === 0) {
        var player = snapshot.state.factions.player;
        var pendingCount = Array.isArray(snapshot.pendingActions) ? snapshot.pendingActions.length : 0;
        var message = snapshot.state.phase !== "action"
          ? "Ngoại giao chỉ khả dụng trong pha hành động."
          : player && pendingCount >= player.actionPoints
            ? "Đã dùng hết điểm lệnh của lượt này."
            : "Chưa có lệnh ngoại giao hợp lệ.";
        appendEmpty(group, message);
        panel.append(group);
        return;
      }

      var pendingKeys = new Set((snapshot.pendingActions || []).map(utils.actionKey));
      var list = utils.element("div", "game-action-list");
      actions.forEach(function (action) {
        var copy = { type: action.type, payload: utils.clone(action.payload) };
        var description = actionModel.describeAction(data, snapshot.state, copy);
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
      var player = state && state.factions ? state.factions.player : null;
      if (!player) {
        appendEmpty(panel, "Bắt đầu hoặc tiếp tục chiến dịch để xem ngoại giao.");
        return;
      }

      var proposals = uniqueProposals(player);
      var warnings = playerWarnings(state);
      var selectedProvince = state.provinces[snapshot.selectedProvinceId];
      var targetFactionId = selectedProvince && selectedProvince.ownerId !== "player" ? selectedProvince.ownerId : null;
      if (targetFactionId) {
        proposals = proposals.filter(function (proposal) { return proposalPartner(proposal) === targetFactionId; });
        warnings = warnings.filter(function (warning) {
          return (warning.attackerId === "player" ? warning.defenderId : warning.attackerId) === targetFactionId;
        });
      }
      var treaties = Object.keys(player.relations || {}).filter(function (factionId) {
        var status = player.relations[factionId].status;
        return status === "alliance" || status === "non-aggression";
      }).length;
      var limit = routeLimit(state, data);
      var header = utils.element("div", "game-panel-header");
      var title = document.createElement("div");
      title.append(
        utils.element("p", "game-eyebrow", targetFactionId ? "Đối ngoại mục tiêu" : "Đối ngoại"),
        utils.element("h2", "", targetFactionId ? factionName(data, targetFactionId) : "Ngoại giao")
      );
      var targetRelation = targetFactionId ? player.relations[targetFactionId] : null;
      header.append(title, utils.element(
        "div",
        "game-owner-label",
        targetRelation ? relationLabel(targetRelation.status) + " · " + (targetRelation.score > 0 ? "+" : "") + targetRelation.score : utils.formatInteger(Object.keys(player.relations || {}).length) + " thế lực"
      ));
      panel.append(header);
      panel.append(utils.element(
        "div",
        "game-status-line",
        "Tuyến " + utils.formatInteger(player.tradeRoutes.length) + (limit === null ? "" : "/" + utils.formatInteger(limit)) +
          " · Hiệp ước " + utils.formatInteger(treaties) +
          " · Cảnh báo " + utils.formatInteger(warnings.length)
      ));

      renderWarnings(panel, warnings, data);
      renderProposals(panel, proposals, data);
      renderActions(snapshot, proposals, targetFactionId);
      renderRoutes(panel, (player.tradeRoutes || []).filter(function (route) { return !targetFactionId || routePartner(route) === targetFactionId; }), data);
      renderTreaties(panel, player, data, targetFactionId);
      renderRelations(panel, state, player, data, targetFactionId);
    }

    return { render: render, update: render };
  }

  return { create: create };
});
