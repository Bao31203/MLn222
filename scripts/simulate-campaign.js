"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const STANDARD_MIN_WIN_RATE = 0.6;
const MODULES = [
  "game/core/namespace.js", "game/core/rng.js", "game/core/contracts.js", "game/core/invariants.js", "game/core/runtime.js",
  "game/engine/population.js", "game/engine/economy.js", "game/engine/recruitment.js", "game/engine/turn-economy.js",
  "game/engine/combat-tactics.js", "game/engine/combat-casualties.js", "game/engine/combat.js",
  "game/quiz/quiz-rewards.js", "game/storage/save-validation.js", "game/storage/save-codec.js",
  "game/engine/diplomacy.js", "game/engine/occupation.js", "game/engine/npc-ai.js", "game/engine/campaign.js",
  "game/sim/benchmark-policies.js", "game/storage/campaign-save.js",
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

function loadDependencies() {
  const read = (relative) => JSON.parse(fs.readFileSync(path.join(ROOT, relative), "utf8"));
  const provinceData = read("game/data/provinces.json");
  const personalityData = read("game/data/npc-personalities.json");
  return {
    provinces: provinceData.provinces,
    adjacency: read("game/data/adjacency.json").neighbors,
    balance: read("game/data/balance.json"),
    personalities: personalityData.personalities,
    victoryRules: read("game/data/victory-rules.json"),
  };
}

function median(values) {
  if (values.length === 0) return null;
  const sorted = values.slice().sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

function percentile(values, fraction) {
  if (values.length === 0) return null;
  const sorted = values.slice().sort((left, right) => left - right);
  return sorted[Math.min(sorted.length - 1, Math.ceil(sorted.length * fraction) - 1)];
}

function policyFor(index) {
  const variants = [
    { policy: "expansionist", quiz: "proficient", standard: true, referenceProvinceId: "da-nang" },
    { policy: "balanced", quiz: "mastery", standard: false },
    { policy: "steward", quiz: "developing", standard: false },
  ];
  return variants[index % variants.length];
}

function createQuizProof(turn, score, factionId = "player") {
  if (!Number.isSafeInteger(turn) || turn < 1 || !Number.isSafeInteger(score) || score < 0 || score > 10 || typeof factionId !== "string" || factionId.length < 1) {
    throw new RangeError("Benchmark quiz proof fields are invalid.");
  }
  const questionIds = Array.from({ length: 10 }, (_value, index) => `benchmark-question-${index + 1}`);
  return {
    turn,
    factionId,
    quiz: {
      id: `benchmark-quiz-${turn}-${factionId}`,
      questionIds,
      position: 10,
      answers: Object.fromEntries(questionIds.map((questionId) => [questionId, 0])),
      score,
      completed: true,
    },
  };
}

function runCampaign(game, deps, options, index) {
  const profile = policyFor(index);
  const provinceIds = deps.provinces.map((province) => province.id).sort();
  let state = game.campaign.createCampaign({
    campaignId: `benchmark-${index}`,
    seed: `${options.seed}-${index}`,
    playerProvinceId: options.playerProvinceId || profile.referenceProvinceId || provinceIds[index % provinceIds.length],
  }, deps);
  const startProvinceId = game.campaign.ownedProvinceIds(state, "player")[0];
  const turnDurations = [];
  let actionErrors = 0;
  const invalidDecisions = [];
  let invariantFailures = 0;
  const invariantSamples = [];
  let warnings = 0;
  let battles = 0;
  let warBeforeTurn4 = 0;
  let warningViolations = 0;
  const actionCounts = {};
  let playerCaptures = 0;
  let playerLosses = 0;
  let lastProvinceCount = 1;
  let unchangedTurns = 0;
  let maximumUnchangedTurns = 0;
  let outcome = { status: "active" };
  for (let turnIndex = 0; turnIndex < options.turns && state.phase !== "complete"; turnIndex += 1) {
    const started = process.hrtime.bigint();
    const prepared = game.campaign.prepareCampaignTurn(state, deps);
    const actions = game["benchmark-policies"].chooseActions(prepared.state, profile.policy, deps, "player");
    actions.forEach((action) => { actionCounts[action.type] = (actionCounts[action.type] || 0) + 1; });
    const result = game.campaign.completeCampaignTurn(prepared.state, {
      playerFactionId: "player",
      playerActions: actions,
      quizProof: createQuizProof(prepared.state.turn, game["benchmark-policies"].quizScore(profile.quiz), "player"),
      quizChoice: turnIndex % 2 === 0 ? "food" : "coin",
    }, deps);
    result.events = prepared.events.concat(result.events);
    turnDurations.push(Number(process.hrtime.bigint() - started) / 1e6);
    state = result.state;
    outcome = result.outcome;
    actionErrors += result.actionErrors;
    invalidDecisions.push(...result.invalidDecisions);
    result.events.forEach((event) => {
      if (event.type === "ATTACK_WARNING_CREATED") warnings += 1;
      if (event.type === "BATTLE_STARTED") {
        battles += 1;
        if (event.payload.warningId === undefined) warningViolations += 1;
        if (state.turn - 1 <= deps.balance.campaign.noWarThroughTurn) warBeforeTurn4 += 1;
      }
      if (event.type === "PROVINCE_CAPTURED" && event.payload.newOwnerId === "player") playerCaptures += 1;
      if (event.type === "PROVINCE_CAPTURED" && event.payload.previousOwnerId === "player") playerLosses += 1;
    });
    const errors = game.invariants.validateState(state).concat(game.campaign.validateCampaignState(state, deps));
    invariantFailures += errors.length;
    errors.slice(0, 5).forEach((error) => {
      if (invariantSamples.length < 20) invariantSamples.push({ turn: state.turn - 1, code: error.code, path: error.path, message: error.message });
    });
    const count = game.campaign.ownedProvinceIds(state, "player").length;
    if (count === lastProvinceCount) unchangedTurns += 1;
    else { unchangedTurns = 0; lastProvinceCount = count; }
    maximumUnchangedTurns = Math.max(maximumUnchangedTurns, unchangedTurns);
  }
  const points = game.campaign.territoryPointsByFaction(state, deps);
  const totalPoints = Object.values(points).reduce((sum, value) => sum + value, 0);
  const concentration = Math.max(...Object.values(points)) / totalPoints;
  return {
    profile,
    startProvinceId,
    finalTurn: state.turn - 1,
    outcome: outcome.status,
    outcomeDetails: outcome,
    victoryTurn: outcome.status === "victory" ? state.turn - 1 : null,
    provinceCount: game.campaign.ownedProvinceIds(state, "player").length,
    concentration,
    actionErrors,
    invalidDecisions,
    invariantFailures,
    invariantSamples,
    warnings,
    battles,
    warBeforeTurn4,
    warningViolations,
    actionCounts,
    playerCaptures,
    playerLosses,
    maximumUnchangedTurns,
    turnDurations,
  };
}

function runSimulation(options = {}) {
  const game = loadGame();
  const deps = options.dependencies || loadDependencies();
  const runs = options.runs === undefined ? 1000 : options.runs;
  const turns = options.turns === undefined ? 60 : options.turns;
  const seed = options.seed || "campaign-held-out";
  if (!Number.isSafeInteger(runs) || runs < 1 || !Number.isSafeInteger(turns) || turns < 1) throw new RangeError("Campaign run and turn counts must be positive integers.");
  const campaigns = [];
  const allTurnDurations = [];
  const started = process.hrtime.bigint();
  for (let index = 0; index < runs; index += 1) {
    const campaign = runCampaign(game, deps, { turns, seed }, index);
    campaigns.push(campaign);
    allTurnDurations.push(...campaign.turnDurations);
  }
  const standard = campaigns.filter((campaign) => campaign.profile.standard);
  const standardWins = standard.filter((campaign) => campaign.victoryTurn !== null);
  const allWins = campaigns.filter((campaign) => campaign.victoryTurn !== null);
  const metrics = {
    runs,
    turns,
    seed,
    seedPartition: seed === "campaign-held-out" ? "held-out" : "custom",
    durationMs: Number(process.hrtime.bigint() - started) / 1e6,
    p95TurnMs: percentile(allTurnDurations, 0.95),
    maximumTurnMs: Math.max(...allTurnDurations),
    victories: allWins.length,
    defeats: campaigns.filter((campaign) => campaign.outcome === "defeat").length,
    unfinished: campaigns.filter((campaign) => campaign.outcome === "active").length,
    medianVictoryTurn: median(allWins.map((campaign) => campaign.victoryTurn)),
    earlyWinRate: allWins.filter((campaign) => campaign.victoryTurn < 30).length / runs,
    standard: {
      campaigns: standard.length,
      victories: standardWins.length,
      winRate: standardWins.length / standard.length,
      medianVictoryTurn: median(standardWins.map((campaign) => campaign.victoryTurn)),
      earlyWinRate: standardWins.filter((campaign) => campaign.victoryTurn < 30).length / standard.length,
      referenceProvinceId: standard.length > 0 ? standard[0].startProvinceId : null,
    },
    invalidActions: campaigns.reduce((sum, campaign) => sum + campaign.actionErrors, 0),
    invalidDecisionSamples: campaigns.flatMap((campaign) => campaign.invalidDecisions).slice(0, 20),
    invariantFailures: campaigns.reduce((sum, campaign) => sum + campaign.invariantFailures, 0),
    invariantFailureSamples: campaigns.flatMap((campaign) => campaign.invariantSamples).slice(0, 20),
    warnings: campaigns.reduce((sum, campaign) => sum + campaign.warnings, 0),
    battles: campaigns.reduce((sum, campaign) => sum + campaign.battles, 0),
    warBeforeTurn4: campaigns.reduce((sum, campaign) => sum + campaign.warBeforeTurn4, 0),
    warningViolations: campaigns.reduce((sum, campaign) => sum + campaign.warningViolations, 0),
    medianConcentration: median(campaigns.map((campaign) => campaign.concentration)),
    p95StallTurns: percentile(campaigns.map((campaign) => campaign.maximumUnchangedTurns), 0.95),
    playerActions: campaigns.reduce((totals, campaign) => {
      Object.entries(campaign.actionCounts).forEach(([type, count]) => { totals[type] = (totals[type] || 0) + count; });
      return totals;
    }, {}),
    playerCaptures: campaigns.reduce((sum, campaign) => sum + campaign.playerCaptures, 0),
    playerLosses: campaigns.reduce((sum, campaign) => sum + campaign.playerLosses, 0),
    policies: Object.fromEntries(game["benchmark-policies"].POLICY_IDS.map((policy) => {
      const subset = campaigns.filter((campaign) => campaign.profile.policy === policy);
      return [policy, {
        campaigns: subset.length,
        victories: subset.filter((campaign) => campaign.victoryTurn !== null).length,
        medianVictoryTurn: median(subset.filter((campaign) => campaign.victoryTurn !== null).map((campaign) => campaign.victoryTurn)),
        medianProvinces: median(subset.map((campaign) => campaign.provinceCount)),
      }];
    })),
  };
  if (options.assert) assertSimulationMetrics(metrics);
  return metrics;
}

function assertSimulationMetrics(metrics) {
  const standardWinRate = metrics.standard.victories / metrics.standard.campaigns;
  assert.equal(metrics.invalidActions, 0, "Campaign AI and benchmark policies must only emit valid actions.");
  assert.equal(metrics.invariantFailures, 0, "Campaign transitions must preserve all invariants.");
  assert.equal(metrics.warBeforeTurn4, 0, "NPC wars are forbidden during turns 1-3.");
  assert.equal(metrics.warningViolations, 0, "Every battle must have a previous warning.");
  assert.ok(metrics.p95TurnMs < 100, "P95 campaign turn time must remain under 100 ms.");
  assert.ok(metrics.standard.campaigns > 0 && standardWinRate >= STANDARD_MIN_WIN_RATE, "At least 60% of standard benchmark campaigns must reach victory.");
  assert.ok(metrics.standard.medianVictoryTurn >= 45 && metrics.standard.medianVictoryTurn <= 60, "Standard benchmark median victory must be turn 45-60.");
  assert.ok(metrics.standard.earlyWinRate < 0.05, "Fewer than 5% of standard wins may occur before turn 30.");
}

function parseArguments(argv) {
  const options = { runs: 1000, turns: 60, seed: "campaign-held-out", assert: false, output: null };
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--runs") options.runs = Number(argv[++index]);
    else if (value === "--turns") options.turns = Number(argv[++index]);
    else if (value === "--seed") options.seed = argv[++index];
    else if (value === "--assert") options.assert = true;
    else if (value === "--output") options.output = path.resolve(argv[++index]);
    else throw new Error(`Unknown argument: ${value}`);
  }
  return options;
}

if (require.main === module) {
  try {
    const options = parseArguments(process.argv.slice(2));
    const shouldAssert = options.assert;
    const metrics = runSimulation({ ...options, assert: false });
    const text = `${JSON.stringify(metrics, null, 2)}\n`;
    if (options.output) fs.writeFileSync(options.output, text, "utf8");
    process.stdout.write(text);
    if (shouldAssert) assertSimulationMetrics(metrics);
  } catch (error) {
    process.stderr.write(`${error.stack || error.message}\n`);
    process.exitCode = 1;
  }
}

module.exports = { ROOT, MODULES, STANDARD_MIN_WIN_RATE, loadGame, loadDependencies, policyFor, createQuizProof, runCampaign, runSimulation, assertSimulationMetrics, parseArguments };
