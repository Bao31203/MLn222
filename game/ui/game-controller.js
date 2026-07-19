(function (root, factory) {
  "use strict";
  var game = root.MLN222Game;
  var required = ["contracts", "campaign", "npc-ai", "question-deck", "campaign-save", "browser-storage", "combat-tactics"];
  if (!game || required.some(function (name) { return !game.hasModule(name); })) throw new Error("Load campaign, quiz, and storage modules before game-controller.js.");
  var api = game.registerModule("game-controller", factory(game));
  if (typeof module === "object" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function (game) {
  "use strict";

  var contracts = game.contracts;
  var CHOICES = Object.freeze(["food", "coin", "population", "unlock"]);
  var PANELS = Object.freeze(["province", "diplomacy", "battle", "report"]);
  var SAVE_ERROR_MESSAGES = Object.freeze({
    SAVE_MISSING: "Chưa có chiến dịch đã lưu.",
    SAVE_SIZE: "Bản lưu vượt quá kích thước được hỗ trợ.",
    SAVE_JSON: "Bản lưu bị hỏng và không thể đọc.",
    SAVE_INVALID: "Bản lưu không vượt qua kiểm tra an toàn.",
    SAVE_CLONE: "Không thể khôi phục dữ liệu từ bản lưu.",
    SAVE_STORAGE_READ: "Không thể đọc bản lưu từ bộ nhớ trình duyệt.",
    SAVE_STORAGE_WRITE: "Không thể ghi bản lưu vào bộ nhớ trình duyệt.",
    CAMPAIGN_SAVE_STORAGE_READ: "Không thể đọc chiến dịch đã lưu.",
    CAMPAIGN_SAVE_STORAGE_WRITE: "Không thể lưu chiến dịch trên trình duyệt này.",
  });

  function saveErrorMessage(error) {
    if (!error || typeof error.code !== "string") return "Không thể xử lý bản lưu chiến dịch.";
    return SAVE_ERROR_MESSAGES[error.code] || "Bản lưu chiến dịch không hợp lệ (" + error.code + ").";
  }

  function create(options) {
    if (!contracts.isPlainObject(options) || !contracts.isPlainObject(options.deps) || !Array.isArray(options.questions) || !options.storage) throw new TypeError("Game controller options are invalid.");
    var deps = options.deps;
    var questions = options.questions;
    var storage = options.storage;
    var listeners = [];
    var state = null;
    var selectedProvinceId = options.defaultProvinceId || deps.provinces[0].id;
    var pendingActions = [];
    var tacticSelections = {};
    var quizChoice = "food";
    var quizReviewQuestionId = null;
    var activePanel = "province";
    var reportEvents = [];
    var message = "Chọn một tỉnh để bắt đầu.";
    var errorMessage = null;

    function hasProvince(provinceId) {
      return deps.provinces.some(function (province) { return province.id === provinceId; });
    }

    function snapshot() {
      var canResume = storage.hasCampaign();
      return {
        state: state === null ? null : contracts.cloneGameState(state),
        selectedProvinceId: selectedProvinceId,
        pendingActions: contracts.cloneJson(pendingActions),
        tacticSelections: contracts.cloneJson(tacticSelections),
        quizChoice: quizChoice,
        quizReviewQuestionId: quizReviewQuestionId,
        activePanel: activePanel,
        reportEvents: contracts.cloneJson(reportEvents),
        message: message,
        error: errorMessage || storage.lastError(),
        canResume: canResume,
      };
    }

    function emit() {
      var value = snapshot();
      listeners.slice().forEach(function (listener) { listener(value); });
      return value;
    }

    function subscribe(listener) {
      if (typeof listener !== "function") throw new TypeError("Controller subscriber must be a function.");
      listeners.push(listener);
      listener(snapshot());
      return function () { listeners = listeners.filter(function (entry) { return entry !== listener; }); };
    }

    function sidecar() {
      return {
        schemaVersion: 1,
        selectedProvinceId: selectedProvinceId,
        pendingActions: contracts.cloneJson(pendingActions),
        tacticSelections: contracts.cloneJson(tacticSelections),
        quizChoice: quizChoice,
        quizReviewQuestionId: quizReviewQuestionId,
        activePanel: activePanel,
        reportEvents: contracts.cloneJson(reportEvents.slice(-100)),
      };
    }

    function save() {
      if (state === null) return false;
      var saved = game["campaign-save"].saveToAdapter(storage.adapter, state, deps);
      if (!saved.ok) {
        errorMessage = saveErrorMessage(saved.error);
        return false;
      }
      storage.writeUi(sidecar());
      return true;
    }

    function prepareIfNeeded(nextState) {
      if (nextState.phase !== "start") return { state: nextState, events: [] };
      return game.campaign.prepareCampaignTurn(nextState, deps);
    }

    function initializeQuiz(nextState) {
      if (nextState.quiz !== null) return nextState;
      var deck = game["question-deck"].createDeckState(questions, nextState.rng);
      nextState.quiz = { deckState: deck.state, active: null, completedTurns: [] };
      nextState.rng = deck.rngState;
      return nextState;
    }

    function startCampaign(provinceId, seed) {
      if (!hasProvince(provinceId)) throw new RangeError("Tỉnh khởi đầu không hợp lệ.");
      var normalizedSeed = typeof seed === "string" && seed.trim() ? seed.trim().slice(0, 64) : "mln222-campaign";
      var created = game.campaign.createCampaign({ campaignId: "campaign-" + normalizedSeed, seed: normalizedSeed, playerProvinceId: provinceId }, deps);
      initializeQuiz(created);
      var prepared = prepareIfNeeded(created);
      state = prepared.state;
      selectedProvinceId = provinceId;
      pendingActions = [];
      tacticSelections = {};
      quizReviewQuestionId = null;
      activePanel = "province";
      reportEvents = game.campaign.filterEvents(prepared.events, "player", state);
      message = "Chiến dịch đã bắt đầu tại " + provinceId + ".";
      errorMessage = null;
      save();
      return emit();
    }

    function restoreSidecar(value) {
      if (!contracts.isPlainObject(value) || value.schemaVersion !== 1) return;
      if (hasProvince(value.selectedProvinceId)) selectedProvinceId = value.selectedProvinceId;
      if (Array.isArray(value.pendingActions) && value.pendingActions.length <= deps.balance.campaign.actionPointsPerTurn) pendingActions = contracts.cloneJson(value.pendingActions);
      if (contracts.isPlainObject(value.tacticSelections)) tacticSelections = contracts.cloneJson(value.tacticSelections);
      if (CHOICES.indexOf(value.quizChoice) !== -1) quizChoice = value.quizChoice;
      if (typeof value.quizReviewQuestionId === "string") quizReviewQuestionId = value.quizReviewQuestionId;
      if (PANELS.indexOf(value.activePanel) !== -1) activePanel = value.activePanel;
      if (Array.isArray(value.reportEvents)) reportEvents = contracts.cloneJson(value.reportEvents.slice(-100));
    }

    function sanitizeRestoredUi() {
      var discarded = false;
      var quiz = state && state.quiz && state.quiz.active;
      if (quizReviewQuestionId !== null) {
        var reviewPosition = quiz && Array.isArray(quiz.questionIds) ? quiz.questionIds.indexOf(quizReviewQuestionId) : -1;
        if (!quiz || !contracts.isPlainObject(quiz.answers) || reviewPosition !== quiz.position - 1 || !Object.prototype.hasOwnProperty.call(quiz.answers, quizReviewQuestionId)) {
          quizReviewQuestionId = null;
          discarded = true;
        }
      }
      var validatedTactics = {};
      Object.keys(tacticSelections).forEach(function (battleId) {
        var battle = state && state.battles ? state.battles[battleId] : null;
        var side = battle && battle.attacker.factionId === "player" ? "attacker" : battle && battle.defender.factionId === "player" ? "defender" : null;
        var errors = battle && battle.status === "active" && side && typeof tacticSelections[battleId] === "string"
          ? game["combat-tactics"].validateSelection(side, tacticSelections[battleId], battle, deps.balance.combat.tactics, deps.balance.combat.fortification.assaultBreachThreshold)
          : [{ code: "INVALID_RESTORED_TACTIC" }];
        if (errors.length === 0) validatedTactics[battleId] = tacticSelections[battleId];
        else discarded = true;
      });
      tacticSelections = validatedTactics;
      if (discarded) errorMessage = "Một phần trạng thái giao diện đã lưu không còn hợp lệ và đã được loại bỏ.";
    }

    function inputFor(actions, score) {
      return {
        playerFactionId: "player",
        playerActions: actions.length ? contracts.cloneJson(actions) : [{ type: "WAIT", payload: { factionId: "player" } }],
        battleTactics: contracts.cloneJson(tacticSelections),
        quizScore: score,
        quizChoice: quizChoice,
      };
    }

    function validatePending(actions) {
      if (state === null || state.phase !== "action") throw new RangeError("Chiến dịch chưa ở pha ra lệnh.");
      return game.campaign.validatePlayerActions(state, "player", actions, deps);
    }

    function resume() {
      var loaded = game["campaign-save"].loadFromAdapter(storage.adapter, deps);
      if (!loaded.ok) {
        errorMessage = saveErrorMessage(loaded.error);
        message = "Không thể tiếp tục chiến dịch đã lưu.";
        return emit();
      }
      var prepared = prepareIfNeeded(loaded.value);
      errorMessage = null;
      state = prepared.state;
      pendingActions = [];
      tacticSelections = {};
      quizReviewQuestionId = null;
      activePanel = "province";
      var restoredSidecar = storage.readUi();
      var sidecarError = storage.lastError();
      restoreSidecar(restoredSidecar);
      sanitizeRestoredUi();
      if (sidecarError) errorMessage = sidecarError;
      if (prepared.events.length) reportEvents = game.campaign.filterEvents(prepared.events, "player", state);
      if (state.phase === "action") {
        try {
          validatePending(pendingActions);
        } catch (_caught) {
          pendingActions = [];
          tacticSelections = {};
          errorMessage = "Các lệnh đang xếp trong bản lưu không còn hợp lệ và đã được hủy.";
        }
      }
      message = state.quiz && state.quiz.active ? "Tiếp tục phần thử thách cuối lượt." : "Đã khôi phục chiến dịch.";
      save();
      return emit();
    }

    function showSetup() {
      state = null;
      pendingActions = [];
      tacticSelections = {};
      quizReviewQuestionId = null;
      activePanel = "province";
      reportEvents = [];
      errorMessage = null;
      message = "Chọn một tỉnh để bắt đầu chiến dịch mới.";
      return emit();
    }

    function reset() {
      storage.clear();
      return showSetup();
    }

    function aiContext() {
      var campaignConfig = contracts.cloneJson(deps.balance.campaign);
      campaignConfig.baseMaximumActiveFronts = deps.balance.campaign.maximumActiveFronts;
      campaignConfig.maximumActiveFronts += Math.floor(game.campaign.ownedProvinceIds(state, "player").length / 5);
      return {
        adjacency: deps.adjacency,
        personalities: deps.personalities,
        config: deps.balance.ai,
        campaignConfig: campaignConfig,
        diplomacyConfig: deps.balance.diplomacy,
        recruitmentConfig: deps.balance.economy.recruitment,
        combatConfig: deps.balance.combat,
      };
    }

    function legalActions() {
      if (state === null || state.phase !== "action" || (state.quiz && state.quiz.active)) return [];
      var remaining = state.factions.player.actionPoints - pendingActions.length;
      if (remaining < 1) return [];
      return game["npc-ai"].queryLegalActions(state, "player", aiContext()).filter(function (action) { return action.type !== "WAIT"; }).map(function (action) { return contracts.cloneJson(action); });
    }

    function stageAction(action) {
      if (!contracts.isPlainObject(action) || typeof action.type !== "string" || !contracts.isPlainObject(action.payload) || action.payload.factionId !== "player") throw new TypeError("Lệnh chiến dịch không hợp lệ.");
      if (pendingActions.length >= deps.balance.campaign.actionPointsPerTurn) throw new RangeError("Đã dùng hết điểm lệnh của lượt này.");
      var candidate = pendingActions.concat([contracts.cloneJson(action)]);
      validatePending(candidate);
      pendingActions = candidate;
      message = "Đã xếp lệnh " + action.type + ".";
      errorMessage = null;
      save();
      return emit();
    }

    function clearOrders() {
      pendingActions = [];
      tacticSelections = {};
      message = "Đã hủy các lệnh đang xếp.";
      save();
      return emit();
    }

    function removePendingAction(index) {
      if (!Number.isSafeInteger(index) || index < 0 || index >= pendingActions.length) throw new RangeError("Lệnh chờ cần bỏ không hợp lệ.");
      var candidate = pendingActions.filter(function (_action, actionIndex) { return actionIndex !== index; });
      validatePending(candidate);
      var removed = pendingActions[index];
      pendingActions = candidate;
      message = "Đã bỏ lệnh " + removed.type + ".";
      errorMessage = null;
      save();
      return emit();
    }

    function setTactic(battleId, tacticId) {
      var battle = state && state.battles ? state.battles[battleId] : null;
      if (!battle || battle.status !== "active") throw new RangeError("Mặt trận không còn hoạt động.");
      var side = battle.attacker.factionId === "player" ? "attacker" : battle.defender.factionId === "player" ? "defender" : null;
      if (side === null) throw new RangeError("Bạn không tham chiến tại mặt trận này.");
      var tacticErrors = game["combat-tactics"].validateSelection(
        side,
        tacticId,
        battle,
        deps.balance.combat.tactics,
        deps.balance.combat.fortification.assaultBreachThreshold
      );
      if (tacticErrors.length) throw new RangeError(tacticErrors[0].message);
      var next = contracts.cloneJson(tacticSelections);
      next[battleId] = tacticId;
      tacticSelections = next;
      message = "Đã chọn chiến thuật cho mặt trận.";
      save();
      return emit();
    }

    function selectProvince(provinceId) {
      if (!hasProvince(provinceId)) return snapshot();
      selectedProvinceId = provinceId;
      storage.writeUi(sidecar());
      return emit();
    }

    function beginQuiz(choice) {
      if (state === null || state.phase !== "action") throw new RangeError("Không thể bắt đầu thử thách lúc này.");
      if (CHOICES.indexOf(choice) !== -1) quizChoice = choice;
      if (!state.quiz) initializeQuiz(state);
      if (state.quiz.active === null) {
        var created = game["question-deck"].createQuiz(state.quiz.deckState, questions, state.rng, "campaign-quiz-" + state.turn);
        state.quiz.deckState = created.deckState;
        state.quiz.active = created.quiz;
        state.rng = created.rngState;
        quizReviewQuestionId = null;
      }
      message = "Hoàn thành 10 câu để kết thúc lượt.";
      save();
      return emit();
    }

    function answerQuiz(selectedOption) {
      if (state === null || !state.quiz || !state.quiz.active) throw new RangeError("Không có thử thách đang diễn ra.");
      var questionId = state.quiz.active.questionIds[state.quiz.active.position];
      state.quiz.active = game["question-deck"].answerQuiz(state.quiz.active, questions, selectedOption);
      quizReviewQuestionId = questionId;
      save();
      return emit();
    }

    function continueQuizReview() {
      quizReviewQuestionId = null;
      storage.writeUi(sidecar());
      return emit();
    }

    function completeQuiz() {
      if (state === null || !state.quiz || !state.quiz.active || state.quiz.active.completed !== true) throw new RangeError("Phải hoàn thành đủ 10 câu trước khi kết thúc lượt.");
      var completedQuiz = contracts.cloneJson(state.quiz.active);
      var turn = state.turn;
      var result = game.campaign.completeCampaignTurn(state, inputFor(pendingActions, completedQuiz.score), deps);
      result.state.quiz.active = null;
      result.state.quiz.completedTurns.push({ turn: turn, quizId: completedQuiz.id, score: completedQuiz.score, questionIds: contracts.cloneJson(completedQuiz.questionIds) });
      var events = result.events.slice();
      var prepared = prepareIfNeeded(result.state);
      state = prepared.state;
      events.push.apply(events, prepared.events);
      pendingActions = [];
      tacticSelections = {};
      quizReviewQuestionId = null;
      reportEvents = game.campaign.filterEvents(events, "player", state);
      message = result.outcome.status === "active" ? "Lượt mới đã bắt đầu." : result.outcome.status === "victory" ? "Bạn đã thống nhất đất nước." : "Thế lực của bạn đã thất bại.";
      errorMessage = null;
      save();
      return emit();
    }

    function setQuizChoice(choice) {
      if (CHOICES.indexOf(choice) === -1) throw new RangeError("Lựa chọn phần thưởng quiz không hợp lệ.");
      quizChoice = choice;
      storage.writeUi(sidecar());
      return emit();
    }

    function setActivePanel(panel) {
      if (PANELS.indexOf(panel) === -1) throw new RangeError("Khu vực chiến dịch không hợp lệ.");
      activePanel = panel;
      storage.writeUi(sidecar());
      return emit();
    }

    return {
      subscribe: subscribe,
      snapshot: snapshot,
      startCampaign: startCampaign,
      resume: resume,
      showSetup: showSetup,
      reset: reset,
      save: function () { var ok = save(); emit(); return ok; },
      legalActions: legalActions,
      stageAction: stageAction,
      removePendingAction: removePendingAction,
      clearOrders: clearOrders,
      setTactic: setTactic,
      selectProvince: selectProvince,
      beginQuiz: beginQuiz,
      answerQuiz: answerQuiz,
      continueQuizReview: continueQuizReview,
      completeQuiz: completeQuiz,
      setQuizChoice: setQuizChoice,
      setActivePanel: setActivePanel,
    };
  }

  return { CHOICES: CHOICES, PANELS: PANELS, create: create };
});
