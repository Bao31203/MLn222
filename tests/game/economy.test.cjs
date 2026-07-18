"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");
const {
  CORE_FILES,
  ROOT,
  corePath,
  loadNodeCore,
  serialize,
} = require("./test-helpers.cjs");
const {
  createBaselineConfig,
  runSimulation,
} = require("../../scripts/simulate-economy.js");

const ENGINE_FILES = ["population.js", "economy.js", "recruitment.js", "turn-economy.js"];

function enginePath(file) {
  return path.join(ROOT, "game", "engine", file);
}

function loadEngine() {
  const game = loadNodeCore();
  ENGINE_FILES.forEach((file) => {
    const resolved = require.resolve(enginePath(file));
    delete require.cache[resolved];
  });
  ENGINE_FILES.forEach((file) => require(enginePath(file)));
  return game;
}

function createState(game, options = {}) {
  const capacity = options.capacity === undefined ? 1000 : options.capacity;
  const civilians = options.civilians === undefined ? 360 : options.civilians;
  const military = options.military === undefined ? 40 : options.military;
  const field = options.field === undefined ? 0 : options.field;
  const training = options.training === undefined ? 0 : options.training;
  const wounded = options.wounded === undefined ? 0 : options.wounded;
  const garrison = military - field - training - wounded;
  const state = game.contracts.createInitialState({
    campaignId: "economy-test",
    seed: options.seed || "economy-test",
    phase: options.phase || "start",
  });
  state.factions.player = {
    resources: {
      food: options.food === undefined ? 0 : options.food,
      coin: options.coin === undefined ? 0 : options.coin,
    },
    crisis: {
      food: options.foodCrisis === undefined ? 0 : options.foodCrisis,
      coin: options.coinCrisis === undefined ? 0 : options.coinCrisis,
    },
    readiness: {
      supply: options.supply === undefined ? 100 : options.supply,
      morale: options.morale === undefined ? 100 : options.morale,
    },
    unlockedUnits: options.unlockedUnits || ["militia"],
    actionPoints: options.actionPoints === undefined ? 0 : options.actionPoints,
  };
  state.provinces.alpha = {
    ownerId: "player",
    population: { capacity, civilians, military },
    units: {
      militia: { field, garrison, training, wounded },
    },
    recruitmentQueue: options.recruitmentQueue || [],
  };
  return state;
}

function action(game, input) {
  return game.contracts.createAction({
    id: input.id,
    type: input.type,
    payload: input.payload,
    expectedPhase: input.expectedPhase === undefined ? "action" : input.expectedPhase,
  });
}

test("population curve is zero at empty/full and peaks at 40 percent", () => {
  const game = loadEngine();
  const config = createBaselineConfig().population;
  const curve = (civilians) => game.population.populationCurve({ capacity: 1000, civilians, military: 0 }, config);
  assert.equal(curve(0), 0);
  assert.equal(curve(200), 0.5);
  assert.equal(curve(400), 1);
  assert.equal(Math.abs(curve(700) - 0.5) < 1e-12, true);
  assert.equal(curve(1000), 0);
});

test("raw population growth peaks at 40 percent within rounding tolerance", () => {
  const game = loadEngine();
  const config = createBaselineConfig().population;
  const factors = { effects: 1, quiz: 1, stability: 1, trait: 1 };
  const at399 = game.population.calculateGrowth({ capacity: 1000, civilians: 399, military: 0 }, factors, config);
  const at400 = game.population.calculateGrowth({ capacity: 1000, civilians: 400, military: 0 }, factors, config);
  const at401 = game.population.calculateGrowth({ capacity: 1000, civilians: 401, military: 0 }, factors, config);
  assert.equal(at400.rawGrowth > at399.rawGrowth, true);
  assert.equal(at400.rawGrowth > at401.rawGrowth, true);
  assert.equal(Math.abs(at400.delta - at399.delta) <= 1, true);
  assert.equal(Math.abs(at400.delta - at401.delta) <= 1, true);
});

