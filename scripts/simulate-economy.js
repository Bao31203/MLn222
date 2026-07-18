"use strict";

const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const CORE_FILES = ["namespace.js", "rng.js", "contracts.js", "invariants.js", "runtime.js"];
const ENGINE_FILES = ["population.js", "economy.js", "recruitment.js", "turn-economy.js"];

function loadGame() {
  if (!globalThis.MLN222Game) {
    CORE_FILES.forEach((file) => require(path.join(ROOT, "game", "core", file)));
  }
  ENGINE_FILES.forEach((file) => {
    const name = file.replace(/\.js$/, "");
    if (!globalThis.MLN222Game.hasModule(name)) {
      require(path.join(ROOT, "game", "engine", file));
    }
  });
  return globalThis.MLN222Game;
}

function createBaselineConfig() {
  const population = {
    peakOccupancy: 0.4,
    baseGrowthRate: 0.025,
    militaryPenalty: 1.25,
    minimumMilitaryFactor: 0.25,
    roundingMode: "floor",
  };
  const production = {
    foodPerCivilian: 0.08,
    coinPerCivilian: 0.035,
    mobilizationPenalty: 0.75,
    minimumProductivity: 0.35,
    roundingMode: "floor",
  };
  const upkeep = {
    unitUpkeep: {
      militia: { food: 0.18, coin: 0.05 },
      infantry: { food: 0.22, coin: 0.09 },
      archer: { food: 0.2, coin: 0.12 },
      cavalry: { food: 0.32, coin: 0.2 },
      engineer: { food: 0.25, coin: 0.18 },
    },
    statusMultipliers: { field: 1.5, garrison: 1, training: 0.5, wounded: 0.65 },
    roundingMode: "ceil",
  };
  const shortage = {
    supplyPenaltyAtFullShortage: 24,
    moralePenaltyAtFullShortage: 18,
    supplyRecovery: 4,
    moraleRecovery: 3,
    readinessMinimum: 0,
    readinessMaximum: 100,
    desertionAfterTurns: 2,
    desertionRate: 0.05,
    penaltyRoundingMode: "ceil",
    readinessRoundingMode: "round",
  };
  const desertion = {
    statuses: ["field", "garrison"],
    minimumDeserters: 1,
    roundingMode: "floor",
  };
  const recruitment = {
    actionPhase: "action",
    maxBatchSize: 500,
    trainingTurns: 1,
    actionPointCost: 1,
    costRoundingMode: "ceil",
    unitCosts: {
      militia: { food: 0.4, coin: 0.12 },
      infantry: { food: 0.55, coin: 0.3 },
      archer: { food: 0.5, coin: 0.38 },
      cavalry: { food: 0.75, coin: 0.6 },
      engineer: { food: 0.65, coin: 0.55 },
    },
    unlocks: {
      infantry: { coinCost: 100, actionPointCost: 1, minTurn: 3, minProvinces: 1, prerequisites: ["militia"] },
      archer: { coinCost: 180, actionPointCost: 1, minTurn: 5, minProvinces: 2, prerequisites: ["infantry"] },
      cavalry: { coinCost: 320, actionPointCost: 1, minTurn: 8, minProvinces: 3, prerequisites: ["infantry"] },
      engineer: { coinCost: 300, actionPointCost: 1, minTurn: 8, minProvinces: 3, prerequisites: ["infantry"] },
    },
  };
  return {
    population,
    production,
    upkeep,
    shortage,
    desertion,
    recruitment,
    turn: {
      startPhase: "start",
      actionPhase: "action",
      actionPointsPerTurn: 2,
      population,
      production,
      upkeep,
      shortage,
      desertion,
    },
  };
}

function createDraw(game, seed) {
  let state = game.rng.createRngState(seed);
  return function draw(minimum, maximum) {
    const result = game.rng.nextInt(state, "events", minimum, maximum);
    state = result.state;
    return result.value;
  };
}

function assertTransition(game, state) {
  const invariantErrors = game.invariants.validateState(state);
  if (invariantErrors.length > 0) {
    throw new Error(`${invariantErrors[0].code}: ${invariantErrors[0].path}`);
  }
  Object.values(state.factions).forEach((faction) => {
    [faction.resources.food, faction.resources.coin].forEach((value) => {
      if (!Number.isSafeInteger(value) || value < 0) {
        throw new Error("Simulation produced an invalid resource value.");
      }
    });
  });
  Object.values(state.provinces).forEach((province) => {
    const population = province.population;
    if (
      !Number.isSafeInteger(population.civilians) ||
      !Number.isSafeInteger(population.military) ||
      population.civilians < 0 ||
      population.military < 0 ||
      population.civilians + population.military > population.capacity ||
      game.economy.countMilitary(province.units) !== population.military
    ) {
      throw new Error("Simulation produced an invalid population value.");
    }
  });
}

