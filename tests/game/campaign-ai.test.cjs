"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const {
  loadGame,
  loadDependencies,
  createQuizProof,
  runSimulation,
  assertSimulationMetrics,
} = require("../../scripts/simulate-campaign.js");

const game = loadGame();
const deps = loadDependencies();

function createCampaign(seed = "campaign-test") {
  return game.campaign.createCampaign({
    campaignId: `test-${seed}`,
    seed,
    playerProvinceId: "ha-noi",
  }, deps);
}

function withQuiz(state, input, score = input.quizScore === undefined ? 5 : input.quizScore) {
  return {
    ...input,
    quizProof: createQuizProof(state.turn, score, input.playerFactionId || "player"),
  };
}

function advanceTurn(state, input, score) {
  return game.campaign.advanceCampaignTurn(state, withQuiz(state, input, score), deps);
}

function completeTurn(state, input, score) {
  return game.campaign.completeCampaignTurn(state, withQuiz(state, input, score), deps);
}

function installBattle(state, id = "battle-campaign-test", force = 250) {
  const battle = game.combat.createBattle({
    id,
    sourceProvinceId: "ha-noi",
    targetProvinceId: "bac-ninh",
    terrain: state.provinces["bac-ninh"].terrain,
    fortification: 40,
    attacker: { factionId: "player", units: { militia: force } },
    defender: { factionId: "npc-bac-ninh", units: { militia: force } },
  }, deps.balance.combat);
  state.battles[id] = battle;
  state.effects.push({
    type: "battle-reservation",
    battleId: id,
    attacker: { provinceId: "ha-noi", units: { militia: force } },
    defender: { provinceId: "bac-ninh", units: { militia: force } },
    pending: [],
  });
  return battle;
}

function aiContext(state, factionId) {
  const campaignConfig = game.contracts.cloneJson(deps.balance.campaign);
  campaignConfig.baseMaximumActiveFronts = deps.balance.campaign.maximumActiveFronts;
  campaignConfig.maximumActiveFronts += Math.floor(
    game.campaign.ownedProvinceIds(state, factionId).length / 5,
  );
  return {
    adjacency: deps.adjacency,
    personalities: deps.personalities,
    config: deps.balance.ai,
    campaignConfig,
    diplomacyConfig: deps.balance.diplomacy,
    recruitmentConfig: deps.balance.economy.recruitment,
    combatConfig: deps.balance.combat,
  };
}

test("campaign creates one faction per province and replaces the selected owner with the player", () => {
  const state = createCampaign();
  assert.equal(Object.keys(state.provinces).length, 34);
  assert.equal(Object.keys(state.factions).length, 34);
  assert.equal(state.provinces["ha-noi"].ownerId, "player");
  assert.equal(Object.prototype.hasOwnProperty.call(state.factions, "npc-ha-noi"), false);
  assert.equal(game.campaign.ownedProvinceIds(state, "player").length, 1);
  Object.keys(state.factions).forEach((factionId) => {
    assert.equal(Object.keys(state.factions[factionId].relations).length, 33);
  });
  assert.deepEqual(game.campaign.validateCampaignState(state, deps), []);
});

test("campaign completion requires a completed quiz proof and never trusts raw quizScore", () => {
  const prepared = game.campaign.prepareCampaignTurn(createCampaign("quiz-proof-required"), deps);
  const wait = { playerFactionId: "player", playerAction: { type: "WAIT", payload: { factionId: "player" } } };
  const before = JSON.stringify(prepared.state);
  assert.throws(() => game.campaign.completeCampaignTurn(prepared.state, { ...wait, quizScore: 10 }, deps), /completed ten-question quiz proof/i);
  assert.equal(JSON.stringify(prepared.state), before);

  const quizProof = createQuizProof(prepared.state.turn, 2, "player");
  assert.throws(() => game.campaign.completeCampaignTurn(prepared.state, { ...wait, quizProof, quizScore: 10 }, deps), /does not match/i);
  const completed = game.campaign.completeCampaignTurn(prepared.state, { ...wait, quizProof, quizScore: 2 }, deps);
  const reward = completed.events.find((event) => event.type === "QUIZ_REWARD_APPLIED");
  assert.equal(reward.payload.score, 2);
  assert.equal(reward.payload.quizId, quizProof.quiz.id);

  const nextPrepared = game.campaign.prepareCampaignTurn(completed.state, deps);
  const activeQuiz = createQuizProof(nextPrepared.state.turn, 5, "player").quiz;
  nextPrepared.state.quiz = { active: activeQuiz };
  const conflictingProof = createQuizProof(nextPrepared.state.turn, 10, "player");
  conflictingProof.quiz.id = activeQuiz.id;
  assert.throws(() => game.campaign.completeCampaignTurn(nextPrepared.state, { ...wait, quizProof: conflictingProof }, deps), /does not match the active/i);
  const compatible = game.campaign.completeCampaignTurn(nextPrepared.state, { ...wait, quizScore: 5 }, deps);
  assert.ok(compatible.events.some((event) => event.type === "QUIZ_REWARD_APPLIED" && event.payload.quizId === activeQuiz.id));
});