test("empty zero-capacity province has safe zero growth and production", () => {
  const game = loadEngine();
  const config = createBaselineConfig();
  const population = { capacity: 0, civilians: 0, military: 0 };
  const growth = game.population.calculateGrowth(population, {}, config.population);
  const production = game.economy.calculateProduction({ population }, {}, config.production);
  assert.equal(growth.delta, 0);
  assert.equal(growth.occupancy, 0);
  assert.equal(growth.mobilization, 0);
  assert.equal(production.food, 0);
  assert.equal(production.coin, 0);
  assert.equal(Number.isNaN(production.productivity), false);
});

test("20-30 percent mobilization materially strains output", () => {
  const game = loadEngine();
  const config = createBaselineConfig().production;
  const produce = (civilians, military) => game.economy.calculateProduction({
    population: { capacity: 1000, civilians, military },
  }, {}, config);
  const civilianEconomy = produce(400, 0);
  const moderate = produce(300, 100);
  const high = produce(200, 200);
  assert.equal(moderate.mobilization, 0.25);
  assert.equal(moderate.food < civilianEconomy.food * 0.75, true);
  assert.equal(moderate.coin < civilianEconomy.coin * 0.75, true);
  assert.equal(high.food < moderate.food, true);
  assert.equal(high.productivity < moderate.productivity, true);
});

test("field army pays the configured upkeep multiplier", () => {
  const game = loadEngine();
  const config = createBaselineConfig().upkeep;
  const garrison = createState(game, { civilians: 300, military: 100 }).provinces.alpha;
  const field = createState(game, { civilians: 300, military: 100, field: 100 }).provinces.alpha;
  const garrisonCost = game.economy.calculateUpkeep(garrison, config);
  const fieldCost = game.economy.calculateUpkeep(field, config);
  assert.equal(garrisonCost.food, 18);
  assert.equal(fieldCost.food, 27);
  assert.equal(fieldCost.rawFood / garrisonCost.rawFood, config.statusMultipliers.field);
});

test("shortage clamps resources and permits desertion only after two turns", () => {
  const game = loadEngine();
  const config = createBaselineConfig().shortage;
  const faction = createState(game).factions.player;
  const first = game.economy.settleUpkeep(faction, { food: 10, coin: 5 }, config);
  assert.deepEqual(first.faction.resources, { coin: 0, food: 0 });
  assert.deepEqual(first.faction.crisis, { coin: 1, food: 1 });
  assert.equal(first.breakdown.desertionRate, 0);
  assert.equal(first.faction.readiness.supply < faction.readiness.supply, true);
  const second = game.economy.settleUpkeep(first.faction, { food: 10, coin: 5 }, config);
  assert.deepEqual(second.faction.crisis, { coin: 2, food: 2 });
  assert.equal(second.breakdown.desertionRate, config.desertionRate);
  const funded = JSON.parse(JSON.stringify(second.faction));
  funded.resources = { food: 20, coin: 20 };
  const recovery = game.economy.settleUpkeep(funded, { food: 10, coin: 5 }, config);
  assert.deepEqual(recovery.faction.crisis, { coin: 0, food: 0 });
  assert.equal(recovery.breakdown.desertionRate, 0);
});

test("shortage rejects malformed state and crisis counter overflow", () => {
  const game = loadEngine();
  const config = createBaselineConfig().shortage;
  assert.throws(() => game.economy.settleUpkeep({}, { food: 1, coin: 1 }, config), /must be objects/);
  const faction = createState(game).factions.player;
  faction.crisis.food = Number.MAX_SAFE_INTEGER;
  assert.throws(
    () => game.economy.settleUpkeep(faction, { food: 1, coin: 0 }, config),
    /safe-integer range/
  );
});

test("desertion converts soldiers to civilians without changing total population", () => {
  const game = loadEngine();
  const config = createBaselineConfig().desertion;
  const province = createState(game, { civilians: 300, military: 100, field: 50 }).provinces.alpha;
  const before = province.population.civilians + province.population.military;
  const result = game.economy.applyDesertion(province, 0.05, config);
  assert.equal(result.breakdown.deserters, 5);
  assert.equal(result.province.population.civilians, 305);
  assert.equal(result.province.population.military, 95);
  assert.equal(result.province.population.civilians + result.province.population.military, before);
  assert.equal(game.economy.countMilitary(result.province.units), 95);
});

