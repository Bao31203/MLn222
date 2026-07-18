"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");
const { CORE_FILES, ROOT, corePath, loadNodeCore } = require("./test-helpers.cjs");
const { createBaselineCombatConfig, runSimulation } = require("../../scripts/simulate-combat.js");

const COMBAT_FILES = ["combat-tactics.js", "combat-casualties.js", "combat.js"];

function combatPath(file) { return path.join(ROOT, "game", "engine", file); }

function loadCombat() {
  const game = loadNodeCore();
  COMBAT_FILES.forEach((file) => {
    const resolved = require.resolve(combatPath(file));
    delete require.cache[resolved];
  });
  COMBAT_FILES.forEach((file) => require(combatPath(file)));
  return game;
}

function battleInput(options = {}) {
  const attacker = { factionId: "player", units: options.attackerUnits || { militia: 800, infantry: 200 } };
  const defender = { factionId: "npc", units: options.defenderUnits || { militia: 800, infantry: 200 } };
  if (options.attackerMorale !== undefined) attacker.morale = options.attackerMorale;
  if (options.attackerSupply !== undefined) attacker.supply = options.attackerSupply;
  if (options.defenderMorale !== undefined) defender.morale = options.defenderMorale;
  if (options.defenderSupply !== undefined) defender.supply = options.defenderSupply;
  return {
    id: options.id || "battle-test",
    sourceProvinceId: "ha-noi",
    targetProvinceId: "bac-ninh",
    terrain: options.terrain || "plains",
    fortification: options.fortification === undefined ? 100 : options.fortification,
    attacker,
    defender,
  };
}

function noVarianceConfig() {
  const config = createBaselineCombatConfig();
  config.attrition.varianceMin = 1;
  config.attrition.varianceMax = 1;
  return config;
}

test("battle factory creates validated conserved participants", () => {
  const game = loadCombat();
  const config = createBaselineCombatConfig();
  const battle = game.combat.createBattle(battleInput(), config);
  assert.deepEqual(game.combat.validateBattle(battle, config), []);
  assert.equal(game["combat-casualties"].accountingTotal(battle.attacker), 1000);
  assert.equal(battle.breach, 0);
  assert.equal(battle.turn, 0);
});

test("malformed IDs, unknown units, empty stacks, and invalid state are rejected", () => {
  const game = loadCombat();
  const config = createBaselineCombatConfig();
  assert.throws(() => game.combat.createBattle({ ...battleInput(), id: "bad id" }, config), /invalid/);
  assert.throws(() => game.combat.createBattle(battleInput({ attackerUnits: { dragon: 10 } }), config), /configured power/);
  assert.throws(() => game.combat.createBattle(battleInput({ attackerUnits: { militia: 0 } }), config), /active units/);
  const battle = game.combat.createBattle(battleInput(), config);
  battle.attacker.units.militia += 1;
  assert.equal(game.combat.validateBattle(battle, config).some((item) => item.code === "BATTLE_CONSERVATION"), true);
});

test("engage losses are simultaneous, symmetric, and inside the 4-10 percent envelope", () => {
  const game = loadCombat();
  const config = noVarianceConfig();
  config.power.fortificationDefenseBonus = 0;
  const battle = game.combat.createBattle(battleInput({ fortification: 0 }), config);
  const beforeAttacker = game["combat-casualties"].countUnits(battle.attacker.units);
  const beforeDefender = game["combat-casualties"].countUnits(battle.defender.units);
  const result = game.combat.resolvePulse(battle, { attackerTactic: "engage", defenderTactic: "engage" }, game.rng.createRngState("symmetry"), config);
  assert.equal(result.report.losses.attacker.total, result.report.losses.defender.total);
  assert.ok(result.report.lossRates.attacker >= 0.04 && result.report.lossRates.attacker <= 0.1);
  assert.equal(game["combat-casualties"].countUnits(result.battle.attacker.units), beforeAttacker - result.report.losses.attacker.total);
  assert.equal(game["combat-casualties"].countUnits(result.battle.defender.units), beforeDefender - result.report.losses.defender.total);
});

test("siege stays in 2-6 percent and increases breach", () => {
  const game = loadCombat();
  const config = noVarianceConfig();
  const battle = game.combat.createBattle(battleInput(), config);
  const result = game.combat.resolvePulse(battle, { attackerTactic: "siege", defenderTactic: "engage" }, game.rng.createRngState("siege"), config);
  assert.ok(result.report.lossRates.attacker >= 0.02 && result.report.lossRates.attacker <= 0.06);
  assert.ok(result.report.breachDamage >= 14 && result.report.breachDamage <= 20);
  assert.ok(result.battle.breach > 0);
});