test("prepared turn context requires a finite production snapshot for every faction", () => {
  const missing = game.campaign.prepareCampaignTurn(createCampaign("missing-production-snapshot"), deps);
  const missingContext = missing.state.effects.find((effect) => effect.type === "campaign-turn-context");
  delete missingContext.productionByFaction["npc-bac-ninh"];
  assert.ok(game.campaign.validateCampaignState(missing.state, deps).some((error) => error.code === "CAMPAIGN_TURN_CONTEXT"));
  const before = JSON.stringify(missing.state);
  assert.throws(() => completeTurn(missing.state, { playerFactionId: "player", playerAction: { type: "WAIT", payload: { factionId: "player" } } }), /turn context/i);
  assert.equal(JSON.stringify(missing.state), before);

  const nonNumeric = game.campaign.prepareCampaignTurn(createCampaign("non-numeric-production-snapshot"), deps);
  const nonNumericContext = nonNumeric.state.effects.find((effect) => effect.type === "campaign-turn-context");
  nonNumericContext.productionByFaction.player.food = "100";
  assert.ok(game.campaign.validateCampaignState(nonNumeric.state, deps).some((error) => error.code === "CAMPAIGN_TURN_CONTEXT"));
  assert.throws(() => completeTurn(nonNumeric.state, { playerFactionId: "player", playerAction: { type: "WAIT", payload: { factionId: "player" } } }), /turn context/i);
});

test("diplomacy keeps routes and treaty state symmetric and applies betrayal penalties", () => {
  const config = deps.balance.diplomacy;
  let state = createCampaign("diplomacy");
  state = game.diplomacy.changeRelation(state, "player", "npc-bac-ninh", 50, config);
  const route = game.diplomacy.createTradeRoute(state, {
    id: "route-test",
    fromFactionId: "player",
    toFactionId: "npc-bac-ninh",
    sourceProvinceId: "ha-noi",
    targetProvinceId: "bac-ninh",
  }, deps.adjacency, config);
  state = route.state;
  const settled = game.diplomacy.settleTradeRoutes(state, config);
  state = settled.state;
  assert.equal(state.factions.player.resources.coin, config.tradeCoinPerTurn);
  assert.equal(state.factions["npc-bac-ninh"].resources.coin, config.tradeCoinPerTurn);

  const proposed = game.diplomacy.proposeTreaty(state, {
    id: "treaty-test",
    type: "alliance",
    fromFactionId: "player",
    toFactionId: "npc-bac-ninh",
    turn: 1,
  }, config);
  const accepted = game.diplomacy.respondTreaty(proposed.state, "treaty-test", true, 1, config);
  state = accepted.state;
  assert.equal(state.factions.player.relations["npc-bac-ninh"].status, "alliance");
  assert.deepEqual(
    state.factions.player.relations["npc-bac-ninh"],
    state.factions["npc-bac-ninh"].relations.player,
  );

  const war = game.diplomacy.declareWar(state, "player", "npc-bac-ninh", 2, config);
  state = war.state;
  assert.equal(war.event.payload.betrayedTreaty, true);
  assert.equal(state.factions.player.relations["npc-bac-ninh"].status, "war");
  assert.equal(state.factions.player.relations["npc-bac-ninh"].betrayalUntilTurn, 12);
  assert.equal(state.factions.player.tradeRoutes[0].active, false);
  assert.deepEqual(
    state.factions.player.relations["npc-bac-ninh"],
    state.factions["npc-bac-ninh"].relations.player,
  );
});

test("trade route limits reject an otherwise legal extra route", () => {
  const config = game.contracts.cloneJson(deps.balance.diplomacy);
  config.maxTradeRoutes = 1;
  let state = createCampaign("route-limit");
  state = game.diplomacy.changeRelation(state, "player", "npc-bac-ninh", 50, config);
  state = game.diplomacy.changeRelation(state, "player", "npc-thai-nguyen", 50, config);
  state = game.diplomacy.createTradeRoute(state, {
    id: "route-one",
    fromFactionId: "player",
    toFactionId: "npc-bac-ninh",
    sourceProvinceId: "ha-noi",
    targetProvinceId: "bac-ninh",
  }, deps.adjacency, config).state;
  assert.throws(() => game.diplomacy.createTradeRoute(state, {
    id: "route-two",
    fromFactionId: "player",
    toFactionId: "npc-thai-nguyen",
    sourceProvinceId: "ha-noi",
    targetProvinceId: "thai-nguyen",
  }, deps.adjacency, config), /limit/i);
});