test("recruitment conserves population and completes after one turn", () => {
  const game = loadEngine();
  const config = createBaselineConfig().recruitment;
  const state = createState(game, { phase: "action", food: 100, coin: 100, actionPoints: 2 });
  const before = state.provinces.alpha.population.civilians + state.provinces.alpha.population.military;
  const queued = game.recruitment.queueRecruitment(
    state.provinces.alpha,
    state.factions.player,
    { actionId: "recruit-1", unitId: "militia", count: 20 },
    { phase: "action", factionId: "player", provinceId: "alpha" },
    config
  );
  assert.equal(queued.ok, true, serialize(queued.errors));
  assert.equal(queued.province.population.civilians, 340);
  assert.equal(queued.province.population.military, 60);
  assert.equal(queued.province.units.militia.training, 20);
  assert.equal(queued.province.population.civilians + queued.province.population.military, before);
  assert.deepEqual(queued.faction.resources, { coin: 97, food: 92 });
  assert.equal(queued.faction.actionPoints, 1);
  const completed = game.recruitment.processRecruitmentQueue(queued.province);
  assert.equal(completed.province.recruitmentQueue.length, 0);
  assert.equal(completed.province.units.militia.training, 0);
  assert.equal(completed.province.units.militia.garrison, 60);
  assert.equal(completed.events[0].type, "RECRUITMENT_COMPLETED");
});

test("recruitment rejects wrong phase, locked units, and invalid counts", () => {
  const game = loadEngine();
  const config = createBaselineConfig().recruitment;
  const state = createState(game, { phase: "action", food: 1000, coin: 1000, actionPoints: 2 });
  const request = { actionId: "recruit-invalid", unitId: "infantry", count: 500 };
  const result = game.recruitment.queueRecruitment(
    state.provinces.alpha,
    state.factions.player,
    request,
    { phase: "quiz", factionId: "player", provinceId: "alpha" },
    config
  );
  const codes = new Set(result.errors.map((item) => item.code));
  assert.equal(result.ok, false);
  assert.equal(codes.has("RECRUIT_PHASE"), true);
  assert.equal(codes.has("RECRUIT_UNIT_LOCKED"), true);
  assert.equal(codes.has("RECRUIT_CIVILIANS"), true);
  assert.equal(result.province, state.provinces.alpha);
  assert.equal(result.faction, state.factions.player);
});

test("unit unlock validates turn, territory, prerequisites, coin, and action points", () => {
  const game = loadEngine();
  const config = createBaselineConfig().recruitment;
  const faction = createState(game, { coin: 100, actionPoints: 2 }).factions.player;
  const unlocked = game.recruitment.unlockUnit(
    faction,
    { actionId: "unlock-1", unitId: "infantry" },
    { phase: "action", turn: 3, ownedProvinceCount: 1, factionId: "player" },
    config
  );
  assert.equal(unlocked.ok, true, serialize(unlocked.errors));
  assert.deepEqual(unlocked.faction.unlockedUnits, ["infantry", "militia"]);
  assert.equal(unlocked.faction.resources.coin, 0);
  assert.equal(unlocked.faction.actionPoints, 1);
  const tooEarly = game.recruitment.unlockUnit(
    faction,
    { actionId: "unlock-2", unitId: "archer" },
    { phase: "action", turn: 1, ownedProvinceCount: 1, factionId: "player" },
    config
  );
  const codes = new Set(tooEarly.errors.map((item) => item.code));
  assert.equal(codes.has("UNLOCK_TURN"), true);
  assert.equal(codes.has("UNLOCK_PROVINCES"), true);
  assert.equal(codes.has("UNLOCK_PREREQUISITE"), true);
  assert.equal(codes.has("UNLOCK_COIN"), true);
});

test("unit unlock rejects definitions without recruitment costs", () => {
  const game = loadEngine();
  const config = createBaselineConfig().recruitment;
  delete config.unitCosts.infantry;
  const faction = createState(game, { coin: 100, actionPoints: 2 }).factions.player;
  const result = game.recruitment.unlockUnit(
    faction,
    { actionId: "unlock-missing-cost", unitId: "infantry" },
    { phase: "action", turn: 3, ownedProvinceCount: 1, factionId: "player" },
    config
  );
  assert.equal(result.ok, false);
  assert.equal(result.errors.some((item) => item.code === "UNLOCK_UNIT_UNKNOWN"), true);
});