function runSimulation(options = {}) {
  const game = loadGame();
  const runs = options.runs === undefined ? 100000 : options.runs;
  const seed = options.seed === undefined ? "economy-fuzz-v1" : options.seed;
  const shouldAssert = options.assert !== false;
  if (!Number.isSafeInteger(runs) || runs < 1) {
    throw new RangeError("Simulation runs must be a positive safe integer.");
  }
  const config = createBaselineConfig();
  const draw = createDraw(game, seed);
  const template = game.contracts.createInitialState({
    campaignId: "economy-fuzz",
    seed: "economy-state",
    phase: "start",
  });
  const summary = {
    runs,
    seed,
    shortages: 0,
    desertionTransitions: 0,
    totalFoodProduced: 0,
    totalCoinProduced: 0,
    maximumPopulation: 0,
  };

  for (let index = 0; index < runs; index += 1) {
    const capacity = draw(1, 3000);
    const military = draw(0, capacity);
    const civilians = draw(0, capacity - military);
    const field = draw(0, military);
    const crisisTurns = draw(0, 1);
    const state = game.contracts.cloneGameState(template);
    state.factions.player = {
      resources: { food: draw(0, 600), coin: draw(0, 350) },
      crisis: { food: crisisTurns, coin: draw(0, 1) },
      readiness: { supply: draw(35, 100), morale: draw(35, 100) },
      unlockedUnits: ["militia"],
      actionPoints: 0,
    };
    state.provinces.alpha = {
      ownerId: "player",
      population: { capacity, civilians, military },
      units: {
        militia: {
          field,
          garrison: military - field,
          training: 0,
          wounded: 0,
        },
      },
      recruitmentQueue: [],
    };
    const factor = () => draw(85, 115) / 100;
    const result = game["turn-economy"].startTurn(state, {
      provinceFactors: {
        alpha: {
          growth: { effects: factor(), quiz: factor(), stability: factor(), trait: factor() },
          production: {
            agriculture: factor(),
            coinEffects: factor(),
            commerce: factor(),
            foodEffects: factor(),
            quiz: factor(),
            stability: factor(),
          },
        },
      },
      tradeCoinByFaction: { player: draw(0, 20) },
    }, config.turn);
    if (shouldAssert) {
      assertTransition(game, result.state);
    }
    const factionReport = result.report.factions.player;
    summary.totalFoodProduced += factionReport.production.food;
    summary.totalCoinProduced += factionReport.production.coin;
    if (factionReport.shortage.shortage.food > 0 || factionReport.shortage.shortage.coin > 0) {
      summary.shortages += 1;
    }
    if (factionReport.deserters > 0) {
      summary.desertionTransitions += 1;
    }
    const nextPopulation = result.state.provinces.alpha.population;
    summary.maximumPopulation = Math.max(
      summary.maximumPopulation,
      nextPopulation.civilians + nextPopulation.military
    );
  }
  return summary;
}

function parseArguments(argv) {
  const options = {};
  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === "--runs") {
      options.runs = Number(argv[++index]);
    } else if (argv[index] === "--seed") {
      options.seed = argv[++index];
    } else if (argv[index] === "--assert") {
      options.assert = true;
    } else {
      throw new Error(`Unknown argument: ${argv[index]}`);
    }
  }
  return options;
}

if (require.main === module) {
  const started = process.hrtime.bigint();
  const summary = runSimulation(parseArguments(process.argv.slice(2)));
  const durationMs = Number(process.hrtime.bigint() - started) / 1000000;
  console.log("Economy simulation passed.");
  console.log(`- Transitions: ${summary.runs}`);
  console.log(`- Shortages: ${summary.shortages}`);
  console.log(`- Desertion transitions: ${summary.desertionTransitions}`);
  console.log(`- Duration: ${durationMs.toFixed(2)} ms`);
}

module.exports = {
  createBaselineConfig,
  loadGame,
  runSimulation,
};