test("campaign treaty proposals require the recipient response and revalidate stale acceptance", () => {
  let state = createCampaign("campaign-treaty-response");
  state.turn = 4;
  state = game.diplomacy.changeRelation(state, "player", "npc-bac-ninh", 50, deps.balance.diplomacy);
  state = game.diplomacy.proposeTreaty(state, {
    id: "npc-offer-player",
    type: "non-aggression",
    fromFactionId: "npc-bac-ninh",
    toFactionId: "player",
    turn: 4,
  }, deps.balance.diplomacy).state;
  let result = advanceTurn(state, {
    playerFactionId: "player",
    playerAction: { type: "RESPOND_TREATY", payload: { factionId: "player", proposalId: "npc-offer-player", accepted: true } },
  });
  assert.equal(result.state.factions.player.relations["npc-bac-ninh"].status, "non-aggression");
  assert.equal(result.state.factions.player.treatyProposals.length, 0);

  state = createCampaign("campaign-stale-treaty");
  state.turn = 4;
  state = game.diplomacy.changeRelation(state, "player", "npc-bac-ninh", 50, deps.balance.diplomacy);
  state = game.diplomacy.proposeTreaty(state, {
    id: "stale-npc-offer",
    type: "alliance",
    fromFactionId: "npc-bac-ninh",
    toFactionId: "player",
    turn: 4,
  }, deps.balance.diplomacy).state;
  state = game.diplomacy.changeRelation(state, "player", "npc-bac-ninh", -100, deps.balance.diplomacy);
  const before = JSON.stringify(state);
  assert.throws(() => advanceTurn(state, {
    playerFactionId: "player",
    playerAction: { type: "RESPOND_TREATY", payload: { factionId: "player", proposalId: "stale-npc-offer", accepted: true } },
  }), /not legal/i);
  assert.equal(JSON.stringify(state), before);
  result = advanceTurn(state, {
    playerFactionId: "player",
    playerAction: { type: "RESPOND_TREATY", payload: { factionId: "player", proposalId: "stale-npc-offer", accepted: false } },
  });
  assert.equal(result.state.factions.player.treatyProposals.length, 0);
});

test("occupation lasts three turns, applies staged modifiers, and blocks recruitment", () => {
  let state = createCampaign("occupation");
  const occupied = game.occupation.startOccupation(
    state.provinces["bac-ninh"],
    "player",
    "npc-bac-ninh",
    1,
    deps.balance.occupation,
  );
  state.provinces["bac-ninh"] = occupied.province;
  assert.deepEqual(game.occupation.modifiers(state.provinces["bac-ninh"], deps.balance.occupation), {
    production: 0.5,
    growth: 0,
    recruitmentBlocked: true,
  });

  state.factions.player.resources = { food: 10000, coin: 10000 };
  const beforeBlocked = JSON.stringify(state);
  assert.throws(() => advanceTurn(state, {
    playerFactionId: "player",
    playerAction: {
      type: "RECRUIT",
      payload: { factionId: "player", provinceId: "bac-ninh", count: 10 },
    },
    quizScore: 8,
  }), /not legal/i);
  assert.equal(JSON.stringify(state), beforeBlocked);
  const occupiedTurn = advanceTurn(state, {
    playerFactionId: "player",
    playerAction: { type: "WAIT", payload: { factionId: "player" } },
  });
  assert.equal(occupiedTurn.state.provinces["bac-ninh"].occupation.remainingTurns, 2);

  state = createCampaign("occupation-progress");
  state.provinces["bac-ninh"] = game.occupation.startOccupation(
    state.provinces["bac-ninh"], "player", "npc-bac-ninh", 1, deps.balance.occupation,
  ).province;
  const expectedRemaining = [2, 1, null];
  expectedRemaining.forEach((remaining) => {
    state = game.occupation.advanceOccupations(state, deps.balance.occupation).state;
    assert.equal(state.provinces["bac-ninh"].occupation && state.provinces["bac-ninh"].occupation.remainingTurns, remaining);
  });

  state = createCampaign("occupation-final-turn");
  state.provinces["bac-ninh"] = game.occupation.startOccupation(
    state.provinces["bac-ninh"], "player", "npc-bac-ninh", 1, deps.balance.occupation,
  ).province;
  state.provinces["bac-ninh"].occupation.remainingTurns = 1;
  state.factions.player.resources = { food: 10000, coin: 10000 };
  assert.throws(() => advanceTurn(state, {
    playerFactionId: "player",
    playerAction: {
      type: "RECRUIT",
      payload: { factionId: "player", provinceId: "bac-ninh", count: 10 },
    },
  }), /not legal/i);
  const finalTurn = advanceTurn(state, {
    playerFactionId: "player",
    playerAction: { type: "WAIT", payload: { factionId: "player" } },
  });
  assert.equal(finalTurn.state.provinces["bac-ninh"].occupation, null);
});

test("player actions reject unknown commands and attempts to control an NPC atomically", () => {
  const state = createCampaign("player-command-validation");
  const before = JSON.stringify(state);
  assert.throws(() => advanceTurn(state, {
    playerFactionId: "player",
    playerAction: { type: "NOT_A_CAMPAIGN_ACTION", payload: { factionId: "player" } },
  }), /not legal/i);
  assert.throws(() => advanceTurn(state, {
    playerFactionId: "player",
    playerAction: {
      type: "WARN_ATTACK",
      payload: {
        factionId: "npc-cao-bang",
        defenderId: "npc-lang-son",
        sourceProvinceId: "cao-bang",
        targetProvinceId: "lang-son",
      },
    },
  }), /another faction/i);
  assert.equal(JSON.stringify(state), before);
});

