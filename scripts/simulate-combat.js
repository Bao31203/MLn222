"use strict";

const fs = require("node:fs");
const path = require("node:path");
const assert = require("node:assert/strict");

const ROOT = path.resolve(__dirname, "..");

function loadGame() {
  delete globalThis.MLN222Game;
  [
    "game/core/namespace.js",
    "game/core/rng.js",
    "game/core/contracts.js",
    "game/core/invariants.js",
    "game/core/runtime.js",
    "game/engine/combat-tactics.js",
    "game/engine/combat-casualties.js",
    "game/engine/combat.js",
  ].forEach((relative) => {
    const resolved = require.resolve(path.join(ROOT, relative));
    delete require.cache[resolved];
    require(resolved);
  });
  return globalThis.MLN222Game;
}

function createBaselineCombatConfig() {
  return {
    stream: "combat",
    unitPower: { militia: 1, infantry: 1.2, archer: 1.1, cavalry: 1.45, engineer: 1.3 },
    terrain: { plains: 1, urban: 1.04, mountain: 1.1, delta: 1.02, coastal: 1.03, highland: 1.08 },
    tactics: {
      siege: { damage: 0.65, exposure: 0.45, power: 0.9, minLoss: 0.02, maxLoss: 0.06, breachMin: 14, breachMax: 20, moraleRecovery: 0 },
      engage: { damage: 1, exposure: 1, power: 1, minLoss: 0.04, maxLoss: 0.1, breachMin: 4, breachMax: 8, moraleRecovery: 0 },
      assault: { damage: 1.55, exposure: 1.35, power: 1.2, minLoss: 0.07, maxLoss: 0.15, breachMin: 20, breachMax: 30, moraleRecovery: 0 },
      consolidate: { damage: 0.25, exposure: 0.35, power: 0.7, minLoss: 0.01, maxLoss: 0.04, breachMin: 0, breachMax: 0, moraleRecovery: 5 },
      retreat: { damage: 0, exposure: 0, power: 0.6, minLoss: 0, maxLoss: 0, breachMin: 0, breachMax: 0, moraleRecovery: 0 },
    },
    power: { minimumMoraleFactor: 0.25, minimumSupplyFactor: 0.3, fortificationDefenseBonus: 0.12 },
    attrition: { baseRate: 0.065, varianceMin: 0.92, varianceMax: 1.08, directLossCap: 0.15 },
    morale: {
      start: 100,
      baseLoss: 5.3,
      lossRateFactor: 90,
      strengthPressureFactor: 18,
      strengthPressureCap: 25,
      fatigueStartTurn: 3,
      fatiguePerTurn: 4,
      supplyPressureFactor: 0.08,
      assaultShock: 6,
      fortificationShield: 3,
      routThreshold: 0,
    },
    supply: { start: 100, baseDrain: 4, lateTurn: 8, lateDrain: 6, siegeDrain: 5 },
    fortification: { assaultBreachThreshold: 60 },
    casualties: { deadRate: 0.35, woundedRate: 0.4, routedRate: 0.25, woundedRecoveryTurns: 2 },
    reinforcement: { delayTurns: 1, maxInitialRate: 0.25 },
    retreat: { pursuitMinRate: 0.02, pursuitMaxRate: 0.08, defenderCapturedRate: 0.6 },
    phases: { action: "action", resolution: "resolution", postPulse: "quiz" },
  };
}

