(function (root, factory) {
  "use strict";
  var game = root.MLN222Game;
  if (!game || !game.hasModule("contracts")) {
    throw new Error("Load the core modules before diplomacy.js.");
  }
  var api = game.registerModule("diplomacy", factory(game.contracts));
  if (typeof module === "object" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function (contracts) {
  "use strict";

  var TREATY_TYPES = Object.freeze(["non-aggression", "alliance"]);
  var RELATION_STATUSES = Object.freeze(["neutral", "non-aggression", "alliance", "war"]);
  var ID_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,95}$/;

  function validateConfig(config) {
    if (!contracts.isPlainObject(config)) throw new TypeError("Diplomacy config must be an object.");
    ["relationMinimum", "relationMaximum", "tradeRelationMinimum", "allianceRelationMinimum", "nonAggressionRelationMinimum", "tradeCoinPerTurn", "tradeRelationGain", "betrayalPenalty"].forEach(function (field) {
      if (!Number.isFinite(config[field])) throw new RangeError("Diplomacy config value is invalid: " + field);
    });
    ["maxTradeRoutes", "maxAlliances", "maxNonAggressionTreaties", "treatyDuration", "betrayalLockTurns"].forEach(function (field) {
      if (!Number.isSafeInteger(config[field]) || config[field] < 0) throw new RangeError("Diplomacy config integer is invalid: " + field);
    });
    if (config.relationMaximum <= config.relationMinimum || config.tradeCoinPerTurn < 0 || config.betrayalPenalty < 0) {
      throw new RangeError("Diplomacy config ranges are invalid.");
    }
    return true;
  }

  function emptyRelation() {
    return { score: 0, status: "neutral", untilTurn: null, betrayalUntilTurn: null };
  }

  function initializeFactions(factions) {
    if (!contracts.isPlainObject(factions)) throw new TypeError("Faction map must be an object.");
    var next = contracts.cloneJson(factions);
    var ids = Object.keys(next).sort();
    ids.forEach(function (id) {
      next[id].relations = {};
      next[id].tradeRoutes = [];
      next[id].treatyProposals = [];
      ids.forEach(function (otherId) {
        if (otherId !== id) next[id].relations[otherId] = emptyRelation();
      });
    });
    return next;
  }

  function requireFactionPair(state, leftId, rightId) {
    if (!contracts.isPlainObject(state) || !contracts.isPlainObject(state.factions) || leftId === rightId || !Object.prototype.hasOwnProperty.call(state.factions, leftId) || !Object.prototype.hasOwnProperty.call(state.factions, rightId)) {
      throw new RangeError("Diplomacy faction pair is invalid.");
    }
    [leftId, rightId].forEach(function (id) {
      if (!contracts.isPlainObject(state.factions[id].relations) || !contracts.isPlainObject(state.factions[id].relations[id === leftId ? rightId : leftId])) {
        throw new TypeError("Faction diplomacy state is missing.");
      }
    });
  }

  function relation(state, leftId, rightId) {
    requireFactionPair(state, leftId, rightId);
    return contracts.cloneJson(state.factions[leftId].relations[rightId]);
  }

  function updatePair(next, leftId, rightId, values) {
    [
      [leftId, rightId],
      [rightId, leftId],
    ].forEach(function (pair) {
      Object.keys(values).forEach(function (key) { next.factions[pair[0]].relations[pair[1]][key] = values[key]; });
    });
  }

  function safeTurnAdd(turn, duration, name) {
    if (!Number.isSafeInteger(turn) || !Number.isSafeInteger(duration) || !Number.isSafeInteger(turn + duration)) throw new RangeError(name + " exceeded the safe-integer range.");
    return turn + duration;
  }

  function changeRelation(state, leftId, rightId, delta, config) {
    validateConfig(config);
    requireFactionPair(state, leftId, rightId);
    if (!Number.isFinite(delta)) throw new RangeError("Relation delta must be finite.");
    var next = contracts.cloneGameState(state);
    var current = next.factions[leftId].relations[rightId].score;
    var score = Math.max(config.relationMinimum, Math.min(config.relationMaximum, current + delta));
    updatePair(next, leftId, rightId, { score: score });
    return next;
  }

  function countTreaties(faction, status) {
    return Object.keys(faction.relations).filter(function (otherId) { return faction.relations[otherId].status === status; }).length;
  }

  function proposeTreaty(state, input, config) {
    validateConfig(config);
    if (!contracts.isPlainObject(input) || typeof input.id !== "string" || !ID_PATTERN.test(input.id) || TREATY_TYPES.indexOf(input.type) === -1 || !Number.isSafeInteger(input.turn) || input.turn < 1) {
      throw new RangeError("Treaty proposal is invalid.");
    }
    requireFactionPair(state, input.fromFactionId, input.toFactionId);
    var current = state.factions[input.fromFactionId].relations[input.toFactionId];
    var threshold = input.type === "alliance" ? config.allianceRelationMinimum : config.nonAggressionRelationMinimum;
    if (current.status === "war" || current.score < threshold || (current.betrayalUntilTurn !== null && current.betrayalUntilTurn >= input.turn)) {
      throw new RangeError("Treaty relation requirements are not met.");
    }
    var limit = input.type === "alliance" ? config.maxAlliances : config.maxNonAggressionTreaties;
    if (countTreaties(state.factions[input.fromFactionId], input.type) >= limit || countTreaties(state.factions[input.toFactionId], input.type) >= limit) {
      throw new RangeError("Treaty limit reached.");
    }
    if (state.factions[input.fromFactionId].treatyProposals.concat(state.factions[input.toFactionId].treatyProposals).some(function (proposal) { return proposal.id === input.id; })) {
      throw new RangeError("Treaty proposal ID already exists.");
    }
    var next = contracts.cloneGameState(state);
    var proposal = { id: input.id, fromFactionId: input.fromFactionId, toFactionId: input.toFactionId, type: input.type, turn: input.turn };
    next.factions[input.fromFactionId].treatyProposals.push(proposal);
    next.factions[input.toFactionId].treatyProposals.push(contracts.cloneJson(proposal));
    return { state: next, event: { type: "TREATY_PROPOSED", payload: proposal } };
  }

  function respondTreaty(state, proposalId, accepted, turn, config) {
    validateConfig(config);
    if (typeof proposalId !== "string" || !ID_PATTERN.test(proposalId) || typeof accepted !== "boolean" || !Number.isSafeInteger(turn) || turn < 1) {
      throw new RangeError("Treaty response is invalid.");
    }
    var proposal = null;
    Object.keys(state.factions).some(function (factionId) {
      proposal = state.factions[factionId].treatyProposals.find(function (item) { return item.id === proposalId; }) || null;
      return proposal !== null;
    });
    if (!proposal) throw new RangeError("Treaty proposal is unknown.");
    if (accepted) {
      requireFactionPair(state, proposal.fromFactionId, proposal.toFactionId);
      var relationState = state.factions[proposal.fromFactionId].relations[proposal.toFactionId];
      var threshold = proposal.type === "alliance" ? config.allianceRelationMinimum : config.nonAggressionRelationMinimum;
      var allowedStatus = proposal.type === "alliance" ? (relationState.status === "neutral" || relationState.status === "non-aggression") : relationState.status === "neutral";
      var limit = proposal.type === "alliance" ? config.maxAlliances : config.maxNonAggressionTreaties;
      if (!allowedStatus || relationState.score < threshold || (relationState.betrayalUntilTurn !== null && relationState.betrayalUntilTurn >= turn) || countTreaties(state.factions[proposal.fromFactionId], proposal.type) >= limit || countTreaties(state.factions[proposal.toFactionId], proposal.type) >= limit) {
        throw new RangeError("Treaty proposal is no longer acceptable.");
      }
    }
    var next = contracts.cloneGameState(state);
    [proposal.fromFactionId, proposal.toFactionId].forEach(function (factionId) {
      next.factions[factionId].treatyProposals = next.factions[factionId].treatyProposals.filter(function (item) { return item.id !== proposalId; });
    });
    var untilTurn = accepted ? safeTurnAdd(turn, config.treatyDuration, "Treaty expiry turn") : null;
    if (accepted) updatePair(next, proposal.fromFactionId, proposal.toFactionId, { status: proposal.type, untilTurn: untilTurn });
    return { state: next, event: { type: "TREATY_CHANGED", payload: { proposalId: proposalId, fromFactionId: proposal.fromFactionId, toFactionId: proposal.toFactionId, status: accepted ? proposal.type : "rejected", untilTurn: untilTurn } } };
  }

  function routeExists(faction, routeId) {
    return faction.tradeRoutes.some(function (route) { return route.id === routeId; });
  }

  function createTradeRoute(state, input, adjacency, config) {
    validateConfig(config);
    if (!contracts.isPlainObject(input) || typeof input.id !== "string" || !ID_PATTERN.test(input.id)) throw new RangeError("Trade route ID is invalid.");
    requireFactionPair(state, input.fromFactionId, input.toFactionId);
    if (!Object.prototype.hasOwnProperty.call(state.provinces, input.sourceProvinceId) || !Object.prototype.hasOwnProperty.call(state.provinces, input.targetProvinceId) || state.provinces[input.sourceProvinceId].ownerId !== input.fromFactionId || state.provinces[input.targetProvinceId].ownerId !== input.toFactionId) {
      throw new RangeError("Trade route province ownership is invalid.");
    }
    if (!Array.isArray(adjacency[input.sourceProvinceId]) || adjacency[input.sourceProvinceId].indexOf(input.targetProvinceId) === -1) throw new RangeError("Trade route provinces must be adjacent.");
    var current = state.factions[input.fromFactionId].relations[input.toFactionId];
    if (current.status === "war" || current.score < config.tradeRelationMinimum) throw new RangeError("Trade relation requirements are not met.");
    if (state.factions[input.fromFactionId].tradeRoutes.length >= config.maxTradeRoutes || state.factions[input.toFactionId].tradeRoutes.length >= config.maxTradeRoutes) throw new RangeError("Trade route limit reached.");
    if (Object.keys(state.factions).some(function (factionId) { return routeExists(state.factions[factionId], input.id); })) throw new RangeError("Trade route ID already exists.");
    var next = contracts.cloneGameState(state);
    var route = { id: input.id, fromFactionId: input.fromFactionId, toFactionId: input.toFactionId, sourceProvinceId: input.sourceProvinceId, targetProvinceId: input.targetProvinceId, active: true };
    next.factions[input.fromFactionId].tradeRoutes.push(route);
    next.factions[input.toFactionId].tradeRoutes.push(contracts.cloneJson(route));
    updatePair(next, input.fromFactionId, input.toFactionId, { score: Math.min(config.relationMaximum, current.score + config.tradeRelationGain) });
    return { state: next, event: { type: "TRADE_ROUTE_CREATED", payload: route } };
  }

  function routeBlocked(state, route) {
    if (state.factions[route.fromFactionId].relations[route.toFactionId].status === "war") return true;
    if (state.provinces[route.sourceProvinceId].ownerId !== route.fromFactionId || state.provinces[route.targetProvinceId].ownerId !== route.toFactionId) return true;
    return Object.keys(state.battles).some(function (battleId) {
      var battle = state.battles[battleId];
      return battle.status === "active" && (battle.sourceProvinceId === route.sourceProvinceId || battle.targetProvinceId === route.targetProvinceId || battle.sourceProvinceId === route.targetProvinceId || battle.targetProvinceId === route.sourceProvinceId);
    });
  }

  function settleTradeRoutes(state, config) {
    validateConfig(config);
    var next = contracts.cloneGameState(state);
    var events = [];
    var processed = Object.create(null);
    Object.keys(next.factions).sort().forEach(function (factionId) {
      next.factions[factionId].tradeRoutes.forEach(function (route) {
        if (processed[route.id]) return;
        processed[route.id] = true;
        var blocked = routeBlocked(next, route);
        [route.fromFactionId, route.toFactionId].forEach(function (id) {
          var ownRoute = next.factions[id].tradeRoutes.find(function (entry) { return entry.id === route.id; });
          ownRoute.active = !blocked;
          if (!blocked) {
            var coin = next.factions[id].resources.coin + config.tradeCoinPerTurn;
            if (!Number.isSafeInteger(coin)) throw new RangeError("Trade income exceeded the safe-integer range.");
            next.factions[id].resources.coin = coin;
          }
        });
        if (!blocked) {
          var current = next.factions[route.fromFactionId].relations[route.toFactionId];
          updatePair(next, route.fromFactionId, route.toFactionId, { score: Math.min(config.relationMaximum, current.score + config.tradeRelationGain) });
        }
        events.push({ type: "TRADE_SETTLED", payload: { routeId: route.id, active: !blocked, coin: blocked ? 0 : config.tradeCoinPerTurn } });
      });
    });
    return { state: next, events: events };
  }

  function declareWar(state, attackerId, defenderId, turn, config) {
    validateConfig(config);
    requireFactionPair(state, attackerId, defenderId);
    if (!Number.isSafeInteger(turn) || turn < 1) throw new RangeError("War turn is invalid.");
    var next = contracts.cloneGameState(state);
    var current = next.factions[attackerId].relations[defenderId];
    var betrayed = current.status === "alliance" || current.status === "non-aggression";
    var score = Math.max(config.relationMinimum, current.score - (betrayed ? config.betrayalPenalty : 20));
    updatePair(next, attackerId, defenderId, {
      score: score,
      status: "war",
      untilTurn: null,
      betrayalUntilTurn: betrayed ? safeTurnAdd(turn, config.betrayalLockTurns, "Betrayal lock turn") : current.betrayalUntilTurn,
    });
    [attackerId, defenderId].forEach(function (id) {
      next.factions[id].tradeRoutes.forEach(function (route) {
        if ((route.fromFactionId === attackerId && route.toFactionId === defenderId) || (route.fromFactionId === defenderId && route.toFactionId === attackerId)) route.active = false;
      });
    });
    return { state: next, event: { type: "WAR_DECLARED", payload: { attackerId: attackerId, defenderId: defenderId, turn: turn, betrayedTreaty: betrayed } } };
  }

  function expireTreaties(state, turn) {
    if (!Number.isSafeInteger(turn) || turn < 1) throw new RangeError("Treaty expiry turn is invalid.");
    var next = contracts.cloneGameState(state);
    var expired = [];
    Object.keys(next.factions).sort().forEach(function (leftId) {
      Object.keys(next.factions[leftId].relations).sort().forEach(function (rightId) {
        if (leftId >= rightId) return;
        var current = next.factions[leftId].relations[rightId];
        if ((current.status === "alliance" || current.status === "non-aggression") && current.untilTurn !== null && current.untilTurn < turn) {
          updatePair(next, leftId, rightId, { status: "neutral", untilTurn: null });
          expired.push({ leftId: leftId, rightId: rightId });
        }
      });
    });
    return { state: next, expired: expired };
  }

  return {
    TREATY_TYPES: TREATY_TYPES,
    RELATION_STATUSES: RELATION_STATUSES,
    validateConfig: validateConfig,
    initializeFactions: initializeFactions,
    relation: relation,
    changeRelation: changeRelation,
    proposeTreaty: proposeTreaty,
    respondTreaty: respondTreaty,
    createTradeRoute: createTradeRoute,
    settleTradeRoutes: settleTradeRoutes,
    declareWar: declareWar,
    expireTreaties: expireTreaties,
  };
});
