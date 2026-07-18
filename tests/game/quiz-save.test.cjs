"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");
const { CORE_FILES, ROOT, corePath, loadNodeCore } = require("./test-helpers.cjs");

const QUESTIONS = JSON.parse(fs.readFileSync(path.join(ROOT, "questions.json"), "utf8"));
const MODULE_FILES = [
  ["quiz", "question-deck.js"],
  ["quiz", "quiz-rewards.js"],
  ["storage", "save-validation.js"],
  ["storage", "save-codec.js"],
];

function modulePath(parts) {
  return path.join(ROOT, "game", ...parts);
}

function loadQuizSave() {
  const game = loadNodeCore();
  MODULE_FILES.forEach((parts) => {
    const resolved = require.resolve(modulePath(parts));
    delete require.cache[resolved];
  });
  MODULE_FILES.forEach((parts) => require(modulePath(parts)));
  return game;
}

function loadBrowserQuizSave(values = {}) {
  const context = vm.createContext(values);
  CORE_FILES.forEach((file) => vm.runInContext(fs.readFileSync(corePath(file), "utf8"), context, { filename: file }));
  MODULE_FILES.forEach((parts) => {
    const file = modulePath(parts);
    vm.runInContext(fs.readFileSync(file, "utf8"), context, { filename: parts[1] });
  });
  return context;
}

