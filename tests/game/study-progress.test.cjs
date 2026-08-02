"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "../..");
const TEMPLATE = fs.readFileSync(path.join(ROOT, "template.html"), "utf8");
const CATALOG_START = TEMPLATE.indexOf("/* ====== Embedded multi-subject catalogs ====== */");
const HOME_START = TEMPLATE.indexOf("/* ====== Home, subject metadata, and shared chrome ====== */", CATALOG_START);
const REBUILD_START = TEMPLATE.indexOf("function rebuildSubjectIndexes(){", HOME_START);
const ACTIVATE_START = TEMPLATE.indexOf("function activateSubject(subjectId){", REBUILD_START);
const SESSION_START = TEMPLATE.indexOf("function pruneStudySessions(mode,keepKey){", ACTIVATE_START);
const SESSION_END = TEMPLATE.indexOf("function buildChapterSelect(){", SESSION_START);

for (const [name, value] of Object.entries({ CATALOG_START, HOME_START, REBUILD_START, ACTIVATE_START, SESSION_START, SESSION_END })) {
  assert.notEqual(value, -1, `${name} marker is missing`);
}

const FEATURES_NONE = { quiz: false, flashcards: false, search: false, lectures: false, game: false };
const SUBJECTS = [
  {
    id: "mln111", code: "MLN111", title: "Triết học", status: "ready", studyReady: true,
    features: { ...FEATURES_NONE, quiz: true, flashcards: true, search: true },
    chapters: [{ id: "mln111-c01", number: 1, title: "Chương Triết học", questionCount: 3 }],
  },
  {
    id: "mln112", code: "MLN112", title: "Kinh tế chính trị", status: "ready", studyReady: true,
    features: { quiz: true, flashcards: true, search: true, lectures: true, game: true },
    chapters: [{ id: "mln112-c01", number: 1, title: "Chương 1", questionCount: 3 }],
  },
  {
    id: "hcm202", code: "HCM202", title: "Tư tưởng Hồ Chí Minh", status: "ready", studyReady: true,
    features: { ...FEATURES_NONE, quiz: true, flashcards: true, search: true },
    chapters: [{ id: "hcm202-c01", number: 1, title: "Chương Tư tưởng", questionCount: 3 }],
  },
  {
    id: "mln131", code: "MLN131", title: "MLN131", status: "comingSoon", studyReady: false,
    features: FEATURES_NONE, chapters: [],
  },
];
const BANKS = {
  mln111: [
    { id: "MLN111-C01-Q001", chapterId: "mln111-c01", chapter: "Chương Triết học", difficulty: "Nhận biết", options: ["a", "b", "c", "d"], answer: 0 },
    { id: "MLN111-C01-Q002", chapterId: "mln111-c01", chapter: "Chương Triết học", difficulty: "Thông hiểu", options: ["a", "b", "c", "d"], answer: 1 },
    { id: "MLN111-C01-Q003", chapterId: "mln111-c01", chapter: "Chương Triết học", difficulty: "Vận dụng", options: ["a", "b", "c", "d"], answer: 2 },
  ],
  mln112: [
    { id: "C01-Q001", chapterId: "mln112-c01", chapter: "Chương 1", difficulty: "Nhận biết", options: ["a", "b", "c", "d"], answer: 0 },
    { id: "C01-Q002", chapterId: "mln112-c01", chapter: "Chương 1", difficulty: "Thông hiểu", options: ["a", "b", "c", "d"], answer: 1 },
    { id: "C01-Q003", chapterId: "mln112-c01", chapter: "Chương 1", difficulty: "Vận dụng", options: ["a", "b", "c", "d"], answer: 2 },
  ],
  hcm202: [
    { id: "HCM202-C01-Q001", chapterId: "hcm202-c01", chapter: "Chương Tư tưởng", difficulty: "Nhận biết", options: ["a", "b", "c", "d"], answer: 0 },
    { id: "HCM202-C01-Q002", chapterId: "hcm202-c01", chapter: "Chương Tư tưởng", difficulty: "Thông hiểu", options: ["a", "b", "c", "d"], answer: 1 },
    { id: "HCM202-C01-Q003", chapterId: "hcm202-c01", chapter: "Chương Tư tưởng", difficulty: "Vận dụng", options: ["a", "b", "c", "d"], answer: 2 },
  ],
};