test("validatePlayerActions dry-runs pending actions sequentially without turn, RNG, or quiz work", () => {
  let state = createCampaign("player-action-dry-run");
  state.turn = 4;
  state = game.diplomacy.changeRelation(state, "player", "npc-bac-ninh", 50, deps.balance.diplomacy);
  state = game.campaign.prepareCampaignTurn(state, deps).state;
  const proposal = {
    type: "PROPOSE_TREATY",
    payload: { factionId: "player", partnerId: "npc-bac-ninh", treatyType: "non-aggression" },
  };
  const before = JSON.stringify(state);

  assert.equal(game.campaign.validatePlayerActions(state, "player", [], deps), true);
  assert.equal(game.campaign.validatePlayerActions(state, "player", [proposal], deps), true);
  assert.equal(JSON.stringify(state), before);
  assert.throws(() => game.campaign.validatePlayerActions(state, "player", [proposal, proposal], deps), /not legal/i);
  assert.throws(() => game.campaign.validatePlayerActions(state, "player", [
    { type: "WAIT", payload: { factionId: "npc-bac-ninh" } },
  ], deps), /another faction/i);
  assert.equal(JSON.stringify(state), before);

  const limited = game.contracts.cloneGameState(state);
  limited.factions.player.actionPoints = 1;
  assert.throws(() => game.campaign.validatePlayerActions(limited, "player", [
    { type: "WAIT", payload: { factionId: "player" } },
    { type: "WAIT", payload: { factionId: "player" } },
  ], deps), /action-point budget/i);
  assert.throws(() => game.campaign.validatePlayerActions(createCampaign("dry-run-phase"), "player", [], deps), /action phase/i);
});

test("NPC legal actions forbid early war and deterministic selection uses only adjacent targets", () => {
  const state = createCampaign("npc-actions");
  state.factions.player.resources = { food: 10000, coin: 10000 };
  state.factions.player.actionPoints = 2;
  state.turn = 3;
  let context = aiContext(state, "player");
  assert.equal(
    game["npc-ai"].queryLegalActions(state, "player", context).some((action) => action.type === "WARN_ATTACK"),
    false,
  );

  state.turn = 4;
  context = aiContext(state, "player");
  const actions = game["npc-ai"].queryLegalActions(state, "player", context);
  const warnings = actions.filter((action) => action.type === "WARN_ATTACK");
  assert.ok(warnings.length > 0);
  warnings.forEach((action) => {
    assert.ok(deps.adjacency[action.payload.sourceProvinceId].includes(action.payload.targetProvinceId));
  });
  const first = game["npc-ai"].chooseAction(state, "player", context, state.rng);
  const second = game["npc-ai"].chooseAction(state, "player", context, state.rng);
  assert.deepEqual(first, second);
});

test("NPC treaties use proposal and response actions and benchmark responses are not projected twice", () => {
  let state = createCampaign("npc-treaty-state-machine");
  state.turn = 4;
  state = game.diplomacy.changeRelation(state, "player", "npc-bac-ninh", 50, deps.balance.diplomacy);
  state.factions.player.actionPoints = deps.balance.campaign.actionPointsPerTurn;
  const legal = game["npc-ai"].queryLegalActions(state, "player", aiContext(state, "player"));
  assert.ok(legal.some((action) => action.type === "PROPOSE_TREATY" && action.payload.partnerId === "npc-bac-ninh"));
  assert.equal(legal.some((action) => action.type === "TREATY"), false);

  state = game.diplomacy.proposeTreaty(state, {
    id: "npc-benchmark-offer",
    type: "non-aggression",
    fromFactionId: "npc-bac-ninh",
    toFactionId: "player",
    turn: state.turn,
  }, deps.balance.diplomacy).state;
  const prepared = game.campaign.prepareCampaignTurn(state, deps);
  const actions = game["benchmark-policies"].chooseActions(prepared.state, "balanced", deps, "player");
  const responses = actions.filter((action) => action.type === "RESPOND_TREATY" && action.payload.proposalId === "npc-benchmark-offer");
  assert.equal(responses.length, 1);
  const completed = completeTurn(prepared.state, { playerFactionId: "player", playerActions: actions });
  assert.equal(completed.actionErrors, 0);
  assert.equal(completed.state.factions.player.treatyProposals.some((proposal) => proposal.id === "npc-benchmark-offer"), false);
});

