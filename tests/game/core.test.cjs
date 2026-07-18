"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const test = require("node:test");
const {
  CORE_FILES,
  corePath,
  loadBrowserCore,
  loadNodeCore,
  serialize,
} = require("./test-helpers.cjs");

function createTurnRuntime(game) {
  return game.runtime.createRuntime({
    handlers: {
      ADVANCE_TURN(draft, action, context) {
        const draw = context.rng.nextInt(draft.rng, "events", 2, 7);
        draft.rng = draw.state;
        if (!draft.factions.player) {
          draft.factions.player = { resources: { food: 0, coin: 0 } };
        }
        draft.factions.player.resources.food += draw.value;
        draft.turn += 1;
        context.emit("TURN_ADVANCED", {
          food: draw.value,
          requestedTurn: action.payload.turn,
        });
      },
    },
  });
}

function advance(runtime, contracts, state, from, to) {
  let current = state;
  for (let turn = from; turn <= to; turn += 1) {
    const result = runtime.dispatch(current, contracts.createAction({
      id: `advance-${turn}`,
      type: "ADVANCE_TURN",
      payload: { turn },
      expectedPhase: "action",
    }));
    assert.equal(result.ok, true, serialize(result.errors));
    current = result.state;
  }
  return current;
}

test("core modules share one namespace in Node", () => {
  const game = loadNodeCore();
  assert.deepEqual(game.listModules(), ["contracts", "invariants", "rng", "runtime"]);
  assert.equal(game.getModule("rng"), game.rng);
  assert.throws(() => game.registerModule("rng", {}), /already registered/);
});

test("classic browser scripts and Node produce the same RNG sequence", () => {
  const nodeGame = loadNodeCore();
  const browserGame = loadBrowserCore();
  let nodeState = nodeGame.rng.createRngState("realm-parity");
  let browserState = browserGame.rng.createRngState("realm-parity");
  const nodeValues = [];
  const browserValues = [];

  for (let index = 0; index < 12; index += 1) {
    const nodeDraw = nodeGame.rng.drawUint32(nodeState, "combat");
    const browserDraw = browserGame.rng.drawUint32(browserState, "combat");
    nodeState = nodeDraw.state;
    browserState = browserDraw.state;
    nodeValues.push(nodeDraw.value);
    browserValues.push(browserDraw.value);
  }

  assert.deepEqual(nodeValues, browserValues);
  assert.equal(serialize(nodeState), serialize(browserState));
});

test("RNG streams are deterministic and independent", () => {
  const { rng } = loadNodeCore();
  let perturbed = rng.createRngState("stream-isolation");
  const baseline = rng.createRngState("stream-isolation");
  perturbed = rng.nextInt(perturbed, "ai", 0, 100).state;
  perturbed = rng.nextInt(perturbed, "ai", 0, 100).state;

  const perturbedQuiz = rng.nextInt(perturbed, "quiz", 0, 500);
  const baselineQuiz = rng.nextInt(baseline, "quiz", 0, 500);
  assert.equal(perturbedQuiz.value, baselineQuiz.value);
  assert.equal(perturbedQuiz.state.counters.quiz, baselineQuiz.state.counters.quiz);
  assert.equal(perturbedQuiz.state.counters.ai, 2);
  assert.equal(baselineQuiz.state.counters.ai, 0);
});

test("RNG requires domain streams and rejects counter overflow", () => {
  const { rng } = loadNodeCore();
  assert.throws(() => rng.createRngState("missing", ["ai"]), /Required RNG stream/);
  const state = rng.createRngState("overflow");
  state.counters.ai = Number.MAX_SAFE_INTEGER;
  assert.throws(() => rng.drawUint32(state, "ai"), /safe-integer range/);
  const extended = rng.createRngState("extended", rng.DEFAULT_STREAMS.concat("loot"));
  assert.equal(extended.counters.loot, 0);
  assert.deepEqual(rng.validateRngState(extended), []);
});

test("shuffle and weighted choice do not mutate caller inputs", () => {
  const { rng } = loadNodeCore();
  const state = rng.createRngState("collection-helpers");
  const values = [1, 2, 3, 4, 5];
  const choices = [
    { value: "none", weight: 0 },
    { value: "common", weight: 4 },
    { value: "rare", weight: 1 },
    { value: "also-none", weight: 0 },
  ];
  const shuffled = rng.shuffle(state, "events", values);
  const choiceA = rng.weightedChoice(state, "events", choices);
  const choiceB = rng.weightedChoice(state, "events", choices);

  assert.deepEqual(values, [1, 2, 3, 4, 5]);
  assert.equal(new Set(shuffled.value).size, values.length);
  assert.equal(choiceA.value, choiceB.value);
  assert.notEqual(choiceA.value, "none");
  assert.notEqual(choiceA.value, "also-none");
});

