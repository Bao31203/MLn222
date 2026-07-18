(function (root, factory) {
  "use strict";
  var game = root.MLN222Game;
  if (!game || !game.hasModule("contracts")) {
    throw new Error("Load the core modules before quiz-rewards.js.");
  }
  var api = game.registerModule("quiz-rewards", factory(game.contracts));
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function (contracts) {
  "use strict";

  var RESOURCE_NAMES = Object.freeze(["food", "coin"]);
  var CHOICES = Object.freeze(["food", "coin", "population", "unlock"]);
  var ID_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,95}$/;

  function requireRate(value, name, maximum) {
    if (!Number.isFinite(value) || value < 0 || value > maximum) {
      throw new RangeError(name + " must be between zero and " + maximum + ".");
    }
  }

  function validateConfig(config) {
    if (!contracts.isPlainObject(config) || !contracts.isPlainObject(config.penalty) || !contracts.isPlainObject(config.reward)) {
      throw new TypeError("Quiz reward config must define penalty and reward groups.");
    }
    ["low", "medium"].forEach(function (key) {
      var rule = config.penalty[key];
      if (!contracts.isPlainObject(rule)) {
        throw new TypeError("Missing quiz penalty rule: " + key);
      }
      requireRate(rule.stockRate, "penalty." + key + ".stockRate", 1);
      requireRate(rule.productionCapRate, "penalty." + key + ".productionCapRate", 2);
      requireRate(rule.productionEffectRate, "penalty." + key + ".productionEffectRate", 1);
      if (!Number.isSafeInteger(rule.duration) || rule.duration < 1 || rule.duration > 20) {
        throw new RangeError("Penalty duration is invalid.");
      }
    });
    ["smallProductionRate", "mediumProductionRate", "perfectProductionRate"].forEach(function (key) {
      requireRate(config.reward[key], "reward." + key, 2);
    });
    requireRate(config.reward.migrationRate, "reward.migrationRate", 1);
    requireRate(config.reward.productionEffectRate, "reward.productionEffectRate", 1);
    requireRate(config.reward.unlockDiscountRate, "reward.unlockDiscountRate", 1);
    if (!Number.isSafeInteger(config.reward.effectDuration) || config.reward.effectDuration < 1 || config.reward.effectDuration > 20) {
      throw new RangeError("Reward effect duration is invalid.");
    }
    return true;
  }

  function requireNonNegativeInteger(value, name) {
    if (!Number.isSafeInteger(value) || value < 0) {
      throw new RangeError(name + " must be a non-negative safe integer.");
    }
  }

  function validateContext(context) {
    if (!contracts.isPlainObject(context) || typeof context.factionId !== "string" || !ID_PATTERN.test(context.factionId)) {
      throw new TypeError("Quiz reward context needs a valid faction ID.");
    }
    if (!contracts.isPlainObject(context.resources) || !contracts.isPlainObject(context.production)) {
      throw new TypeError("Quiz reward context needs resource and production snapshots.");
    }
    RESOURCE_NAMES.forEach(function (name) {
      requireNonNegativeInteger(context.resources[name], "resources." + name);
      requireNonNegativeInteger(context.production[name], "production." + name);
    });
    requireNonNegativeInteger(context.capacityAvailable, "capacityAvailable");
    if (CHOICES.indexOf(context.choice) === -1) {
      throw new RangeError("Quiz reward choice is invalid.");
    }
  }

  function selectedResource(context) {
    if (RESOURCE_NAMES.indexOf(context.choice) !== -1) {
      return context.choice;
    }
    return context.resources.food >= context.resources.coin ? "food" : "coin";
  }

  function emptyOutcome(score, factionId) {
    return {
      factionId: factionId,
      score: score,
      tier: "neutral",
      resourceDeltas: { food: 0, coin: 0 },
      populationDelta: 0,
      effects: [],
    };
  }

  function checkedInteger(value, name) {
    if (!Number.isSafeInteger(value)) {
      throw new RangeError(name + " exceeded the safe-integer range.");
    }
    return value;
  }

  function resourceBonus(outcome, context, rate) {
    var resource = selectedResource(context);
    outcome.resourceDeltas[resource] = checkedInteger(Math.ceil(context.production[resource] * rate), "Quiz resource bonus");
    checkedInteger(context.resources[resource] + outcome.resourceDeltas[resource], "Quiz rewarded resource stock");
  }

  function resourcePenalty(outcome, context, rule) {
    var resource = selectedResource(context);
    var stockLimit = checkedInteger(Math.floor(context.resources[resource] * rule.stockRate), "Quiz stock penalty cap");
    var productionLimit = checkedInteger(Math.floor(context.production[resource] * rule.productionCapRate), "Quiz production penalty cap");
    outcome.resourceDeltas[resource] = -Math.min(context.resources[resource], stockLimit, productionLimit);
    outcome.effects.push({
      type: "production",
      resource: resource,
      multiplier: 1 - rule.productionEffectRate,
      remainingTurns: rule.duration,
    });
  }

  function evaluateScore(score, context, config) {
    if (!Number.isSafeInteger(score) || score < 0 || score > 10) {
      throw new RangeError("Quiz score must be between zero and ten.");
    }
    validateContext(context);
    validateConfig(config);
    var outcome = emptyOutcome(score, context.factionId);
    if (score <= 2) {
      outcome.tier = "major-penalty";
      resourcePenalty(outcome, context, config.penalty.low);
    } else if (score <= 4) {
      outcome.tier = "minor-penalty";
      resourcePenalty(outcome, context, config.penalty.medium);
    } else if (score === 5) {
      outcome.tier = "neutral";
    } else if (score <= 7) {
      outcome.tier = "small-reward";
      if (context.choice === "population") {
        outcome.populationDelta = Math.min(
          context.capacityAvailable,
          context.capacityAvailable === 0 ? 0 : Math.max(1, Math.floor(context.capacityAvailable * config.reward.migrationRate))
        );
      } else {
        resourceBonus(outcome, context, config.reward.smallProductionRate);
      }
    } else if (score <= 9) {
      outcome.tier = "major-reward";
      resourceBonus(outcome, context, config.reward.mediumProductionRate);
      outcome.effects.push({
        type: "production",
        resource: selectedResource(context),
        multiplier: 1 + config.reward.productionEffectRate,
        remainingTurns: config.reward.effectDuration,
      });
    } else {
      outcome.tier = "perfect-reward";
      resourceBonus(outcome, context, config.reward.perfectProductionRate);
      if (context.choice === "unlock") {
        outcome.effects.push({
          type: "unlock-discount",
          multiplier: 1 - config.reward.unlockDiscountRate,
          remainingTurns: config.reward.effectDuration,
        });
      } else {
        outcome.effects.push({
          type: "production",
          resource: selectedResource(context),
          multiplier: 1 + config.reward.productionEffectRate,
          remainingTurns: config.reward.effectDuration,
        });
      }
    }
    return outcome;
  }

  function createRewardAction(actionId, quiz, context, config) {
    if (typeof actionId !== "string" || !ID_PATTERN.test(actionId)) {
      throw new RangeError("Quiz reward action ID is invalid.");
    }
    if (
      !contracts.isPlainObject(quiz) ||
      typeof quiz.id !== "string" ||
      !ID_PATTERN.test(quiz.id) ||
      quiz.completed !== true ||
      quiz.position !== 10 ||
      !Number.isSafeInteger(quiz.score) ||
      quiz.score < 0 ||
      quiz.score > 10
    ) {
      throw new RangeError("Quiz reward requires a completed ten-question quiz.");
    }
    var payload = evaluateScore(quiz.score, context, config);
    payload.quizId = quiz.id;
    return {
      id: actionId,
      type: "APPLY_QUIZ_RESULT",
      expectedPhase: "quiz",
      payload: payload,
    };
  }

  function createRewardEvent(score, context, config) {
    return { type: "QUIZ_RESULT_EVALUATED", payload: evaluateScore(score, context, config) };
  }

  return {
    validateConfig: validateConfig,
    evaluateScore: evaluateScore,
    createRewardAction: createRewardAction,
    createRewardEvent: createRewardEvent,
  };
});