test("NPC recruitment actions are affordable under the configured spending fraction", () => {
  const state = createCampaign("recruit-affordability");
  state.turn = 4;
  state.phase = "action";
  state.factions.player.actionPoints = 2;
  state.factions.player.resources = { food: 20, coin: 6 };
  const action = game["npc-ai"].queryLegalActions(state, "player", aiContext(state, "player"))
    .find((candidate) => candidate.type === "RECRUIT");
  assert.ok(action);
  const result = game.recruitment.queueRecruitment(
    state.provinces[action.payload.provinceId],
    state.factions.player,
    { actionId: "affordable-recruit", unitId: "militia", count: action.payload.count },
    { phase: "action", factionId: "player", provinceId: action.payload.provinceId },
    deps.balance.economy.recruitment,
  );
  assert.equal(result.ok, true);
});

test("owned adjacent provinces can move mixed campaign forces without changing total population", () => {
  let state = createCampaign("campaign-movement");
  state.turn = 4;
  state.provinces["bac-ninh"].ownerId = "player";
  const beforePopulation = state.provinces["ha-noi"].population.military + state.provinces["bac-ninh"].population.military;
  const result = advanceTurn(state, {
    playerFactionId: "player",
    playerAction: { type: "MOVE", payload: { factionId: "player", sourceProvinceId: "ha-noi", targetProvinceId: "bac-ninh", unitId: "militia", count: 40 } },
  });
  assert.ok(result.events.some((event) => event.type === "TROOPS_MOVED" && event.payload.count === 40));
  assert.equal(result.state.provinces["ha-noi"].population.military + result.state.provinces["bac-ninh"].population.military, beforePopulation);
  assert.deepEqual(game.campaign.validateCampaignState(result.state, deps), []);
});

test("campaign rejects malformed production dependencies and safe-integer turn overflow atomically", () => {
  const malformed = game.contracts.cloneJson(deps);
  delete malformed.balance.campaign.autoRecruitBatchLimit;
  assert.throws(() => game.campaign.createCampaign({ playerProvinceId: "ha-noi", seed: "bad-deps" }, malformed), /safe integer/i);

  const asymmetric = game.contracts.cloneJson(deps);
  asymmetric.adjacency["ha-noi"] = asymmetric.adjacency["ha-noi"].filter((provinceId) => provinceId !== "bac-ninh");
  assert.throws(() => game.campaign.createCampaign({ playerProvinceId: "ha-noi", seed: "bad-map" }, asymmetric), /symmetric/i);

  const state = createCampaign("turn-overflow");
  state.turn = Number.MAX_SAFE_INTEGER;
  const before = JSON.stringify(state);
  assert.throws(() => advanceTurn(state, {
    playerFactionId: "player",
    playerAction: { type: "WAIT", payload: { factionId: "player" } },
  }), /safe integer range/i);
  assert.equal(JSON.stringify(state), before);
});

test("trade settlement prunes invalid or over-capacity route pairs deterministically", () => {
  let state = createCampaign("campaign-route-pruning");
  state = game.diplomacy.changeRelation(state, "player", "npc-bac-ninh", 50, deps.balance.diplomacy);
  state = game.diplomacy.changeRelation(state, "player", "npc-thai-nguyen", 50, deps.balance.diplomacy);
  state = game.diplomacy.createTradeRoute(state, {
    id: "route-prune-one",
    fromFactionId: "player",
    toFactionId: "npc-bac-ninh",
    sourceProvinceId: "ha-noi",
    targetProvinceId: "bac-ninh",
  }, deps.adjacency, deps.balance.diplomacy).state;
  state = game.diplomacy.createTradeRoute(state, {
    id: "route-prune-two",
    fromFactionId: "player",
    toFactionId: "npc-thai-nguyen",
    sourceProvinceId: "ha-noi",
    targetProvinceId: "thai-nguyen",
  }, deps.adjacency, deps.balance.diplomacy).state;
  const prepared = game.campaign.prepareCampaignTurn(state, deps);
  assert.deepEqual(prepared.state.factions.player.tradeRoutes.map((route) => route.id), ["route-prune-one"]);
  assert.ok(prepared.events.some((event) => event.type === "TRADE_ROUTE_REMOVED" && event.payload.routeId === "route-prune-two"));
  assert.deepEqual(game.campaign.validateCampaignState(prepared.state, deps), []);
});

test("an attack warning waits one full turn before starting an adjacent battle", () => {
  let state = createCampaign("warning");
  state.turn = 4;
  const warned = advanceTurn(state, {
    playerFactionId: "player",
    playerAction: {
      type: "WARN_ATTACK",
      payload: {
        factionId: "player",
        defenderId: "npc-bac-ninh",
        sourceProvinceId: "ha-noi",
        targetProvinceId: "bac-ninh",
      },
    },
    quizScore: 8,
  });
  const warning = warned.events.find((event) => event.type === "ATTACK_WARNING_CREATED" && event.payload.attackerId === "player");
  assert.ok(warning);
  assert.equal(warning.payload.createdTurn, 4);
  assert.equal(warning.payload.executeTurn, 5);
  assert.equal(warned.events.some((event) => event.type === "BATTLE_STARTED" && event.payload.attackerId === "player"), false);

  const started = advanceTurn(warned.state, {
    playerFactionId: "player",
    playerAction: { type: "WAIT", payload: { factionId: "player" } },
    quizScore: 8,
  });
  const battle = started.events.find((event) => event.type === "BATTLE_STARTED" && event.payload.warningId === warning.payload.id);
  assert.ok(battle);
  assert.ok(deps.adjacency[battle.payload.sourceProvinceId].includes(battle.payload.targetProvinceId));
});