test("JSON contracts reject cycles and unsafe keys", () => {
  const { contracts } = loadNodeCore();
  const cyclic = {};
  cyclic.self = cyclic;
  const unsafe = JSON.parse('{"__proto__":{"polluted":true}}');

  assert.equal(contracts.validateJsonValue(cyclic)[0].code, "JSON_CYCLE");
  assert.equal(contracts.validateJsonValue(unsafe)[0].code, "JSON_KEY");
  assert.throws(() => contracts.cloneJson(unsafe), /Unsafe object key/);
  assert.equal({}.polluted, undefined);
});

test("state and event contracts reject unknown envelope fields", () => {
  const game = loadNodeCore();
  const state = game.contracts.createInitialState({ seed: "strict-envelope" });
  state.untrusted = {};
  assert.equal(game.invariants.validateState(state).some((item) => item.code === "STATE_FIELD"), true);
  assert.throws(() => game.contracts.cloneGameState(state), /Unknown game-state field/);
  assert.equal(game.contracts.validateEventDraft({
    type: "VALID_NAME",
    payload: {},
    sequence: 100,
  }).some((item) => item.code === "EVENT_FIELD"), true);
});

test("stable sort preserves input and equal-item order", () => {
  const { contracts } = loadNodeCore();
  const input = [
    { name: "first", rank: 2 },
    { name: "second", rank: 1 },
    { name: "third", rank: 2 },
  ];
  const sorted = contracts.stableSort(input, (left, right) => left.rank - right.rank);
  assert.deepEqual(sorted.map((item) => item.name), ["second", "first", "third"]);
  assert.deepEqual(input.map((item) => item.name), ["first", "second", "third"]);
});

test("same seed and ordered actions produce byte-equivalent state", () => {
  const game = loadNodeCore();
  const runtime = createTurnRuntime(game);
  const initialA = game.contracts.createInitialState({ seed: "campaign-a", phase: "action" });
  const initialB = game.contracts.createInitialState({ seed: "campaign-a", phase: "action" });
  const finalA = advance(runtime, game.contracts, initialA, 1, 30);
  const finalB = advance(runtime, game.contracts, initialB, 1, 30);

  assert.equal(serialize(finalA), serialize(finalB));
  assert.equal(finalA.turn, 31);
  assert.equal(finalA.eventSequence, 30);
});

test("save and load at turn ten matches uninterrupted play", () => {
  const game = loadNodeCore();
  const runtime = createTurnRuntime(game);
  const initial = game.contracts.createInitialState({ seed: "round-trip", phase: "action" });
  const uninterrupted = advance(runtime, game.contracts, initial, 1, 30);
  const firstLeg = advance(runtime, game.contracts, initial, 1, 10);
  const loaded = JSON.parse(serialize(firstLeg));
  assert.deepEqual(game.invariants.validateState(loaded), []);
  const resumed = advance(runtime, game.contracts, loaded, 11, 30);

  assert.equal(serialize(resumed), serialize(uninterrupted));
});

test("runtime commits ordered events with action metadata", () => {
  const game = loadNodeCore();
  const runtime = createTurnRuntime(game);
  const initial = game.contracts.createInitialState({ seed: "events", phase: "action" });
  const final = advance(runtime, game.contracts, initial, 1, 3);

  assert.deepEqual(final.eventLog.map((event) => event.sequence), [1, 2, 3]);
  assert.deepEqual(final.eventLog.map((event) => event.actionId), ["advance-1", "advance-2", "advance-3"]);
  assert.deepEqual(final.eventLog.map((event) => event.turn), [1, 2, 3]);
});

