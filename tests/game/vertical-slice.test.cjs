"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const { ROOT, loadGame, createFixtureOptions, runAcceptance } = require("../../scripts/run-game-vertical-slice.js");

test("vertical slice completes eight turns across all Phase 02-05 modules", { timeout: 120000 }, () => {
  const result = runAcceptance(createFixtureOptions());
  assert.equal(result.metrics.strategicTurns, 8);
  assert.equal(result.metrics.quizzesCompleted, 8);
  assert.equal(result.metrics.quizQuestions, 80);
  assert.equal(result.metrics.uniqueQuizQuestions, 80);
  assert.equal(result.metrics.recruitmentCompleted >= 1, true);
  assert.equal(result.metrics.tradeSettled, 1);
  assert.equal(result.metrics.reinforcementArrived, 1);
  assert.equal(result.metrics.validationErrors.length, 0);
});

test("scripted battle spans 3-7 pulses, changes tactics, and resolves territory", { timeout: 120000 }, () => {
  const result = runAcceptance(createFixtureOptions({ seed: "battle-slice" }));
  assert.ok(result.metrics.battleDuration >= 3 && result.metrics.battleDuration <= 7);
  assert.notEqual(result.metrics.battleStatus, "active");
  const tactics = result.uninterrupted.state.eventLog
    .filter((event) => event.type === "BATTLE_PULSE_RESOLVED")
    .map((event) => event.payload.attackerTactic);
  assert.equal(tactics.length, result.metrics.battleDuration);
  assert.equal(tactics.includes("engage"), true);
  assert.equal(tactics.includes("siege"), true);
  if (result.metrics.battleStatus === "attacker-victory") assert.equal(result.metrics.finalOwner, "player");
});

test("mid-quiz and mid-battle resume is byte-equivalent to uninterrupted play", { timeout: 120000 }, () => {
  const result = runAcceptance(createFixtureOptions({ seed: "resume-slice" }));
  assert.equal(result.metrics.stateEquivalentAfterResume, true);
  assert.ok(result.metrics.saveCheckpoints >= 80);
});

test("invalid phase action is rejected without mutation", () => {
  const game = loadGame();
  const options = createFixtureOptions();
  const state = game["vertical-slice"].createInitialState(options);
  const runtime = game["vertical-slice"].createRuntime(options);
  const action = game.contracts.createAction({ id: "invalid-trade", type: "SCENARIO_TRADE", expectedPhase: null, payload: { factionId: "player", partnerId: "npc", coin: 10 } });
  const result = runtime.dispatch(state, action);
  assert.equal(result.ok, false);
  assert.equal(result.state, state);
  assert.equal(state.factions.player.resources.coin, 0);
});

test("insufficient resources and corrupt resume return structured failures", () => {
  const game = loadGame();
  const options = createFixtureOptions();
  const state = game["vertical-slice"].createInitialState(options);
  const runtime = game["vertical-slice"].createRuntime(options);
  state.phase = "action";
  state.factions.player.actionPoints = 2;
  const recruit = runtime.dispatch(state, game.contracts.createAction({ id: "too-many", type: "RECRUIT_UNITS", expectedPhase: "action", payload: { factionId: "player", provinceId: "ha-noi", unitId: "militia", count: 500 } }));
  assert.equal(recruit.ok, false);
  assert.equal(recruit.state, state);
  assert.equal(game["save-codec"].decodeSave('{"schemaVersion":1').error.code, "SAVE_JSON");
});

test("scenario uses the actual connected province fixtures and documented API", () => {
  const options = createFixtureOptions();
  assert.equal(options.adjacency["ha-noi"].includes("bac-ninh"), true);
  assert.equal(options.adjacency["bac-ninh"].includes("thai-nguyen"), true);
  const contract = fs.readFileSync(path.join(ROOT, "game/contracts/campaign-api.md"), "utf8");
  ["START_TURN_ECONOMY", "RESOLVE_BATTLE_PULSE", "ANSWER_TURN_QUIZ", "getMapView", "mln222.game.v1"].forEach((term) => assert.match(contract, new RegExp(term.replace(".", "\\."))));
});