test("recruitment handlers commit through deterministic runtime", () => {
  const game = loadEngine();
  const config = createBaselineConfig();
  const runtime = game.runtime.createRuntime({ handlers: game.recruitment.createHandlers(config.recruitment) });
  const state = createState(game, { phase: "action", food: 100, coin: 100, actionPoints: 2 });
  const result = runtime.dispatch(state, action(game, {
    id: "runtime-recruit-1",
    type: "RECRUIT_UNITS",
    payload: { factionId: "player", provinceId: "alpha", unitId: "militia", count: 10 },
  }));
  assert.equal(result.ok, true, serialize(result.errors));
  assert.equal(result.state.provinces.alpha.population.civilians, 350);
  assert.equal(result.state.provinces.alpha.population.military, 50);
  assert.equal(result.events[0].type, "RECRUITMENT_QUEUED");
  assert.equal(state.provinces.alpha.population.civilians, 360);
});

test("failed recruitment handler rolls back the complete action", () => {
  const game = loadEngine();
  const config = createBaselineConfig();
  const runtime = game.runtime.createRuntime({ handlers: game.recruitment.createHandlers(config.recruitment) });
  const state = createState(game, { phase: "action", food: 0, coin: 0, actionPoints: 2 });
  const before = serialize(state);
  const result = runtime.dispatch(state, action(game, {
    id: "runtime-recruit-fail",
    type: "RECRUIT_UNITS",
    payload: { factionId: "player", provinceId: "alpha", unitId: "militia", count: 10 },
  }));
  assert.equal(result.ok, false);
  assert.equal(result.errors[0].code, "HANDLER_EXCEPTION");
  assert.equal(result.state, state);
  assert.equal(serialize(state), before);
});

test("first zero-stock turn produces before upkeep and avoids deadlock", () => {
  const game = loadEngine();
  const config = createBaselineConfig();
  const state = createState(game, { phase: "start", food: 0, coin: 0, actionPoints: 0 });
  const result = game["turn-economy"].startTurn(state, {}, config.turn);
  assert.equal(result.state.phase, "action");
  assert.equal(result.state.factions.player.actionPoints, 2);
  assert.equal(result.report.factions.player.production.food > result.report.factions.player.upkeep.food, true);
  assert.equal(result.report.factions.player.production.coin > result.report.factions.player.upkeep.coin, true);
  assert.equal(result.state.factions.player.resources.food > 0, true);
  assert.equal(result.state.factions.player.resources.coin > 0, true);
  assert.deepEqual(result.state.factions.player.crisis, { coin: 0, food: 0 });
  assert.equal(state.factions.player.resources.food, 0);
});

test("training completes before upkeep is calculated", () => {
  const game = loadEngine();
  const config = createBaselineConfig();
  const state = createState(game, {
    phase: "start",
    civilians: 360,
    military: 40,
    training: 20,
    food: 100,
    coin: 100,
    recruitmentQueue: [{ id: "queued-1", unitId: "militia", count: 20, remainingTurns: 1 }],
  });
  const result = game["turn-economy"].startTurn(state, {}, config.turn);
  assert.equal(result.state.provinces.alpha.units.militia.training, 0);
  assert.equal(result.state.provinces.alpha.units.militia.garrison, 40);
  assert.equal(result.report.provinces.alpha.upkeep.rawFood, 40 * config.upkeep.unitUpkeep.militia.food);
  assert.equal(result.events.some((event) => event.type === "RECRUITMENT_COMPLETED"), true);
});

test("over-40-percent mobilization triggers sustained crisis and self-correction", () => {
  const game = loadEngine();
  const config = createBaselineConfig();
  let state = createState(game, {
    phase: "start",
    civilians: 180,
    military: 220,
    field: 150,
    food: 0,
    coin: 0,
  });
  const initialMilitary = state.provinces.alpha.population.military;
  let sawDesertion = false;
  for (let turn = 0; turn < 6; turn += 1) {
    state.phase = "start";
    const result = game["turn-economy"].startTurn(state, {}, config.turn);
    state = result.state;
    sawDesertion ||= result.report.factions.player.deserters > 0;
  }
  assert.equal(sawDesertion, true);
  assert.equal(state.provinces.alpha.population.military < initialMilitary, true);
  assert.equal(state.factions.player.readiness.supply < 100, true);
  assert.equal(state.provinces.alpha.population.civilians + state.provinces.alpha.population.military <= 1000, true);
});