test("battle reconciliation preserves a recruitment queue created during combat", () => {
  let state = createCampaign("battle-recruitment");
  state.turn = 5;
  state.factions.player.resources = { food: 10000, coin: 10000 };
  const battle = game.combat.createBattle({
    id: "battle-training-regression",
    sourceProvinceId: "ha-noi",
    targetProvinceId: "bac-ninh",
    terrain: state.provinces["bac-ninh"].terrain,
    fortification: 40,
    attacker: { factionId: "player", units: { militia: 200 } },
    defender: { factionId: "npc-bac-ninh", units: { militia: 200 } },
  }, deps.balance.combat);
  battle.defender.morale = 1;
  state.battles[battle.id] = battle;
  state.effects.push({
    type: "battle-reservation",
    battleId: battle.id,
    attacker: { provinceId: "ha-noi", units: { militia: 200 } },
    defender: { provinceId: "bac-ninh", units: { militia: 200 } },
    pending: [],
  });

  const result = advanceTurn(state, {
    playerFactionId: "player",
    playerAction: {
      type: "RECRUIT",
      payload: { factionId: "player", provinceId: "ha-noi", count: 10 },
    },
    quizScore: 8,
  });
  const province = result.state.provinces["ha-noi"];
  assert.notEqual(result.state.battles[battle.id].status, "active");
  assert.equal(province.recruitmentQueue.length, 1);
  assert.equal(province.units.militia.training, 10);
  assert.equal(game.economy.countMilitary(province.units), province.population.military);
  const completed = game.recruitment.processRecruitmentQueue(province);
  assert.equal(completed.province.recruitmentQueue.length, 0);
  assert.equal(completed.province.units.militia.training, 0);
});

test("campaign reinforcement reserves ready troops, arrives after one pulse, and honors player tactics", () => {
  let state = createCampaign("reinforcement-campaign");
  state.turn = 5;
  state.factions.player.resources = { food: 100000, coin: 100000 };
  state.factions["npc-bac-ninh"].resources = { food: 100000, coin: 100000 };
  const battle = installBattle(state, "battle-reinforcement-campaign", 250);
  const before = JSON.stringify(state);
  assert.throws(() => advanceTurn(state, {
    playerFactionId: "player",
    playerAction: { type: "REINFORCE", payload: { factionId: "player", battleId: battle.id, units: { militia: 100 } } },
  }), /not legal/i);
  assert.equal(JSON.stringify(state), before);

  let result = advanceTurn(state, {
    playerFactionId: "player",
    playerAction: { type: "REINFORCE", payload: { factionId: "player", battleId: battle.id, units: { militia: 50 } } },
    battleTactics: { [battle.id]: "siege" },
  });
  assert.ok(result.events.some((event) => event.type === "BATTLE_REINFORCEMENT_QUEUED" && event.payload.count === 50));
  assert.ok(result.events.some((event) => event.type === "BATTLE_PULSE_RESOLVED" && event.payload.attackerTactic === "siege"));
  assert.equal(result.state.battles[battle.id].attacker.reinforcementsReceived, 0);
  assert.equal(result.state.effects.find((effect) => effect.type === "battle-reservation" && effect.battleId === battle.id).pending.length, 1);

  result = advanceTurn(result.state, {
    playerFactionId: "player",
    playerAction: { type: "WAIT", payload: { factionId: "player" } },
  });
  assert.equal(result.state.battles[battle.id].attacker.reinforcementsReceived, 50);
  assert.ok(result.events.some((event) => event.type === "BATTLE_REINFORCEMENT_ARRIVED"));
  assert.deepEqual(game.campaign.validateCampaignState(result.state, deps), []);
});

test("battle completion cancels undelivered reinforcements without consuming reserved province troops", () => {
  const state = createCampaign("reinforcement-battle-end");
  state.turn = 5;
  const battle = installBattle(state, "battle-reinforcement-end", 250);
  battle.defender.morale = 1;
  const control = game.contracts.cloneGameState(state);

  const reinforced = advanceTurn(state, {
    playerFactionId: "player",
    playerAction: { type: "REINFORCE", payload: { factionId: "player", battleId: battle.id, units: { militia: 50 } } },
    battleTactics: { [battle.id]: "siege" },
  });
  const withoutReinforcement = advanceTurn(control, {
    playerFactionId: "player",
    playerAction: { type: "WAIT", payload: { factionId: "player" } },
    battleTactics: { [battle.id]: "siege" },
  });

  assert.notEqual(reinforced.state.battles[battle.id].status, "active");
  assert.deepEqual(reinforced.state.battles[battle.id].reinforcementQueue, []);
  assert.equal(reinforced.state.effects.some((effect) => effect.type === "battle-reservation" && effect.battleId === battle.id), false);
  assert.ok(reinforced.events.some((event) => event.type === "BATTLE_REINFORCEMENT_CANCELLED" && event.payload.count === 50));
  assert.deepEqual(reinforced.state.provinces["ha-noi"], withoutReinforcement.state.provinces["ha-noi"]);
  assert.deepEqual(reinforced.state.provinces["bac-ninh"], withoutReinforcement.state.provinces["bac-ninh"]);
  assert.deepEqual(game.campaign.validateCampaignState(reinforced.state, deps), []);
});