function rewardConfig() {
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

function memoryAdapter() {
  const values = new Map();
  return {
    getItem(key) { return values.has(key) ? values.get(key) : null; },
    setItem(key, value) { values.set(key, value); },
    removeItem(key) { values.delete(key); },
  };
}

test("question index accepts the 504-question production bank", () => {
  const game = loadQuizSave();
  const index = game["question-deck"].createQuestionIndex(QUESTIONS);
  assert.equal(index.ids.length, 504);
  assert.deepEqual([...index.chapters], ["1", "2", "3", "4", "5", "6"]);
});

test("scheduler draws exactly ten stable IDs without repeating before all 504 are consumed", () => {
  const game = loadQuizSave();
  let rngState = game.rng.createRngState("quiz-cycle");
  const created = game["question-deck"].createDeckState(QUESTIONS, rngState);
  let deck = created.state;
  rngState = created.rngState;
  const drawn = [];
  for (let turn = 0; turn < 51; turn += 1) {
    const result = game["question-deck"].drawQuiz(deck, QUESTIONS, rngState);
    assert.equal(result.questionIds.length, 10);
    assert.equal(new Set(result.questionIds).size, 10);
    drawn.push(...result.questionIds);
    deck = result.state;
    rngState = result.rngState;
  }
  assert.equal(new Set(drawn.slice(0, 504)).size, 504);
  assert.equal(deck.cycle, 2);
});

test("difficulty debt reaches the ideal 4/4/2 allocation for the first 48 turns", () => {
  const game = loadQuizSave();
  let rngState = game.rng.createRngState("quiz-quota");
  let created = game["question-deck"].createDeckState(QUESTIONS, rngState);
  let deck = created.state;
  rngState = created.rngState;
  for (let turn = 0; turn < 48; turn += 1) {
    const draw = game["question-deck"].drawQuiz(deck, QUESTIONS, rngState);
    deck = draw.state;
    rngState = draw.rngState;
  }
  assert.deepEqual(deck.difficultyCounts, { "Nhan biet": 192, "Thong hieu": 192, "Van dung": 96 });
  assert.equal(Object.values(deck.chapterCounts).every((count) => count >= 64), true);
});

test("same seed produces the same quiz sequence and RNG counters", () => {
  const game = loadQuizSave();
  const firstRng = game.rng.createRngState("quiz-replay");
  const secondRng = game.rng.createRngState("quiz-replay");
  const firstDeck = game["question-deck"].createDeckState(QUESTIONS, firstRng);
  const secondDeck = game["question-deck"].createDeckState(QUESTIONS, secondRng);
  const first = game["question-deck"].createQuiz(firstDeck.state, QUESTIONS, firstDeck.rngState, "quiz-1");
  const second = game["question-deck"].createQuiz(secondDeck.state, QUESTIONS, secondDeck.rngState, "quiz-1");
  assert.deepEqual(first, second);
});

test("quiz answers advance atomically and preserve a consistent score", () => {
  const game = loadQuizSave();
  const rngState = game.rng.createRngState("quiz-answers");
  const deck = game["question-deck"].createDeckState(QUESTIONS, rngState);
  let quiz = game["question-deck"].createQuiz(deck.state, QUESTIONS, deck.rngState, "quiz-answer").quiz;
  const answers = Object.fromEntries(QUESTIONS.map((question) => [question.id, question.answer]));
  for (let index = 0; index < 10; index += 1) {
    quiz = game["question-deck"].answerQuiz(quiz, QUESTIONS, answers[quiz.questionIds[index]]);
  }
  assert.equal(quiz.completed, true);
  assert.equal(quiz.position, 10);
  assert.equal(quiz.score, 10);
  assert.throws(() => game["question-deck"].answerQuiz(quiz, QUESTIONS, 0), /Completed quiz/);
});

test("quiz reward rules return bounded actions without mutating economy snapshots", () => {
  const game = loadQuizSave();
  const context = {
    factionId: "player",
    resources: { food: 1000, coin: 500 },
    production: { food: 100, coin: 40 },
    capacityAvailable: 2000,
    choice: "food",
  };
  const before = JSON.stringify(context);
  const penalty = game["quiz-rewards"].evaluateScore(2, context, rewardConfig());
  const completedQuiz = { id: "quiz-reward", completed: true, position: 10, score: 9 };
  const reward = game["quiz-rewards"].createRewardAction("quiz-reward-1", completedQuiz, context, rewardConfig());
  assert.equal(penalty.resourceDeltas.food, -50);
  assert.equal(reward.payload.resourceDeltas.food, 50);
  assert.equal(reward.type, "APPLY_QUIZ_RESULT");
  assert.equal(reward.payload.quizId, "quiz-reward");
  assert.equal(JSON.stringify(context), before);
});

test("reward actions reject unfinished quizzes and unsafe arithmetic", () => {
  const game = loadQuizSave();
  const context = { factionId: "player", resources: { food: 0, coin: 0 }, production: { food: 10, coin: 10 }, capacityAvailable: 0, choice: "food" };
  assert.throws(() => game["quiz-rewards"].createRewardAction("unfinished", { id: "quiz-x", completed: false, position: 9, score: 9 }, context, rewardConfig()), /completed/);
  const unsafe = { ...context, resources: { food: 1, coin: 0 }, production: { food: Number.MAX_SAFE_INTEGER, coin: 0 } };
  assert.throws(() => game["quiz-rewards"].evaluateScore(10, unsafe, rewardConfig()), /safe-integer/);
});

test("population and perfect-score rewards respect capacity and configured caps", () => {
  const game = loadQuizSave();
  const base = { factionId: "player", resources: { food: 0, coin: 0 }, production: { food: 80, coin: 20 }, capacityAvailable: 10 };
  const migrants = game["quiz-rewards"].evaluateScore(7, { ...base, choice: "population" }, rewardConfig());
  const perfect = game["quiz-rewards"].evaluateScore(10, { ...base, choice: "unlock" }, rewardConfig());
  assert.equal(migrants.populationDelta, 1);
  assert.equal(perfect.resourceDeltas.food, 80);
  assert.equal(perfect.effects[0].type, "unlock-discount");
});

test("save codec round-trips full game state including mid-quiz and mid-battle state", () => {
  const game = loadQuizSave();
  const state = game.contracts.createInitialState({ campaignId: "save-test", seed: "save-roundtrip", phase: "quiz" });
  const ids = QUESTIONS.slice(0, 10).map((q) => q.id);
  state.quiz = { id: "quiz-8", questionIds: ids, position: 3, answers: { [ids[0]]: 0, [ids[1]]: 0, [ids[2]]: 0 }, score: 1, completed: false };
  state.battles["battle-1"] = { turn: 4, morale: { attacker: 61, defender: 48 }, reinforcementQueue: [] };
  const raw = game["save-codec"].encodeSave(state);
  const restored = game["save-codec"].decodeSave(raw);
  assert.equal(restored.ok, true);
  assert.deepEqual(restored.value, state);
  assert.equal(JSON.parse(raw).rng.counters.quiz, state.rng.counters.quiz);
});

test("save validation rejects internally inconsistent quiz progress", () => {
  const game = loadQuizSave();
  const state = game.contracts.createInitialState({ campaignId: "bad-quiz", seed: "bad-quiz", phase: "quiz" });
  state.quiz = { id: "quiz-bad", questionIds: QUESTIONS.slice(0, 10).map((q) => q.id), position: 3, answers: { [QUESTIONS[0].id]: 0 }, score: 1, completed: false };
  assert.throws(() => game["save-codec"].encodeSave(state), /answer count/i);
});

test("deck validation rejects forged cycle and counter relationships", () => {
  const game = loadQuizSave();
  const created = game["question-deck"].createDeckState(QUESTIONS, game.rng.createRngState("forged-deck"));
  const forged = JSON.parse(JSON.stringify(created.state));
  forged.remaining.pop();
  assert.throws(() => game["question-deck"].validateDeckState(forged, game["question-deck"].createQuestionIndex(QUESTIONS)), /inconsistent/);
});

test("save after every answer restores identical quiz progress", () => {
  const game = loadQuizSave();
  const adapter = memoryAdapter();
  const state = game.contracts.createInitialState({ campaignId: "answer-save", seed: "answer-save", phase: "quiz" });
  const deck = game["question-deck"].createDeckState(QUESTIONS, state.rng);
  const created = game["question-deck"].createQuiz(deck.state, QUESTIONS, deck.rngState, "quiz-save");
  state.rng = created.rngState;
  state.quiz = created.quiz;
  const answers = Object.fromEntries(QUESTIONS.map((question) => [question.id, question.answer]));
  for (let index = 0; index < 10; index += 1) {
    state.quiz = game["question-deck"].answerQuiz(state.quiz, QUESTIONS, answers[state.quiz.questionIds[index]]);
    assert.equal(game["save-codec"].saveToAdapter(adapter, state).ok, true);
    const loaded = game["save-codec"].loadFromAdapter(adapter);
    assert.equal(loaded.ok, true);
    assert.deepEqual(loaded.value.quiz, state.quiz);
    assert.deepEqual(loaded.value.rng, state.rng);
  }
});

test("save/load continuation is equivalent to uninterrupted quiz play", () => {
  const game = loadQuizSave();
  const state = game.contracts.createInitialState({ campaignId: "resume", seed: "resume", phase: "quiz" });
  const deck = game["question-deck"].createDeckState(QUESTIONS, state.rng);
  const created = game["question-deck"].createQuiz(deck.state, QUESTIONS, deck.rngState, "quiz-resume");
  state.rng = created.rngState;
  state.quiz = created.quiz;
  const answerById = Object.fromEntries(QUESTIONS.map((question) => [question.id, question.answer]));
  for (let index = 0; index < 5; index += 1) state.quiz = game["question-deck"].answerQuiz(state.quiz, QUESTIONS, answerById[state.quiz.questionIds[index]]);
  const resumed = game["save-codec"].decodeSave(game["save-codec"].encodeSave(state)).value;
  for (let index = 5; index < 10; index += 1) {
    state.quiz = game["question-deck"].answerQuiz(state.quiz, QUESTIONS, answerById[state.quiz.questionIds[index]]);
    resumed.quiz = game["question-deck"].answerQuiz(resumed.quiz, QUESTIONS, answerById[resumed.quiz.questionIds[index]]);
  }
  assert.deepEqual(resumed, state);
});

test("missing, truncated, future, tampered, and malicious saves fail safely", () => {
  const game = loadQuizSave();
  const state = game.contracts.createInitialState({ campaignId: "corrupt", seed: "corrupt" });
  const raw = game["save-codec"].encodeSave(state);
  assert.equal(game["save-codec"].decodeSave(null).error.code, "SAVE_MISSING");
  assert.equal(game["save-codec"].decodeSave(raw.slice(0, 20)).error.code, "SAVE_JSON");
  const future = JSON.parse(raw); future.schemaVersion = 99;
  assert.equal(game["save-codec"].decodeSave(JSON.stringify(future)).error.code, "SAVE_VERSION");
  const tampered = JSON.parse(raw); tampered.payload.turn = 3;
  assert.equal(game["save-codec"].decodeSave(JSON.stringify(tampered)).error.code, "SAVE_CHECKSUM");
  const malicious = raw.replace('"checksum"', '"__proto__":{"polluted":true},"checksum"');
  assert.equal(game["save-codec"].decodeSave(malicious).ok, false);
  assert.equal({}.polluted, undefined);
});

test("unavailable storage returns structured failures and preserves study storage separation", () => {
  const game = loadQuizSave();
  const state = game.contracts.createInitialState({ campaignId: "storage", seed: "storage" });
  const failing = { getItem() { throw new Error("denied"); }, setItem() { throw new Error("denied"); }, removeItem() { throw new Error("denied"); } };
  assert.equal(game["save-codec"].saveToAdapter(failing, state).error.code, "SAVE_STORAGE_WRITE");
  assert.equal(game["save-codec"].loadFromAdapter(failing).error.code, "SAVE_STORAGE_READ");
  assert.equal(game["save-codec"].STORAGE_KEY, "mln222.game.v1");
});

test("browser and Node module APIs produce equivalent deterministic output", () => {
  const nodeGame = loadQuizSave();
  const context = loadBrowserQuizSave({ questionsJson: JSON.stringify(QUESTIONS) });
  const nodeRng = nodeGame.rng.createRngState("parity");
  const nodeDeck = nodeGame["question-deck"].createDeckState(QUESTIONS, nodeRng);
  vm.runInContext(`
    browserDeckJson = JSON.stringify(
      MLN222Game["question-deck"].createDeckState(JSON.parse(questionsJson), MLN222Game.rng.createRngState("parity"))
    );
  `, context);
  assert.equal(JSON.stringify(nodeDeck), context.browserDeckJson);
});

test("quiz and storage modules avoid nondeterministic or browser-storage globals", () => {
  MODULE_FILES.forEach((parts) => {
    const source = fs.readFileSync(modulePath(parts), "utf8");
    assert.equal(/Math\.random|Date\.now|window\.localStorage|document\./.test(source), false, parts[1]);
  });
});
