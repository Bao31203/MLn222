"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "../..");
const TEMPLATE = fs.readFileSync(path.join(ROOT, "template.html"), "utf8");
const BLOCK_START = TEMPLATE.indexOf("const QUESTION_IDS = new Set(QUESTIONS.map(q=>q.id));");
const BLOCK_END = TEMPLATE.indexOf("function buildChapterSelect(){", BLOCK_START);

assert.notEqual(BLOCK_START, -1, "study progress block start is missing");
assert.notEqual(BLOCK_END, -1, "study progress block end is missing");

const STUDY_SOURCE = TEMPLATE.slice(BLOCK_START, BLOCK_END) + `
globalThis.__studyTest = {
  LS,
  STUDY_PROGRESS_KEY,
  questions: QUESTIONS,
  progress: studyProgress,
  restoreStudySession,
  saveStudySession,
  state,
};`;

const QUESTIONS = [
  { id: "C01-Q001", chapter: "Chương 1", difficulty: "Nhận biết", options: ["a", "b", "c", "d"], answer: 0 },
  { id: "C01-Q002", chapter: "Chương 1", difficulty: "Thông hiểu", options: ["a", "b", "c", "d"], answer: 1 },
  { id: "C02-Q001", chapter: "Chương 2", difficulty: "Vận dụng", options: ["a", "b", "c", "d"], answer: 2 },
];

function createStorage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem(key) { return values.has(key) ? values.get(key) : null; },
    setItem(key, value) { values.set(key, String(value)); },
    removeItem(key) { values.delete(key); },
  };
}

function boot(storage) {
  const context = vm.createContext({
    QUESTIONS: structuredClone(QUESTIONS),
    window: { localStorage: storage },
  });
  vm.runInContext(STUDY_SOURCE, context, { filename: "template-study-progress.js" });
  return context.__studyTest;
}

function setSession(api, values) {
  Object.assign(api.state, {
    chapter: "all",
    difficulty: "all",
    shuffle: false,
    onlyMarked: false,
    onlyWrong: false,
    answered: {},
    sessSeen: 0,
    sessCorrect: 0,
    flashRevealed: -1,
  }, values);
}

test("study quiz and flashcard sessions survive a full storage reload independently", () => {
  const storage = createStorage();
  let api = boot(storage);

  setSession(api, {
    mode: "quiz",
    shuffle: true,
    pool: [api.questions[2], api.questions[0], api.questions[1]],
    idx: 2,
    answered: { "C02-Q001": 2, "C01-Q001": 0, "C01-Q002": 3 },
    sessSeen: 3,
    sessCorrect: 2,
  });
  api.saveStudySession();

  setSession(api, {
    mode: "flash",
    pool: api.questions.slice(),
    idx: 1,
    flashRevealed: 1,
  });
  api.saveStudySession();

  api = boot(storage);
  api.state.mode = "quiz";
  assert.equal(api.restoreStudySession("quiz"), true);
  assert.deepEqual(Array.from(api.state.pool, (question) => question.id), ["C02-Q001", "C01-Q001", "C01-Q002"]);
  assert.equal(api.state.idx, 2);
  assert.equal(api.state.sessSeen, 3);
  assert.equal(api.state.sessCorrect, 2);
  assert.deepEqual({ ...api.state.answered }, { "C02-Q001": 2, "C01-Q001": 0, "C01-Q002": 3 });

  api.state.mode = "flash";
  assert.equal(api.restoreStudySession("flash"), true);
  assert.equal(api.state.idx, 1);
  assert.equal(api.state.flashRevealed, 1);
  assert.deepEqual({ ...api.state.answered }, {});
});

test("invalid study progress is ignored and reset removes every study storage key", () => {
  const storage = createStorage({
    "mln222.v2.marked": "[]",
    "mln222.v2.stats": "{}",
    "mln222.v3.studyProgress": JSON.stringify({
      version: 1,
      sessions: {
        quiz: {
          chapter: "all",
          difficulty: "all",
          shuffle: false,
          onlyMarked: false,
          onlyWrong: false,
          pool: ["C01-Q001", "C01-Q001", "C02-Q001"],
          idx: 1,
          answered: {},
          flashRevealed: null,
        },
        flash: null,
      },
    }),
  });
  const api = boot(storage);

  assert.equal(api.progress.sessions.quiz, null);
  assert.equal(api.restoreStudySession("quiz"), false);
  api.LS.clear();
  assert.equal(storage.getItem("mln222.v2.marked"), null);
  assert.equal(storage.getItem("mln222.v2.stats"), null);
  assert.equal(storage.getItem(api.STUDY_PROGRESS_KEY), null);
});