test("quiz production and unlock discounts apply for exactly their configured future turns", () => {
  let state = createCampaign("quiz-campaign-effects");
  state.turn = 3;
  let result = advanceTurn(state, {
    playerFactionId: "player",
    playerAction: { type: "WAIT", payload: { factionId: "player" } },
    quizScore: 10,
    quizChoice: "unlock",
  });
  let discount = result.state.effects.find((effect) => effect.type === "quiz-unlock-discount");
  assert.equal(discount.remainingTurns, 2);
  result.state.factions.player.resources.coin = 75;
  result = advanceTurn(result.state, {
    playerFactionId: "player",
    playerAction: { type: "UNLOCK", payload: { factionId: "player", unitId: "infantry" } },
  });
  const unlocked = result.events.find((event) => event.type === "UNIT_UNLOCKED" && event.payload.factionId === "player");
  assert.equal(unlocked.payload.coinCost, 75);
  assert.equal(result.state.effects.find((effect) => effect.type === "quiz-unlock-discount").remainingTurns, 1);
  result = advanceTurn(result.state, {
    playerFactionId: "player",
    playerAction: { type: "WAIT", payload: { factionId: "player" } },
  });
  assert.equal(result.state.effects.some((effect) => effect.type === "quiz-unlock-discount"), false);

  state = createCampaign("quiz-production-effect");
  result = advanceTurn(state, {
    playerFactionId: "player",
    playerAction: { type: "WAIT", payload: { factionId: "player" } },
    quizScore: 8,
    quizChoice: "food",
  });
  let prepared = game.campaign.prepareCampaignTurn(result.state, deps);
  let context = prepared.state.effects.find((effect) => effect.type === "campaign-turn-context");
  let expected = game.economy.calculateProduction(prepared.state.provinces["ha-noi"], { foodEffects: 1.1, coinEffects: 1 }, deps.balance.economy.production);
  assert.equal(context.productionByFaction.player.food, expected.food);
  result = completeTurn(prepared.state, {
    playerFactionId: "player",
    playerAction: { type: "WAIT", payload: { factionId: "player" } },
  });
  assert.equal(result.state.effects.find((effect) => effect.type === "quiz-production").remainingTurns, 1);
  prepared = game.campaign.prepareCampaignTurn(result.state, deps);
  result = completeTurn(prepared.state, {
    playerFactionId: "player",
    playerAction: { type: "WAIT", payload: { factionId: "player" } },
  });
  assert.equal(result.state.effects.some((effect) => effect.type === "quiz-production"), false);
});

test("campaign saves replay warning and battle states and reject campaign-only corruption", () => {
  let state = createCampaign("campaign-save-replay");
  state.turn = 4;
  const warned = advanceTurn(state, {
    playerFactionId: "player",
    playerAction: { type: "WARN_ATTACK", payload: { factionId: "player", defenderId: "npc-bac-ninh", sourceProvinceId: "ha-noi", targetProvinceId: "bac-ninh" } },
  }).state;
  let raw = game["campaign-save"].encodeSave(warned, deps);
  let restored = game["campaign-save"].decodeSave(raw, deps);
  assert.equal(restored.ok, true);
  const input = withQuiz(warned, { playerFactionId: "player", playerAction: { type: "WAIT", payload: { factionId: "player" } } });
  const originalBattle = game.campaign.advanceCampaignTurn(warned, input, deps);
  const restoredBattle = game.campaign.advanceCampaignTurn(restored.value, input, deps);
  assert.deepEqual(restoredBattle, originalBattle);
  assert.ok(Object.values(originalBattle.state.battles).some((entry) => entry.status === "active"));

  raw = game["campaign-save"].encodeSave(originalBattle.state, deps);
  restored = game["campaign-save"].decodeSave(raw, deps);
  assert.equal(restored.ok, true);
  const nextInput = withQuiz(originalBattle.state, { playerFactionId: "player", playerAction: { type: "WAIT", payload: { factionId: "player" } } });
  assert.deepEqual(game.campaign.advanceCampaignTurn(restored.value, nextInput, deps), game.campaign.advanceCampaignTurn(originalBattle.state, nextInput, deps));

  const corrupted = game.contracts.cloneGameState(originalBattle.state);
  const reservation = corrupted.effects.find((effect) => effect.type === "battle-reservation");
  reservation.attacker.units.militia += 10000;
  const baseValidRaw = game["save-codec"].encodeSave(corrupted);
  const rejected = game["campaign-save"].decodeSave(baseValidRaw, deps);
  assert.equal(rejected.ok, false);
  assert.equal(rejected.error.code, "CAMPAIGN_BATTLE_RESERVED_FORCE");
});