test("assault is locked until breach threshold and never exceeds 15 percent direct loss", () => {
  const game = loadCombat();
  const config = noVarianceConfig();
  const battle = game.combat.createBattle(battleInput(), config);
  assert.throws(() => game.combat.resolvePulse(battle, { attackerTactic: "assault", defenderTactic: "engage" }, game.rng.createRngState("locked"), config), /TACTIC_ASSAULT_LOCKED/);
  battle.fortification.current = 40;
  battle.breach = 60;
  const result = game.combat.resolvePulse(battle, { attackerTactic: "assault", defenderTactic: "assault" }, game.rng.createRngState("assault"), config);
  assert.ok(result.report.lossRates.attacker >= 0.07 && result.report.lossRates.attacker <= 0.15);
  assert.ok(result.report.lossRates.defender >= 0.07 && result.report.lossRates.defender <= 0.15);
  assert.ok(result.report.losses.attacker.total <= 150);
  assert.ok(result.report.losses.defender.total <= 150);
});

test("casualty allocation conserves direct dead, wounded, and routed outcomes", () => {
  const game = loadCombat();
  const config = createBaselineCombatConfig();
  const battle = game.combat.createBattle(battleInput(), config);
  const result = game["combat-casualties"].applyDirectLosses(battle.attacker, 101, config.casualties);
  const breakdown = result.breakdown;
  assert.equal(breakdown.dead + breakdown.wounded + breakdown.routed, 101);
  assert.equal(breakdown.captured, 0);
  assert.equal(game["combat-casualties"].countUnits(result.participant.woundedQueue[0].units), breakdown.wounded);
  assert.equal(game["combat-casualties"].accountingTotal(result.participant), 1000);
});

test("wounded recovery preserves unit categories and total accounting", () => {
  const game = loadCombat();
  const config = createBaselineCombatConfig();
  const battle = game.combat.createBattle(battleInput(), config);
  const loss = game["combat-casualties"].applyDirectLosses(battle.attacker, 100, config.casualties);
  const first = game["combat-casualties"].advanceWoundedRecovery(loss.participant);
  assert.equal(first.breakdown.recovered, 0);
  const second = game["combat-casualties"].advanceWoundedRecovery(first.participant);
  assert.equal(second.breakdown.recovered, loss.breakdown.wounded);
  assert.equal(second.events[0].type, "WOUNDED_RECOVERED");
  assert.equal(game["combat-casualties"].accountingTotal(second.participant), 1000);
});

test("reinforcement is capped, arrives one pulse late, and does not reset turn or morale", () => {
  const game = loadCombat();
  const config = noVarianceConfig();
  let battle = game.combat.createBattle(battleInput(), config);
  battle.attacker.morale = 70;
  battle = game.combat.queueReinforcement(battle, "attacker", { militia: 200 }, "reinforce-1", config);
  assert.throws(() => game.combat.queueReinforcement(battle, "attacker", { militia: 60 }, "reinforce-2", config), /limit/);
  let rngState = game.rng.createRngState("reinforcement");
  let pulse = game.combat.resolvePulse(battle, { attackerTactic: "engage", defenderTactic: "engage" }, rngState, config);
  assert.equal(pulse.report.deliveredReinforcements.length, 0);
  const moraleAfterFirst = pulse.battle.attacker.morale;
  battle = pulse.battle; rngState = pulse.rngState;
  pulse = game.combat.resolvePulse(battle, { attackerTactic: "engage", defenderTactic: "engage" }, rngState, config);
  assert.equal(pulse.report.deliveredReinforcements[0].count, 200);
  assert.equal(pulse.battle.turn, 2);
  assert.ok(pulse.battle.attacker.morale <= moraleAfterFirst);
  assert.equal(pulse.battle.attacker.reinforcementsReceived, 200);
});

