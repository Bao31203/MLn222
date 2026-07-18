(function (root, factory) {
  "use strict";
  var game = root.MLN222Game;
  if (!game || !game.hasModule("contracts") || !game.hasModule("rng") || !game.hasModule("combat-casualties")) {
    throw new Error("Load core and combat casualties before npc-ai.js.");
  }
  var api = game.registerModule("npc-ai", factory(game.contracts, game.rng, game["combat-casualties"]));
  if (typeof module === "object" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function (contracts, rng, casualties) {
  "use strict";

  var ACTION_TYPES = Object.freeze(["WAIT", "RECRUIT", "REINFORCE", "UNLOCK", "MOVE", "TRADE", "PROPOSE_TREATY", "RESPOND_TREATY", "WARN_ATTACK"]);

  function validateContext(context) {
    if (!contracts.isPlainObject(context) || !contracts.isPlainObject(context.adjacency) || !contracts.isPlainObject(context.personalities) || !contracts.isPlainObject(context.config) || !contracts.isPlainObject(context.campaignConfig) || !contracts.isPlainObject(context.diplomacyConfig) || !contracts.isPlainObject(context.recruitmentConfig) || !contracts.isPlainObject(context.combatConfig)) {
      throw new TypeError("NPC AI context is invalid.");
    }
    if (context.config.stream !== "ai" || !Number.isFinite(context.config.randomVariation) || context.config.randomVariation < 0 || context.config.randomVariation > 1) {
      throw new RangeError("NPC AI config is invalid.");
    }
  }

  function ownedProvinceIds(state, factionId) {
    return Object.keys(state.provinces).sort().filter(function (provinceId) { return state.provinces[provinceId].ownerId === factionId; });
  }

  function provinceMilitary(province) {
    return casualties.countUnits(Object.fromEntries(Object.keys(province.units).map(function (unitId) {
      var unit = province.units[unitId];
      return [unitId, unit.field + unit.garrison];
    })));
  }

  function activeFronts(state, factionId) {
    var battles = Object.keys(state.battles).filter(function (battleId) {
      var battle = state.battles[battleId];
      return battle.status === "active" && (battle.attacker.factionId === factionId || battle.defender.factionId === factionId);
    }).length;
    var warnings = state.effects.filter(function (effect) {
      return effect.type === "attack-warning" && (effect.attackerId === factionId || effect.defenderId === factionId);
    }).length;
    return battles + warnings;
  }

  function adjacentEnemyPairs(state, factionId, adjacency) {
    var pairs = [];
    ownedProvinceIds(state, factionId).forEach(function (sourceId) {
      (adjacency[sourceId] || []).slice().sort().forEach(function (targetId) {
        var target = state.provinces[targetId];
        if (target && target.ownerId !== factionId) pairs.push({ sourceId: sourceId, targetId: targetId, defenderId: target.ownerId });
      });
    });
    return pairs;
  }

  function enemyNeighborCount(state, provinceId, factionId, adjacency) {
    return (adjacency[provinceId] || []).filter(function (neighborId) {
      return state.provinces[neighborId] && state.provinces[neighborId].ownerId !== factionId;
    }).length;
  }

  function distanceToEnemy(state, provinceId, factionId, adjacency) {
    if (enemyNeighborCount(state, provinceId, factionId, adjacency) > 0) return 0;
    var visited = Object.create(null);
    visited[provinceId] = true;
    var frontier = [{ provinceId: provinceId, distance: 0 }];
    while (frontier.length > 0) {
      var current = frontier.shift();
      var neighbors = (adjacency[current.provinceId] || []).slice().sort();
      for (var index = 0; index < neighbors.length; index += 1) {
        var neighborId = neighbors[index];
        if (visited[neighborId] || !state.provinces[neighborId] || state.provinces[neighborId].ownerId !== factionId) continue;
        if (enemyNeighborCount(state, neighborId, factionId, adjacency) > 0) return current.distance + 1;
        visited[neighborId] = true;
        frontier.push({ provinceId: neighborId, distance: current.distance + 1 });
      }
    }
    return Number.MAX_SAFE_INTEGER;
  }

  function hasPendingWarning(state, sourceId, targetId) {
    return state.effects.some(function (effect) {
      return effect.type === "attack-warning" && effect.sourceProvinceId === sourceId && effect.targetProvinceId === targetId;
    });
  }

  function hasPendingWarningForProvince(state, provinceId) {
    return state.effects.some(function (effect) {
      return effect.type === "attack-warning" && (effect.sourceProvinceId === provinceId || effect.targetProvinceId === provinceId);
    });
  }

  function hasActiveBattle(state, provinceId) {
    return Object.keys(state.battles).some(function (battleId) {
      var battle = state.battles[battleId];
      return battle.status === "active" && (battle.sourceProvinceId === provinceId || battle.targetProvinceId === provinceId);
    });
  }

  function hasRouteWith(faction, otherFactionId) {
    return faction.tradeRoutes.some(function (route) {
      return route.fromFactionId === otherFactionId || route.toFactionId === otherFactionId;
    });
  }

  function hasPendingTreatyProposal(faction, otherFactionId) {
    return faction.treatyProposals.some(function (proposal) {
      return proposal.fromFactionId === otherFactionId || proposal.toFactionId === otherFactionId;
    });
  }

  function tradeRouteLimit(state, factionId, context) {
    return Math.min(
      context.diplomacyConfig.maxTradeRoutes,
      context.campaignConfig.baseTradeRoutes + Math.floor(ownedProvinceIds(state, factionId).length / context.campaignConfig.provincesPerTradeRoute)
    );
  }

  function reinforcementAction(state, factionId, battle, personality, context) {
    var side = battle.attacker.factionId === factionId ? "attacker" : battle.defender.factionId === factionId ? "defender" : null;
    if (!side) return null;
    var reservation = state.effects.find(function (effect) { return effect.type === "battle-reservation" && effect.battleId === battle.id; });
    if (!reservation || !reservation[side] || !state.provinces[reservation[side].provinceId]) return null;
    var province = state.provinces[reservation[side].provinceId];
    var reserved = contracts.cloneJson(reservation[side].units);
    (reservation.pending || []).filter(function (entry) { return entry.side === side; }).forEach(function (entry) {
      Object.keys(entry.units).forEach(function (unitId) { reserved[unitId] = (reserved[unitId] || 0) + entry.units[unitId]; });
    });
    var arrivalTurn = battle.turn + context.combatConfig.reinforcement.delayTurns + 1;
    var queued = battle.reinforcementQueue.filter(function (entry) { return entry.side === side && entry.arrivalTurn === arrivalTurn; }).reduce(function (total, entry) { return total + casualties.countUnits(entry.units); }, 0);
    var allowance = Math.floor(battle[side].initialForce * context.combatConfig.reinforcement.maxInitialRate) - queued;
    if (allowance < 1) return null;
    var unitId = Object.keys(province.units).filter(function (id) {
      return province.units[id].field + province.units[id].garrison - (reserved[id] || 0) > 0;
    }).sort(function (left, right) {
      return context.combatConfig.unitPower[right] - context.combatConfig.unitPower[left] || (left < right ? -1 : 1);
    })[0];
    if (!unitId) return null;
    var available = province.units[unitId].field + province.units[unitId].garrison - (reserved[unitId] || 0);
    var count = Math.min(available, allowance);
    if (count < 1) return null;
    var urgency = 1 + (100 - battle[side].morale) / 100;
    var roleWeight = side === "defender" ? personality.defense : personality.attack;
    return { type: "REINFORCE", payload: { factionId: factionId, battleId: battle.id, units: Object.fromEntries([[unitId, count]]) }, baseUtility: context.config.reinforceBaseUtility * roleWeight * urgency };
  }

  function queryLegalActions(state, factionId, context) {
    validateContext(context);
    if (!contracts.isPlainObject(state.factions[factionId])) throw new RangeError("NPC faction is unknown.");
    var faction = state.factions[factionId];
    var provinces = ownedProvinceIds(state, factionId);
    var actions = [{ type: "WAIT", payload: { factionId: factionId }, baseUtility: context.config.waitBaseUtility }];
    if (provinces.length === 0 || faction.eliminated || !Number.isSafeInteger(faction.actionPoints) || faction.actionPoints < 1) return actions;
    var personality = context.personalities[faction.personality];
    if (!contracts.isPlainObject(personality)) throw new RangeError("NPC personality is unknown.");
    faction.treatyProposals.filter(function (proposal) { return proposal.toFactionId === factionId; }).forEach(function (proposal) {
      var relation = faction.relations[proposal.fromFactionId];
      var threshold = proposal.type === "alliance" ? context.diplomacyConfig.allianceRelationMinimum : context.diplomacyConfig.nonAggressionRelationMinimum;
      var allowedStatus = proposal.type === "alliance" ? relation.status === "neutral" || relation.status === "non-aggression" : relation.status === "neutral";
      var limit = proposal.type === "alliance" ? context.diplomacyConfig.maxAlliances : context.diplomacyConfig.maxNonAggressionTreaties;
      var ownCount = Object.keys(faction.relations).filter(function (id) { return faction.relations[id].status === proposal.type; }).length;
      var senderCount = Object.keys(state.factions[proposal.fromFactionId].relations).filter(function (id) { return state.factions[proposal.fromFactionId].relations[id].status === proposal.type; }).length;
      var accepted = allowedStatus && relation.score >= threshold && ownCount < limit && senderCount < limit && (relation.betrayalUntilTurn === null || relation.betrayalUntilTurn < state.turn);
      actions.push({ type: "RESPOND_TREATY", payload: { factionId: factionId, proposalId: proposal.id, accepted: accepted }, baseUtility: context.config.treatyBaseUtility * personality.treaty * 2 });
    });
    Object.keys(state.battles).sort().forEach(function (battleId) {
      var battle = state.battles[battleId];
      if (battle.status !== "active") return;
      var action = reinforcementAction(state, factionId, battle, personality, context);
      if (action) actions.push(action);
    });
    Object.keys(context.recruitmentConfig.unlocks).sort().forEach(function (unitId) {
      var spec = context.recruitmentConfig.unlocks[unitId];
      if (faction.unlockedUnits.indexOf(unitId) !== -1 || state.turn < spec.minTurn || provinces.length < spec.minProvinces || faction.resources.coin < spec.coinCost || faction.actionPoints < spec.actionPointCost || spec.prerequisites.some(function (required) { return faction.unlockedUnits.indexOf(required) === -1; })) return;
      actions.push({ type: "UNLOCK", payload: { factionId: factionId, unitId: unitId }, baseUtility: context.config.unlockBaseUtility * personality.economy * context.combatConfig.unitPower[unitId] });
    });
    var recruitProvinceId = provinces.filter(function (provinceId) { return !state.provinces[provinceId].occupation; }).sort(function (leftId, rightId) {
      var left = state.provinces[leftId];
      var right = state.provinces[rightId];
      var distanceDifference = distanceToEnemy(state, leftId, factionId, context.adjacency) - distanceToEnemy(state, rightId, factionId, context.adjacency);
      if (distanceDifference !== 0) return distanceDifference;
      var militaryDifference = provinceMilitary(left) - provinceMilitary(right);
      if (militaryDifference !== 0) return militaryDifference;
      return right.population.civilians - left.population.civilians || (leftId < rightId ? -1 : 1);
    })[0];
    var recruitProvince = recruitProvinceId ? state.provinces[recruitProvinceId] : null;
    var factionPopulation = provinces.reduce(function (totals, provinceId) {
      totals.civilians += state.provinces[provinceId].population.civilians;
      totals.military += state.provinces[provinceId].population.military;
      return totals;
    }, { civilians: 0, military: 0 });
    var mobilization = factionPopulation.military / Math.max(1, factionPopulation.civilians + factionPopulation.military);
    var targetMobilization = Math.min(0.45, context.campaignConfig.militaryTargetRate * Math.max(personality.attack, personality.defense));
    if (recruitProvince && recruitProvince.population.civilians >= 50 && mobilization < targetMobilization) {
      var recruitUnitId = faction.unlockedUnits.slice().sort(function (left, right) {
        return context.combatConfig.unitPower[right] - context.combatConfig.unitPower[left] || (left < right ? -1 : 1);
      })[0];
      var unitCost = context.recruitmentConfig.unitCosts[recruitUnitId];
      var resourceFraction = context.campaignConfig.autoRecruitResourceFraction;
      var count = Math.min(
        context.recruitmentConfig.maxBatchSize,
        context.campaignConfig.autoRecruitBatchLimit,
        Math.floor(recruitProvince.population.civilians * context.campaignConfig.autoRecruitCivilianRate),
        Math.floor(faction.resources.food * resourceFraction / unitCost.food),
        Math.floor(faction.resources.coin * resourceFraction / unitCost.coin)
      );
      if (count > 0) actions.push({ type: "RECRUIT", payload: { factionId: factionId, provinceId: recruitProvinceId, unitId: recruitUnitId, count: count }, baseUtility: context.config.recruitBaseUtility * personality.defense * context.combatConfig.unitPower[recruitUnitId] });
    }
    provinces.forEach(function (sourceId) {
      var source = state.provinces[sourceId];
      if (hasActiveBattle(state, sourceId) || hasPendingWarningForProvince(state, sourceId)) return;
      (context.adjacency[sourceId] || []).slice().sort().forEach(function (targetId) {
        var target = state.provinces[targetId];
        if (!target || target.ownerId !== factionId || hasActiveBattle(state, targetId) || hasPendingWarningForProvince(state, targetId)) return;
        var capacityAvailable = target.population.capacity - target.population.civilians - target.population.military;
        var targetThreat = enemyNeighborCount(state, targetId, factionId, context.adjacency);
        var sourceThreat = enemyNeighborCount(state, sourceId, factionId, context.adjacency);
        var targetDistance = distanceToEnemy(state, targetId, factionId, context.adjacency);
        var sourceDistance = distanceToEnemy(state, sourceId, factionId, context.adjacency);
        Object.keys(source.units).sort().forEach(function (unitId) {
          var sourceReady = source.units[unitId].field + source.units[unitId].garrison;
          var targetReady = target.units[unitId] ? target.units[unitId].field + target.units[unitId].garrison : 0;
          var count = Math.min(capacityAvailable, Math.floor(Math.max(0, sourceReady - targetReady) / 2));
          if (count >= context.campaignConfig.minimumMoveForce && (targetThreat > sourceThreat || targetDistance < sourceDistance)) actions.push({ type: "MOVE", payload: { factionId: factionId, sourceProvinceId: sourceId, targetProvinceId: targetId, unitId: unitId, count: count }, baseUtility: context.config.moveBaseUtility * personality.defense * context.combatConfig.unitPower[unitId] * (1 + targetThreat * 0.15 + Math.max(0, sourceDistance - targetDistance) * 0.1) });
        });
      });
    });
    adjacentEnemyPairs(state, factionId, context.adjacency).forEach(function (pair) {
      var relation = faction.relations[pair.defenderId];
      if (!relation) return;
      if (relation.status !== "war" && relation.score >= context.diplomacyConfig.tradeRelationMinimum && faction.tradeRoutes.length < tradeRouteLimit(state, factionId, context) && state.factions[pair.defenderId].tradeRoutes.length < tradeRouteLimit(state, pair.defenderId, context) && !hasRouteWith(faction, pair.defenderId)) {
        actions.push({ type: "TRADE", payload: { factionId: factionId, partnerId: pair.defenderId, sourceProvinceId: pair.sourceId, targetProvinceId: pair.targetId }, baseUtility: context.config.tradeBaseUtility * personality.trade });
      }
      if ((relation.status === "neutral" && relation.score >= context.diplomacyConfig.nonAggressionRelationMinimum) || (relation.status === "non-aggression" && relation.score >= context.diplomacyConfig.allianceRelationMinimum)) {
        var treatyType = relation.score >= context.diplomacyConfig.allianceRelationMinimum ? "alliance" : "non-aggression";
        var treatyLimit = treatyType === "alliance" ? context.diplomacyConfig.maxAlliances : context.diplomacyConfig.maxNonAggressionTreaties;
        var ownTreaties = Object.keys(faction.relations).filter(function (id) { return faction.relations[id].status === treatyType; }).length;
        var partnerTreaties = Object.keys(state.factions[pair.defenderId].relations).filter(function (id) { return state.factions[pair.defenderId].relations[id].status === treatyType; }).length;
        if (ownTreaties < treatyLimit && partnerTreaties < treatyLimit && !hasPendingTreatyProposal(faction, pair.defenderId)) actions.push({ type: "PROPOSE_TREATY", payload: { factionId: factionId, partnerId: pair.defenderId, treatyType: treatyType }, baseUtility: context.config.treatyBaseUtility * personality.treaty });
      }
      if (
        state.turn > context.campaignConfig.noWarThroughTurn &&
        activeFronts(state, factionId) < context.campaignConfig.maximumActiveFronts &&
        activeFronts(state, pair.defenderId) < context.campaignConfig.baseMaximumActiveFronts + Math.floor(ownedProvinceIds(state, pair.defenderId).length / 5) &&
        relation.status !== "alliance" && relation.status !== "non-aggression" &&
        !hasPendingWarning(state, pair.sourceId, pair.targetId) &&
        !hasPendingWarningForProvince(state, pair.sourceId) &&
        !hasPendingWarningForProvince(state, pair.targetId) &&
        !hasActiveBattle(state, pair.sourceId) &&
        !hasActiveBattle(state, pair.targetId)
      ) {
        var sourcePower = provinceMilitary(state.provinces[pair.sourceId]);
        var targetPower = provinceMilitary(state.provinces[pair.targetId]);
        var playerBias = faction.isPlayer ? context.campaignConfig.playerAttackBias : 1;
        var ratio = sourcePower * playerBias / Math.max(1, targetPower);
        var committable = Math.floor(sourcePower * context.campaignConfig.attackForceRate);
        if (committable >= context.campaignConfig.minimumBattleForce && ratio >= context.config.attackStrengthMinimum) {
          actions.push({ type: "WARN_ATTACK", payload: { factionId: factionId, defenderId: pair.defenderId, sourceProvinceId: pair.sourceId, targetProvinceId: pair.targetId, strengthRatio: ratio }, baseUtility: context.config.warningBaseUtility * personality.attack * Math.min(2, ratio) });
        }
      }
    });
    var seen = Object.create(null);
    return actions.filter(function (action) {
      var key = action.type + ":" + JSON.stringify(action.payload);
      if (seen[key]) return false;
      seen[key] = true;
      return true;
    });
  }

  function chooseAction(state, factionId, context, rngState) {
    var actions = queryLegalActions(state, factionId, context);
    var nextRng = rng.cloneRngState(rngState);
    var scored = actions.map(function (action) {
      var draw = rng.nextFloat(nextRng, context.config.stream);
      nextRng = draw.state;
      var variation = 1 + (draw.value * 2 - 1) * context.config.randomVariation;
      return { action: action, utility: action.baseUtility * variation };
    });
    scored.sort(function (left, right) {
      if (right.utility !== left.utility) return right.utility - left.utility;
      var leftKey = left.action.type + JSON.stringify(left.action.payload);
      var rightKey = right.action.type + JSON.stringify(right.action.payload);
      return leftKey < rightKey ? -1 : leftKey > rightKey ? 1 : 0;
    });
    return { action: contracts.cloneJson(scored[0].action), rngState: nextRng, scored: scored.map(function (entry) { return { type: entry.action.type, utility: entry.utility }; }) };
  }

  return {
    ACTION_TYPES: ACTION_TYPES,
    ownedProvinceIds: ownedProvinceIds,
    provinceMilitary: provinceMilitary,
    activeFronts: activeFronts,
    adjacentEnemyPairs: adjacentEnemyPairs,
    queryLegalActions: queryLegalActions,
    chooseAction: chooseAction,
  };
});
