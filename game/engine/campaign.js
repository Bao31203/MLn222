(function (root, factory) {
  "use strict";
  var game = root.MLN222Game;
  var required = ["contracts", "population", "economy", "recruitment", "combat", "combat-casualties", "diplomacy", "occupation", "npc-ai", "quiz-rewards"];
  if (!game || required.some(function (name) { return !game.hasModule(name); })) throw new Error("Load Phase 01-07 engine modules before campaign.js.");
  var api = game.registerModule("campaign", factory(game));
  if (typeof module === "object" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function (game) {
  "use strict";

  var contracts = game.contracts;
  var casualties = game["combat-casualties"];
  var PERSONALITY_IDS = Object.freeze(["cautious", "trader", "expansionist", "defensive"]);
  var QUIZ_SIZE = 10;
  var VALIDATED_DEPENDENCIES = new WeakSet();

  function requireInteger(value, name, minimum) {
    if (!Number.isSafeInteger(value) || value < minimum) throw new RangeError(name + " must be a safe integer of at least " + minimum + ".");
  }

  function requireRate(value, name, minimum, maximum) {
    if (!Number.isFinite(value) || value < minimum || value > maximum) throw new RangeError(name + " is outside its allowed range.");
  }

  function requireDependencies(deps) {
    if (contracts.isPlainObject(deps) && VALIDATED_DEPENDENCIES.has(deps)) return true;
    if (!contracts.isPlainObject(deps) || !Array.isArray(deps.provinces) || !contracts.isPlainObject(deps.adjacency) || !contracts.isPlainObject(deps.balance) || !contracts.isPlainObject(deps.personalities) || !contracts.isPlainObject(deps.victoryRules)) {
      throw new TypeError("Campaign dependencies are invalid.");
    }
    if (deps.provinces.length !== 34) throw new RangeError("Campaign requires exactly 34 province definitions.");
    ["economy", "combat", "quizRewards", "diplomacy", "occupation", "campaign", "ai"].forEach(function (field) {
      if (!contracts.isPlainObject(deps.balance[field])) throw new TypeError("Production balance is missing " + field + ".");
    });
    game.combat.validateConfig(deps.balance.combat);
    game.diplomacy.validateConfig(deps.balance.diplomacy);
    game.occupation.validateConfig(deps.balance.occupation);
    game["quiz-rewards"].validateConfig(deps.balance.quizRewards);
    game.recruitment.createHandlers(deps.balance.economy.recruitment);
    var provinceIds = deps.provinces.map(function (province) { return province.id; }).sort();
    if (new Set(provinceIds).size !== provinceIds.length || JSON.stringify(Object.keys(deps.adjacency).sort()) !== JSON.stringify(provinceIds)) throw new RangeError("Campaign province and adjacency IDs must be unique and identical.");
    deps.provinces.forEach(function (province) {
      if (!contracts.isPlainObject(province) || typeof province.id !== "string" || typeof province.region !== "string" || typeof province.trait !== "string" || !Object.prototype.hasOwnProperty.call(deps.balance.campaign.capacityByTier, province.capacityTier) || !Object.prototype.hasOwnProperty.call(deps.balance.combat.terrain, province.terrain)) throw new RangeError("Campaign province definition is invalid.");
      var neighbors = deps.adjacency[province.id];
      if (!Array.isArray(neighbors) || new Set(neighbors).size !== neighbors.length || neighbors.some(function (neighborId) { return neighborId === province.id || provinceIds.indexOf(neighborId) === -1 || deps.adjacency[neighborId].indexOf(province.id) === -1; })) throw new RangeError("Campaign adjacency must be symmetric and reference known provinces.");
    });
    ["small", "medium", "large"].forEach(function (tier) { requireInteger(deps.balance.campaign.capacityByTier[tier], "campaign.capacityByTier." + tier, 1); });
    ["initialCivilianRate", "initialMilitaryRate", "initialFieldRate", "autoRecruitCivilianRate", "autoRecruitResourceFraction", "militaryTargetRate", "attackForceRate", "defenseForceRate"].forEach(function (field) { requireRate(deps.balance.campaign[field], "campaign." + field, 0, 1); });
    if (deps.balance.campaign.initialCivilianRate + deps.balance.campaign.initialMilitaryRate > 1) throw new RangeError("Initial campaign population rates exceed capacity.");
    ["actionPointsPerTurn", "baseTradeRoutes", "provincesPerTradeRoute", "autoRecruitBatchLimit", "minimumBattleForce", "minimumMoveForce", "maximumActiveFronts", "noWarThroughTurn", "warningDelayTurns", "eventLogLimit"].forEach(function (field) { requireInteger(deps.balance.campaign[field], "campaign." + field, field === "noWarThroughTurn" ? 0 : 1); });
    requireRate(deps.balance.campaign.playerAttackBias, "campaign.playerAttackBias", 0.1, 5);
    if (deps.balance.campaign.warningDelayTurns !== 1) throw new RangeError("Campaign attack warnings must last exactly one turn.");
    if (deps.balance.ai.stream !== "ai") throw new RangeError("NPC AI must use the ai RNG stream.");
    ["randomVariation", "attackStrengthMinimum", "warningBaseUtility", "tradeBaseUtility", "treatyBaseUtility", "recruitBaseUtility", "reinforceBaseUtility", "unlockBaseUtility", "moveBaseUtility", "waitBaseUtility"].forEach(function (field) { requireRate(deps.balance.ai[field], "ai." + field, 0, field === "randomVariation" ? 1 : 1000); });
    if (JSON.stringify(Object.keys(deps.personalities).sort()) !== JSON.stringify(PERSONALITY_IDS.slice().sort())) throw new RangeError("Campaign must define exactly four approved NPC personalities.");
    PERSONALITY_IDS.forEach(function (id) {
      var personality = deps.personalities[id];
      ["economy", "trade", "treaty", "attack", "defense", "risk"].forEach(function (field) { requireRate(personality[field], "personalities." + id + "." + field, 0, 5); });
    });
    if (deps.victoryRules.schemaVersion !== 1 || JSON.stringify(Object.keys(deps.victoryRules.territoryPoints).sort()) !== JSON.stringify(["large", "medium", "small"])) throw new RangeError("Victory territory tiers are invalid.");
    Object.keys(deps.victoryRules.territoryPoints).forEach(function (tier) { requireInteger(deps.victoryRules.territoryPoints[tier], "victory.territoryPoints." + tier, 1); });
    requireRate(deps.victoryRules.regionControlThreshold, "victory.regionControlThreshold", 0, 1);
    requireRate(deps.victoryRules.nationalControlThreshold, "victory.nationalControlThreshold", 0, 1);
    requireInteger(deps.victoryRules.minimumControlledRegions, "victory.minimumControlledRegions", 1);
    requireInteger(deps.victoryRules.defeatProvinceCount, "victory.defeatProvinceCount", 0);
    if (deps.victoryRules.occupationTurns !== deps.balance.occupation.turns) throw new RangeError("Victory and occupation duration configs disagree.");
    VALIDATED_DEPENDENCIES.add(deps);
    return true;
  }

  function factionTemplate(personality, isPlayer) {
    return {
      isPlayer: isPlayer,
      personality: personality,
      resources: { food: 0, coin: 0 },
      crisis: { food: 0, coin: 0 },
      readiness: { supply: 100, morale: 100 },
      unlockedUnits: ["militia"],
      actionPoints: 0,
      relations: {},
      tradeRoutes: [],
      treatyProposals: [],
      eliminated: false,
      campaignOutcome: null,
    };
  }

  function provinceTemplate(definition, ownerId, config) {
    var capacity = config.capacityByTier[definition.capacityTier];
    if (!Number.isSafeInteger(capacity) || capacity < 1) throw new RangeError("Missing capacity for tier: " + definition.capacityTier);
    var civilians = Math.floor(capacity * config.initialCivilianRate);
    var military = Math.floor(capacity * config.initialMilitaryRate);
    var field = Math.floor(military * config.initialFieldRate);
    return {
      ownerId: ownerId,
      region: definition.region,
      terrain: definition.terrain,
      capacityTier: definition.capacityTier,
      trait: definition.trait,
      population: { capacity: capacity, civilians: civilians, military: military },
      units: { militia: { field: field, garrison: military - field, training: 0, wounded: 0 } },
      recruitmentQueue: [],
      recoveryQueue: [],
      occupation: null,
    };
  }

  function createCampaign(options, deps) {
    requireDependencies(deps);
    if (!contracts.isPlainObject(options) || typeof options.playerProvinceId !== "string") throw new TypeError("Campaign options are invalid.");
    var provinceIds = deps.provinces.map(function (province) { return province.id; });
    if (provinceIds.indexOf(options.playerProvinceId) === -1) throw new RangeError("Player starting province is unknown.");
    var state = contracts.createInitialState({ campaignId: options.campaignId || "conquest-campaign", seed: options.seed || "conquest-seed", phase: "start" });
    deps.provinces.slice().sort(function (left, right) { return left.id < right.id ? -1 : 1; }).forEach(function (definition, index) {
      var ownerId = definition.id === options.playerProvinceId ? "player" : "npc-" + definition.id;
      var personality = ownerId === "player" ? "expansionist" : PERSONALITY_IDS[index % PERSONALITY_IDS.length];
      state.factions[ownerId] = factionTemplate(personality, ownerId === "player");
      state.provinces[definition.id] = provinceTemplate(definition, ownerId, deps.balance.campaign);
    });
    state.factions = game.diplomacy.initializeFactions(state.factions);
    return state;
  }

  function ownedProvinceIds(state, factionId) {
    return Object.keys(state.provinces).sort().filter(function (provinceId) { return state.provinces[provinceId].ownerId === factionId; });
  }

  function safeAdd(left, right, name) {
    if (!Number.isSafeInteger(left) || !Number.isSafeInteger(right) || !Number.isSafeInteger(left + right)) throw new RangeError(name + " exceeded safe integer range.");
    return left + right;
  }

  function routeLimit(state, factionId, deps) {
    return Math.min(
      deps.balance.diplomacy.maxTradeRoutes,
      deps.balance.campaign.baseTradeRoutes + Math.floor(ownedProvinceIds(state, factionId).length / deps.balance.campaign.provincesPerTradeRoute)
    );
  }

  function processRecovery(province) {
    var events = [];
    var pending = [];
    province.recoveryQueue.forEach(function (entry) {
      entry.remainingTurns -= 1;
      if (entry.remainingTurns > 0) {
        pending.push(entry);
        return;
      }
      Object.keys(entry.units).forEach(function (unitId) {
        if (!province.units[unitId]) province.units[unitId] = { field: 0, garrison: 0, training: 0, wounded: 0 };
        province.units[unitId].wounded -= entry.units[unitId];
        province.units[unitId].garrison += entry.units[unitId];
      });
      events.push({ type: "WOUNDED_RECOVERED", payload: { count: casualties.countUnits(entry.units) } });
    });
    province.recoveryQueue = pending;
    return events;
  }

  function quizEffectsForFaction(state, factionId) {
    return state.effects.filter(function (effect) {
      return (effect.type === "quiz-production" || effect.type === "quiz-unlock-discount") && effect.factionId === factionId;
    });
  }

  function productionEffectFactors(state, factionId) {
    var factors = { food: 1, coin: 1 };
    quizEffectsForFaction(state, factionId).forEach(function (effect) {
      if (effect.type !== "quiz-production") return;
      factors[effect.resource] *= effect.multiplier;
      if (!Number.isFinite(factors[effect.resource]) || factors[effect.resource] < 0) throw new RangeError("Quiz production multiplier is invalid.");
    });
    return factors;
  }

  function processEconomy(next, deps) {
    var events = [];
    var productionByFaction = {};
    var upkeepByFaction = {};
    Object.keys(next.factions).forEach(function (factionId) {
      productionByFaction[factionId] = { food: 0, coin: 0 };
      upkeepByFaction[factionId] = { food: 0, coin: 0 };
      next.factions[factionId].actionPoints = deps.balance.campaign.actionPointsPerTurn;
    });
    Object.keys(next.provinces).sort().forEach(function (provinceId) {
      var province = next.provinces[provinceId];
      processRecovery(province).forEach(function (event) { event.payload.provinceId = provinceId; events.push(event); });
      var queue = game.recruitment.processRecruitmentQueue(province);
      next.provinces[provinceId] = queue.province;
      province = next.provinces[provinceId];
      queue.events.forEach(function (event) { event.payload.provinceId = provinceId; events.push(event); });
      var occupationModifiers = game.occupation.modifiers(province, deps.balance.occupation);
      var growth = game.population.applyGrowth(province.population, { effects: occupationModifiers.growth }, deps.balance.economy.population);
      province.population = growth.population;
      var quizFactors = productionEffectFactors(next, province.ownerId);
      var production = game.economy.calculateProduction(province, { foodEffects: occupationModifiers.production * quizFactors.food, coinEffects: occupationModifiers.production * quizFactors.coin }, deps.balance.economy.production);
      productionByFaction[province.ownerId].food += production.food;
      productionByFaction[province.ownerId].coin += production.coin;
      var upkeep = game.economy.calculateUpkeep(province, deps.balance.economy.upkeep);
      upkeepByFaction[province.ownerId].food += upkeep.food;
      upkeepByFaction[province.ownerId].coin += upkeep.coin;
    });
    Object.keys(next.factions).sort().forEach(function (factionId) {
      var faction = next.factions[factionId];
      faction.resources.food = safeAdd(faction.resources.food, productionByFaction[factionId].food, "Campaign food production");
      faction.resources.coin = safeAdd(faction.resources.coin, productionByFaction[factionId].coin, "Campaign coin production");
      var settled = game.economy.settleUpkeep(faction, upkeepByFaction[factionId], deps.balance.economy.shortage);
      next.factions[factionId] = settled.faction;
      if (settled.breakdown.desertionRate > 0) {
        ownedProvinceIds(next, factionId).forEach(function (provinceId) {
          if (activeBattleForProvince(next, provinceId)) return;
          var desertion = game.economy.applyDesertion(next.provinces[provinceId], settled.breakdown.desertionRate, deps.balance.economy.desertion);
          next.provinces[provinceId] = desertion.province;
        });
      }
    });
    return { productionByFaction: productionByFaction, events: events };
  }

  function validProductionByFaction(productionByFaction, factions) {
    if (!contracts.isPlainObject(productionByFaction)) return false;
    var factionIds = Object.keys(factions).sort();
    if (JSON.stringify(Object.keys(productionByFaction).sort()) !== JSON.stringify(factionIds)) return false;
    return factionIds.every(function (factionId) {
      var snapshot = productionByFaction[factionId];
      return contracts.isPlainObject(snapshot) &&
        JSON.stringify(Object.keys(snapshot).sort()) === JSON.stringify(["coin", "food"]) &&
        Number.isFinite(snapshot.food) && snapshot.food >= 0 &&
        Number.isFinite(snapshot.coin) && snapshot.coin >= 0;
    });
  }

  function captureOccupations(state) {
    return Object.keys(state.provinces).sort().filter(function (provinceId) {
      return state.provinces[provinceId].occupation !== null;
    }).map(function (provinceId) {
      var occupation = state.provinces[provinceId].occupation;
      return { provinceId: provinceId, occupierId: occupation.occupierId, startedTurn: occupation.startedTurn };
    });
  }

  function advanceOccupationDirect(next, tokens) {
    var events = [];
    tokens.forEach(function (token) {
      var provinceId = token.provinceId;
      var occupation = next.provinces[provinceId].occupation;
      if (!occupation || occupation.occupierId !== token.occupierId || occupation.startedTurn !== token.startedTurn) return;
      occupation.remainingTurns -= 1;
      if (occupation.remainingTurns <= 0) {
        next.provinces[provinceId].occupation = null;
        events.push({ type: "OCCUPATION_ENDED", payload: { provinceId: provinceId } });
      } else {
        events.push({ type: "OCCUPATION_ADVANCED", payload: { provinceId: provinceId, remainingTurns: occupation.remainingTurns } });
      }
    });
    return events;
  }

  function pruneTradeRoutesDirect(next, deps) {
    var events = [];
    var removed = Object.create(null);
    Object.keys(next.factions).sort().forEach(function (factionId) {
      next.factions[factionId].tradeRoutes.forEach(function (route) {
        if (!next.provinces[route.sourceProvinceId] || !next.provinces[route.targetProvinceId] || next.provinces[route.sourceProvinceId].ownerId !== route.fromFactionId || next.provinces[route.targetProvinceId].ownerId !== route.toFactionId) removed[route.id] = "ownership";
      });
    });
    Object.keys(next.factions).sort().forEach(function (factionId) {
      var retained = next.factions[factionId].tradeRoutes.filter(function (route) { return !removed[route.id]; }).slice().sort(function (left, right) { return left.id < right.id ? -1 : 1; });
      var limit = routeLimit(next, factionId, deps);
      retained.slice(limit).forEach(function (route) { removed[route.id] = "capacity"; });
    });
    Object.keys(next.factions).forEach(function (factionId) {
      next.factions[factionId].tradeRoutes = next.factions[factionId].tradeRoutes.filter(function (route) { return !removed[route.id]; });
    });
    Object.keys(removed).sort().forEach(function (routeId) { events.push({ type: "TRADE_ROUTE_REMOVED", payload: { routeId: routeId, reason: removed[routeId] } }); });
    return events;
  }

  function settleTradesDirect(next, deps) {
    var processed = Object.create(null);
    var events = pruneTradeRoutesDirect(next, deps);
    Object.keys(next.factions).sort().forEach(function (factionId) {
      next.factions[factionId].tradeRoutes.forEach(function (route) {
        if (processed[route.id]) return;
        processed[route.id] = true;
        var peaceful = next.factions[route.fromFactionId].relations[route.toFactionId].status !== "war";
        var active = peaceful && !activeBattleForProvince(next, route.sourceProvinceId) && !activeBattleForProvince(next, route.targetProvinceId);
        [route.fromFactionId, route.toFactionId].forEach(function (id) {
          var own = next.factions[id].tradeRoutes.find(function (item) { return item.id === route.id; });
          own.active = active;
          if (active) next.factions[id].resources.coin = safeAdd(next.factions[id].resources.coin, deps.balance.diplomacy.tradeCoinPerTurn, "Trade coin");
        });
        if (active) {
          var relation = next.factions[route.fromFactionId].relations[route.toFactionId];
          relationPair(next, route.fromFactionId, route.toFactionId, { score: Math.min(deps.balance.diplomacy.relationMaximum, relation.score + deps.balance.diplomacy.tradeRelationGain) });
        }
        events.push({ type: "TRADE_SETTLED", payload: { routeId: route.id, active: active } });
      });
    });
    return events;
  }

  function relationPair(next, leftId, rightId, values) {
    [[leftId, rightId], [rightId, leftId]].forEach(function (pair) {
      Object.keys(values).forEach(function (key) { next.factions[pair[0]].relations[pair[1]][key] = values[key]; });
    });
  }

  function activeBattleForProvince(state, provinceId) {
    return Object.keys(state.battles).some(function (battleId) {
      var battle = state.battles[battleId];
      return battle.status === "active" && (battle.sourceProvinceId === provinceId || battle.targetProvinceId === provinceId);
    });
  }

  function pendingWarningForProvince(state, provinceId) {
    return state.effects.some(function (effect) {
      return effect.type === "attack-warning" && (effect.sourceProvinceId === provinceId || effect.targetProvinceId === provinceId);
    });
  }

  function createAttackWarning(next, payload, deps) {
    if (next.turn <= deps.balance.campaign.noWarThroughTurn) return null;
    var frontLimit = deps.balance.campaign.maximumActiveFronts + Math.floor(ownedProvinceIds(next, payload.factionId).length / 5);
    var defenderFrontLimit = next.factions[payload.defenderId] ? deps.balance.campaign.maximumActiveFronts + Math.floor(ownedProvinceIds(next, payload.defenderId).length / 5) : 0;
    if (!next.provinces[payload.sourceProvinceId] || !next.provinces[payload.targetProvinceId] || next.provinces[payload.sourceProvinceId].ownerId !== payload.factionId || next.provinces[payload.targetProvinceId].ownerId !== payload.defenderId || (deps.adjacency[payload.sourceProvinceId] || []).indexOf(payload.targetProvinceId) === -1 || activeBattleForProvince(next, payload.sourceProvinceId) || activeBattleForProvince(next, payload.targetProvinceId) || pendingWarningForProvince(next, payload.sourceProvinceId) || pendingWarningForProvince(next, payload.targetProvinceId) || game["npc-ai"].activeFronts(next, payload.factionId) >= frontLimit || game["npc-ai"].activeFronts(next, payload.defenderId) >= defenderFrontLimit) return null;
    var relation = next.factions[payload.factionId] && next.factions[payload.factionId].relations[payload.defenderId];
    if (!relation || relation.status === "alliance" || relation.status === "non-aggression") return null;
    var id = "warning-" + next.turn + "-" + payload.sourceProvinceId + "-" + payload.targetProvinceId;
    if (next.effects.some(function (effect) { return effect.type === "attack-warning" && effect.id === id; })) return null;
    var warning = { type: "attack-warning", id: id, attackerId: payload.factionId, defenderId: payload.defenderId, sourceProvinceId: payload.sourceProvinceId, targetProvinceId: payload.targetProvinceId, createdTurn: next.turn, executeTurn: safeAdd(next.turn, deps.balance.campaign.warningDelayTurns, "Attack warning turn") };
    next.effects.push(warning);
    return { type: "ATTACK_WARNING_CREATED", payload: contracts.cloneJson(warning) };
  }

  function createRouteDirect(next, payload, deps) {
    var left = next.factions[payload.factionId];
    var right = next.factions[payload.partnerId];
    if (!left || !right || !next.provinces[payload.sourceProvinceId] || !next.provinces[payload.targetProvinceId] || next.provinces[payload.sourceProvinceId].ownerId !== payload.factionId || next.provinces[payload.targetProvinceId].ownerId !== payload.partnerId || (deps.adjacency[payload.sourceProvinceId] || []).indexOf(payload.targetProvinceId) === -1 || left.tradeRoutes.length >= routeLimit(next, payload.factionId, deps) || right.tradeRoutes.length >= routeLimit(next, payload.partnerId, deps) || left.relations[payload.partnerId].status === "war" || left.relations[payload.partnerId].score < deps.balance.diplomacy.tradeRelationMinimum) return null;
    var existing = left.tradeRoutes.some(function (route) { return route.toFactionId === payload.partnerId || route.fromFactionId === payload.partnerId; });
    if (existing) return null;
    var id = "route-" + [payload.factionId, payload.partnerId].sort().join("-");
    var route = { id: id, fromFactionId: payload.factionId, toFactionId: payload.partnerId, sourceProvinceId: payload.sourceProvinceId, targetProvinceId: payload.targetProvinceId, active: true };
    left.tradeRoutes.push(route);
    right.tradeRoutes.push(contracts.cloneJson(route));
    var score = Math.min(deps.balance.diplomacy.relationMaximum, left.relations[payload.partnerId].score + deps.balance.diplomacy.tradeRelationGain);
    relationPair(next, payload.factionId, payload.partnerId, { score: score });
    return { type: "TRADE_ROUTE_CREATED", payload: route };
  }

  function createTreatyDirect(next, payload, deps) {
    var left = next.factions[payload.factionId];
    var right = next.factions[payload.partnerId];
    if (!left || !right) return null;
    var status = payload.treatyType;
    var currentStatus = left.relations[payload.partnerId].status;
    var minimum = status === "alliance" ? deps.balance.diplomacy.allianceRelationMinimum : deps.balance.diplomacy.nonAggressionRelationMinimum;
    if ((status !== "alliance" && status !== "non-aggression") || left.relations[payload.partnerId].score < minimum || (status === "non-aggression" && currentStatus !== "neutral") || (status === "alliance" && currentStatus !== "neutral" && currentStatus !== "non-aggression")) return null;
    var limit = status === "alliance" ? deps.balance.diplomacy.maxAlliances : deps.balance.diplomacy.maxNonAggressionTreaties;
    var count = function (faction) { return Object.keys(faction.relations).filter(function (id) { return faction.relations[id].status === status; }).length; };
    if (count(left) >= limit || count(right) >= limit) return null;
    var untilTurn = safeAdd(next.turn, deps.balance.diplomacy.treatyDuration, "Treaty expiry turn");
    relationPair(next, payload.factionId, payload.partnerId, { status: status, untilTurn: untilTurn });
    return { type: "TREATY_CHANGED", payload: { fromFactionId: payload.factionId, toFactionId: payload.partnerId, status: status, untilTurn: untilTurn } };
  }

  function proposeTreatyDirect(next, payload, deps) {
    var proposalId = "proposal-" + next.turn + "-" + payload.factionId + "-" + payload.partnerId + "-" + payload.treatyType;
    var result;
    try {
      result = game.diplomacy.proposeTreaty(next, { id: proposalId, type: payload.treatyType, fromFactionId: payload.factionId, toFactionId: payload.partnerId, turn: next.turn }, deps.balance.diplomacy);
    } catch (_caught) {
      return null;
    }
    next.factions = result.state.factions;
    return result.event;
  }

  function respondTreatyDirect(next, payload, deps) {
    var proposal = null;
    Object.keys(next.factions).some(function (factionId) {
      proposal = next.factions[factionId].treatyProposals.find(function (entry) { return entry.id === payload.proposalId; }) || null;
      return proposal !== null;
    });
    if (!proposal || proposal.toFactionId !== payload.factionId || typeof payload.accepted !== "boolean") return null;
    var result;
    try {
      result = game.diplomacy.respondTreaty(next, payload.proposalId, payload.accepted, next.turn, deps.balance.diplomacy);
    } catch (_caught) {
      return null;
    }
    next.factions = result.state.factions;
    return result.event;
  }

  function recruitDirect(next, payload, deps) {
    var faction = next.factions[payload.factionId];
    var province = next.provinces[payload.provinceId];
    if (!faction || !province || province.ownerId !== payload.factionId || province.occupation || payload.count < 1) return null;
    var queued = ownedProvinceIds(next, payload.factionId).reduce(function (total, provinceId) { return total + next.provinces[provinceId].recruitmentQueue.length; }, 0);
    var unitId = payload.unitId || "militia";
    var result = game.recruitment.queueRecruitment(province, faction, { actionId: "auto-recruit-" + next.turn + "-" + payload.factionId + "-" + queued, unitId: unitId, count: payload.count }, { phase: "action", factionId: payload.factionId, provinceId: payload.provinceId }, deps.balance.economy.recruitment);
    if (!result.ok) return null;
    next.provinces[payload.provinceId] = result.province;
    next.factions[payload.factionId] = result.faction;
    return result.event;
  }

  function unlockDirect(next, payload, deps) {
    var faction = next.factions[payload.factionId];
    if (!faction) return null;
    var recruitmentConfig = contracts.cloneJson(deps.balance.economy.recruitment);
    if (recruitmentConfig.unlocks[payload.unitId]) {
      var discount = quizEffectsForFaction(next, payload.factionId).filter(function (effect) { return effect.type === "quiz-unlock-discount"; }).reduce(function (factor, effect) { return factor * effect.multiplier; }, 1);
      var discountedCost = Math.ceil(recruitmentConfig.unlocks[payload.unitId].coinCost * discount);
      if (!Number.isSafeInteger(discountedCost) || discountedCost < 0) throw new RangeError("Discounted unlock cost is invalid.");
      recruitmentConfig.unlocks[payload.unitId].coinCost = discountedCost;
    }
    var result = game.recruitment.unlockUnit(faction, { actionId: "auto-unlock-" + next.turn + "-" + payload.factionId + "-" + payload.unitId, unitId: payload.unitId }, { phase: "action", turn: next.turn, ownedProvinceCount: ownedProvinceIds(next, payload.factionId).length, factionId: payload.factionId }, recruitmentConfig);
    if (!result.ok) return null;
    next.factions[payload.factionId] = result.faction;
    return result.event;
  }

  function battleReservation(next, battleId) {
    return next.effects.find(function (effect) { return effect.type === "battle-reservation" && effect.battleId === battleId; }) || null;
  }

  function addUnitMaps(target, units, name) {
    Object.keys(units).forEach(function (unitId) {
      target[unitId] = safeAdd(target[unitId] || 0, units[unitId], name);
    });
    return target;
  }

  function reservedUnits(reservation, side) {
    var result = contracts.cloneJson(reservation[side].units);
    (reservation.pending || []).filter(function (entry) { return entry.side === side; }).forEach(function (entry) {
      addUnitMaps(result, entry.units, "Pending reinforcement reservation");
    });
    return result;
  }

  function reinforceDirect(next, payload, deps) {
    var battle = next.battles[payload.battleId];
    var faction = next.factions[payload.factionId];
    if (!battle || battle.status !== "active" || !faction || !contracts.isPlainObject(payload.units)) return null;
    var side = battle.attacker.factionId === payload.factionId ? "attacker" : battle.defender.factionId === payload.factionId ? "defender" : null;
    var reservation = battleReservation(next, payload.battleId);
    if (!side || !reservation) return null;
    var provinceId = reservation[side].provinceId;
    var province = next.provinces[provinceId];
    if (!province || province.ownerId !== payload.factionId) return null;
    var reserved = reservedUnits(reservation, side);
    var total = 0;
    var units = {};
    var valid = Object.keys(payload.units).length > 0 && Object.keys(payload.units).every(function (unitId) {
      var count = payload.units[unitId];
      var unit = province.units[unitId];
      if (!unit || !Number.isSafeInteger(count) || count < 0 || count > unit.field + unit.garrison - (reserved[unitId] || 0)) return false;
      if (count > 0) {
        units[unitId] = count;
        total = safeAdd(total, count, "Campaign reinforcement force");
      }
      return true;
    });
    if (!valid || total < 1) return null;
    var requestId = "rf-" + next.turn + "-" + side + "-" + battle.reinforcementQueue.length;
    var queued;
    try {
      queued = game.combat.queueReinforcement(battle, side, units, requestId, deps.balance.combat);
    } catch (_caught) {
      return null;
    }
    next.battles[payload.battleId] = queued;
    if (!Array.isArray(reservation.pending)) reservation.pending = [];
    reservation.pending.push({ requestId: requestId, side: side, units: contracts.cloneJson(units) });
    return { type: "BATTLE_REINFORCEMENT_QUEUED", payload: { battleId: payload.battleId, factionId: payload.factionId, side: side, provinceId: provinceId, units: contracts.cloneJson(units), count: total, arrivalTurn: queued.reinforcementQueue.find(function (entry) { return entry.requestId === requestId; }).arrivalTurn, requestId: requestId } };
  }

  function moveDirect(next, payload, deps) {
    var faction = next.factions[payload.factionId];
    var source = next.provinces[payload.sourceProvinceId];
    var target = next.provinces[payload.targetProvinceId];
    if (!faction || !source || !target || source.ownerId !== payload.factionId || target.ownerId !== payload.factionId || !source.units[payload.unitId] || !Number.isSafeInteger(payload.count) || payload.count < deps.balance.campaign.minimumMoveForce || (deps.adjacency[payload.sourceProvinceId] || []).indexOf(payload.targetProvinceId) === -1 || activeBattleForProvince(next, payload.sourceProvinceId) || activeBattleForProvince(next, payload.targetProvinceId) || pendingWarningForProvince(next, payload.sourceProvinceId) || pendingWarningForProvince(next, payload.targetProvinceId)) return null;
    var available = source.units[payload.unitId].field + source.units[payload.unitId].garrison;
    var capacityAvailable = target.population.capacity - target.population.civilians - target.population.military;
    if (payload.count > available || payload.count > capacityAvailable) return null;
    var nextSource = contracts.cloneJson(source);
    var nextTarget = contracts.cloneJson(target);
    if (!nextTarget.units[payload.unitId]) nextTarget.units[payload.unitId] = { field: 0, garrison: 0, training: 0, wounded: 0 };
    var fromField = Math.min(nextSource.units[payload.unitId].field, payload.count);
    nextSource.units[payload.unitId].field -= fromField;
    nextSource.units[payload.unitId].garrison -= payload.count - fromField;
    nextSource.population.military -= payload.count;
    nextTarget.units[payload.unitId].garrison += payload.count;
    nextTarget.population.military += payload.count;
    next.provinces[payload.sourceProvinceId] = nextSource;
    next.provinces[payload.targetProvinceId] = nextTarget;
    return { type: "TROOPS_MOVED", payload: { factionId: payload.factionId, sourceProvinceId: payload.sourceProvinceId, targetProvinceId: payload.targetProvinceId, unitId: payload.unitId, count: payload.count } };
  }

  function applyDecision(next, action, deps) {
    if (!action || action.type === "WAIT") return { applied: true, event: null };
    if (!contracts.isPlainObject(action.payload) || typeof action.payload.factionId !== "string" || !next.factions[action.payload.factionId] || next.factions[action.payload.factionId].actionPoints < 1) return { applied: false, event: null };
    var event = null;
    if (action.type === "RECRUIT") event = recruitDirect(next, action.payload, deps);
    else if (action.type === "UNLOCK") event = unlockDirect(next, action.payload, deps);
    else if (action.type === "MOVE") event = moveDirect(next, action.payload, deps);
    else if (action.type === "REINFORCE") event = reinforceDirect(next, action.payload, deps);
    else if (action.type === "TRADE") event = createRouteDirect(next, action.payload, deps);
    else if (action.type === "TREATY") event = createTreatyDirect(next, action.payload, deps);
    else if (action.type === "PROPOSE_TREATY") event = proposeTreatyDirect(next, action.payload, deps);
    else if (action.type === "RESPOND_TREATY") event = respondTreatyDirect(next, action.payload, deps);
    else if (action.type === "WARN_ATTACK") event = createAttackWarning(next, action.payload, deps);
    else return { applied: false, event: null };
    if (event !== null && action.type !== "RECRUIT" && action.type !== "UNLOCK") next.factions[action.payload.factionId].actionPoints -= 1;
    return { applied: event !== null, event: event };
  }

  function applyPlayerActionsDirect(next, playerId, actions, deps) {
    var events = [];
    actions.forEach(function (action) {
      if (!contracts.isPlainObject(action) || typeof action.type !== "string" || !contracts.isPlainObject(action.payload) || action.payload.factionId !== playerId) throw new RangeError("Player action cannot control another faction.");
      var applied = applyDecision(next, action, deps);
      if (action.type !== "WAIT" && !applied.applied) throw new RangeError("Player campaign action is not legal in the prepared state: " + action.type);
      if (applied.event) events.push(applied.event);
    });
    return events;
  }

  function validatePlayerActions(state, playerId, actions, deps) {
    requireDependencies(deps);
    if (!contracts.isPlainObject(state) || state.phase !== "action") throw new RangeError("Player action validation requires the action phase.");
    if (typeof playerId !== "string" || !state.factions[playerId] || state.factions[playerId].isPlayer !== true) throw new RangeError("Player faction is invalid.");
    if (!Array.isArray(actions)) throw new TypeError("Player actions must be an array.");
    var availableActionPoints = state.factions[playerId].actionPoints;
    if (!Number.isSafeInteger(availableActionPoints) || availableActionPoints < 0 || actions.length > availableActionPoints || actions.length > deps.balance.campaign.actionPointsPerTurn) throw new RangeError("Player action count exceeds the available action-point budget.");
    var next = contracts.cloneGameState(state);
    applyPlayerActionsDirect(next, playerId, actions, deps);
    return true;
  }

  function readyStacks(province) {
    var stacks = {};
    Object.keys(province.units).sort().forEach(function (unitId) {
      var count = province.units[unitId].field + province.units[unitId].garrison;
      if (count > 0) stacks[unitId] = count;
    });
    return stacks;
  }

  function battleStacksFromProvince(province, count) {
    var available = readyStacks(province);
    var total = casualties.countUnits(available);
    return casualties.allocateInteger(Math.max(1, Math.min(total, count)), available);
  }

  function executeWarnings(next, deps) {
    var events = [];
    var pending = [];
    var reservations = [];
    next.effects.forEach(function (effect) {
      if (effect.type !== "attack-warning" || effect.executeTurn > next.turn) {
        pending.push(effect);
        return;
      }
      var source = next.provinces[effect.sourceProvinceId];
      var target = next.provinces[effect.targetProvinceId];
      var valid = source && target && source.ownerId === effect.attackerId && target.ownerId === effect.defenderId && (deps.adjacency[effect.sourceProvinceId] || []).indexOf(effect.targetProvinceId) !== -1 && !activeBattleForProvince(next, effect.sourceProvinceId) && !activeBattleForProvince(next, effect.targetProvinceId);
      if (!valid) {
        events.push({ type: "ATTACK_WARNING_CANCELLED", payload: { warningId: effect.id } });
        return;
      }
      var attackReady = casualties.countUnits(readyStacks(source));
      var defendReady = casualties.countUnits(readyStacks(target));
      var attackBias = next.factions[effect.attackerId].isPlayer ? deps.balance.campaign.playerAttackBias : 1;
      var attackCount = Math.floor(attackReady * deps.balance.campaign.attackForceRate);
      var defendCount = Math.floor(defendReady * deps.balance.campaign.defenseForceRate / attackBias);
      if (attackCount < deps.balance.campaign.minimumBattleForce || defendCount < 1) {
        events.push({ type: "ATTACK_WARNING_CANCELLED", payload: { warningId: effect.id } });
        return;
      }
      var relation = next.factions[effect.attackerId].relations[effect.defenderId];
      var betrayed = relation.status === "alliance" || relation.status === "non-aggression";
      relationPair(next, effect.attackerId, effect.defenderId, { status: "war", untilTurn: null, score: Math.max(deps.balance.diplomacy.relationMinimum, relation.score - (betrayed ? deps.balance.diplomacy.betrayalPenalty : 20)), betrayalUntilTurn: betrayed ? safeAdd(next.turn, deps.balance.diplomacy.betrayalLockTurns, "Betrayal lock turn") : relation.betrayalUntilTurn });
      [effect.attackerId, effect.defenderId].forEach(function (factionId) {
        next.factions[factionId].tradeRoutes.forEach(function (route) {
          if ((route.fromFactionId === effect.attackerId && route.toFactionId === effect.defenderId) || (route.fromFactionId === effect.defenderId && route.toFactionId === effect.attackerId)) route.active = false;
        });
      });
      events.push({ type: "WAR_DECLARED", payload: { attackerId: effect.attackerId, defenderId: effect.defenderId, turn: next.turn, betrayedTreaty: betrayed } });
      var battleId = "battle-" + next.turn + "-" + effect.sourceProvinceId + "-" + effect.targetProvinceId;
      var attackerStacks = battleStacksFromProvince(source, attackCount);
      var defenderStacks = battleStacksFromProvince(target, defendCount);
      next.battles[battleId] = game.combat.createBattle({
        id: battleId,
        sourceProvinceId: effect.sourceProvinceId,
        targetProvinceId: effect.targetProvinceId,
        terrain: Object.prototype.hasOwnProperty.call(deps.balance.combat.terrain, target.terrain) ? target.terrain : "plains",
        fortification: 40,
        attacker: { factionId: effect.attackerId, units: attackerStacks },
        defender: { factionId: effect.defenderId, units: defenderStacks },
      }, deps.balance.combat);
      reservations.push({ type: "battle-reservation", battleId: battleId, attacker: { provinceId: effect.sourceProvinceId, units: contracts.cloneJson(attackerStacks) }, defender: { provinceId: effect.targetProvinceId, units: contracts.cloneJson(defenderStacks) }, pending: [] });
      events.push({ type: "BATTLE_STARTED", payload: { battleId: battleId, warningId: effect.id, attackerId: effect.attackerId, defenderId: effect.defenderId, sourceProvinceId: effect.sourceProvinceId, targetProvinceId: effect.targetProvinceId } });
    });
    next.effects = pending.concat(reservations);
    return events;
  }

  function woundedByUnit(participant) {
    var result = {};
    participant.woundedQueue.forEach(function (entry) {
      Object.keys(entry.units).forEach(function (unitId) {
        result[unitId] = safeAdd(result[unitId] || 0, entry.units[unitId], "Battle wounded by unit");
      });
    });
    return result;
  }

  function reconcileParticipantProvince(province, participant, role, committedUnits) {
    var wounded = woundedByUnit(participant);
    var unitIds = Object.keys(province.units).concat(Object.keys(participant.units), Object.keys(wounded)).filter(function (unitId, index, all) { return all.indexOf(unitId) === index; }).sort();
    var military = 0;
    province.population.civilians += participant.casualties.routed + participant.casualties.captured;
    unitIds.forEach(function (unitId) {
      var current = province.units[unitId] || { field: 0, garrison: 0, training: 0, wounded: 0 };
      var reserve = Math.max(0, current.field + current.garrison - (committedUnits[unitId] || 0));
      var active = participant.units[unitId] || 0;
      province.units[unitId] = {
        field: role === "attacker" ? active : 0,
        garrison: reserve + (role === "defender" ? active : 0),
        training: current.training,
        wounded: current.wounded + (wounded[unitId] || 0),
      };
      military = safeAdd(military, province.units[unitId].field + province.units[unitId].garrison + province.units[unitId].training + province.units[unitId].wounded, "Reconciled province military");
    });
    province.population.military = military;
    participant.woundedQueue.forEach(function (entry) { province.recoveryQueue.push(contracts.cloneJson(entry)); });
  }

  function establishOccupationGarrison(source, target) {
    var defeatedMilitary = target.population.military;
    target.population.civilians = safeAdd(target.population.civilians, defeatedMilitary, "Defeated military demobilization");
    target.population.military = 0;
    Object.keys(target.units).forEach(function (unitId) {
      target.units[unitId] = { field: 0, garrison: 0, training: 0, wounded: 0 };
    });
    target.recruitmentQueue = [];
    target.recoveryQueue = [];
    var availableCapacity = target.population.capacity - target.population.civilians;
    var transferred = 0;
    Object.keys(source.units).sort().forEach(function (unitId) {
      var count = Math.min(source.units[unitId].field, availableCapacity - transferred);
      if (!target.units[unitId]) target.units[unitId] = { field: 0, garrison: 0, training: 0, wounded: 0 };
      source.units[unitId].field -= count;
      target.units[unitId].garrison += count;
      transferred = safeAdd(transferred, count, "Occupation garrison transfer");
    });
    source.population.military -= transferred;
    target.population.military += transferred;
    return transferred;
  }

  function applyDeliveredReservations(reservation, queuedBeforePulse, result) {
    queuedBeforePulse.filter(function (entry) {
      return !result.battle.reinforcementQueue.some(function (pending) { return pending.requestId === entry.requestId; });
    }).forEach(function (queued) {
      var pendingIndex = reservation.pending.findIndex(function (entry) { return entry.requestId === queued.requestId; });
      if (pendingIndex === -1 || reservation.pending[pendingIndex].side !== queued.side) throw new RangeError("Delivered reinforcement is missing its campaign reservation.");
      addUnitMaps(reservation[queued.side].units, queued.units, "Delivered reinforcement reservation");
      reservation.pending.splice(pendingIndex, 1);
    });
  }

  function cancelUndeliveredReinforcements(reservation, battle) {
    var events = [];
    battle.reinforcementQueue.forEach(function (queued) {
      var pending = reservation.pending.find(function (entry) { return entry.requestId === queued.requestId; });
      if (!pending || pending.side !== queued.side || JSON.stringify(pending.units) !== JSON.stringify(queued.units)) {
        throw new RangeError("Undelivered reinforcement is missing its campaign reservation.");
      }
      events.push({ type: "BATTLE_REINFORCEMENT_CANCELLED", payload: { battleId: battle.id, requestId: queued.requestId, side: queued.side, count: casualties.countUnits(queued.units), reason: "battle-ended" } });
    });
    if (reservation.pending.length !== battle.reinforcementQueue.length) throw new RangeError("Campaign reinforcement reservation is not present in the battle queue.");
    reservation.pending = [];
    battle.reinforcementQueue = [];
    return events;
  }

  function tacticsForBattle(battle, selections, playerId, deps) {
    var tactics = {
      attackerTactic: battle.breach >= deps.balance.combat.fortification.assaultBreachThreshold ? "assault" : battle.fortification.current > 0 ? "siege" : "engage",
      defenderTactic: "engage",
    };
    if (!selections || !Object.prototype.hasOwnProperty.call(selections, battle.id)) return tactics;
    var selection = selections[battle.id];
    var tactic = typeof selection === "string" ? selection : contracts.isPlainObject(selection) ? selection.tactic : null;
    var side = battle.attacker.factionId === playerId ? "attacker" : battle.defender.factionId === playerId ? "defender" : null;
    if (!side || typeof tactic !== "string") throw new RangeError("Battle tactic selection does not belong to the player.");
    tactics[side + "Tactic"] = tactic;
    return tactics;
  }

  function resolveBattles(next, deps, tacticSelections, playerId) {
    var events = [];
    if (tacticSelections !== undefined && !contracts.isPlainObject(tacticSelections)) throw new TypeError("Battle tactic selections must be an object.");
    Object.keys(tacticSelections || {}).forEach(function (battleId) {
      var battle = next.battles[battleId];
      if (!battle || battle.status !== "active" || (battle.attacker.factionId !== playerId && battle.defender.factionId !== playerId)) throw new RangeError("Battle tactic selection does not belong to an active player front.");
    });
    Object.keys(next.battles).sort().forEach(function (battleId) {
      var battle = next.battles[battleId];
      if (battle.status !== "active") return;
      var reservation = battleReservation(next, battleId);
      if (!reservation) throw new RangeError("Active battle is missing its campaign force reservation.");
      if (!Array.isArray(reservation.pending)) reservation.pending = [];
      var queuedBeforePulse = contracts.cloneJson(battle.reinforcementQueue);
      var result = game.combat.resolvePulse(battle, tacticsForBattle(battle, tacticSelections, playerId, deps), next.rng, deps.balance.combat);
      applyDeliveredReservations(reservation, queuedBeforePulse, result);
      next.battles[battleId] = result.battle;
      next.rng = result.rngState;
      events.push.apply(events, result.events);
      if (result.battle.status === "active") return;
      events.push.apply(events, cancelUndeliveredReinforcements(reservation, result.battle));
      var source = next.provinces[result.battle.sourceProvinceId];
      var target = next.provinces[result.battle.targetProvinceId];
      reconcileParticipantProvince(source, result.battle.attacker, "attacker", reservation.attacker.units);
      reconcileParticipantProvince(target, result.battle.defender, "defender", reservation.defender.units);
      next.effects = next.effects.filter(function (effect) { return effect !== reservation; });
      if (result.battle.status === "attacker-victory") {
        var occupationGarrison = establishOccupationGarrison(source, target);
        var occupied = game.occupation.startOccupation(target, result.battle.attacker.factionId, target.ownerId, next.turn, deps.balance.occupation);
        next.provinces[result.battle.targetProvinceId] = occupied.province;
        occupied.event.payload.provinceId = result.battle.targetProvinceId;
        occupied.event.payload.garrison = occupationGarrison;
        events.push(occupied.event);
      }
    });
    return events;
  }

  function expireTreatiesDirect(next) {
    Object.keys(next.factions).sort().forEach(function (leftId) {
      Object.keys(next.factions[leftId].relations).sort().forEach(function (rightId) {
        if (leftId >= rightId) return;
        var relation = next.factions[leftId].relations[rightId];
        if ((relation.status === "alliance" || relation.status === "non-aggression") && relation.untilTurn !== null && relation.untilTurn < next.turn) relationPair(next, leftId, rightId, { status: "neutral", untilTurn: null });
      });
    });
  }

  function territoryPointsByFaction(state, deps) {
    var points = {};
    Object.keys(state.factions).forEach(function (id) { points[id] = 0; });
    Object.keys(state.provinces).forEach(function (provinceId) {
      var province = state.provinces[provinceId];
      points[province.ownerId] += deps.victoryRules.territoryPoints[province.capacityTier];
    });
    return points;
  }

  function regionalControl(state, factionId, deps) {
    var totals = {};
    var owned = {};
    Object.keys(state.provinces).forEach(function (provinceId) {
      var province = state.provinces[provinceId];
      var points = deps.victoryRules.territoryPoints[province.capacityTier];
      totals[province.region] = (totals[province.region] || 0) + points;
      if (province.ownerId === factionId) owned[province.region] = (owned[province.region] || 0) + points;
    });
    return Object.keys(totals).sort().filter(function (region) { return (owned[region] || 0) / totals[region] > deps.victoryRules.regionControlThreshold; });
  }

  function evaluateOutcome(state, factionId, deps) {
    var provinceCount = ownedProvinceIds(state, factionId).length;
    if (provinceCount === deps.victoryRules.defeatProvinceCount) return { status: "defeat", provinceCount: provinceCount, nationalShare: 0, controlledRegions: [] };
    var points = territoryPointsByFaction(state, deps);
    var total = Object.keys(points).reduce(function (sum, id) { return sum + points[id]; }, 0);
    var share = points[factionId] / total;
    var regions = regionalControl(state, factionId, deps);
    return { status: share >= deps.victoryRules.nationalControlThreshold && regions.length >= deps.victoryRules.minimumControlledRegions ? "victory" : "active", provinceCount: provinceCount, nationalShare: share, controlledRegions: regions };
  }

  function validateCompletedQuiz(quiz) {
    if (!contracts.isPlainObject(quiz) || typeof quiz.id !== "string" || quiz.id.length < 1 || quiz.completed !== true || quiz.position !== QUIZ_SIZE || !Number.isSafeInteger(quiz.score) || quiz.score < 0 || quiz.score > QUIZ_SIZE) return false;
    if (!Array.isArray(quiz.questionIds) || quiz.questionIds.length !== QUIZ_SIZE || new Set(quiz.questionIds).size !== QUIZ_SIZE || quiz.questionIds.some(function (id) { return typeof id !== "string" || id.length < 1; })) return false;
    if (!contracts.isPlainObject(quiz.answers) || Object.keys(quiz.answers).length !== QUIZ_SIZE) return false;
    return Object.keys(quiz.answers).every(function (questionId) {
      return quiz.questionIds.indexOf(questionId) !== -1 && Number.isSafeInteger(quiz.answers[questionId]) && quiz.answers[questionId] >= 0 && quiz.answers[questionId] <= 3;
    });
  }

  function completedQuizForTurn(state, input, factionId) {
    var activeQuiz = contracts.isPlainObject(state.quiz) && contracts.isPlainObject(state.quiz.active) ? state.quiz.active : null;
    var quiz = activeQuiz;
    if (input.quizProof !== undefined) {
      if (!contracts.isPlainObject(input.quizProof) || input.quizProof.turn !== state.turn || input.quizProof.factionId !== factionId || !contracts.isPlainObject(input.quizProof.quiz)) {
        throw new RangeError("Campaign turn requires a quiz proof for the current turn and player faction.");
      }
      quiz = input.quizProof.quiz;
      if (activeQuiz && JSON.stringify(contracts.cloneJson(activeQuiz)) !== JSON.stringify(contracts.cloneJson(quiz))) throw new RangeError("Quiz proof does not match the active campaign quiz.");
    }
    if (!validateCompletedQuiz(quiz)) throw new RangeError("Campaign turn requires a completed ten-question quiz proof.");
    if (Object.prototype.hasOwnProperty.call(input, "quizScore") && input.quizScore !== quiz.score) throw new RangeError("Legacy quizScore does not match the completed quiz proof.");
    return quiz;
  }

  function applyQuizProfile(next, input, quiz, productionByFaction, deps) {
    var factionId = input.playerFactionId || "player";
    var provinces = ownedProvinceIds(next, factionId);
    if (provinces.length === 0) return null;
    var province = next.provinces[provinces[0]];
    var faction = next.factions[factionId];
    var outcome = game["quiz-rewards"].evaluateScore(quiz.score, { factionId: factionId, resources: faction.resources, production: productionByFaction[factionId], capacityAvailable: province.population.capacity - province.population.civilians - province.population.military, choice: input.quizChoice || "food" }, deps.balance.quizRewards);
    outcome.quizId = quiz.id;
    ["food", "coin"].forEach(function (resource) { faction.resources[resource] = Math.max(0, safeAdd(faction.resources[resource], outcome.resourceDeltas[resource], "Quiz campaign resource")); });
    province.population.civilians += outcome.populationDelta;
    outcome.effects.forEach(function (effect, index) {
      var id = "quiz-effect-" + next.turn + "-" + factionId + "-" + index;
      if (effect.type === "production") {
        next.effects.push({ type: "quiz-production", id: id, factionId: factionId, resource: effect.resource, multiplier: effect.multiplier, remainingTurns: effect.remainingTurns });
      } else if (effect.type === "unlock-discount") {
        next.effects.push({ type: "quiz-unlock-discount", id: id, factionId: factionId, multiplier: effect.multiplier, remainingTurns: effect.remainingTurns });
      }
    });
    return { type: "QUIZ_REWARD_APPLIED", payload: outcome };
  }

  function advanceQuizEffects(next, effectIds) {
    var idSet = new Set(effectIds);
    next.effects = next.effects.filter(function (effect) {
      if (!idSet.has(effect.id)) return true;
      effect.remainingTurns -= 1;
      return effect.remainingTurns > 0;
    });
  }

  function aiContext(next, deps) {
    var campaignConfig = contracts.cloneJson(deps.balance.campaign);
    campaignConfig.baseMaximumActiveFronts = deps.balance.campaign.maximumActiveFronts;
    return { adjacency: deps.adjacency, personalities: deps.personalities, config: deps.balance.ai, campaignConfig: campaignConfig, diplomacyConfig: deps.balance.diplomacy, recruitmentConfig: deps.balance.economy.recruitment, combatConfig: deps.balance.combat };
  }

  function prepareCampaignTurn(state, deps) {
    requireDependencies(deps);
    if (!contracts.isPlainObject(state) || state.phase !== "start") throw new RangeError("Campaign turn preparation requires the start phase.");
    var next = contracts.cloneGameState(state);
    var events = [];
    next.phase = "action";
    var occupationsAtTurnStart = captureOccupations(next);
    var quizEffectIds = next.effects.filter(function (effect) { return effect.type === "quiz-production" || effect.type === "quiz-unlock-discount"; }).map(function (effect) { return effect.id; });
    var economy = processEconomy(next, deps);
    events.push.apply(events, economy.events);
    events.push.apply(events, settleTradesDirect(next, deps));
    next.effects.push({
      type: "campaign-turn-context",
      id: "campaign-turn-context-" + next.turn,
      turn: next.turn,
      productionByFaction: contracts.cloneJson(economy.productionByFaction),
      occupations: contracts.cloneJson(occupationsAtTurnStart),
      quizEffectIds: quizEffectIds,
    });
    return { state: next, events: events };
  }

  function takeTurnContext(next) {
    var matches = next.effects.filter(function (effect) { return effect.type === "campaign-turn-context"; });
    if (matches.length !== 1 || matches[0].turn !== next.turn || !validProductionByFaction(matches[0].productionByFaction, next.factions) || !Array.isArray(matches[0].occupations) || !Array.isArray(matches[0].quizEffectIds)) {
      throw new RangeError("Prepared campaign turn context is missing or invalid.");
    }
    next.effects = next.effects.filter(function (effect) { return effect !== matches[0]; });
    return matches[0];
  }

  function completeCampaignTurn(state, input, deps) {
    requireDependencies(deps);
    if (!contracts.isPlainObject(input)) throw new TypeError("Campaign turn input must be an object.");
    if (!contracts.isPlainObject(state) || state.phase !== "action") throw new RangeError("Campaign turn completion requires the action phase.");
    var next = contracts.cloneGameState(state);
    var events = [];
    var turnContext = takeTurnContext(next);
    var playerId = input.playerFactionId || "player";
    if (!next.factions[playerId] || next.factions[playerId].isPlayer !== true) throw new RangeError("Player faction is invalid.");
    var completedQuiz = completedQuizForTurn(state, input, playerId);
    var playerDecisions = input.playerActions || [input.playerAction || { type: "WAIT", payload: { factionId: input.playerFactionId || "player" } }];
    if (!Array.isArray(playerDecisions) || playerDecisions.length < 1 || playerDecisions.length > deps.balance.campaign.actionPointsPerTurn) throw new RangeError("Player action count exceeds the campaign action-point budget.");
    var actionErrors = 0;
    var invalidDecisions = [];
    events.push.apply(events, applyPlayerActionsDirect(next, playerId, playerDecisions, deps));

    events.push.apply(events, executeWarnings(next, deps));
    events.push.apply(events, resolveBattles(next, deps, input.battleTactics, playerId));
    events.push.apply(events, pruneTradeRoutesDirect(next, deps));

    var context = aiContext(next, deps);
    Object.keys(next.factions).sort().forEach(function (factionId) {
      var faction = next.factions[factionId];
      if (faction.isPlayer || faction.eliminated || ownedProvinceIds(next, factionId).length === 0) return;
      context.campaignConfig.maximumActiveFronts = deps.balance.campaign.maximumActiveFronts + Math.floor(ownedProvinceIds(next, factionId).length / 5);
      var selected = game["npc-ai"].chooseAction(next, factionId, context, next.rng);
      next.rng = selected.rngState;
      var applied = applyDecision(next, selected.action, deps);
      if (selected.action.type !== "WAIT" && !applied.applied) {
        actionErrors += 1;
        invalidDecisions.push({ factionId: factionId, type: selected.action.type, turn: next.turn });
      }
      if (applied.event) events.push(applied.event);
    });

    var quizEvent = applyQuizProfile(next, input, completedQuiz, turnContext.productionByFaction, deps);
    if (quizEvent) events.push(quizEvent);
    advanceQuizEffects(next, turnContext.quizEffectIds);
    events.push.apply(events, advanceOccupationDirect(next, turnContext.occupations));
    expireTreatiesDirect(next);
    Object.keys(next.factions).forEach(function (factionId) {
      var count = ownedProvinceIds(next, factionId).length;
      next.factions[factionId].eliminated = count === 0;
    });
    var outcome = evaluateOutcome(next, playerId, deps);
    next.factions[playerId].campaignOutcome = outcome.status === "active" ? null : { status: outcome.status, turn: next.turn };
    if (outcome.status !== "active") events.push({ type: outcome.status === "victory" ? "CAMPAIGN_VICTORY" : "CAMPAIGN_DEFEAT", payload: { factionId: playerId, turn: next.turn, nationalShare: outcome.nationalShare, controlledRegions: outcome.controlledRegions } });
    var completedTurn = next.turn;
    next.turn = safeAdd(next.turn, 1, "Campaign turn");
    next.phase = outcome.status === "active" ? "start" : "complete";
    events.push({ type: "CAMPAIGN_TURN_COMPLETED", payload: { turn: completedTurn, playerOutcome: outcome.status } });
    return { state: next, events: events, outcome: outcome, actionErrors: actionErrors, invalidDecisions: invalidDecisions };
  }

  function advanceCampaignTurn(state, input, deps) {
    var prepared = state.phase === "start" ? prepareCampaignTurn(state, deps) : { state: state, events: [] };
    var completed = completeCampaignTurn(prepared.state, input, deps);
    completed.events = prepared.events.concat(completed.events);
    return completed;
  }

  function createHandlers(deps) {
    requireDependencies(deps);
    return {
      BEGIN_CAMPAIGN_TURN: function beginCampaignTurnHandler(draft) {
        return prepareCampaignTurn(draft, deps);
      },
      COMPLETE_CAMPAIGN_TURN: function completeCampaignTurnHandler(draft, action) {
        var result = completeCampaignTurn(draft, action.payload, deps);
        return { state: result.state, events: result.events };
      },
      ADVANCE_CAMPAIGN_TURN: function advanceCampaignTurnHandler(draft, action) {
        if (draft.phase !== "start" && draft.phase !== "action") throw new RangeError("Campaign turn cannot advance in the current phase.");
        var result = advanceCampaignTurn(draft, action.payload, deps);
        return { state: result.state, events: result.events };
      },
    };
  }

  function validateCampaignState(state, deps) {
    var errors = [];
    if (!contracts.isPlainObject(state.factions) || !contracts.isPlainObject(state.provinces)) return [{ code: "CAMPAIGN_MAP", path: "state", message: "Campaign faction and province maps are required." }];
    if (Object.keys(state.factions).length !== 34 || Object.keys(state.provinces).length !== 34) errors.push({ code: "CAMPAIGN_SIZE", path: "state", message: "Campaign must retain exactly 34 factions and provinces." });
    Object.keys(state.provinces).forEach(function (provinceId) {
      var province = state.provinces[provinceId];
      if (!state.factions[province.ownerId]) errors.push({ code: "CAMPAIGN_OWNER", path: "state.provinces." + provinceId + ".ownerId", message: "Province owner is unknown." });
      try {
        if (game.economy.countMilitary(province.units) !== province.population.military) errors.push({ code: "CAMPAIGN_MILITARY", path: "state.provinces." + provinceId, message: "Province military does not match unit statuses." });
        var trainingByUnit = {};
        if (!Array.isArray(province.recruitmentQueue)) throw new TypeError("Recruitment queue must be an array.");
        province.recruitmentQueue.forEach(function (entry) {
          if (!contracts.isPlainObject(entry) || !province.units[entry.unitId] || !Number.isSafeInteger(entry.count) || entry.count < 1 || !Number.isSafeInteger(entry.remainingTurns) || entry.remainingTurns < 1) throw new RangeError("Recruitment queue entry is invalid.");
          trainingByUnit[entry.unitId] = safeAdd(trainingByUnit[entry.unitId] || 0, entry.count, "Recruitment queue total");
        });
        Object.keys(province.units).forEach(function (unitId) {
          if ((trainingByUnit[unitId] || 0) !== province.units[unitId].training) errors.push({ code: "CAMPAIGN_TRAINING_QUEUE", path: "state.provinces." + provinceId + ".recruitmentQueue", message: "Recruitment queue must exactly account for training units." });
        });
        var recoveryByUnit = {};
        if (!Array.isArray(province.recoveryQueue)) throw new TypeError("Recovery queue must be an array.");
        province.recoveryQueue.forEach(function (entry) {
          if (!contracts.isPlainObject(entry) || !contracts.isPlainObject(entry.units) || !Number.isSafeInteger(entry.remainingTurns) || entry.remainingTurns < 1) throw new RangeError("Recovery queue entry is invalid.");
          Object.keys(entry.units).forEach(function (unitId) {
            if (!province.units[unitId] || !Number.isSafeInteger(entry.units[unitId]) || entry.units[unitId] < 0) throw new RangeError("Recovery queue unit entry is invalid.");
            recoveryByUnit[unitId] = safeAdd(recoveryByUnit[unitId] || 0, entry.units[unitId], "Recovery queue total");
          });
        });
        Object.keys(province.units).forEach(function (unitId) {
          if ((recoveryByUnit[unitId] || 0) !== province.units[unitId].wounded) errors.push({ code: "CAMPAIGN_RECOVERY_QUEUE", path: "state.provinces." + provinceId + ".recoveryQueue", message: "Recovery queue must exactly account for wounded units." });
        });
      } catch (caught) {
        errors.push({ code: "CAMPAIGN_UNITS", path: "state.provinces." + provinceId + ".units", message: caught.message });
      }
    });
    var routesById = {};
    var proposalsById = {};
    Object.keys(state.factions).forEach(function (leftId) {
      var faction = state.factions[leftId];
      if (!Number.isSafeInteger(faction.actionPoints) || faction.actionPoints < 0 || faction.actionPoints > deps.balance.campaign.actionPointsPerTurn) errors.push({ code: "CAMPAIGN_ACTION_POINTS", path: "state.factions." + leftId + ".actionPoints", message: "Faction action points are invalid." });
      if (!Array.isArray(faction.tradeRoutes) || faction.tradeRoutes.length > routeLimit(state, leftId, deps)) errors.push({ code: "CAMPAIGN_ROUTE_LIMIT", path: "state.factions." + leftId + ".tradeRoutes", message: "Faction exceeds its dynamic trade-route limit." });
      var allianceCount = 0;
      var nonAggressionCount = 0;
      Object.keys(state.factions[leftId].relations || {}).forEach(function (rightId) {
        var relation = state.factions[leftId].relations[rightId];
        if (!state.factions[rightId] || !state.factions[rightId].relations[leftId] || JSON.stringify(relation) !== JSON.stringify(state.factions[rightId].relations[leftId])) errors.push({ code: "CAMPAIGN_RELATION", path: "state.factions." + leftId + ".relations." + rightId, message: "Diplomacy relation must be symmetric." });
        if (!relation || game.diplomacy.RELATION_STATUSES.indexOf(relation.status) === -1 || !Number.isFinite(relation.score) || relation.score < deps.balance.diplomacy.relationMinimum || relation.score > deps.balance.diplomacy.relationMaximum || (relation.untilTurn !== null && (!Number.isSafeInteger(relation.untilTurn) || relation.untilTurn < 1)) || (relation.betrayalUntilTurn !== null && (!Number.isSafeInteger(relation.betrayalUntilTurn) || relation.betrayalUntilTurn < 1))) errors.push({ code: "CAMPAIGN_RELATION_STATE", path: "state.factions." + leftId + ".relations." + rightId, message: "Diplomacy relation fields are invalid." });
        if (relation && relation.status === "alliance") allianceCount += 1;
        if (relation && relation.status === "non-aggression") nonAggressionCount += 1;
      });
      if (!Array.isArray(faction.treatyProposals)) errors.push({ code: "CAMPAIGN_TREATY_PROPOSALS", path: "state.factions." + leftId + ".treatyProposals", message: "Treaty proposals must be an array." });
      (faction.treatyProposals || []).forEach(function (proposal) {
        if (!proposalsById[proposal.id]) proposalsById[proposal.id] = [];
        proposalsById[proposal.id].push({ factionId: leftId, proposal: proposal });
      });
      (faction.tradeRoutes || []).forEach(function (route) {
        if (!routesById[route.id]) routesById[route.id] = [];
        routesById[route.id].push({ factionId: leftId, route: route });
      });
      if (allianceCount > deps.balance.diplomacy.maxAlliances || nonAggressionCount > deps.balance.diplomacy.maxNonAggressionTreaties) errors.push({ code: "CAMPAIGN_TREATY_LIMIT", path: "state.factions." + leftId + ".relations", message: "Faction exceeds a treaty limit." });
      var frontLimit = deps.balance.campaign.maximumActiveFronts + Math.floor(ownedProvinceIds(state, leftId).length / 5);
      if (game["npc-ai"].activeFronts(state, leftId) > frontLimit) errors.push({ code: "CAMPAIGN_FRONT_LIMIT", path: "state.factions." + leftId, message: "Faction exceeds its active-front limit." });
    });
    Object.keys(routesById).forEach(function (routeId) {
      var copies = routesById[routeId];
      var route = copies[0].route;
      var sameRoute = copies.length === 2 && ["id", "fromFactionId", "toFactionId", "sourceProvinceId", "targetProvinceId", "active"].every(function (field) { return copies[0].route[field] === copies[1].route[field]; });
      if (!sameRoute || copies.map(function (copy) { return copy.factionId; }).sort().join("|") !== [route.fromFactionId, route.toFactionId].sort().join("|") || !state.factions[route.fromFactionId] || !state.factions[route.toFactionId] || !state.provinces[route.sourceProvinceId] || !state.provinces[route.targetProvinceId]) errors.push({ code: "CAMPAIGN_ROUTE_PAIR", path: "state.factions.*.tradeRoutes." + routeId, message: "Trade route must have two identical faction copies and valid endpoints." });
    });
    Object.keys(proposalsById).forEach(function (proposalId) {
      var copies = proposalsById[proposalId];
      var proposal = copies[0].proposal;
      var sameProposal = copies.length === 2 && ["id", "fromFactionId", "toFactionId", "type", "turn"].every(function (field) { return copies[0].proposal[field] === copies[1].proposal[field]; });
      if (!sameProposal || copies.map(function (copy) { return copy.factionId; }).sort().join("|") !== [proposal.fromFactionId, proposal.toFactionId].sort().join("|") || game.diplomacy.TREATY_TYPES.indexOf(proposal.type) === -1 || !Number.isSafeInteger(proposal.turn) || proposal.turn < 1) errors.push({ code: "CAMPAIGN_TREATY_PROPOSAL_PAIR", path: "state.factions.*.treatyProposals." + proposalId, message: "Treaty proposal must have two identical, valid faction copies." });
    });
    var reserved = {};
    var reservationsByBattle = {};
    var effectIds = {};
    var turnContexts = 0;
    state.effects.forEach(function (effect, index) {
      if (effect.id !== undefined) {
        if (typeof effect.id !== "string" || effectIds[effect.id]) errors.push({ code: "CAMPAIGN_EFFECT_ID", path: "state.effects[" + index + "].id", message: "Campaign effect IDs must be unique strings." });
        effectIds[effect.id] = true;
      }
      if (effect.type === "campaign-turn-context") {
        turnContexts += 1;
        if (effect.turn !== state.turn || !validProductionByFaction(effect.productionByFaction, state.factions) || !Array.isArray(effect.occupations) || !Array.isArray(effect.quizEffectIds)) errors.push({ code: "CAMPAIGN_TURN_CONTEXT", path: "state.effects[" + index + "]", message: "Prepared turn context is invalid." });
      }
      if (effect.type === "quiz-production" || effect.type === "quiz-unlock-discount") {
        var productionValid = effect.type !== "quiz-production" || ((effect.resource === "food" || effect.resource === "coin") && Number.isFinite(effect.multiplier) && effect.multiplier >= 0);
        if (!state.factions[effect.factionId] || !Number.isSafeInteger(effect.remainingTurns) || effect.remainingTurns < 1 || !Number.isFinite(effect.multiplier) || effect.multiplier < 0 || !productionValid) errors.push({ code: "CAMPAIGN_QUIZ_EFFECT", path: "state.effects[" + index + "]", message: "Quiz campaign effect is invalid." });
      }
      if (effect.type === "battle-reservation") {
        if (reservationsByBattle[effect.battleId]) errors.push({ code: "CAMPAIGN_BATTLE_RESERVATION_COUNT", path: "state.effects[" + index + "]", message: "A battle cannot have multiple force reservations." });
        reservationsByBattle[effect.battleId] = effect;
        if (!Array.isArray(effect.pending) || !effect.attacker || !effect.defender) errors.push({ code: "CAMPAIGN_BATTLE_RESERVATION", path: "state.effects[" + index + "]", message: "Battle force reservation fields are invalid." });
        [effect.attacker && effect.attacker.provinceId, effect.defender && effect.defender.provinceId].forEach(function (provinceId) {
          if (!provinceId || reserved[provinceId]) errors.push({ code: "CAMPAIGN_PROVINCE_RESERVATION", path: "state.effects[" + index + "]", message: "A province cannot belong to multiple active fronts." });
          if (provinceId) reserved[provinceId] = true;
        });
      }
      if (effect.type === "attack-warning") {
        var expectedTurn = Number.isSafeInteger(effect.createdTurn) ? effect.createdTurn + deps.balance.campaign.warningDelayTurns : NaN;
        if (!state.factions[effect.attackerId] || !state.factions[effect.defenderId] || !state.provinces[effect.sourceProvinceId] || !state.provinces[effect.targetProvinceId] || (deps.adjacency[effect.sourceProvinceId] || []).indexOf(effect.targetProvinceId) === -1 || !Number.isSafeInteger(expectedTurn) || effect.executeTurn !== expectedTurn) errors.push({ code: "CAMPAIGN_WARNING", path: "state.effects[" + index + "]", message: "Attack warning is invalid." });
        [effect.sourceProvinceId, effect.targetProvinceId].forEach(function (provinceId) {
          if (reserved[provinceId]) errors.push({ code: "CAMPAIGN_WARNING_RESERVATION", path: "state.effects[" + index + "]", message: "A province cannot be reserved by multiple fronts." });
          reserved[provinceId] = true;
        });
      }
    });
    Object.keys(state.battles).forEach(function (battleId) {
      var battle = state.battles[battleId];
      var reservation = reservationsByBattle[battleId];
      if (battle.status !== "active") {
        if (reservation) errors.push({ code: "CAMPAIGN_ORPHAN_RESERVATION", path: "state.effects", message: "Completed battle retains a force reservation." });
        if (battle.reinforcementQueue.length > 0) errors.push({ code: "CAMPAIGN_COMPLETED_BATTLE_REINFORCEMENT", path: "state.battles." + battleId + ".reinforcementQueue", message: "Completed battle retains queued reinforcements." });
        return;
      }
      if (!reservation) {
        errors.push({ code: "CAMPAIGN_BATTLE_RESERVATION_MISSING", path: "state.battles." + battleId, message: "Active battle requires one force reservation." });
        return;
      }
      if (!reservation.attacker || !reservation.defender || !Array.isArray(reservation.pending)) return;
      if (reservation.attacker.provinceId !== battle.sourceProvinceId || reservation.defender.provinceId !== battle.targetProvinceId) errors.push({ code: "CAMPAIGN_BATTLE_RESERVATION_PROVINCE", path: "state.effects", message: "Battle reservation provinces do not match the battle." });
      ["attacker", "defender"].forEach(function (side) {
        var province = state.provinces[reservation[side].provinceId];
        if (!province || !contracts.isPlainObject(reservation[side].units)) {
          errors.push({ code: "CAMPAIGN_BATTLE_RESERVED_FORCE", path: "state.effects", message: "Reserved battle force is invalid." });
          return;
        }
        try {
          var committed = reservedUnits(reservation, side);
          Object.keys(committed).forEach(function (unitId) {
            if (!Number.isSafeInteger(committed[unitId]) || committed[unitId] < 0 || !province.units[unitId] || committed[unitId] > province.units[unitId].field + province.units[unitId].garrison) throw new RangeError("Reserved units exceed ready units in their province.");
          });
        } catch (caught) {
          errors.push({ code: "CAMPAIGN_BATTLE_RESERVED_FORCE", path: "state.effects", message: caught.message });
        }
      });
      var queueIds = {};
      battle.reinforcementQueue.forEach(function (entry) { queueIds[entry.requestId] = entry; });
      (reservation.pending || []).forEach(function (entry) {
        if (!queueIds[entry.requestId] || JSON.stringify(queueIds[entry.requestId].units) !== JSON.stringify(entry.units) || queueIds[entry.requestId].side !== entry.side) errors.push({ code: "CAMPAIGN_REINFORCEMENT_RESERVATION", path: "state.effects", message: "Pending reinforcement does not match the battle queue." });
        delete queueIds[entry.requestId];
      });
      if (Object.keys(queueIds).length > 0) errors.push({ code: "CAMPAIGN_REINFORCEMENT_RESERVATION_MISSING", path: "state.battles." + battleId + ".reinforcementQueue", message: "Battle reinforcement queue is not fully reserved." });
    });
    Object.keys(reservationsByBattle).forEach(function (battleId) {
      if (!state.battles[battleId]) errors.push({ code: "CAMPAIGN_ORPHAN_RESERVATION", path: "state.effects", message: "Force reservation references an unknown battle." });
    });
    if ((state.phase === "action" && turnContexts !== 1) || (state.phase !== "action" && turnContexts !== 0)) errors.push({ code: "CAMPAIGN_TURN_CONTEXT_COUNT", path: "state.effects", message: "Prepared turn context count does not match campaign phase." });
    errors.push.apply(errors, game.combat.createInvariant(deps.balance.combat)(state));
    errors.push.apply(errors, game.occupation.createInvariant(deps.balance.occupation)(state));
    return errors;
  }

  function filterEvents(events, playerId, state) {
    var owned = ownedProvinceIds(state, playerId);
    var relatedFactions = Object.keys(state.factions[playerId].relations).filter(function (id) {
      var relation = state.factions[playerId].relations[id];
      return relation.status === "alliance" || relation.status === "war";
    });
    var identifiers = new Set([playerId].concat(owned, relatedFactions));
    Object.keys(state.battles).forEach(function (battleId) {
      var battle = state.battles[battleId];
      if (battle.attacker.factionId === playerId || battle.defender.factionId === playerId) identifiers.add(battleId);
    });
    state.factions[playerId].tradeRoutes.forEach(function (route) { identifiers.add(route.id); });
    function containsIdentifier(value) {
      if (typeof value === "string") return identifiers.has(value);
      if (Array.isArray(value)) return value.some(containsIdentifier);
      if (contracts.isPlainObject(value)) return Object.keys(value).some(function (key) { return containsIdentifier(value[key]); });
      return false;
    }
    return events.filter(function (event) {
      return containsIdentifier(event.payload) || event.type === "CAMPAIGN_TURN_COMPLETED" || event.type.indexOf("QUIZ_") === 0;
    });
  }

  return {
    PERSONALITY_IDS: PERSONALITY_IDS,
    createCampaign: createCampaign,
    ownedProvinceIds: ownedProvinceIds,
    territoryPointsByFaction: territoryPointsByFaction,
    regionalControl: regionalControl,
    evaluateOutcome: evaluateOutcome,
    validatePlayerActions: validatePlayerActions,
    prepareCampaignTurn: prepareCampaignTurn,
    completeCampaignTurn: completeCampaignTurn,
    advanceCampaignTurn: advanceCampaignTurn,
    createHandlers: createHandlers,
    validateCampaignState: validateCampaignState,
    filterEvents: filterEvents,
  };
});