function createStorage(initial = {}, throwing = {}) {
  const values = new Map(Object.entries(initial));
  const calls = [];
  return {
    calls,
    getItem(key) {
      calls.push(["get", key]);
      if (throwing.get) throw new Error("get disabled");
      return values.has(key) ? values.get(key) : null;
    },
    setItem(key, value) {
      calls.push(["set", key]);
      if (throwing.set) throw new Error("set disabled");
      values.set(key, String(value));
    },
    removeItem(key) {
      calls.push(["remove", key]);
      if (throwing.remove) throw new Error("remove disabled");
      values.delete(key);
    },
    snapshot() { return Object.fromEntries(values); },
  };
}

function boot(storage) {
  const catalogSource = TEMPLATE.slice(CATALOG_START, HOME_START)
    .replace("/*__SUBJECT_CATALOG__*/[]", JSON.stringify(SUBJECTS))
    .replace("/*__QUESTION_BANKS__*/{}", JSON.stringify(BANKS))
    .replace("/*__LECTURE_CATALOGS__*/{}", "{}");
  const rebuildSource = TEMPLATE.slice(REBUILD_START, ACTIVATE_START);
  const sessionSource = TEMPLATE.slice(SESSION_START, SESSION_END);
  const source = `${catalogSource}\n${rebuildSource}\n${sessionSource}\n
function __primeSubject(subjectId){
  const subject=getSubject(subjectId);
  if(!subject)return false;
  app.subject=subject;
  app.questions=isReadySubject(subject)?getQuestionBank(subject.id):EMPTY_QUESTION_BANK;
  rebuildSubjectIndexes();
  if(isReadySubject(subject)){
    app.study=app.memoryStudyBySubject.get(subject.id)||loadSubjectStudy(subject);
    app.memoryStudyBySubject.set(subject.id,app.study);
  }else app.study=createEmptyStudyState();
  return true;
}
globalThis.__studyTest={
  app,getSubject,getQuestionBank,questionKey,storageConfig,__primeSubject,
  saveStudySession,restoreStudySession,persistStudyState,rememberStudyState,
  removeActiveStudyStorage,currentStudyFilters,createEmptyStudyState
};`;
  const context = vm.createContext({
    window: { localStorage: storage },
    document: {
      querySelector() { return null; },
      createElementNS() { throw new Error("unexpected DOM creation"); },
    },
    TextEncoder,
    encodeURIComponent,
    decodeURIComponent,
    normalizeText(value) { return String(value); },
    requestAnimationFrame() {},
  });
  vm.runInContext(source, context, { filename: "template-study-progress.js" });
  return context.__studyTest;
}

function setSession(api, values) {
  Object.assign(api.app.study, {
    mode: "quiz",
    chapterId: "all",
    difficulty: "all",
    questionStart: 1,
    shuffle: false,
    onlyMarked: false,
    onlyWrong: false,
    pool: api.app.questions.slice(),
    idx: 0,
    answered: Object.create(null),
    sessSeen: 0,
    sessCorrect: 0,
    flashRevealed: -1,
  }, values);
}

test("MLN112 quiz and flash sessions keep the legacy keys and serialized ID shape", () => {
  const storage = createStorage();
  let api = boot(storage);
  api.__primeSubject("mln112");
  setSession(api, {
    mode: "quiz",
    shuffle: true,
    pool: [api.app.questions[2], api.app.questions[0], api.app.questions[1]],
    idx: 2,
    answered: { "mln112:C01-Q003": 2, "mln112:C01-Q001": 0, "mln112:C01-Q002": 3 },
  });
  api.saveStudySession();
  setSession(api, { mode: "flash", idx: 1, flashRevealed: 1 });
  api.saveStudySession();

  const saved = storage.snapshot();
  assert.ok(saved["mln222.v3.studyProgress"]);
  assert.ok(saved["mln222.v2.marked"]);
  assert.ok(saved["mln222.v2.stats"]);
  assert.doesNotMatch(saved["mln222.v3.studyProgress"], /mln112:/);

  api = boot(storage);
  api.__primeSubject("mln112");
  api.app.study.mode = "quiz";
  assert.equal(api.restoreStudySession("quiz"), true);
  assert.deepEqual(Array.from(api.app.study.pool, (question) => question.id), ["C01-Q003", "C01-Q001", "C01-Q002"]);
  assert.equal(api.app.study.idx, 2);
  assert.deepEqual({ ...api.app.study.answered }, {
    "mln112:C01-Q003": 2,
    "mln112:C01-Q001": 0,
    "mln112:C01-Q002": 3,
  });
  api.app.study.mode = "flash";
  assert.equal(api.restoreStudySession("flash"), true);
  assert.equal(api.app.study.idx, 1);
  assert.equal(api.app.study.flashRevealed, 1);
});

