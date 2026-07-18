"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const { loadGame, loadDependencies } = require("../../scripts/simulate-campaign.js");

const ROOT = path.resolve(__dirname, "..", "..");
const game = loadGame();
[
  "game/quiz/question-deck.js",
  "game/ui/browser-storage.js",
  "game/ui/game-controller.js",
].forEach((relative) => require(path.join(ROOT, relative)));

const deps = loadDependencies();
const questions = JSON.parse(fs.readFileSync(path.join(ROOT, "questions.json"), "utf8"));
const answers = Object.fromEntries(questions.map((question) => [question.id, question.answer]));

function memoryStorage() {
  const values = new Map();
  return {
    getItem(key) { return values.has(key) ? values.get(key) : null; },
    setItem(key, value) { values.set(key, String(value)); },
    removeItem(key) { values.delete(key); },
  };
}

function createController(storage = memoryStorage()) {
  const browserStorage = game["browser-storage"].create(storage);
  return {
    controller: game["game-controller"].create({
      deps,
      questions,
      storage: browserStorage,
      defaultProvinceId: "ha-noi",
    }),
    storage,
  };
}

test("browser controller stages and resumes actions without bypassing the turn quiz", () => {
  const { controller, storage } = createController();
  controller.startCampaign("ha-noi", "controller-regression");
  const recruit = controller.legalActions().find((action) => action.type === "RECRUIT");
  assert.ok(recruit);
  controller.stageAction(recruit);
  assert.equal(controller.snapshot().pendingActions.length, 1);
  assert.ok(storage.getItem(game["campaign-save"].STORAGE_KEY));
  assert.ok(storage.getItem(game["browser-storage"].UI_KEY));

  let resumed = createController(storage).controller;
  resumed.resume();
  assert.equal(resumed.snapshot().pendingActions.length, 1);
  assert.equal(resumed.snapshot().state.turn, 1);

  resumed.beginQuiz("food");
  const firstQuiz = resumed.snapshot().state.quiz.active;
  const firstQuestionId = firstQuiz.questionIds[firstQuiz.position];
  resumed.answerQuiz(answers[firstQuestionId]);
  resumed.setActivePanel("battle");

  resumed = createController(storage).controller;
  resumed.resume();
  assert.equal(resumed.snapshot().quizReviewQuestionId, firstQuestionId);
  assert.equal(resumed.snapshot().activePanel, "battle");
  resumed.continueQuizReview();
  assert.equal(resumed.snapshot().quizReviewQuestionId, null);

  for (let index = 1; index < 10; index += 1) {
    const active = resumed.snapshot().state.quiz.active;
    const questionId = active.questionIds[active.position];
    resumed.answerQuiz(answers[questionId]);
  }
  assert.equal(resumed.snapshot().state.quiz.active.completed, true);
  resumed.completeQuiz();
  const completed = resumed.snapshot();
  assert.equal(completed.state.turn, 2);
  assert.equal(completed.pendingActions.length, 0);
  assert.equal(completed.state.quiz.completedTurns[0].score, 10);
});

test("browser controller discards untrusted UI sidecar fields on resume", () => {
  const { controller, storage } = createController();
  controller.startCampaign("ha-noi", "controller-sidecar-validation");
  storage.setItem(game["browser-storage"].UI_KEY, JSON.stringify({
    schemaVersion: 1,
    selectedProvinceId: "ha-noi",
    pendingActions: [],
    tacticSelections: { "missing-battle": "assault" },
    quizChoice: "food",
    quizReviewQuestionId: "missing-question",
    activePanel: "not-a-panel",
    reportEvents: [],
  }));

  const resumed = createController(storage).controller;
  const snapshot = resumed.resume();
  assert.deepEqual(snapshot.tacticSelections, {});
  assert.equal(snapshot.quizReviewQuestionId, null);
  assert.equal(snapshot.activePanel, "province");
  assert.match(snapshot.error, /đã được loại bỏ/);
});

test("browser controller reports a corrupt campaign save in Vietnamese", () => {
  const storage = memoryStorage();
  storage.setItem(game["campaign-save"].STORAGE_KEY, "{broken");
  const { controller } = createController(storage);
  const snapshot = controller.resume();
  assert.equal(snapshot.state, null);
  assert.match(snapshot.error, /bị hỏng/);
});

test("browser controller reports and replaces a corrupt UI sidecar", () => {
  const { controller, storage } = createController();
  controller.startCampaign("ha-noi", "controller-corrupt-sidecar");
  storage.setItem(game["browser-storage"].UI_KEY, "{broken");

  const resumed = createController(storage).controller;
  const snapshot = resumed.resume();
  assert.ok(snapshot.state);
  assert.match(snapshot.error, /không thể đọc được/);
  assert.doesNotThrow(() => JSON.parse(storage.getItem(game["browser-storage"].UI_KEY)));
});