test("production coefficients are injected rather than embedded", () => {
  const game = loadEngine();
  const config = createBaselineConfig();
  const province = createState(game, { civilians: 400, military: 0 }).provinces.alpha;
  const baseline = game.economy.calculateProduction(province, {}, config.production);
  const doubledConfig = { ...config.production, foodPerCivilian: config.production.foodPerCivilian * 2 };
  const doubled = game.economy.calculateProduction(province, {}, doubledConfig);
  assert.equal(doubled.food, baseline.food * 2);
  assert.equal(doubled.coin, baseline.coin);
});

test("turn economy handler advances through Phase 01 runtime", () => {
  const game = loadEngine();
  const config = createBaselineConfig();
  const runtime = game.runtime.createRuntime({ handlers: game["turn-economy"].createHandlers(config.turn) });
  const state = createState(game, { phase: "start" });
  const result = runtime.dispatch(state, action(game, {
    id: "start-economy-1",
    type: "START_TURN_ECONOMY",
    payload: {},
    expectedPhase: "start",
  }));
  assert.equal(result.ok, true, serialize(result.errors));
  assert.equal(result.state.phase, "action");
  assert.equal(result.events.some((event) => event.type === "TURN_ECONOMY_COMPLETED"), true);
  assert.equal(game.invariants.validateState(result.state).length, 0);
});

test("browser and Node engine modules produce equivalent calculations", () => {
  const nodeGame = loadEngine();
  const config = createBaselineConfig();
  const nodeResult = nodeGame.population.calculateGrowth(
    { capacity: 1000, civilians: 360, military: 40 },
    { effects: 1.1, quiz: 1, stability: 0.9, trait: 1.08 },
    config.population
  );
  const context = vm.createContext({ configJson: JSON.stringify(config.population) });
  CORE_FILES.forEach((file) => {
    vm.runInContext(fs.readFileSync(corePath(file), "utf8"), context, { filename: file });
  });
  ENGINE_FILES.forEach((file) => {
    vm.runInContext(fs.readFileSync(enginePath(file), "utf8"), context, { filename: file });
  });
  vm.runInContext(`
    resultJson = JSON.stringify(MLN222Game.population.calculateGrowth(
      { capacity: 1000, civilians: 360, military: 40 },
      { effects: 1.1, quiz: 1, stability: 0.9, trait: 1.08 },
      JSON.parse(configJson)
    ));
  `, context);
  assert.equal(context.resultJson, JSON.stringify(nodeResult));
});

test("economy engine source avoids nondeterministic and browser APIs", () => {
  const forbidden = [
    /Math\.random/,
    /Date\.now/,
    /\bdocument\b/,
    /\bwindow\b/,
    /\blocalStorage\b/,
    /\bsessionStorage\b/,
  ];
  ENGINE_FILES.forEach((file) => {
    const source = fs.readFileSync(enginePath(file), "utf8");
    forbidden.forEach((pattern) => assert.equal(pattern.test(source), false, `${file} contains ${pattern}`));
  });
});

test("100,000 generated economy transitions preserve all invariants", { timeout: 120000 }, () => {
  const summary = runSimulation({ runs: 100000, seed: "economy-fuzz-test", assert: true });
  assert.equal(summary.runs, 100000);
  assert.equal(summary.shortages > 0, true);
  assert.equal(summary.desertionTransitions > 0, true);
  assert.equal(summary.totalFoodProduced > 0, true);
  assert.equal(summary.totalCoinProduced > 0, true);
});

test("economy simulation is deterministic for the same seed", () => {
  const first = runSimulation({ runs: 1000, seed: "economy-repeat", assert: true });
  const second = runSimulation({ runs: 1000, seed: "economy-repeat", assert: true });
  assert.deepEqual(second, first);
});
