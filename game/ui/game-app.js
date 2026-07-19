(function (root, factory) {
  "use strict";
  var game = root.MLN222Game;
  var required = [
    "contracts", "browser-storage", "game-controller", "context-action-model", "context-command-menu", "order-tray", "map-view", "resource-bar",
    "province-panel", "diplomacy-panel", "battle-panel", "game-quiz-view",
    "turn-report", "ui-utils"
  ];
  if (!game || required.some(function (name) { return !game.hasModule(name); })) throw new Error("Load all campaign UI modules before game-app.js.");
  var api = game.registerModule("game-app", factory(game, root));
  root.MLN222GameUI = api;
  if (typeof module === "object" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function (game, root) {
  "use strict";

  var instance = null;

  function memoryStorage() {
    var values = Object.create(null);
    return {
      getItem: function (key) { return Object.prototype.hasOwnProperty.call(values, key) ? values[key] : null; },
      setItem: function (key, value) { values[key] = String(value); },
      removeItem: function (key) { delete values[key]; },
    };
  }

  function storageBackend() {
    try {
      if (root.localStorage) return { storage: root.localStorage, warning: null };
    } catch (_caught) {
      return { storage: memoryStorage(), warning: "Bộ nhớ trình duyệt không khả dụng; chiến dịch chỉ được giữ trong phiên này." };
    }
    return { storage: memoryStorage(), warning: "Trình duyệt không hỗ trợ lưu chiến dịch; dữ liệu chỉ được giữ trong phiên này." };
  }

  function dependencies(data) {
    return {
      provinces: data.provinces.provinces,
      adjacency: data.adjacency.neighbors,
      balance: data.balance,
      personalities: data.personalities.personalities,
      victoryRules: data.victoryRules,
    };
  }

  function create() {
    var data = root.MLN222_GAME_DATA;
    var questions = root.MLN222_QUESTIONS;
    if (!game.contracts.isPlainObject(data) || !Array.isArray(questions)) throw new Error("Embedded campaign data or questions are missing.");
    var backend = storageBackend();
    var storage = game["browser-storage"].create(backend.storage);
    var controller = game["game-controller"].create({
      deps: dependencies(data),
      questions: questions,
      storage: storage,
      defaultProvinceId: data.provinces.provinces[0].id,
    });
    var utils = game["ui-utils"];
    var gameRoot = document.getElementById("gameRoot");
    var setupPane = document.getElementById("gameSetupPane");
    var campaignPane = document.getElementById("gameCampaignPane");
    var startSelect = document.getElementById("gameStartProvince");
    var seedInput = document.getElementById("gameSeed");
    var summary = document.getElementById("gameStartSummary");
    var status = document.getElementById("gameOrderStatus");
    var liveStatus = document.getElementById("gameLiveStatus");
    var quizChoice = document.getElementById("gameQuizChoice");
    var endTurn = document.getElementById("gameEndTurnBtn");
    var clearOrders = document.getElementById("gameClearOrdersBtn");
    var sheetToggle = document.getElementById("gameSheetToggle");
    var sheetTitle = document.getElementById("gameSheetTitle");
    var resourceToggle = document.getElementById("gameResourceToggle");
    var battleBadge = document.getElementById("gameBattleBadge");
    var reportBadge = document.getElementById("gameReportBadge");
    var rewardBanner = document.getElementById("gameRewardBanner");
    var sheetState = "collapsed";
    var resourcesExpanded = false;
    var lastAnnouncement = "";
    data.provinces.provinces.forEach(function (province) {
      var option = document.createElement("option");
      option.value = province.id;
      option.textContent = province.display.name;
      startSelect.appendChild(option);
    });

    function reportError(caught) {
      var message = caught && caught.message ? caught.message : String(caught || "Không thể thực hiện thao tác.");
      status.textContent = message;
      liveStatus.textContent = message;
    }

    function safeRun(operation) {
      try {
        return operation();
      } catch (caught) {
        reportError(caught);
        return null;
      }
    }

    function applyPresentationState() {
      gameRoot.dataset.sheetState = sheetState;
      gameRoot.dataset.resourcesExpanded = String(resourcesExpanded);
      sheetToggle.setAttribute("aria-expanded", String(sheetState === "expanded"));
      sheetToggle.title = sheetState === "expanded" ? "Thu gọn bảng chiến dịch" : "Mở rộng bảng chiến dịch";
      resourceToggle.setAttribute("aria-expanded", String(resourcesExpanded));
      resourceToggle.title = resourcesExpanded ? "Thu gọn tài nguyên" : "Hiện toàn bộ tài nguyên";
      resourceToggle.setAttribute("aria-label", resourceToggle.title);
    }

    function rewardDetails(snapshot) {
      var events = Array.isArray(snapshot.reportEvents) ? snapshot.reportEvents : [];
      for (var index = events.length - 1; index >= 0; index -= 1) {
        var event = events[index];
        if (!event || event.type !== "QUIZ_REWARD_APPLIED" || !event.payload) continue;
        var payload = event.payload;
        var parts = ["Kết quả " + utils.formatInteger(payload.score) + "/10"];
        if (payload.resourceDeltas) {
          if (payload.resourceDeltas.food) parts.push((payload.resourceDeltas.food > 0 ? "+" : "") + utils.formatInteger(payload.resourceDeltas.food) + " lương thực");
          if (payload.resourceDeltas.coin) parts.push((payload.resourceDeltas.coin > 0 ? "+" : "") + utils.formatInteger(payload.resourceDeltas.coin) + " tiền");
        }
        if (payload.populationDelta) parts.push((payload.populationDelta > 0 ? "+" : "") + utils.formatInteger(payload.populationDelta) + " dân thường");
        if (Array.isArray(payload.effects) && payload.effects.length) parts.push(utils.formatInteger(payload.effects.length) + " hiệu ứng mới");
        return { text: parts.join(" · "), warning: !(payload.score > 5) };
      }
      return { text: "", warning: false };
    }

    function renderBadges(snapshot) {
      var state = snapshot.state;
      var fronts = 0;
      var warnings = 0;
      if (state) {
        fronts = Object.keys(state.battles).filter(function (battleId) {
          var battle = state.battles[battleId];
          return battle.status === "active" && (battle.attacker.factionId === "player" || battle.defender.factionId === "player");
        }).length;
        warnings = state.effects.filter(function (effect) {
          return effect.type === "attack-warning" && (effect.attackerId === "player" || effect.defenderId === "player");
        }).length;
      }
      var battleCount = fronts + warnings;
      var reportCount = Array.isArray(snapshot.reportEvents) ? snapshot.reportEvents.length : 0;
      battleBadge.textContent = String(battleCount);
      battleBadge.classList.toggle("hidden", battleCount === 0);
      battleBadge.setAttribute("aria-label", battleCount + " mặt trận hoặc cảnh báo");
      reportBadge.textContent = String(Math.min(99, reportCount));
      reportBadge.classList.toggle("hidden", reportCount === 0);
      reportBadge.setAttribute("aria-label", reportCount + " sự kiện báo cáo");
    }

    function renderStartSummary(provinceId) {
      var definition = utils.provinceDefinition(data, provinceId);
      if (!definition) return;
      var tier = data.provinces.capacityTiers[definition.capacityTier];
      var trait = data.provinces.traitPackages[definition.trait];
      var terrain = data.provinces.terrains.find(function (entry) { return entry.id === definition.terrain; });
      var capacity = data.balance.campaign.capacityByTier[definition.capacityTier];
      var rows = [
        ["Vùng", (data.provinces.regions.find(function (entry) { return entry.id === definition.region; }) || {}).name || definition.region],
        ["Địa hình", terrain ? terrain.name : definition.terrain],
        ["Đặc tính", trait ? trait.name : definition.trait],
        ["Quy mô", tier ? tier.name : definition.capacityTier],
        ["Giới hạn dân", utils.formatInteger(capacity)],
      ];
      var list = document.createElement("dl");
      rows.forEach(function (row) {
        list.appendChild(utils.element("dt", "", row[0]));
        list.appendChild(utils.element("dd", "", row[1]));
      });
      summary.replaceChildren(list);
    }

    function selectPanel(name) {
      document.querySelectorAll("[data-game-panel]").forEach(function (button) {
        var selected = button.dataset.gamePanel === name;
        button.classList.toggle("active", selected);
        button.setAttribute("aria-pressed", String(selected));
        button.setAttribute("aria-controls", "game" + button.dataset.gamePanel.charAt(0).toUpperCase() + button.dataset.gamePanel.slice(1) + "Panel");
      });
      ["province", "diplomacy", "battle", "report"].forEach(function (panelName) {
        var panelNode = document.getElementById("game" + panelName.charAt(0).toUpperCase() + panelName.slice(1) + "Panel");
        var hidden = panelName !== name;
        panelNode.classList.toggle("hidden", hidden);
        panelNode.setAttribute("aria-hidden", String(hidden));
      });
    }

    var viewOptions = { data: data, controller: controller, onError: reportError };
    var views = [
      game["map-view"].create(viewOptions),
      game["context-command-menu"].create(viewOptions),
      game["order-tray"].create(viewOptions),
      game["resource-bar"].create(viewOptions),
      game["province-panel"].create(viewOptions),
      game["diplomacy-panel"].create(viewOptions),
      game["battle-panel"].create(viewOptions),
      game["game-quiz-view"].create(viewOptions),
      game["turn-report"].create(viewOptions),
    ];

    document.querySelectorAll("[data-game-panel]").forEach(function (button) {
      button.addEventListener("click", function () { safeRun(function () { controller.setActivePanel(button.dataset.gamePanel); }); });
    });
    sheetToggle.addEventListener("click", function () {
      sheetState = sheetState === "expanded" ? "collapsed" : "expanded";
      applyPresentationState();
      if (sheetState === "expanded") {
        var activePanel = campaignPane.querySelector(".game-panel:not(.hidden)");
        if (activePanel) activePanel.scrollTop = 0;
      }
    });
    resourceToggle.addEventListener("click", function () {
      resourcesExpanded = !resourcesExpanded;
      applyPresentationState();
    });
    gameRoot.addEventListener("mln222:open-campaign-sheet", function () {
      sheetState = "expanded";
      applyPresentationState();
    });
    startSelect.addEventListener("change", function () { controller.selectProvince(startSelect.value); });
    quizChoice.addEventListener("change", function () { safeRun(function () { controller.setQuizChoice(quizChoice.value); }); });
    document.getElementById("gameBeginBtn").addEventListener("click", function () {
      safeRun(function () { controller.startCampaign(startSelect.value, seedInput.value); });
    });
    document.getElementById("gameContinueBtn").addEventListener("click", function () { safeRun(controller.resume); });
    document.getElementById("gameSaveBtn").addEventListener("click", function () { safeRun(controller.save); });
    document.getElementById("gameNewBtn").addEventListener("click", function () {
      var current = controller.snapshot();
      if (!current.state || root.confirm("Rời chiến dịch hiện tại để thiết lập chiến dịch mới?")) controller.showSetup();
    });
    clearOrders.addEventListener("click", function () { safeRun(controller.clearOrders); });
    endTurn.addEventListener("click", function () { safeRun(function () { controller.beginQuiz(quizChoice.value); }); });

    controller.subscribe(function (snapshot) {
      var hasState = snapshot.state !== null;
      gameRoot.classList.toggle("has-campaign", hasState);
      gameRoot.classList.toggle("has-pending-orders", snapshot.pendingActions.length > 0);
      setupPane.classList.toggle("hidden", hasState);
      campaignPane.classList.toggle("hidden", !hasState);
      document.getElementById("gameContinueBtn").disabled = !snapshot.canResume;
      document.getElementById("gameSaveBtn").disabled = !hasState;
      startSelect.value = snapshot.selectedProvinceId;
      quizChoice.value = snapshot.quizChoice;
      renderStartSummary(snapshot.selectedProvinceId);
      var actionPhase = hasState && snapshot.state.phase === "action";
      var quizActive = actionPhase && snapshot.state.quiz && snapshot.state.quiz.active;
      clearOrders.disabled = !actionPhase || snapshot.pendingActions.length === 0 || !!quizActive;
      endTurn.disabled = !actionPhase || !!quizActive || snapshot.state.factions.player.campaignOutcome !== null;
      endTurn.setAttribute("aria-busy", String(Boolean(quizActive)));
      var ap = hasState ? snapshot.state.factions.player.actionPoints : data.balance.campaign.actionPointsPerTurn;
      var orderText = hasState ? snapshot.pendingActions.length + "/" + ap + " điểm lệnh đã xếp" : "Chưa có chiến dịch đang mở";
      status.textContent = snapshot.error || backend.warning || orderText;
      status.classList.toggle("is-warning", Boolean(snapshot.error || backend.warning));
      status.classList.toggle("is-pending", hasState && snapshot.pendingActions.length > 0 && !snapshot.error);
      sheetTitle.textContent = snapshot.activePanel === "province"
        ? utils.provinceName(data, snapshot.selectedProvinceId)
        : ({ diplomacy: "Ngoại giao", battle: "Mặt trận", report: "Báo cáo lượt" }[snapshot.activePanel] || "Chiến dịch");
      renderBadges(snapshot);
      var reward = rewardDetails(snapshot);
      rewardBanner.textContent = reward.text;
      rewardBanner.classList.toggle("hidden", !reward.text);
      rewardBanner.classList.toggle("is-warning", reward.warning);
      var announcement = snapshot.error || snapshot.message;
      if (announcement && announcement !== lastAnnouncement) {
        liveStatus.textContent = announcement;
        lastAnnouncement = announcement;
      }
      views.forEach(function (view) {
        if (view && typeof view.render === "function") view.render(snapshot);
        else if (view && typeof view.update === "function") view.update(snapshot);
      });
      selectPanel(snapshot.activePanel);
      applyPresentationState();
    });

    renderStartSummary(startSelect.value);
    selectPanel(controller.snapshot().activePanel);
    applyPresentationState();
    return {
      controller: controller,
      activate: function () {
        views.forEach(function (view) { if (view && typeof view.activate === "function") view.activate(); });
      },
    };
  }

  function activate() {
    if (!instance) instance = create();
    instance.activate();
  }

  return {
    activate: activate,
    getController: function () { return instance ? instance.controller : null; },
  };
});
