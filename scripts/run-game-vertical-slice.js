"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { createBaselineConfig } = require("./simulate-economy.js");
const { createBaselineCombatConfig } = require("./simulate-combat.js");

const ROOT = path.resolve(__dirname, "..");
const MODULES = [
  "game/core/namespace.js",
  "game/core/rng.js",
  "game/core/contracts.js",
  "game/core/invariants.js",
  "game/core/runtime.js",
  "game/engine/population.js",
  "game/engine/economy.js",
  "game/engine/recruitment.js",
  "game/engine/turn-economy.js",
  "game/engine/combat-tactics.js",
  "game/engine/combat-casualties.js",
  "game/engine/combat.js",
  "game/quiz/question-deck.js",
  "game/quiz/quiz-rewards.js",
  "game/storage/save-validation.js",
  "game/storage/save-codec.js",
  "game/scenarios/vertical-slice.js",
];

function loadGame() {
  delete globalThis.MLN222Game;
  MODULES.forEach((relative) => {
    const resolved = require.resolve(path.join(ROOT, relative));
    delete require.cache[resolved];
    require(resolved);
  });
  return globalThis.MLN222Game;
}

function quizRewardConfig() {
  return {
    penalty: {
      low: { stockRate: 0.1, productionCapRate: 0.5, productionEffectRate: 0.1, duration: 1 },
      medium: { stockRate: 0.05, productionCapRate: 0.25, productionEffectRate: 0, duration: 1 },
    },
    reward: {
      smallProductionRate: 0.25,
      mediumProductionRate: 0.5,
      perfectProductionRate: 1,
      migrationRate: 0.005,
      productionEffectRate: 0.1,
      effectDuration: 2,
      unlockDiscountRate: 0.25,
    },
  };
}

function createFixtureOptions(overrides = {}) {
  const economy = createBaselineConfig();
  const provinceData = JSON.parse(fs.readFileSync(path.join(ROOT, "game/data/provinces.json"), "utf8"));
  const adjacencyData = JSON.parse(fs.readFileSync(path.join(ROOT, "game/data/adjacency.json"), "utf8"));
  return {
    campaignId: overrides.campaignId || "vertical-slice",
    seed: overrides.seed || "vertical-slice-seed",
    questions: JSON.parse(fs.readFileSync(path.join(ROOT, "questions.json"), "utf8")),
    provinces: provinceData.provinces,
    adjacency: adjacencyData.neighbors,
    config: {
      economy: economy.turn,
      recruitment: economy.recruitment,
      combat: createBaselineCombatConfig(),
      quizRewards: quizRewardConfig(),
      quizProduction: { food: 100, coin: 40 },
      maxScriptedTradeCoin: 100,
    },
  };
}

function eventCount(state, type) {
  return state.eventLog.filter((event) => event.type === type).length;
}

function runAcceptance(options = createFixtureOptions()) {
  const game = loadGame();
  const uninterrupted = game["vertical-slice"].runVerticalSlice(options, { resume: false });
  const resumed = game["vertical-slice"].runVerticalSlice(options, { resume: true });
  const uninterruptedRaw = game["save-codec"].encodeSave(uninterrupted.state);
  const resumedRaw = game["save-codec"].encodeSave(resumed.state);
  const battle = uninterrupted.state.battles["battle-bac-ninh"];
  const validationErrors = game.invariants.validateState(uninterrupted.state)
    .concat(game.combat.createInvariant(options.config.combat)(uninterrupted.state));
  const questionIds = uninterrupted.state.quiz.completedTurns.flatMap((entry) => entry.questionIds);
  return {
    uninterrupted,
    resumed,
    metrics: {
      strategicTurns: uninterrupted.state.turn - 1,
      quizzesCompleted: uninterrupted.state.quiz.completedTurns.length,
      quizQuestions: questionIds.length,
      uniqueQuizQuestions: new Set(questionIds).size,
      battleStatus: battle.status,
      battleDuration: battle.turn,
      recruitmentCompleted: eventCount(uninterrupted.state, "RECRUITMENT_COMPLETED"),
      tradeSettled: eventCount(uninterrupted.state, "TRADE_SETTLED"),
      reinforcementArrived: eventCount(uninterrupted.state, "BATTLE_REINFORCEMENT_ARRIVED"),
      saveCheckpoints: uninterrupted.saveCheckpoints,
      stateEquivalentAfterResume: uninterruptedRaw === resumedRaw,
      validationErrors,
      finalOwner: uninterrupted.state.provinces["bac-ninh"].ownerId,
    },
  };
}

if (require.main === module) {
  try {
    const result = runAcceptance();
    process.stdout.write(`${JSON.stringify({ metrics: result.metrics, turns: result.uninterrupted.summaries }, null, 2)}\n`);
    if (
      result.metrics.strategicTurns < 8 ||
      result.metrics.quizzesCompleted !== 8 ||
      result.metrics.quizQuestions !== 80 ||
      result.metrics.battleDuration < 3 ||
      result.metrics.battleDuration > 7 ||
      result.metrics.recruitmentCompleted < 1 ||
      result.metrics.tradeSettled < 1 ||
      result.metrics.reinforcementArrived < 1 ||
      !result.metrics.stateEquivalentAfterResume ||
      result.metrics.validationErrors.length > 0
    ) {
      process.exitCode = 1;
    }
  } catch (error) {
    process.stderr.write(`${error.stack || error.message}\n`);
    process.exitCode = 1;
  }
}

module.exports = { ROOT, MODULES, loadGame, quizRewardConfig, createFixtureOptions, runAcceptance };