function median(values) {
  const sorted = values.slice().sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

function percentile(values, fraction) {
  const sorted = values.slice().sort((left, right) => left - right);
  return sorted[Math.min(sorted.length - 1, Math.ceil(sorted.length * fraction) - 1)];
}

function unitsFor(total, variant) {
  const infantry = Math.floor(total * (variant % 3 === 0 ? 0.25 : 0.15));
  const archer = Math.floor(total * 0.1);
  return { militia: total - infantry - archer, infantry, archer };
}

function runSingleBattle(game, config, ratio, index, seed, scenario = {}) {
  const defenderForce = 1000 + (index % 9) * 25;
  const attackerForce = Math.max(100, Math.round(defenderForce * ratio));
  let battle = game.combat.createBattle({
    id: `battle-${index}`,
    sourceProvinceId: "source",
    targetProvinceId: "target",
    terrain: scenario.terrain || Object.keys(config.terrain)[index % Object.keys(config.terrain).length],
    fortification: 100,
    attacker: { factionId: "attacker", units: unitsFor(attackerForce, index), supply: scenario.attackerSupply || 95 },
    defender: { factionId: "defender", units: unitsFor(defenderForce, index + 1), supply: scenario.defenderSupply || 95 },
  }, config);
  if (scenario.kind === "assault") {
    battle.fortification.current = 40;
    battle.breach = 60;
  }
  if (scenario.kind === "reinforcement") {
    const reinforcement = Math.max(1, Math.floor(attackerForce * 0.1));
    battle = game.combat.queueReinforcement(battle, "attacker", { militia: reinforcement }, `reinforce-${index}`, config);
  }
  let rngState = game.rng.createRngState(`${seed}-${index}`);
  let maximumPulseLossRate = 0;
  while (battle.status === "active" && battle.turn < 20) {
    let attackerTactic = "engage";
    let defenderTactic = "engage";
    if (battle.turn === 0 && scenario.kind === "retreat") attackerTactic = "retreat";
    if (battle.turn === 0 && scenario.kind === "siege") attackerTactic = "siege";
    if (battle.turn === 0 && scenario.kind === "assault") attackerTactic = "assault";
    if (battle.turn === 0 && scenario.kind === "consolidate") defenderTactic = "consolidate";
    const result = game.combat.resolvePulse(battle, { attackerTactic, defenderTactic }, rngState, config);
    if (result.report.losses) {
      maximumPulseLossRate = Math.max(
        maximumPulseLossRate,
        result.report.losses.attacker.total / Math.max(1, game["combat-casualties"].countUnits(battle.attacker.units)),
        result.report.losses.defender.total / Math.max(1, game["combat-casualties"].countUnits(battle.defender.units))
      );
    } else {
      maximumPulseLossRate = Math.max(
        maximumPulseLossRate,
        result.report.pursuitLosses / Math.max(1, game["combat-casualties"].countUnits(battle.attacker.units))
      );
    }
    battle = result.battle;
    rngState = result.rngState;
  }
  return { battle, duration: battle.turn, maximumPulseLossRate };
}

function runSimulation(options = {}) {
  const game = loadGame();
  const runs = options.runs === undefined ? 10000 : options.runs;
  const seed = options.seed || "combat-simulation";
  const config = options.config || createBaselineCombatConfig();
  const ratios = [0.5, 0.75, 1, 1.5, 2, 3];
  const terrains = Object.keys(config.terrain).sort();
  const supplyPairs = [[100, 100], [85, 100], [100, 85], [75, 75]];
  const scenarioKinds = Array(15).fill("engage").concat(["siege", "assault", "consolidate", "reinforcement", "retreat"]);
  const durations = [];
  const byRatio = Object.fromEntries(ratios.map((ratio) => [String(ratio), []]));
  let completed = 0;
  let withinThreeToSeven = 0;
  let beforeTen = 0;
  let maximumPulseLossRate = 0;
  let conservationFailures = 0;
  const scenarioCounts = Object.fromEntries([...new Set(scenarioKinds)].map((kind) => [kind, 0]));
  const started = process.hrtime.bigint();
  for (let index = 0; index < runs; index += 1) {
    const ratio = ratios[index % ratios.length];
    const terrainIndex = Math.floor(index / ratios.length) % terrains.length;
    const supplyIndex = Math.floor(index / (ratios.length * terrains.length)) % supplyPairs.length;
    const scenarioIndex = Math.floor(index / (ratios.length * terrains.length * supplyPairs.length)) % scenarioKinds.length;
    const kind = scenarioKinds[scenarioIndex];
    const result = runSingleBattle(game, config, ratio, index, seed, {
      kind,
      terrain: terrains[terrainIndex],
      attackerSupply: supplyPairs[supplyIndex][0],
      defenderSupply: supplyPairs[supplyIndex][1],
    });
    scenarioCounts[kind] += 1;
    durations.push(result.duration);
    byRatio[String(ratio)].push(result.duration);
    maximumPulseLossRate = Math.max(maximumPulseLossRate, result.maximumPulseLossRate);
    if (result.battle.status !== "active") completed += 1;
    if (result.duration >= 3 && result.duration <= 7) withinThreeToSeven += 1;
    if (result.duration < 10) beforeTen += 1;
    ["attacker", "defender"].forEach((side) => {
      const participant = result.battle[side];
      if (game["combat-casualties"].accountingTotal(participant) !== participant.initialForce + participant.reinforcementsReceived) {
        conservationFailures += 1;
      }
    });
  }
  const durationMs = Number(process.hrtime.bigint() - started) / 1e6;
  const metrics = {
    runs,
    completed,
    medianDuration: median(durations),
    p95Duration: percentile(durations, 0.95),
    withinThreeToSevenRate: withinThreeToSeven / runs,
    beforeTurnTenRate: beforeTen / runs,
    maximumPulseLossRate,
    conservationFailures,
    scenarioCounts,
    durationMs,
    byRatio: Object.fromEntries(Object.entries(byRatio).map(([ratio, values]) => [ratio, {
      count: values.length,
      median: median(values),
      p95: percentile(values, 0.95),
    }])),
  };
  if (options.assert) {
    assert.equal(metrics.completed, runs, "Every representative battle must complete.");
    assert.ok(metrics.byRatio["1"].median >= 5 && metrics.byRatio["1"].median <= 7, "Equal-force median must be 5-7 turns.");
    assert.ok(metrics.byRatio["2"].median >= 3 && metrics.byRatio["2"].median <= 5, "Two-to-one median must be 3-5 turns.");
    assert.ok(metrics.withinThreeToSevenRate >= 0.8, "At least 80% of battles must end in 3-7 turns.");
    assert.ok(metrics.beforeTurnTenRate >= 0.95, "At least 95% of battles must end before turn 10.");
    assert.ok(metrics.maximumPulseLossRate <= 0.1500000001, "Direct pulse loss cannot exceed 15%.");
    assert.equal(metrics.conservationFailures, 0, "Battle accounting must conserve soldiers.");
  }
  return metrics;
}

function parseArguments(argv) {
  const options = { runs: 10000, seed: "combat-simulation", assert: false, config: null };
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--assert") options.assert = true;
    else if (value === "--runs") options.runs = Number(argv[++index]);
    else if (value === "--seed") options.seed = argv[++index];
    else if (value === "--config") {
      const parsed = JSON.parse(fs.readFileSync(path.resolve(argv[++index]), "utf8"));
      options.config = parsed.combat || parsed;
    } else throw new Error(`Unknown argument: ${value}`);
  }
  if (!Number.isSafeInteger(options.runs) || options.runs < 1) throw new RangeError("--runs must be a positive integer.");
  if (!options.config) delete options.config;
  return options;
}

if (require.main === module) {
  try {
    const metrics = runSimulation(parseArguments(process.argv.slice(2)));
    process.stdout.write(`${JSON.stringify(metrics, null, 2)}\n`);
  } catch (error) {
    process.stderr.write(`${error.stack || error.message}\n`);
    process.exitCode = 1;
  }
}

module.exports = { createBaselineCombatConfig, runSingleBattle, runSimulation, parseArguments };
