(function (root, factory) {
  "use strict";
  var game = root.MLN222Game;
  var required = ["contracts", "campaign", "ui-utils"];
  if (!game || required.some(function (name) { return !game.hasModule(name); })) throw new Error("Load campaign and UI utilities before turn-report.js.");
  var api = game.registerModule("turn-report", factory(game));
  if (typeof module === "object" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function (game) {
  "use strict";

  var contracts = game.contracts;
  var campaign = game.campaign;
  var utils = game["ui-utils"];
  var PLAYER_ID = "player";
  var MAX_EVENTS = 10;

  var REGION_LABELS = Object.freeze({
    "bac-bo": "Bắc Bộ",
    "bac-trung-bo": "Bắc Trung Bộ",
    "nam-trung-bo": "Nam Trung Bộ",
    "tay-nguyen": "Tây Nguyên",
    "dong-nam-bo": "Đông Nam Bộ",
    "tay-nam-bo": "Tây Nam Bộ",
  });

  var EVENT_PRIORITY = Object.freeze({
    CAMPAIGN_VICTORY: 100,
    CAMPAIGN_DEFEAT: 100,
    PROVINCE_CAPTURED: 90,
    OCCUPATION_STARTED: 88,
    BATTLE_ENDED: 85,
    BATTLE_STARTED: 80,
    ATTACK_WARNING_CREATED: 78,
    WAR_DECLARED: 76,
    BATTLE_PULSE_RESOLVED: 70,
    BATTLE_REINFORCEMENT_ARRIVED: 68,
    BATTLE_REINFORCEMENT_QUEUED: 66,
    DESERTION_OCCURRED: 64,
    UNIT_UNLOCKED: 62,
    RECRUITMENT_COMPLETED: 60,
    QUIZ_REWARD_APPLIED: 58,
    CAMPAIGN_TURN_COMPLETED: 10,
  });

  var EVENT_LABELS = Object.freeze({
    CAMPAIGN_VICTORY: "Chiến thắng",
    CAMPAIGN_DEFEAT: "Thất bại",
    CAMPAIGN_TURN_COMPLETED: "Kết thúc lượt",
    PROVINCE_CAPTURED: "Lãnh thổ đổi chủ",
    OCCUPATION_STARTED: "Bắt đầu chiếm đóng",
    OCCUPATION_ADVANCED: "Tiến độ chiếm đóng",
    OCCUPATION_ENDED: "Hoàn tất chiếm đóng",
    BATTLE_STARTED: "Mở mặt trận",
    BATTLE_PULSE_RESOLVED: "Giao chiến",
    BATTLE_ENDED: "Kết thúc mặt trận",
    BATTLE_REINFORCEMENT_QUEUED: "Điều viện binh",
    BATTLE_REINFORCEMENT_ARRIVED: "Viện binh tới nơi",
    ATTACK_WARNING_CREATED: "Cảnh báo tiến công",
    ATTACK_WARNING_CANCELLED: "Hủy tiến công",
    WAR_DECLARED: "Tuyên chiến",
    RECRUITMENT_QUEUED: "Tuyển quân",
    RECRUITMENT_COMPLETED: "Hoàn tất huấn luyện",
    UNIT_UNLOCKED: "Mở khóa binh chủng",
    TROOPS_MOVED: "Điều quân",
    POPULATION_GREW: "Dân số tăng",
    RESOURCES_PRODUCED: "Sản xuất",
    UPKEEP_SETTLED: "Quân phí",
    DESERTION_OCCURRED: "Đào ngũ",
    TURN_ECONOMY_COMPLETED: "Kinh tế đầu lượt",
    TRADE_ROUTE_CREATED: "Mở thương lộ",
    TRADE_SETTLED: "Giao thương",
    TRADE_ROUTE_REMOVED: "Đóng thương lộ",
    TREATY_PROPOSED: "Đề nghị hiệp ước",
    TREATY_CHANGED: "Quan hệ thay đổi",
    QUIZ_REWARD_APPLIED: "Kết quả thử thách",
    WOUNDED_RECOVERED: "Quân bị thương hồi phục",
  });

  var SUCCESS_EVENTS = Object.freeze(["CAMPAIGN_VICTORY", "OCCUPATION_ENDED", "RECRUITMENT_COMPLETED", "UNIT_UNLOCKED", "WOUNDED_RECOVERED"]);
  var DANGER_EVENTS = Object.freeze(["CAMPAIGN_DEFEAT", "BATTLE_STARTED", "BATTLE_PULSE_RESOLVED", "WAR_DECLARED", "DESERTION_OCCURRED"]);
  var WARNING_EVENTS = Object.freeze(["ATTACK_WARNING_CREATED", "OCCUPATION_STARTED", "OCCUPATION_ADVANCED", "UPKEEP_SETTLED"]);

  function provinceName(data, value) {
    return typeof value === "string" ? utils.provinceName(data, value) : "tỉnh không xác định";
  }

  function factionName(data, value) {
    return typeof value === "string" ? utils.factionName(data, value) : "thế lực không xác định";
  }

  function integer(value) {
    return utils.formatInteger(Number.isFinite(value) ? value : 0);
  }

  function percent(value) {
    return Math.round((Number.isFinite(value) ? value : 0) * 100) + "%";
  }

  function unitName(unitId) {
    return utils.UNIT_LABELS[unitId] || unitId || "quân";
  }

  function battleForEvent(state, payload) {
    return payload && typeof payload.battleId === "string" ? state.battles[payload.battleId] || null : null;
  }

  function describeQuizReward(payload) {
    var parts = ["Điểm " + integer(payload.score) + "/10"];
    if (contracts.isPlainObject(payload.resourceDeltas)) {
      if (payload.resourceDeltas.food) parts.push((payload.resourceDeltas.food > 0 ? "+" : "") + integer(payload.resourceDeltas.food) + " lương thực");
      if (payload.resourceDeltas.coin) parts.push((payload.resourceDeltas.coin > 0 ? "+" : "") + integer(payload.resourceDeltas.coin) + " tiền");
    }
    if (payload.populationDelta) parts.push("+" + integer(payload.populationDelta) + " dân thường");
    return parts.join(" · ") + ".";
  }

  function describeEvent(event, state, data) {
    var payload = contracts.isPlainObject(event.payload) ? event.payload : {};
    var battle = battleForEvent(state, payload);
    switch (event.type) {
      case "CAMPAIGN_VICTORY": return "Đã đạt điều kiện thống nhất đất nước.";
      case "CAMPAIGN_DEFEAT": return "Không còn tỉnh thành thuộc quyền kiểm soát.";
      case "CAMPAIGN_TURN_COMPLETED": return "Lượt " + integer(payload.turn) + " đã hoàn tất.";
      case "PROVINCE_CAPTURED":
        if (payload.newOwnerId === PLAYER_ID) return "Đã chiếm " + provinceName(data, payload.provinceId) + ".";
        if (payload.previousOwnerId === PLAYER_ID) return "Đã mất " + provinceName(data, payload.provinceId) + ".";
        return provinceName(data, payload.provinceId) + " đã đổi chủ.";
      case "OCCUPATION_STARTED": return "Bắt đầu ổn định " + provinceName(data, payload.provinceId) + ".";
      case "OCCUPATION_ADVANCED": return provinceName(data, payload.provinceId) + " còn " + integer(payload.remainingTurns) + " lượt chiếm đóng.";
      case "OCCUPATION_ENDED": return "Đã ổn định quyền kiểm soát tại " + provinceName(data, payload.provinceId) + ".";
      case "BATTLE_STARTED": return provinceName(data, payload.sourceProvinceId) + " → " + provinceName(data, payload.targetProvinceId) + ".";
      case "BATTLE_PULSE_RESOLVED":
        if (battle && battle.attacker.factionId === PLAYER_ID) return "Ta mất " + integer(payload.attackerLosses) + ", địch mất " + integer(payload.defenderLosses) + " quân.";
        if (battle && battle.defender.factionId === PLAYER_ID) return "Ta mất " + integer(payload.defenderLosses) + ", địch mất " + integer(payload.attackerLosses) + " quân.";
        return "Hiệp " + integer(payload.turn) + " đã được giải quyết.";
      case "BATTLE_ENDED": return factionName(data, payload.winnerFactionId) + " thắng mặt trận" + (battle ? " tại " + provinceName(data, battle.targetProvinceId) : "") + ".";
      case "BATTLE_REINFORCEMENT_QUEUED": return integer(payload.count) + " quân đã lên đường" + (payload.arrivalTurn ? ", tới ở hiệp " + integer(payload.arrivalTurn) : "") + ".";
      case "BATTLE_REINFORCEMENT_ARRIVED": return integer(payload.count) + " quân đã tới mặt trận.";
      case "ATTACK_WARNING_CREATED": return provinceName(data, payload.sourceProvinceId) + " chuẩn bị tiến công " + provinceName(data, payload.targetProvinceId) + ".";
      case "ATTACK_WARNING_CANCELLED": return "Kế hoạch tiến công đã bị hủy.";
      case "WAR_DECLARED": return factionName(data, payload.attackerId) + " tuyên chiến với " + factionName(data, payload.defenderId) + ".";
      case "RECRUITMENT_QUEUED": return "Đã tuyển " + integer(payload.count) + " " + unitName(payload.unitId) + " tại " + provinceName(data, payload.provinceId) + ".";
      case "RECRUITMENT_COMPLETED": return integer(payload.count) + " " + unitName(payload.unitId) + " hoàn tất huấn luyện tại " + provinceName(data, payload.provinceId) + ".";
      case "UNIT_UNLOCKED": return "Đã mở khóa " + unitName(payload.unitId) + ".";
      case "TROOPS_MOVED": return "Đã điều " + integer(payload.count) + " " + unitName(payload.unitId) + " tới " + provinceName(data, payload.targetProvinceId) + ".";
      case "POPULATION_GREW": return provinceName(data, payload.provinceId) + " tăng " + integer(payload.delta) + " dân thường.";
      case "RESOURCES_PRODUCED": return provinceName(data, payload.provinceId) + ": +" + integer(payload.food) + " lương thực, +" + integer(payload.coin) + " tiền.";
      case "UPKEEP_SETTLED": return "Thiếu " + integer(payload.foodShortage) + " lương thực và " + integer(payload.coinShortage) + " tiền cho quân phí.";
      case "DESERTION_OCCURRED": return integer(payload.count) + " quân đào ngũ tại " + provinceName(data, payload.provinceId) + ".";
      case "TURN_ECONOMY_COMPLETED": return "Đã nhận " + integer(payload.actionPoints) + " điểm lệnh cho lượt " + integer(payload.turn) + ".";
      case "TRADE_ROUTE_CREATED": return "Một thương lộ mới đã được thiết lập.";
      case "TRADE_SETTLED": return payload.active === false ? "Thương lộ bị gián đoạn." : "Thương lộ hoạt động trong lượt này.";
      case "TRADE_ROUTE_REMOVED": return "Một thương lộ đã đóng.";
      case "TREATY_PROPOSED": return "Đã gửi một đề nghị hiệp ước.";
      case "TREATY_CHANGED": return "Quan hệ ngoại giao đã thay đổi.";
      case "QUIZ_REWARD_APPLIED": return describeQuizReward(payload);
      case "WOUNDED_RECOVERED": return integer(payload.count) + " quân hồi phục tại " + provinceName(data, payload.provinceId) + ".";
      default: return "Diễn biến chiến dịch đã được ghi nhận.";
    }
  }

  function eventLabel(type) {
    if (EVENT_LABELS[type]) return EVENT_LABELS[type];
    return typeof type === "string" ? type.toLowerCase().split("_").map(function (part) {
      return part.charAt(0).toUpperCase() + part.slice(1);
    }).join(" ") : "Sự kiện";
  }

  function addProgressItem(container, label, value) {
    var item = utils.element("div");
    item.appendChild(utils.element("span", "", label));
    item.appendChild(utils.element("strong", "", value));
    container.appendChild(item);
  }

  function prioritizedEvents(events) {
    return events.map(function (event, index) { return { event: event, index: index }; }).sort(function (left, right) {
      var priority = (EVENT_PRIORITY[right.event.type] || 0) - (EVENT_PRIORITY[left.event.type] || 0);
      return priority || right.index - left.index;
    });
  }

  function eventTone(event) {
    var type = event.type;
    if (type === "QUIZ_REWARD_APPLIED") return event.payload && event.payload.score > 5 ? "success" : "warning";
    if (type === "PROVINCE_CAPTURED") {
      if (event.payload && event.payload.newOwnerId === PLAYER_ID) return "success";
      if (event.payload && event.payload.previousOwnerId === PLAYER_ID) return "danger";
      return "neutral";
    }
    if (type === "BATTLE_ENDED") return event.payload && event.payload.winnerFactionId === PLAYER_ID ? "success" : "danger";
    if (SUCCESS_EVENTS.indexOf(type) !== -1) return "success";
    if (DANGER_EVENTS.indexOf(type) !== -1) return "danger";
    if (WARNING_EVENTS.indexOf(type) !== -1) return "warning";
    return "neutral";
  }

  function eventIcon(event) {
    var type = event.type;
    var tone = eventTone(event);
    if (tone === "success") return "circle-check";
    if (tone === "danger") return "swords";
    if (tone === "warning") return "triangle-alert";
    return type === "CAMPAIGN_TURN_COMPLETED" ? "clock-3" : "info";
  }

  function create(options) {
    if (!contracts.isPlainObject(options) || !contracts.isPlainObject(options.data)) throw new TypeError("Turn report options are invalid.");
    var data = options.data;
    var panel = options.root || document.getElementById("gameReportPanel");
    if (!panel) throw new Error("Turn report container is missing.");
    if (!contracts.isPlainObject(data.victoryRules)) throw new TypeError("Victory rules are missing from turn report data.");

    function render(snapshot) {
      utils.clear(panel);
      panel.appendChild(utils.element("h2", "", "Tiến độ chiến thắng"));
      if (!snapshot || !snapshot.state) {
        panel.appendChild(utils.status("neutral", "Chưa có chiến dịch", "Bắt đầu hoặc tiếp tục chiến dịch để xem báo cáo."));
        return;
      }

      var state = snapshot.state;
      var outcome = campaign.evaluateOutcome(state, PLAYER_ID, data);
      var regions = outcome.controlledRegions;
      var activeFronts = Object.keys(state.battles).filter(function (battleId) {
        var battle = state.battles[battleId];
        return battle.status === "active" && (battle.attacker.factionId === PLAYER_ID || battle.defender.factionId === PLAYER_ID);
      }).length;
      var summary = utils.element("div", "game-progress-summary");
      addProgressItem(summary, "Kiểm soát quốc gia", percent(outcome.nationalShare) + " / " + percent(data.victoryRules.nationalControlThreshold));
      addProgressItem(summary, "Vùng kiểm soát", regions.length + " / " + data.victoryRules.minimumControlledRegions);
      addProgressItem(summary, "Tỉnh sở hữu", outcome.provinceCount + " / " + Object.keys(state.provinces).length);
      addProgressItem(summary, "Mặt trận", String(activeFronts));
      panel.appendChild(summary);

      var statusText;
      if (outcome.status === "victory") statusText = "Đã đạt đủ hai điều kiện chiến thắng.";
      else if (outcome.status === "defeat") statusText = "Chiến dịch đã thất bại.";
      else statusText = regions.length
        ? "Đang kiểm soát: " + regions.map(function (region) { return REGION_LABELS[region] || region; }).join(", ") + "."
        : "Chưa kiểm soát quá nửa lãnh thổ của vùng nào.";
      panel.appendChild(utils.element("div", "game-status-line", statusText));

      panel.appendChild(utils.element("h3", "", "Diễn biến lượt gần nhất"));
      var events = Array.isArray(snapshot.reportEvents) ? prioritizedEvents(snapshot.reportEvents) : [];
      if (!events.length) {
        panel.appendChild(utils.status("neutral", "Chưa có sự kiện mới", "Kết thúc một lượt để nhận báo cáo chiến dịch."));
        return;
      }
      var timeline = utils.element("div", "game-timeline");
      events.slice(0, MAX_EVENTS).forEach(function (entry) {
        var tone = eventTone(entry.event);
        var row = utils.element("article", "game-timeline-item game-timeline-" + tone);
        row.appendChild(utils.icon(eventIcon(entry.event), "game-timeline-icon"));
        var copy = utils.element("div", "game-timeline-copy");
        copy.appendChild(utils.element("strong", "", eventLabel(entry.event.type)));
        copy.appendChild(utils.element("p", "", describeEvent(entry.event, state, data)));
        row.appendChild(copy);
        timeline.appendChild(row);
      });
      panel.appendChild(timeline);
      if (events.length > MAX_EVENTS) panel.appendChild(utils.element("div", "game-status-line", "Còn " + (events.length - MAX_EVENTS) + " sự kiện ít quan trọng hơn."));
    }

    return { render: render };
  }

  return { create: create };
});
