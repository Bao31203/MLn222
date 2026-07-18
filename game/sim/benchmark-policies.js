(function (root, factory) {
  "use strict";
  var game = root.MLN222Game;
  if (!game || !game.hasModule("contracts") || !game.hasModule("npc-ai") || !game.hasModule("campaign")) {
    throw new Error("Load campaign modules before benchmark-policies.js.");
  }
  var api = game.registerModule("benchmark-policies", factory(game.contracts, game["npc-ai"], game.campaign));
  if (typeof module === "object" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function (contracts, npcAi, campaign) {
  "use strict";

  var POLICY_IDS = Object.freeze(["balanced", "expansionist", "steward"]);
  var QUIZ_PROFILES = Object.freeze({ developing: 6, proficient: 8, mastery: 10 });
  var PRIORITIES = Object.freeze({
    balanced: { RESPOND_TREATY: 80, REINFORCE: 36, UNLOCK: 32, WARN_ATTACK: 28, MOVE: 26, RECRUIT: 24, TRADE: 22, PROPOSE_TREATY: 16, WAIT: 1 },
    expansionist: { RESPOND_TREATY: 80, WARN_ATTACK: 60, UNLOCK: 40, MOVE: 38, RECRUIT: 28, REINFORCE: 20, TRADE: 14, PROPOSE_TREATY: 5, WAIT: 1 },
    steward: { RESPOND_TREATY: 80, REINFORCE: 42, UNLOCK: 38, RECRUIT: 35, TRADE: 30, MOVE: 28, PROPOSE_TREATY: 24, WARN_ATTACK: 12, WAIT: 1 },
  });

  function contextFor(state, deps, factionId) {
    var campaignConfig = contracts.cloneJson(deps.balance.campaign);
    campaignConfig.baseMaximumActiveFronts = deps.balance.campaign.maximumActiveFronts;
    campaignConfig.maximumActiveFronts += Math.floor(campaign.ownedProvinceIds(state, factionId).length / 5);
    return {
      adjacency: deps.adjacency,
      personalities: deps.personalities,
      config: deps.balance.ai,
      campaignConfig: campaignConfig,
      diplomacyConfig: deps.balance.diplomacy,
      recruitmentConfig: deps.balance.economy.recruitment,
      combatConfig: deps.balance.combat,
    };
  }

  function chooseAction(state, policyId, deps, factionId) {
    var id = factionId || "player";
    if (POLICY_IDS.indexOf(policyId) === -1) throw new RangeError("Unknown benchmark policy: " + policyId);
    var actions = npcAi.queryLegalActions(state, id, contextFor(state, deps, id));
    var priorities = PRIORITIES[policyId];
    var controlledRegions = new Set(campaign.regionalControl(state, id, deps));
    var neededRegions = new Set(Object.keys(state.provinces).map(function (provinceId) { return state.provinces[provinceId].region; }).filter(function (region) { return !controlledRegions.has(region); }));
    function distanceToNeededRegion(startId) {
      var visited = Object.create(null);
      visited[startId] = true;
      var queue = [{ provinceId: startId, distance: 0 }];
      while (queue.length > 0) {
        var current = queue.shift();
        if (neededRegions.has(state.provinces[current.provinceId].region)) return current.distance;
        (deps.adjacency[current.provinceId] || []).slice().sort().forEach(function (neighborId) {
          if (!visited[neighborId]) {
            visited[neighborId] = true;
            queue.push({ provinceId: neighborId, distance: current.distance + 1 });
          }
        });
      }
      return 34;
    }
    function strategicBonus(action) {
      if (action.type !== "WARN_ATTACK") return 0;
      var target = state.provinces[action.payload.targetProvinceId];
      var regionTotals = { all: 0, owned: 0 };
      Object.keys(state.provinces).forEach(function (provinceId) {
        var province = state.provinces[provinceId];
        if (province.region !== target.region) return;
        var points = deps.victoryRules.territoryPoints[province.capacityTier];
        regionTotals.all += points;
        if (province.ownerId === id) regionTotals.owned += points;
      });
      var share = regionTotals.owned / regionTotals.all;
      var value = deps.victoryRules.territoryPoints[target.capacityTier] * 2;
      var regionBonus = regionTotals.owned === 0 ? 20 : share <= deps.victoryRules.regionControlThreshold ? (1 - share) * 10 : 0;
      var pathBonus = Math.max(0, 12 - distanceToNeededRegion(action.payload.targetProvinceId) * 3);
      return policyId === "expansionist" ? value + regionBonus + pathBonus : (value + regionBonus + pathBonus) * 0.5;
    }
    actions.sort(function (left, right) {
      var leftScore = priorities[left.type] + left.baseUtility * 0.01 + strategicBonus(left);
      var rightScore = priorities[right.type] + right.baseUtility * 0.01 + strategicBonus(right);
      if (rightScore !== leftScore) return rightScore - leftScore;
      var leftKey = left.type + JSON.stringify(left.payload);
      var rightKey = right.type + JSON.stringify(right.payload);
      return leftKey < rightKey ? -1 : leftKey > rightKey ? 1 : 0;
    });
    return contracts.cloneJson(actions[0]);
  }

  function projectAction(state, action, deps, factionId, index) {
    var next = contracts.cloneGameState(state);
    var faction = next.factions[factionId];
    faction.actionPoints -= 1;
    if (action.type === "WARN_ATTACK") {
      next.effects.push({
        type: "attack-warning",
        id: "benchmark-warning-" + next.turn + "-" + index,
        attackerId: factionId,
        defenderId: action.payload.defenderId,
        sourceProvinceId: action.payload.sourceProvinceId,
        targetProvinceId: action.payload.targetProvinceId,
        createdTurn: next.turn,
        executeTurn: next.turn + deps.balance.campaign.warningDelayTurns,
      });
    } else if (action.type === "RECRUIT") {
      var recruitment = deps.balance.economy.recruitment;
      var unitId = action.payload.unitId || "militia";
      var cost = recruitment.unitCosts[unitId];
      var province = next.provinces[action.payload.provinceId];
      faction.resources.food -= Math.ceil(action.payload.count * cost.food);
      faction.resources.coin -= Math.ceil(action.payload.count * cost.coin);
      province.population.civilians -= action.payload.count;
      province.population.military += action.payload.count;
      if (!province.units[unitId]) province.units[unitId] = { field: 0, garrison: 0, training: 0, wounded: 0 };
      province.units[unitId].training += action.payload.count;
      province.recruitmentQueue.push({ id: "benchmark-recruit-" + next.turn + "-" + index, unitId: unitId, count: action.payload.count, remainingTurns: recruitment.trainingTurns });
    } else if (action.type === "MOVE") {
      var source = next.provinces[action.payload.sourceProvinceId];
      var target = next.provinces[action.payload.targetProvinceId];
      var movingUnitId = action.payload.unitId;
      if (!target.units[movingUnitId]) target.units[movingUnitId] = { field: 0, garrison: 0, training: 0, wounded: 0 };
      var fromField = Math.min(source.units[movingUnitId].field, action.payload.count);
      source.units[movingUnitId].field -= fromField;
      source.units[movingUnitId].garrison -= action.payload.count - fromField;
      source.population.military -= action.payload.count;
      target.units[movingUnitId].garrison += action.payload.count;
      target.population.military += action.payload.count;
    } else if (action.type === "REINFORCE") {
      var battle = next.battles[action.payload.battleId];
      var side = battle.attacker.factionId === factionId ? "attacker" : "defender";
      var requestId = "benchmark-rf-" + next.turn + "-" + index;
      battle.reinforcementQueue.push({ requestId: requestId, side: side, arrivalTurn: battle.turn + deps.balance.combat.reinforcement.delayTurns + 1, units: contracts.cloneJson(action.payload.units) });
      var reservation = next.effects.find(function (effect) { return effect.type === "battle-reservation" && effect.battleId === battle.id; });
      if (!Array.isArray(reservation.pending)) reservation.pending = [];
      reservation.pending.push({ requestId: requestId, side: side, units: contracts.cloneJson(action.payload.units) });
    } else if (action.type === "UNLOCK") {
      var unlock = deps.balance.economy.recruitment.unlocks[action.payload.unitId];
      faction.resources.coin -= unlock.coinCost;
      faction.unlockedUnits.push(action.payload.unitId);
      faction.unlockedUnits.sort();
    } else if (action.type === "TRADE") {
      var route = { id: "benchmark-route-" + next.turn + "-" + index, fromFactionId: factionId, toFactionId: action.payload.partnerId, sourceProvinceId: action.payload.sourceProvinceId, targetProvinceId: action.payload.targetProvinceId, active: true };
      faction.tradeRoutes.push(route);
      next.factions[action.payload.partnerId].tradeRoutes.push(contracts.cloneJson(route));
    } else if (action.type === "PROPOSE_TREATY") {
      var proposal = {
        id: "benchmark-proposal-" + next.turn + "-" + index,
        fromFactionId: factionId,
        toFactionId: action.payload.partnerId,
        type: action.payload.treatyType,
        turn: next.turn,
      };
      faction.treatyProposals.push(proposal);
      next.factions[action.payload.partnerId].treatyProposals.push(contracts.cloneJson(proposal));
    } else if (action.type === "RESPOND_TREATY") {
      var response = faction.treatyProposals.find(function (proposal) { return proposal.id === action.payload.proposalId; });
      if (!response) throw new RangeError("Benchmark treaty response references an unknown proposal.");
      Object.keys(next.factions).forEach(function (id) {
        next.factions[id].treatyProposals = next.factions[id].treatyProposals.filter(function (proposal) { return proposal.id !== response.id; });
      });
      if (action.payload.accepted) {
        var untilTurn = next.turn + deps.balance.diplomacy.treatyDuration;
        faction.relations[response.fromFactionId].status = response.type;
        faction.relations[response.fromFactionId].untilTurn = untilTurn;
        next.factions[response.fromFactionId].relations[factionId].status = response.type;
        next.factions[response.fromFactionId].relations[factionId].untilTurn = untilTurn;
      }
    }
    return next;
  }

  function chooseActions(state, policyId, deps, factionId) {
    var id = factionId || "player";
    var projected = contracts.cloneGameState(state);
    var actions = [];
    var limit = Math.max(1, projected.factions[id].actionPoints);
    for (var index = 0; index < limit; index += 1) {
      var action = chooseAction(projected, policyId, deps, id);
      if (action.type === "WAIT") break;
      actions.push(action);
      projected = projectAction(projected, action, deps, id, index);
    }
    return actions.length > 0 ? actions : [{ type: "WAIT", payload: { factionId: id } }];
  }

  function quizScore(profileId) {
    if (!Object.prototype.hasOwnProperty.call(QUIZ_PROFILES, profileId)) throw new RangeError("Unknown quiz profile: " + profileId);
    return QUIZ_PROFILES[profileId];
  }

  return {
    POLICY_IDS: POLICY_IDS,
    QUIZ_PROFILES: QUIZ_PROFILES,
    chooseAction: chooseAction,
    chooseActions: chooseActions,
    quizScore: quizScore,
  };
});
