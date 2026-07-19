"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const { loadGame } = require("../../scripts/simulate-campaign.js");

const ROOT = path.resolve(__dirname, "..", "..");
const game = loadGame();
require(path.join(ROOT, "game/ui/ui-utils.js"));
require(path.join(ROOT, "game/ui/context-action-model.js"));

const read = (relative) => JSON.parse(fs.readFileSync(path.join(ROOT, relative), "utf8"));
const data = {
  provinces: read("game/data/provinces.json"),
  adjacency: read("game/data/adjacency.json"),
  balance: read("game/data/balance.json"),
};

function snapshot() {
  return {
    state: {
      turn: 5,
      phase: "action",
      quiz: { active: null },
      provinces: {
        "ha-noi": { ownerId: "player" },
        "bac-ninh": { ownerId: "npc-bac-ninh" },
      },
      factions: {
        player: {
          actionPoints: 2,
          campaignOutcome: null,
          relations: { "npc-bac-ninh": { status: "neutral", score: 60 } },
          treatyProposals: [],
        },
      },
      battles: {},
    },
    selectedProvinceId: "bac-ninh",
    pendingActions: [],
  };
}

test("context model groups only exact legal actions for the selected foreign owner", () => {
  const current = snapshot();
  const legalActions = [
    { type: "TRADE", payload: { factionId: "player", partnerId: "npc-bac-ninh", sourceProvinceId: "ha-noi", targetProvinceId: "bac-ninh" }, baseUtility: 12 },
    { type: "PROPOSE_TREATY", payload: { factionId: "player", partnerId: "npc-bac-ninh", treatyType: "non-aggression" }, baseUtility: 10 },
    { type: "WARN_ATTACK", payload: { factionId: "player", defenderId: "npc-bac-ninh", sourceProvinceId: "ha-noi", targetProvinceId: "bac-ninh", strengthRatio: 1.25 }, baseUtility: 9 },
    { type: "RECRUIT", payload: { factionId: "player", provinceId: "ha-noi", unitId: "militia", count: 20 }, baseUtility: 2 },
  ];
  const model = game["context-action-model"].build({ data, snapshot: current, provinceId: "bac-ninh", legalActions });
  assert.equal(model.target.isForeign, true);
  assert.equal(model.groups.find((group) => group.id === "info").actions[0].kind, "navigation");
  assert.deepEqual(model.groups.find((group) => group.id === "trade").actions.map((item) => item.action.type), ["TRADE"]);
  assert.deepEqual(model.groups.find((group) => group.id === "diplomacy").actions.map((item) => item.action.type), ["PROPOSE_TREATY"]);
  assert.deepEqual(model.groups.find((group) => group.id === "military").actions.map((item) => item.action.type), ["WARN_ATTACK"]);
  assert.equal(model.groups.flatMap((group) => group.actions).some((item) => item.action && item.action.type === "RECRUIT"), false);
  const groupedTrade = model.groups.find((group) => group.id === "trade").actions[0].action;
  assert.deepEqual(groupedTrade, legalActions[0]);
  assert.notStrictEqual(groupedTrade, legalActions[0]);
});

test("context model explains exhausted action points without inventing a command", () => {
  const current = snapshot();
  current.pendingActions = [{ type: "RECRUIT" }, { type: "UNLOCK" }];
  const model = game["context-action-model"].build({ data, snapshot: current, provinceId: "bac-ninh", legalActions: [] });
  ["diplomacy", "trade", "military"].forEach((groupId) => {
    const group = model.groups.find((entry) => entry.id === groupId);
    assert.equal(group.available, false);
    assert.equal(group.actions.length, 0);
    assert.match(group.reason, /hết điểm lệnh/);
  });
});

test("context model keeps own territory information-only", () => {
  const current = snapshot();
  current.selectedProvinceId = "ha-noi";
  const model = game["context-action-model"].build({ data, snapshot: current, provinceId: "ha-noi", legalActions: [] });
  assert.equal(model.target.isForeign, false);
  assert.equal(model.groups.find((group) => group.id === "info").available, true);
  ["diplomacy", "trade", "military"].forEach((groupId) => {
    assert.match(model.groups.find((group) => group.id === groupId).reason, /lãnh thổ của bạn/);
  });
});