test("legacy MLN112 version-one progress restores the current question", () => {
  const storage = createStorage({
    "mln222.v3.studyProgress": JSON.stringify({
      version: 1,
      sessions: {
        quiz: {
          chapter: "all", difficulty: "all", shuffle: false,
          onlyMarked: false, onlyWrong: false,
          pool: ["C01-Q001", "C01-Q002", "C01-Q003"], idx: 1,
          answered: { "C01-Q001": 0 }, flashRevealed: null,
        },
        flash: null,
      },
    }),
  });
  const api = boot(storage);
  api.__primeSubject("mln112");
  api.app.study.mode = "quiz";
  assert.equal(api.restoreStudySession("quiz"), true);
  assert.equal(api.app.study.idx, 1);
  assert.equal(api.app.study.sessSeen, 1);
  assert.equal(api.app.study.sessCorrect, 1);
});

test("MLN111 and MLN112 writes stay in separate namespaces", () => {
  const storage = createStorage();
  const api = boot(storage);
  api.__primeSubject("mln111");
  setSession(api, { answered: { "mln111:MLN111-C01-Q001": 0 } });
  api.saveStudySession();
  api.__primeSubject("mln112");
  setSession(api, { answered: { "mln112:C01-Q001": 0 } });
  api.saveStudySession();
  const saved = storage.snapshot();
  assert.ok(saved["mln-study-hub.v1.mln111.marked"]);
  assert.ok(saved["mln-study-hub.v1.mln111.stats"]);
  assert.ok(saved["mln-study-hub.v1.mln111.studyProgress"]);
  assert.ok(saved["mln222.v2.marked"]);
  assert.ok(saved["mln222.v2.stats"]);
  assert.ok(saved["mln222.v3.studyProgress"]);
  const mln111Progress = JSON.parse(saved["mln-study-hub.v1.mln111.studyProgress"]);
  const mln111Session = Object.values(mln111Progress.sessions.quiz)[0];
  assert.equal(mln111Session.pool.includes("C01-Q001"), false);
  assert.equal(mln111Session.pool.includes("MLN111-C01-Q001"), true);
  assert.doesNotMatch(saved["mln222.v3.studyProgress"], /MLN111/);
});

test("HCM202 save, reload, and reset stay isolated from MLN111 and MLN112", () => {
  const storage = createStorage({
    "mln-study-hub.v1.mln111.marked": "[]",
    "mln-study-hub.v1.mln111.stats": "{}",
    "mln-study-hub.v1.mln111.studyProgress": "mln111-sentinel",
    "mln222.v2.marked": "[]",
    "mln222.v2.stats": "{}",
    "mln222.v3.studyProgress": "mln112-sentinel",
  });
  let api = boot(storage);
  api.__primeSubject("hcm202");
  setSession(api, {
    idx: 1,
    answered: {
      "hcm202:HCM202-C01-Q001": 0,
      "hcm202:HCM202-C01-Q002": 1,
    },
  });
  api.saveStudySession();

  let saved = storage.snapshot();
  assert.ok(saved["mln-study-hub.v1.hcm202.marked"]);
  assert.ok(saved["mln-study-hub.v1.hcm202.stats"]);
  assert.ok(saved["mln-study-hub.v1.hcm202.studyProgress"]);
  assert.equal(saved["mln-study-hub.v1.mln111.studyProgress"], "mln111-sentinel");
  assert.equal(saved["mln222.v3.studyProgress"], "mln112-sentinel");
  assert.doesNotMatch(saved["mln-study-hub.v1.hcm202.studyProgress"], /hcm202:/);

  api = boot(storage);
  api.__primeSubject("hcm202");
  api.app.study.mode = "quiz";
  assert.equal(api.restoreStudySession("quiz"), true);
  assert.equal(api.app.study.idx, 1);
  assert.deepEqual(Array.from(api.app.study.pool, (question) => question.id), [
    "HCM202-C01-Q001", "HCM202-C01-Q002", "HCM202-C01-Q003",
  ]);
  assert.deepEqual({ ...api.app.study.answered }, {
    "hcm202:HCM202-C01-Q001": 0,
    "hcm202:HCM202-C01-Q002": 1,
  });

  api.removeActiveStudyStorage();
  saved = storage.snapshot();
  assert.equal(saved["mln-study-hub.v1.hcm202.marked"], undefined);
  assert.equal(saved["mln-study-hub.v1.hcm202.stats"], undefined);
  assert.equal(saved["mln-study-hub.v1.hcm202.studyProgress"], undefined);
  assert.equal(saved["mln-study-hub.v1.mln111.studyProgress"], "mln111-sentinel");
  assert.equal(saved["mln222.v3.studyProgress"], "mln112-sentinel");
});