test("campaign replay is deterministic and preserves limits and invariants", () => {
  function replay() {
    let state = createCampaign("deterministic-replay");
    const audit = [];
    for (let index = 0; index < 20 && state.phase !== "complete"; index += 1) {
      const action = game["benchmark-policies"].chooseAction(state, "expansionist", deps, "player");
      const result = advanceTurn(state, {
        playerFactionId: "player",
        playerAction: action,
        quizScore: 8,
        quizChoice: index % 2 === 0 ? "food" : "coin",
      });
      assert.equal(result.actionErrors, 0);
      state = result.state;
      assert.deepEqual(game.invariants.validateState(state), []);
      assert.deepEqual(game.campaign.validateCampaignState(state, deps), []);
      Object.keys(state.factions).forEach((factionId) => {
        const faction = state.factions[factionId];
        assert.ok(faction.tradeRoutes.length <= deps.balance.diplomacy.maxTradeRoutes);
        assert.ok(game["npc-ai"].activeFronts(state, factionId) <= deps.balance.campaign.maximumActiveFronts + Math.floor(game.campaign.ownedProvinceIds(state, factionId).length / 5));
        const relations = Object.values(faction.relations);
        assert.ok(relations.filter((entry) => entry.status === "alliance").length <= deps.balance.diplomacy.maxAlliances);
        assert.ok(relations.filter((entry) => entry.status === "non-aggression").length <= deps.balance.diplomacy.maxNonAggressionTreaties);
      });
      const reservedProvinces = [];
      state.effects.filter((effect) => effect.type === "attack-warning").forEach((effect) => {
        assert.equal(reservedProvinces.includes(effect.sourceProvinceId), false);
        assert.equal(reservedProvinces.includes(effect.targetProvinceId), false);
        reservedProvinces.push(effect.sourceProvinceId, effect.targetProvinceId);
      });
      audit.push(result.events);
    }
    return { state, audit };
  }
  assert.deepEqual(replay(), replay());
});

test("victory, defeat, and player event filtering follow campaign rules", () => {
  const state = createCampaign("outcomes");
  const victoryState = game.contracts.cloneGameState(state);
  Object.values(victoryState.provinces).forEach((province) => { province.ownerId = "player"; });
  const victory = game.campaign.evaluateOutcome(victoryState, "player", deps);
  assert.equal(victory.status, "victory");
  assert.equal(victory.controlledRegions.length, 6);

  const defeatState = game.contracts.cloneGameState(state);
  defeatState.provinces["ha-noi"].ownerId = "npc-bac-ninh";
  assert.equal(game.campaign.evaluateOutcome(defeatState, "player", deps).status, "defeat");

  const filtered = game.campaign.filterEvents([
    { type: "NPC_ONLY", payload: { factionId: "npc-ca-mau", provinceId: "ca-mau" } },
    { type: "SUBSTRING_ONLY", payload: { factionId: "not-player-copy" } },
    { type: "PLAYER_ONLY", payload: { factionId: "player" } },
    { type: "QUIZ_REWARD_APPLIED", payload: { score: 8 } },
    { type: "CAMPAIGN_TURN_COMPLETED", payload: { turn: 1 } },
  ], "player", state);
  assert.deepEqual(filtered.map((event) => event.type), [
    "PLAYER_ONLY", "QUIZ_REWARD_APPLIED", "CAMPAIGN_TURN_COMPLETED",
  ]);
});

test("simulation assertions require at least sixty percent of standard campaigns to win", () => {
  const metrics = {
    invalidActions: 0,
    invariantFailures: 0,
    warBeforeTurn4: 0,
    warningViolations: 0,
    p95TurnMs: 1,
    standard: { campaigns: 10, victories: 4, winRate: 1, medianVictoryTurn: 50, earlyWinRate: 0 },
  };
  assert.throws(() => assertSimulationMetrics(metrics), /at least 60%/i);
  metrics.standard.victories = 6;
  metrics.standard.winRate = 0.6;
  assert.doesNotThrow(() => assertSimulationMetrics(metrics));
});

test("standard campaign benchmark uses one documented reference province", () => {
  assert.equal(require("../../scripts/simulate-campaign.js").policyFor(0).referenceProvinceId, "da-nang");
  assert.equal(require("../../scripts/simulate-campaign.js").policyFor(1).referenceProvinceId, undefined);
});

test("short held-out campaign simulation has no invalid actions, invariant failures, or early wars", { timeout: 120000 }, () => {
  const metrics = runSimulation({ runs: 9, turns: 12, seed: "campaign-test-held-out" });
  assert.equal(metrics.invalidActions, 0);
  assert.equal(metrics.invariantFailures, 0);
  assert.equal(metrics.warBeforeTurn4, 0);
  assert.equal(metrics.warningViolations, 0);
  assert.ok(metrics.p95TurnMs < 100);
});