test("attacker retreat ends battle with bounded pursuit and no mass death", () => {
  const game = loadCombat();
  const config = createBaselineCombatConfig();
  const battle = game.combat.createBattle(battleInput(), config);
  const result = game.combat.resolvePulse(battle, { attackerTactic: "retreat", defenderTactic: "engage" }, game.rng.createRngState("retreat"), config);
  assert.equal(result.battle.status, "attacker-retreated");
  assert.ok(result.report.pursuitLosses >= 20 && result.report.pursuitLosses <= 80);
  assert.ok(result.battle.attacker.casualties.dead < 80);
  assert.ok(game["combat-casualties"].countUnits(result.battle.attacker.units) >= 920);
  assert.deepEqual(result.battle.outcome.withdrawnUnits, result.battle.attacker.units);
  assert.equal(game["combat-casualties"].accountingTotal(result.battle.attacker), 1000);
});

test("broken pursuer cannot inflict minimum pursuit losses and mutual retreat is rejected", () => {
  const game = loadCombat();
  const config = createBaselineCombatConfig();
  const battle = game.combat.createBattle(battleInput({ defenderMorale: 0 }), config);
  const result = game.combat.resolvePulse(battle, { attackerTactic: "retreat", defenderTactic: "engage" }, game.rng.createRngState("no-pursuit"), config);
  assert.equal(result.report.pursuitLosses, 0);
  const active = game.combat.createBattle(battleInput({ id: "mutual-retreat" }), config);
  assert.throws(() => game.combat.resolvePulse(active, { attackerTactic: "retreat", defenderTactic: "retreat" }, game.rng.createRngState("mutual"), config), /cannot retreat/);
});

test("rout or surrender defeats all active troops without counting all as dead", () => {
  const game = loadCombat();
  const config = noVarianceConfig();
  const battle = game.combat.createBattle(battleInput({ attackerUnits: { militia: 2000 }, defenderUnits: { militia: 400 }, defenderMorale: 8, fortification: 0 }), config);
  const result = game.combat.resolvePulse(battle, { attackerTactic: "engage", defenderTactic: "engage" }, game.rng.createRngState("surrender"), config);
  assert.equal(result.battle.status, "attacker-victory");
  assert.equal(game["combat-casualties"].countUnits(result.battle.defender.units), 0);
  assert.ok(result.battle.defender.casualties.dead < 400);
  assert.ok(result.battle.defender.casualties.captured > 0);
  assert.equal(result.events.some((event) => event.type === "PROVINCE_CAPTURED"), true);
});

test("fatigue and late supply pressure prevent indefinite consolidate battles", () => {
  const game = loadCombat();
  const config = noVarianceConfig();
  let battle = game.combat.createBattle(battleInput(), config);
  let rngState = game.rng.createRngState("fatigue");
  while (battle.status === "active" && battle.turn < 15) {
    const result = game.combat.resolvePulse(battle, { attackerTactic: "consolidate", defenderTactic: "consolidate" }, rngState, config);
    battle = result.battle; rngState = result.rngState;
  }
  assert.notEqual(battle.status, "active");
  assert.ok(battle.turn < 15);
});

test("same seed and tactics replay byte-equivalent battle states and events", () => {
  const game = loadCombat();
  const config = createBaselineCombatConfig();
  const initial = game.combat.createBattle(battleInput(), config);
  const left = game.combat.resolvePulse(initial, { attackerTactic: "engage", defenderTactic: "engage" }, game.rng.createRngState("replay"), config);
  const right = game.combat.resolvePulse(initial, { attackerTactic: "engage", defenderTactic: "engage" }, game.rng.createRngState("replay"), config);
  assert.equal(JSON.stringify(left), JSON.stringify(right));
});

test("runtime handlers commit battle transitions and RNG atomically", () => {
  const game = loadCombat();
  const config = createBaselineCombatConfig();
  const runtime = game.runtime.createRuntime({ handlers: game.combat.createHandlers(config), additionalInvariants: [game.combat.createInvariant(config)] });
  const state = game.contracts.createInitialState({ campaignId: "combat-runtime", seed: "runtime", phase: "resolution" });
  state.battles["battle-runtime"] = game.combat.createBattle(battleInput({ id: "battle-runtime" }), config);
  const resolved = runtime.dispatch(state, game.contracts.createAction({ id: "pulse-1", type: "RESOLVE_BATTLE_PULSE", expectedPhase: "resolution", payload: { battleId: "battle-runtime", attackerTactic: "engage", defenderTactic: "engage" } }));
  assert.equal(resolved.ok, true);
  assert.equal(resolved.state.battles["battle-runtime"].turn, 1);
  assert.equal(resolved.state.phase, "quiz");
  assert.ok(resolved.state.rng.counters.combat > state.rng.counters.combat);
});