test("same-tab memory survives every storage API failure across subject round trips", () => {
  const storage = createStorage({}, { get: true, set: true, remove: true });
  const api = boot(storage);
  api.__primeSubject("mln111");
  setSession(api, { idx: 1, answered: { "mln111:MLN111-C01-Q001": 0 } });
  api.saveStudySession();
  const mln111Study = api.app.study;
  api.__primeSubject("mln112");
  setSession(api, { idx: 2, answered: { "mln112:C01-Q001": 0 } });
  api.saveStudySession();
  const mln112Study = api.app.study;
  api.__primeSubject("mln111");
  assert.equal(api.app.study, mln111Study);
  api.app.study.mode = "quiz";
  assert.equal(api.restoreStudySession("quiz"), true);
  assert.equal(api.app.study.idx, 1);
  api.__primeSubject("mln112");
  assert.equal(api.app.study, mln112Study);
  api.app.study.mode = "quiz";
  assert.equal(api.restoreStudySession("quiz"), true);
  assert.equal(api.app.study.idx, 2);
});

test("reset removes only the active subject study keys", () => {
  const storage = createStorage({
    "mln-study-hub.v1.mln111.marked": "[]",
    "mln-study-hub.v1.mln111.stats": "{}",
    "mln-study-hub.v1.mln111.studyProgress": "{}",
    "mln222.v2.marked": "[]",
    "mln222.v2.stats": "{}",
    "mln222.v3.studyProgress": "{}",
    "mln222.campaign.v1": "campaign-save",
  });
  const api = boot(storage);
  api.__primeSubject("mln111");
  api.removeActiveStudyStorage();
  const saved = storage.snapshot();
  assert.equal(saved["mln-study-hub.v1.mln111.marked"], undefined);
  assert.equal(saved["mln-study-hub.v1.mln111.stats"], undefined);
  assert.equal(saved["mln-study-hub.v1.mln111.studyProgress"], undefined);
  assert.equal(saved["mln222.v2.marked"], "[]");
  assert.equal(saved["mln222.v2.stats"], "{}");
  assert.equal(saved["mln222.v3.studyProgress"], "{}");
  assert.equal(saved["mln222.campaign.v1"], "campaign-save");
});

test("invalid cross-subject and duplicate progress is ignored safely", () => {
  const storage = createStorage({
    "mln-study-hub.v1.mln111.marked": JSON.stringify(["C01-Q001", "MLN111-C01-Q001"]),
    "mln-study-hub.v1.mln111.stats": JSON.stringify({
      "C01-Q001": { c: 99, w: 99 },
      "MLN111-C01-Q001": { c: -1, w: "bad" },
    }),
    "mln-study-hub.v1.mln111.studyProgress": JSON.stringify({
      version: 1,
      sessions: {
        quiz: {
          chapter: "all", difficulty: "all", shuffle: false,
          onlyMarked: false, onlyWrong: false,
          pool: ["MLN111-C01-Q001", "MLN111-C01-Q001", "MLN111-C01-Q003"],
          idx: 1, answered: {}, flashRevealed: null,
        },
        flash: null,
      },
    }),
  });
  const api = boot(storage);
  api.__primeSubject("mln111");
  assert.deepEqual(Array.from(api.app.study.marked), ["mln111:MLN111-C01-Q001"]);
  assert.deepEqual(JSON.parse(JSON.stringify(api.app.study.stats)), {
    "mln111:MLN111-C01-Q001": { c: 0, w: 0 },
  });
  api.app.study.mode = "quiz";
  assert.equal(api.restoreStudySession("quiz"), false);
});

test("coming-soon subjects create no pool and perform zero storage writes", () => {
  const storage = createStorage();
  const api = boot(storage);
  api.__primeSubject("mln131");
  setSession(api, { mode: "quiz" });
  api.saveStudySession();
  api.persistStudyState();
  assert.equal(api.app.questions.length, 0);
  assert.equal(api.app.study.pool.length, 0);
  assert.equal(storage.calls.filter(([operation]) => operation !== "get").length, 0);
  assert.deepEqual(storage.snapshot(), {});
});