test("runtime rejects malformed, unknown, and wrong-phase actions", () => {
  const game = loadNodeCore();
  const runtime = createTurnRuntime(game);
  const initial = game.contracts.createInitialState({ seed: "rejections", phase: "action" });
  const malformed = runtime.dispatch(initial, { id: "bad id", type: "ADVANCE_TURN", payload: {} });
  const unknown = runtime.dispatch(initial, game.contracts.createAction({ id: "known-shape", type: "NO_HANDLER" }));
  const wrongPhase = runtime.dispatch(initial, game.contracts.createAction({
    id: "wrong-phase",
    type: "ADVANCE_TURN",
    expectedPhase: "quiz",
  }));

  assert.equal(malformed.errors[0].code, "ACTION_ID");
  assert.equal(unknown.errors[0].code, "ACTION_UNKNOWN");
  assert.equal(wrongPhase.errors[0].code, "ACTION_PHASE_MISMATCH");
  assert.equal(malformed.state, initial);
  assert.equal(unknown.state, initial);
  assert.equal(wrongPhase.state, initial);
});

test("failed handler and failed postcondition leave original state untouched", () => {
  const game = loadNodeCore();
  const initial = game.contracts.createInitialState({ seed: "rollback", phase: "action" });
  const before = serialize(initial);
  const throwing = game.runtime.createRuntime({
    handlers: {
      BREAK(draft) {
        draft.turn = 99;
        throw new Error("expected failure");
      },
    },
  });
  const invalid = game.runtime.createRuntime({
    handlers: {
      BREAK(draft) {
        draft.turn = 0;
      },
    },
  });
  const action = game.contracts.createAction({ id: "break-1", type: "BREAK" });
  const thrownResult = throwing.dispatch(initial, action);
  const invalidResult = invalid.dispatch(initial, action);

  assert.equal(thrownResult.errors[0].code, "HANDLER_EXCEPTION");
  assert.equal(invalidResult.errors.some((item) => item.code === "TURN_VALUE"), true);
  assert.equal(serialize(initial), before);
  assert.equal(thrownResult.state, initial);
  assert.equal(invalidResult.state, initial);
});

test("runtime rejects state fields introduced by a handler", () => {
  const game = loadNodeCore();
  const initial = game.contracts.createInitialState({ seed: "strict-handler", phase: "action" });
  const runtime = game.runtime.createRuntime({
    handlers: {
      ADD_FIELD(draft) {
        draft.untrusted = { value: 1 };
      },
    },
  });
  const result = runtime.dispatch(initial, game.contracts.createAction({ id: "field-1", type: "ADD_FIELD" }));
  assert.equal(result.ok, false);
  assert.equal(result.errors[0].code, "HANDLER_STATE_CLONE");
  assert.equal(result.state, initial);
});

test("handlers cannot edit runtime-owned event history", () => {
  const game = loadNodeCore();
  const initial = game.contracts.createInitialState({ seed: "event-owner", phase: "action" });
  const runtime = game.runtime.createRuntime({
    handlers: {
      TAMPER(draft) {
        draft.eventSequence = 1;
        draft.eventLog.push({});
      },
    },
  });
  const result = runtime.dispatch(initial, game.contracts.createAction({ id: "tamper-1", type: "TAMPER" }));
  assert.equal(result.ok, false);
  assert.equal(result.errors[0].code, "RUNTIME_EVENT_OWNERSHIP");
  assert.equal(result.state, initial);
});

test("invariants report population, resource, RNG, and event corruption", () => {
  const game = loadNodeCore();
  const state = game.contracts.createInitialState({ seed: "invariants", phase: "action" });
  state.factions.player = { resources: { food: -1, coin: 10 } };
  state.provinces.alpha = { population: { capacity: 100, civilians: 80, military: 30 } };
  state.rng.counters.ai = -1;
  state.eventSequence = 2;
  const errors = game.invariants.validateState(state);
  const codes = new Set(errors.map((item) => item.code));

  assert.equal(codes.has("RESOURCE_VALUE"), true);
  assert.equal(codes.has("POPULATION_CAPACITY"), true);
  assert.equal(codes.has("RNG_COUNTER"), true);
  assert.equal(codes.has("EVENT_SEQUENCE_MISMATCH"), true);
  errors.forEach((item) => {
    assert.equal(typeof item.code, "string");
    assert.equal(typeof item.path, "string");
    assert.equal(typeof item.message, "string");
  });
});

test("core source has no nondeterministic or browser-only API access", () => {
  const forbidden = [
    /Math\.random/,
    /Date\.now/,
    /\bdocument\b/,
    /\bwindow\b/,
    /\blocalStorage\b/,
    /\bsessionStorage\b/,
  ];
  CORE_FILES.forEach((file) => {
    const source = fs.readFileSync(corePath(file), "utf8");
    forbidden.forEach((pattern) => {
      assert.equal(pattern.test(source), false, `${file} contains ${pattern}`);
    });
  });
});
