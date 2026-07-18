(function (root, factory) {
  "use strict";
  var game = root.MLN222Game;
  var required = [
    "contracts", "runtime", "turn-economy", "recruitment", "combat",
    "combat-casualties", "question-deck", "quiz-rewards", "save-codec",
  ];
  if (!game || required.some(function (name) { return !game.hasModule(name); })) {
    throw new Error("Load all Phase 01-05 modules before vertical-slice.js.");
  }
  var api = game.registerModule("vertical-slice", factory(game));
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function (game) {
  "use strict";

  var contracts = game.contracts;
  var PROVINCE_IDS = Object.freeze(["ha-noi", "bac-ninh", "thai-nguyen"]);
  var FACTION_IDS = Object.freeze(["player", "npc-bac-ninh", "npc-thai-nguyen"]);

  function requireOptions(options) {
    if (!contracts.isPlainObject(options) || !Array.isArray(options.questions) || !Array.isArray(options.provinces)) {
      throw new TypeError("Vertical slice requires question and province fixtures.");
    }
    if (!contracts.isPlainObject(options.adjacency) || !contracts.isPlainObject(options.config)) {
      throw new TypeError("Vertical slice requires adjacency and config.");
    }
    ["economy", "recruitment", "combat", "quizRewards"].forEach(function (field) {
      if (!contracts.isPlainObject(options.config[field])) {
        throw new TypeError("Vertical slice config is missing " + field + ".");
      }
    });
    var provinceIds = options.provinces.map(function (province) { return province.id; });
    PROVINCE_IDS.forEach(function (id) {
      if (provinceIds.indexOf(id) === -1) {
        throw new RangeError("Vertical slice province fixture is missing: " + id);
      }
    });
  }

  function faction(resources) {
    return {
      resources: { food: resources.food, coin: resources.coin },
      crisis: { food: 0, coin: 0 },
      readiness: { supply: 100, morale: 100 },
      unlockedUnits: ["militia"],
      actionPoints: 0,
    };
  }

  function province(ownerId, capacity, civilians, military, field) {
    return {
      ownerId: ownerId,
      population: { capacity: capacity, civilians: civilians, military: military },
      units: {
        militia: { field: field, garrison: military - field, training: 0, wounded: 0 },
      },
      recruitmentQueue: [],
      occupation: null,
    };
  }

  function createInitialState(options) {
    requireOptions(options);
    var state = contracts.createInitialState({
      campaignId: options.campaignId || "vertical-slice",
      seed: options.seed || "vertical-slice-seed",
      phase: "start",
    });
    state.factions.player = faction({ food: 0, coin: 0 });
    state.factions["npc-bac-ninh"] = faction({ food: 0, coin: 0 });
    state.factions["npc-thai-nguyen"] = faction({ food: 0, coin: 0 });
    state.provinces["ha-noi"] = province("player", 5000, 3200, 600, 400);
    state.provinces["bac-ninh"] = province("npc-bac-ninh", 4500, 3000, 500, 100);
    state.provinces["thai-nguyen"] = province("npc-thai-nguyen", 4200, 2900, 450, 100);
    var deck = game["question-deck"].createDeckState(options.questions, state.rng);
    state.rng = deck.rngState;
    state.quiz = { deckState: deck.state, active: null, completedTurns: [] };
    return state;
  }

  function ensurePhase(draft, expected, message) {
    if (draft.phase !== expected) {
      throw new RangeError(message);
    }
  }

  function hasNeighbor(adjacency, sourceId, targetId) {
    return Array.isArray(adjacency[sourceId]) && adjacency[sourceId].indexOf(targetId) !== -1;
  }

  function startBattleHandler(options) {
    return function startScenarioBattle(draft, action) {
      ensurePhase(draft, "action", "Battle can only start during the action phase.");
      var payload = action.payload;
      if (!contracts.isPlainObject(payload) || !Object.prototype.hasOwnProperty.call(draft.provinces, payload.sourceProvinceId) || !Object.prototype.hasOwnProperty.call(draft.provinces, payload.targetProvinceId)) {
        throw new RangeError("Battle references an unknown province.");
      }
      if (!hasNeighbor(options.adjacency, payload.sourceProvinceId, payload.targetProvinceId)) {
        throw new RangeError("Battle target must be adjacent to its source.");
      }
      var source = draft.provinces[payload.sourceProvinceId];
      var target = draft.provinces[payload.targetProvinceId];
      if (source.ownerId !== payload.attackerFactionId || target.ownerId !== payload.defenderFactionId || source.ownerId === target.ownerId) {
        throw new RangeError("Battle ownership is invalid.");
      }
      if (!Number.isSafeInteger(payload.attackerCount) || !Number.isSafeInteger(payload.defenderCount) || payload.attackerCount < 1 || payload.defenderCount < 1) {
        throw new RangeError("Battle force counts are invalid.");
      }
      if (source.units.militia.field < payload.attackerCount || target.units.militia.garrison < payload.defenderCount) {
        throw new RangeError("Province does not contain the committed battle force.");
      }
      if (draft.factions[payload.attackerFactionId].actionPoints < 1) {
        throw new RangeError("Attacker lacks an action point.");
      }
      if (Object.prototype.hasOwnProperty.call(draft.battles, payload.battleId)) {
        throw new RangeError("Battle ID already exists.");
      }
      var provinceMeta = options.provinces.find(function (item) { return item.id === payload.targetProvinceId; });
      draft.battles[payload.battleId] = game.combat.createBattle({
        id: payload.battleId,
        sourceProvinceId: payload.sourceProvinceId,
        targetProvinceId: payload.targetProvinceId,
        terrain: Object.prototype.hasOwnProperty.call(options.config.combat.terrain, provinceMeta.terrain) ? provinceMeta.terrain : "plains",
        fortification: payload.fortification,
        attacker: { factionId: payload.attackerFactionId, units: { militia: payload.attackerCount } },
        defender: { factionId: payload.defenderFactionId, units: { militia: payload.defenderCount } },
      }, options.config.combat);
      draft.factions[payload.attackerFactionId].actionPoints -= 1;
      draft.phase = "resolution";
      return { events: [{ type: "BATTLE_STARTED", payload: { battleId: payload.battleId, sourceProvinceId: payload.sourceProvinceId, targetProvinceId: payload.targetProvinceId } }] };
    };
  }

  function tradeHandler(options) {
    return function scenarioTrade(draft, action) {
      ensurePhase(draft, "action", "Trade can only settle during the action phase.");
      var payload = action.payload;
      if (!contracts.isPlainObject(payload) || !Object.prototype.hasOwnProperty.call(draft.factions, payload.factionId) || !Number.isSafeInteger(payload.coin) || payload.coin < 1 || payload.coin > options.config.maxScriptedTradeCoin) {
        throw new RangeError("Scripted trade payload is invalid.");
      }
      if (draft.factions[payload.factionId].actionPoints < 1) {
        throw new RangeError("Trade requires one action point.");
      }
      draft.factions[payload.factionId].resources.coin += payload.coin;
      draft.factions[payload.factionId].actionPoints -= 1;
      return { events: [{ type: "TRADE_SETTLED", payload: { factionId: payload.factionId, coin: payload.coin, partnerId: payload.partnerId } }] };
    };
  }

  function reinforcementHandler(options) {
    return function queueScenarioReinforcement(draft, action) {
      ensurePhase(draft, "action", "Reinforcement can only be queued during the action phase.");
      var payload = action.payload;
      var battle = payload && draft.battles[payload.battleId];
      if (!contracts.isPlainObject(battle) || battle.status !== "active" || payload.side !== "attacker" || !contracts.isPlainObject(payload.units)) {
        throw new RangeError("Scenario reinforcement payload is invalid.");
      }
      var count = game["combat-casualties"].countUnits(payload.units);
      var source = draft.provinces[battle.sourceProvinceId];
      var factionState = draft.factions[battle.attacker.factionId];
      var alreadyCommitted = battle.attacker.initialForce + battle.attacker.reinforcementsReceived + battle.reinforcementQueue
        .filter(function (entry) { return entry.side === "attacker"; })
        .reduce(function (total, entry) { return total + game["combat-casualties"].countUnits(entry.units); }, 0);
      if (source.ownerId !== battle.attacker.factionId || count > source.population.military - alreadyCommitted || factionState.actionPoints < 1) {
        throw new RangeError("Scenario reinforcement exceeds available reserve or action points.");
      }
      draft.battles[payload.battleId] = game.combat.queueReinforcement(battle, payload.side, payload.units, action.id, options.config.combat);
      factionState.actionPoints -= 1;
      return { events: [{ type: "BATTLE_REINFORCEMENT_QUEUED", payload: { battleId: payload.battleId, side: payload.side, requestId: action.id, count: count } }] };
    };
  }

  function endActionsHandler(draft) {
    ensurePhase(draft, "action", "Actions can only end during the action phase.");
    draft.phase = "quiz";
    return { events: [{ type: "ACTION_PHASE_ENDED", payload: { turn: draft.turn } }] };
  }

  function startQuizHandler(options) {
    return function startTurnQuiz(draft, action) {
      ensurePhase(draft, "quiz", "Turn quiz can only start in quiz phase.");
      if (!contracts.isPlainObject(draft.quiz) || draft.quiz.active !== null) {
        throw new RangeError("Turn quiz state is not ready.");
      }
      var created = game["question-deck"].createQuiz(draft.quiz.deckState, options.questions, draft.rng, action.payload.quizId);
      draft.quiz.deckState = created.deckState;
      draft.quiz.active = created.quiz;
      draft.rng = created.rngState;
      return { events: [{ type: "TURN_QUIZ_STARTED", payload: { quizId: created.quiz.id, turn: draft.turn, questionCount: created.quiz.questionIds.length } }] };
    };
  }

  function answerQuizHandler(options) {
    return function answerTurnQuiz(draft, action) {
      ensurePhase(draft, "quiz", "Quiz answer is outside quiz phase.");
      if (!contracts.isPlainObject(draft.quiz) || !contracts.isPlainObject(draft.quiz.active) || draft.quiz.active.id !== action.payload.quizId) {
        throw new RangeError("Quiz answer references an unknown active quiz.");
      }
      draft.quiz.active = game["question-deck"].answerQuiz(draft.quiz.active, options.questions, action.payload.selectedOption);
      return { events: [{ type: "TURN_QUIZ_ANSWERED", payload: { quizId: draft.quiz.active.id, position: draft.quiz.active.position, score: draft.quiz.active.score } }] };
    };
  }

  function applyQuizHandler(options) {
    return function applyQuizResult(draft, action) {
      ensurePhase(draft, "quiz", "Quiz result is outside quiz phase.");
      var active = draft.quiz && draft.quiz.active;
      if (!contracts.isPlainObject(active) || !active.completed || active.id !== action.payload.quizId) {
        throw new RangeError("Quiz result requires the completed active quiz.");
      }
      var factionId = action.payload.factionId;
      var ownedProvinceId = Object.keys(draft.provinces).sort().find(function (provinceId) { return draft.provinces[provinceId].ownerId === factionId; });
      if (!ownedProvinceId || !Object.prototype.hasOwnProperty.call(draft.factions, factionId)) {
        throw new RangeError("Quiz faction has no owned province.");
      }
      var province = draft.provinces[ownedProvinceId];
      var factionState = draft.factions[factionId];
      var outcome = game["quiz-rewards"].evaluateScore(active.score, {
        factionId: factionId,
        resources: factionState.resources,
        production: options.config.quizProduction,
        capacityAvailable: province.population.capacity - province.population.civilians - province.population.military,
        choice: action.payload.choice,
      }, options.config.quizRewards);
      ["food", "coin"].forEach(function (resource) {
        factionState.resources[resource] = Math.max(0, factionState.resources[resource] + outcome.resourceDeltas[resource]);
      });
      province.population.civilians += outcome.populationDelta;
      outcome.effects.forEach(function (effect) {
        draft.effects.push({ factionId: factionId, source: "quiz", effect: effect });
      });
      draft.quiz.completedTurns.push({ turn: draft.turn, quizId: active.id, score: active.score, questionIds: active.questionIds });
      draft.quiz.active = null;
      var completedTurn = draft.turn;
      draft.turn += 1;
      draft.phase = "start";
      return { events: [
        { type: "QUIZ_REWARD_APPLIED", payload: outcome },
        { type: "TURN_COMPLETED", payload: { turn: completedTurn, score: active.score } },
      ] };
    };
  }

  function reconcileProvince(province, participant, role) {
    var next = contracts.cloneJson(province);
    var active = game["combat-casualties"].countUnits(participant.units);
    var committed = participant.initialForce + participant.reinforcementsReceived;
    var reserve = Math.max(0, next.population.military - committed);
    var displaced = participant.casualties.routed + participant.casualties.captured;
    next.population.civilians += displaced;
    next.population.military = reserve + active + participant.casualties.wounded;
    next.units.militia = {
      field: role === "attacker" ? active : 0,
      garrison: reserve + (role === "defender" ? active : 0),
      training: 0,
      wounded: participant.casualties.wounded,
    };
    return next;
  }

  function reconcileBattleHandler(draft, action) {
    ensurePhase(draft, "quiz", "Battle reconciliation must run before the quiz.");
    var battle = draft.battles[action.payload.battleId];
    if (!contracts.isPlainObject(battle) || battle.status === "active" || battle.outcome.reconciled === true) {
      throw new RangeError("Battle is not ready for reconciliation.");
    }
    draft.provinces[battle.sourceProvinceId] = reconcileProvince(draft.provinces[battle.sourceProvinceId], battle.attacker, "attacker");
    draft.provinces[battle.targetProvinceId] = reconcileProvince(draft.provinces[battle.targetProvinceId], battle.defender, "defender");
    if (battle.status === "attacker-victory") {
      draft.provinces[battle.targetProvinceId].ownerId = battle.attacker.factionId;
      draft.provinces[battle.targetProvinceId].occupation = { occupierId: battle.attacker.factionId, remainingTurns: 3 };
    }
    battle.outcome.reconciled = true;
    return { events: [{ type: "BATTLE_RECONCILED", payload: { battleId: battle.id, status: battle.status } }] };
  }

  function createRuntime(options) {
    requireOptions(options);
    var handlers = Object.assign(
      {},
      game["turn-economy"].createHandlers(options.config.economy),
      game.recruitment.createHandlers(options.config.recruitment),
      game.combat.createHandlers(options.config.combat),
      {
        SCENARIO_START_BATTLE: startBattleHandler(options),
        SCENARIO_QUEUE_REINFORCEMENT: reinforcementHandler(options),
        SCENARIO_TRADE: tradeHandler(options),
        SCENARIO_END_ACTIONS: endActionsHandler,
        START_TURN_QUIZ: startQuizHandler(options),
        ANSWER_TURN_QUIZ: answerQuizHandler(options),
        APPLY_QUIZ_RESULT: applyQuizHandler(options),
        SCENARIO_RECONCILE_BATTLE: reconcileBattleHandler,
      }
    );
    return game.runtime.createRuntime({ handlers: handlers, additionalInvariants: [game.combat.createInvariant(options.config.combat)] });
  }

  function command(gameState, id, type, payload) {
    return contracts.createAction({ id: id, type: type, expectedPhase: gameState.phase, payload: payload || {} });
  }

  function dispatchOrThrow(runtime, state, action) {
    var result = runtime.dispatch(state, action);
    if (!result.ok) {
      throw new Error(result.errors[0].code + ": " + result.errors[0].message);
    }
    return result;
  }

  function checkpoint(state, replace) {
    var raw = game["save-codec"].encodeSave(state);
    var loaded = game["save-codec"].decodeSave(raw);
    if (!loaded.ok) {
      throw new Error("Vertical slice save checkpoint failed: " + loaded.error.code);
    }
    return { state: replace ? loaded.value : state, bytes: raw.length };
  }

  function answerTurnQuiz(runtime, state, options, turn, resume) {
    var result = dispatchOrThrow(runtime, state, command(state, "quiz-start-" + turn, "START_TURN_QUIZ", { quizId: "quiz-turn-" + turn }));
    state = result.state;
    var index = game["question-deck"].createQuestionIndex(options.questions);
    for (var position = 0; position < 10; position += 1) {
      var questionId = state.quiz.active.questionIds[position];
      var correct = index.byId[questionId].answer;
      var selected = position < 7 ? correct : (correct + 1) % 4;
      result = dispatchOrThrow(runtime, state, command(state, "quiz-answer-" + turn + "-" + position, "ANSWER_TURN_QUIZ", { quizId: state.quiz.active.id, selectedOption: selected }));
      state = result.state;
      var save = checkpoint(state, resume && turn === 2 && position === 4);
      state = save.state;
    }
    result = dispatchOrThrow(runtime, state, command(state, "quiz-apply-" + turn, "APPLY_QUIZ_RESULT", { quizId: state.quiz.active.id, factionId: "player", choice: "food" }));
    return { state: result.state, events: result.events };
  }

  function runVerticalSlice(options, runOptions) {
    requireOptions(options);
    var settings = runOptions || {};
    var runtime = createRuntime(options);
    var state = createInitialState(options);
    var turnSummaries = [];
    var saveCheckpoints = 0;
    for (var turn = 1; turn <= 8; turn += 1) {
      var economyResult = dispatchOrThrow(runtime, state, command(state, "economy-" + turn, "START_TURN_ECONOMY", {}));
      state = economyResult.state;
      var actions = [];
      if (turn === 1) {
        var recruit = dispatchOrThrow(runtime, state, command(state, "recruit-1", "RECRUIT_UNITS", { factionId: "player", provinceId: "ha-noi", unitId: "militia", count: 50 }));
        state = recruit.state; actions.push("recruit");
      }
      if (turn === 2) {
        var trade = dispatchOrThrow(runtime, state, command(state, "trade-2", "SCENARIO_TRADE", { factionId: "player", partnerId: "npc-thai-nguyen", coin: 40 }));
        state = trade.state; actions.push("trade");
      }
      if (turn === 3) {
        var started = dispatchOrThrow(runtime, state, command(state, "battle-start", "SCENARIO_START_BATTLE", {
          battleId: "battle-bac-ninh", sourceProvinceId: "ha-noi", targetProvinceId: "bac-ninh",
          attackerFactionId: "player", defenderFactionId: "npc-bac-ninh",
          attackerCount: 400, defenderCount: 400, fortification: 40,
        }));
        state = started.state; actions.push("battle-start");
      }
      var battle = state.battles["battle-bac-ninh"];
      if (battle && battle.status === "active") {
        if (turn === 4) {
          var reinforced = dispatchOrThrow(runtime, state, command(state, "battle-reinforce", "SCENARIO_QUEUE_REINFORCEMENT", { battleId: battle.id, side: "attacker", units: { militia: 50 } }));
          state = reinforced.state; actions.push("reinforcement");
        }
        battle = state.battles["battle-bac-ninh"];
        var attackerTactic = battle.turn === 1 ? "siege" : "engage";
        var pulse = dispatchOrThrow(runtime, state, command(state, "battle-pulse-" + turn, "RESOLVE_BATTLE_PULSE", { battleId: battle.id, attackerTactic: attackerTactic, defenderTactic: "engage" }));
        state = pulse.state; actions.push("battle-pulse");
        var battleSave = checkpoint(state, settings.resume === true && turn === 4);
        state = battleSave.state; saveCheckpoints += 1;
        if (state.battles["battle-bac-ninh"].status !== "active") {
          var reconciled = dispatchOrThrow(runtime, state, command(state, "battle-reconcile", "SCENARIO_RECONCILE_BATTLE", { battleId: "battle-bac-ninh" }));
          state = reconciled.state; actions.push("battle-reconcile");
        }
      } else if (state.phase === "action") {
        var ended = dispatchOrThrow(runtime, state, command(state, "end-actions-" + turn, "SCENARIO_END_ACTIONS", {}));
        state = ended.state;
      }
      var quiz = answerTurnQuiz(runtime, state, options, turn, settings.resume === true);
      state = quiz.state;
      saveCheckpoints += 10;
      turnSummaries.push({
        turn: turn,
        actions: actions,
        playerFood: state.factions.player.resources.food,
        playerCoin: state.factions.player.resources.coin,
        quizScore: state.quiz.completedTurns[state.quiz.completedTurns.length - 1].score,
        battleTurn: state.battles["battle-bac-ninh"] ? state.battles["battle-bac-ninh"].turn : 0,
      });
    }
    return { state: state, summaries: turnSummaries, saveCheckpoints: saveCheckpoints };
  }

  return {
    PROVINCE_IDS: PROVINCE_IDS,
    FACTION_IDS: FACTION_IDS,
    createInitialState: createInitialState,
    createRuntime: createRuntime,
    runVerticalSlice: runVerticalSlice,
  };
});
