(function (root, factory) {
  "use strict";
  var game = root.MLN222Game;
  if (!game || !game.hasModule("ui-utils")) throw new Error("Load UI utilities before context-action-model.js.");
  var api = game.registerModule("context-action-model", factory(game["ui-utils"]));
  if (typeof module === "object" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function (utils) {
  "use strict";

  var GROUPS = Object.freeze([
    Object.freeze({ id: "info", label: "Thông tin", icon: "info", panel: "province" }),
    Object.freeze({ id: "diplomacy", label: "Ngoại giao", icon: "handshake", panel: "diplomacy" }),
    Object.freeze({ id: "trade", label: "Thương mại", icon: "coins", panel: "diplomacy" }),
    Object.freeze({ id: "military", label: "Quân sự", icon: "swords", panel: "battle" }),
  ]);

  function proposalFor(state, proposalId) {
    var player = state && state.factions && state.factions.player;
    return player && Array.isArray(player.treatyProposals)
      ? player.treatyProposals.find(function (proposal) { return proposal.id === proposalId; }) || null
      : null;
  }

  function proposalPartner(proposal) {
    if (!proposal) return null;
    return proposal.fromFactionId === "player" ? proposal.toFactionId : proposal.fromFactionId;
  }

  function actionTargets(action, groupId, ownerId, provinceId, state) {
    if (!action || !action.payload) return false;
    var payload = action.payload;
    if (groupId === "trade") {
      return action.type === "TRADE" && (payload.partnerId === ownerId || payload.targetProvinceId === provinceId);
    }
    if (groupId === "diplomacy") {
      if ((action.type === "TREATY" || action.type === "PROPOSE_TREATY") && payload.partnerId === ownerId) return true;
      if (action.type === "RESPOND_TREATY") return proposalPartner(proposalFor(state, payload.proposalId)) === ownerId;
      return false;
    }
    if (groupId === "military") {
      if (action.type === "WARN_ATTACK") return payload.defenderId === ownerId || payload.targetProvinceId === provinceId;
      if (action.type !== "REINFORCE" || !state || !state.battles) return false;
      var battle = state.battles[payload.battleId];
      return Boolean(battle && (battle.sourceProvinceId === provinceId || battle.targetProvinceId === provinceId));
    }
    return false;
  }

  function treatyLabel(type) {
    return type === "alliance" ? "liên minh" : "hiệp ước không xâm phạm";
  }

  function unitLabel(unitId) {
    return utils.UNIT_LABELS[unitId] || unitId;
  }

  function unlockCost(data, state, unitId) {
    var recruitment = data.balance && data.balance.economy && data.balance.economy.recruitment;
    var spec = recruitment && recruitment.unlocks ? recruitment.unlocks[unitId] : null;
    if (!spec) return null;
    var multiplier = (state.effects || []).filter(function (effect) {
      return effect.type === "quiz-unlock-discount" && effect.factionId === "player";
    }).reduce(function (result, effect) { return result * effect.multiplier; }, 1);
    return Math.ceil(spec.coinCost * multiplier);
  }

  function describeAction(data, state, action) {
    var payload = action.payload || {};
    if (action.type === "RECRUIT") {
      var recruitment = data.balance && data.balance.economy && data.balance.economy.recruitment;
      var unitCost = recruitment && recruitment.unitCosts ? recruitment.unitCosts[payload.unitId] : null;
      var cost = unitCost
        ? Math.ceil(payload.count * unitCost.food) + " lương thực · " + Math.ceil(payload.count * unitCost.coin) + " tiền"
        : "Dùng 1 điểm lệnh";
      return {
        label: "Tuyển " + utils.formatInteger(payload.count) + " " + unitLabel(payload.unitId),
        detail: utils.provinceName(data, payload.provinceId) + " · " + cost + " · hoàn tất sau 1 lượt",
        tone: "province",
      };
    }
    if (action.type === "UNLOCK") {
      var coinCost = unlockCost(data, state, payload.unitId);
      return {
        label: "Mở khóa " + unitLabel(payload.unitId),
        detail: coinCost === null ? "Dùng 1 điểm lệnh" : utils.formatInteger(coinCost) + " tiền · dùng 1 điểm lệnh",
        tone: "province",
      };
    }
    if (action.type === "MOVE") {
      return {
        label: "Điều " + utils.formatInteger(payload.count) + " " + unitLabel(payload.unitId) + " tới " + utils.provinceName(data, payload.targetProvinceId),
        detail: utils.provinceName(data, payload.sourceProvinceId) + " - " + utils.provinceName(data, payload.targetProvinceId) + " · dùng 1 điểm lệnh",
        tone: "move",
      };
    }
    if (action.type === "TRADE") {
      return {
        label: "Mở thương lộ " + utils.provinceName(data, payload.sourceProvinceId) + " - " + utils.provinceName(data, payload.targetProvinceId),
        detail: "Tạo thu nhập tiền tệ mỗi lượt · dùng 1 điểm lệnh",
        tone: "trade",
      };
    }
    if (action.type === "TREATY" || action.type === "PROPOSE_TREATY") {
      return {
        label: "Đề nghị " + treatyLabel(payload.treatyType),
        detail: "Gửi tới " + utils.factionName(data, payload.partnerId) + " · dùng 1 điểm lệnh",
        tone: "diplomacy",
      };
    }
    if (action.type === "RESPOND_TREATY") {
      var proposal = proposalFor(state, payload.proposalId);
      return {
        label: (payload.accepted ? "Chấp nhận " : "Từ chối ") + (proposal ? treatyLabel(proposal.type) : "đề nghị hiệp ước"),
        detail: (proposal ? utils.factionName(data, proposal.fromFactionId) : payload.proposalId) + " · dùng 1 điểm lệnh",
        tone: "diplomacy",
      };
    }
    if (action.type === "WARN_ATTACK") {
      var ratio = Number.isFinite(payload.strengthRatio) ? payload.strengthRatio.toFixed(2) : "?";
      return {
        label: "Tiến công từ " + utils.provinceName(data, payload.sourceProvinceId),
        detail: "Tương quan sức mạnh " + ratio + "x · phát cảnh báo trước giao chiến",
        tone: "military",
      };
    }
    if (action.type === "REINFORCE") {
      var count = Object.values(payload.units || {}).reduce(function (total, value) { return total + value; }, 0);
      return {
        label: "Điều " + utils.formatInteger(count) + " quân tiếp viện",
        detail: "Tới mặt trận " + payload.battleId + " · dùng 1 điểm lệnh",
        tone: "military",
      };
    }
    return { label: action.type, detail: "Dùng 1 điểm lệnh", tone: "neutral" };
  }

  function hasAdjacentPlayerProvince(data, state, provinceId) {
    var neighbors = data.adjacency && data.adjacency.neighbors ? data.adjacency.neighbors[provinceId] || [] : [];
    return neighbors.some(function (neighborId) {
      return state.provinces[neighborId] && state.provinces[neighborId].ownerId === "player";
    });
  }

  function unavailableReason(data, snapshot, target, groupId) {
    var state = snapshot.state;
    if (!state) return "Bắt đầu chiến dịch để mở khóa thao tác này.";
    if (state.phase !== "action") return "Chỉ có thể ra lệnh trong giai đoạn hành động.";
    if (state.quiz && state.quiz.active) return "Hoàn thành thử thách cuối lượt trước khi ra lệnh mới.";
    if (state.factions.player.campaignOutcome !== null) return "Chiến dịch đã kết thúc.";
    if (state.factions.player.actionPoints - snapshot.pendingActions.length < 1) return "Bạn đã dùng hết điểm lệnh của lượt này.";
    if (!target.isForeign) return "Đây là lãnh thổ của bạn.";
    var relation = target.relation;
    if (groupId === "trade") {
      if (!hasAdjacentPlayerProvince(data, state, target.provinceId)) return "Cần một tỉnh của bạn giáp mục tiêu để mở thương lộ.";
      if (relation && relation.status === "war") return "Không thể giao thương khi hai bên đang có chiến tranh.";
      return "Thiện chí, giới hạn thương lộ hoặc tình trạng mặt trận chưa đáp ứng.";
    }
    if (groupId === "diplomacy") {
      if (relation && relation.status === "alliance") return "Hai thế lực đã là đồng minh.";
      return "Chưa đủ thiện chí hoặc giới hạn hiệp ước đã đạt tối đa.";
    }
    if (groupId === "military") {
      if (!hasAdjacentPlayerProvince(data, state, target.provinceId)) return "Cần một tỉnh của bạn giáp mục tiêu để phát động tiến công.";
      if (relation && relation.status === "alliance") return "Không thể tiến công đồng minh.";
      if (relation && relation.status === "non-aggression") return "Hiệp ước không xâm phạm đang còn hiệu lực.";
      if (state.turn <= data.balance.campaign.noWarThroughTurn) return "Thời kỳ bảo hộ đầu chiến dịch chưa kết thúc.";
      return "Chưa đủ quân hoặc mục tiêu đang có cảnh báo hay mặt trận hoạt động.";
    }
    return "Chưa có thao tác hợp lệ.";
  }

  function build(options) {
    var data = options.data;
    var snapshot = options.snapshot;
    var provinceId = options.provinceId;
    var legalActions = Array.isArray(options.legalActions) ? options.legalActions : [];
    var state = snapshot && snapshot.state;
    var province = state && state.provinces ? state.provinces[provinceId] : null;
    var ownerId = province ? province.ownerId : null;
    var relation = state && ownerId && ownerId !== "player" ? state.factions.player.relations[ownerId] || null : null;
    var target = {
      provinceId: provinceId,
      provinceName: utils.provinceName(data, provinceId),
      ownerId: ownerId,
      ownerName: ownerId === "player" ? "Thế lực của bạn" : ownerId ? "Thế lực " + utils.factionName(data, ownerId) : "Chưa phân định",
      isForeign: Boolean(ownerId && ownerId !== "player"),
      relation: relation,
      relationLabel: relation ? utils.RELATION_LABELS[relation.status] || relation.status : "Chưa có quan hệ",
    };
    var groups = GROUPS.map(function (definition) {
      if (definition.id === "info") {
        return {
          id: definition.id,
          label: definition.label,
          icon: definition.icon,
          panel: definition.panel,
          available: true,
          reason: "",
          actions: [{ kind: "navigation", id: "inspect-province", label: "Mở hồ sơ " + target.provinceName, detail: target.ownerName + " · " + target.relationLabel }],
        };
      }
      var actions = legalActions.filter(function (action) {
        return actionTargets(action, definition.id, ownerId, provinceId, state);
      }).map(function (action) {
        var description = describeAction(data, state, action);
        return {
          kind: "command",
          id: utils.actionKey(action),
          label: description.label,
          detail: description.detail,
          tone: description.tone,
          action: utils.clone(action),
        };
      });
      return {
        id: definition.id,
        label: definition.label,
        icon: definition.icon,
        panel: definition.panel,
        available: actions.length > 0,
        reason: actions.length ? "" : unavailableReason(data, snapshot, target, definition.id),
        actions: actions,
      };
    });
    return { target: target, groups: groups };
  }

  return {
    GROUPS: GROUPS,
    build: build,
    describeAction: describeAction,
  };
});