test("invalid runtime battle action returns original state without partial mutation", () => {
  const game = loadCombat();
  const config = createBaselineCombatConfig();
  const runtime = game.runtime.createRuntime({ handlers: game.combat.createHandlers(config) });
  const state = game.contracts.createInitialState({ campaignId: "combat-rollback", seed: "rollback", phase: "resolution" });
  const result = runtime.dispatch(state, game.contracts.createAction({ id: "bad-pulse", type: "RESOLVE_BATTLE_PULSE", expectedPhase: "resolution", payload: { battleId: "missing", attackerTactic: "engage", defenderTactic: "engage" } }));
  assert.equal(result.ok, false);
  assert.equal(result.state, state);
  assert.deepEqual(state.battles, {});
});

test("combat handlers enforce internal phase guards even when expectedPhase is null", () => {
  const game = loadCombat();
  const config = createBaselineCombatConfig();
  const runtime = game.runtime.createRuntime({ handlers: game.combat.createHandlers(config), additionalInvariants: [game.combat.createInvariant(config)] });
  const state = game.contracts.createInitialState({ campaignId: "combat-phase", seed: "phase", phase: "quiz" });
  state.battles["battle-phase"] = game.combat.createBattle(battleInput({ id: "battle-phase" }), config);
  const result = runtime.dispatch(state, game.contracts.createAction({ id: "phase-bypass", type: "RESOLVE_BATTLE_PULSE", expectedPhase: null, payload: { battleId: "battle-phase", attackerTactic: "engage", defenderTactic: "engage" } }));
  assert.equal(result.ok, false);
  assert.equal(result.state, state);
  assert.equal(state.battles["battle-phase"].turn, 0);
});

test("strict combat invariant rejects corrupt nested state", () => {
  const game = loadCombat();
  const config = createBaselineCombatConfig();
  const state = game.contracts.createInitialState({ campaignId: "combat-invariant", seed: "invariant" });
  state.battles.strict = game.combat.createBattle(battleInput({ id: "strict" }), config);
  state.battles.strict.terrain = "unknown";
  state.battles.strict.reinforcementQueue.push({ requestId: "bad", side: "attacker", arrivalTurn: 0, units: { militia: -1 } });
  const errors = game.combat.createInvariant(config)(state);
  assert.equal(errors.some((item) => item.code === "BATTLE_TERRAIN"), true);
  assert.equal(errors.some((item) => item.code === "BATTLE_REINFORCEMENT_STATE"), true);
});

test("representative simulation meets duration, cap, and conservation gates", { timeout: 120000 }, () => {
  const metrics = runSimulation({ runs: 600, seed: "combat-test", assert: true });
  assert.equal(metrics.completed, 600);
  assert.equal(metrics.conservationFailures, 0);
});

test("browser and Node combat produce equivalent deterministic pulse output", () => {
  const nodeGame = loadCombat();
  const config = noVarianceConfig();
  const nodeBattle = nodeGame.combat.createBattle(battleInput(), config);
  const nodeResult = nodeGame.combat.resolvePulse(nodeBattle, { attackerTactic: "engage", defenderTactic: "engage" }, nodeGame.rng.createRngState("browser-parity"), config);
  const context = vm.createContext({ configJson: JSON.stringify(config), inputJson: JSON.stringify(battleInput()) });
  CORE_FILES.forEach((file) => vm.runInContext(fs.readFileSync(corePath(file), "utf8"), context, { filename: file }));
  COMBAT_FILES.forEach((file) => vm.runInContext(fs.readFileSync(combatPath(file), "utf8"), context, { filename: file }));
  vm.runInContext(`
    const config = JSON.parse(configJson);
    const battle = MLN222Game.combat.createBattle(JSON.parse(inputJson), config);
    resultJson = JSON.stringify(MLN222Game.combat.resolvePulse(
      battle,
      { attackerTactic: "engage", defenderTactic: "engage" },
      MLN222Game.rng.createRngState("browser-parity"),
      config
    ));
  `, context);
  assert.equal(context.resultJson, JSON.stringify(nodeResult));
});

test("combat source avoids nondeterministic, DOM, clock, and storage APIs", () => {
  COMBAT_FILES.forEach((file) => {
    const source = fs.readFileSync(combatPath(file), "utf8");
    assert.equal(/Math\.random|Date\.now|\bdocument\b|\blocalStorage\b/.test(source), false, file);
  });
});
