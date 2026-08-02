"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "../..");
const TEMPLATE = fs.readFileSync(path.join(ROOT, "template.html"), "utf8");
const START_MARKER = "/* ====== Embedded multi-subject catalogs ====== */";
const END_MARKER = "/* ====== Subject-scoped persistence ====== */";
const START = TEMPLATE.indexOf(START_MARKER);
const END = TEMPLATE.indexOf(END_MARKER, START);

assert.notEqual(START, -1, "catalog/route block start is missing");
assert.notEqual(END, -1, "catalog/route block end is missing");

const FEATURES_NONE = Object.freeze({
  quiz: false,
  flashcards: false,
  search: false,
  lectures: false,
  game: false,
});
const SUBJECTS = [
  {
    id: "mln111", code: "MLN111", title: "Triết học Mác – Lênin",
    status: "ready", studyReady: true,
    features: { ...FEATURES_NONE, quiz: true, flashcards: true, search: true },
  },
  {
    id: "mln112", code: "MLN112", title: "Kinh tế chính trị Mác – Lênin",
    status: "ready", studyReady: true,
    features: { quiz: true, flashcards: true, search: true, lectures: true, game: true },
  },
  {
    id: "mln131", code: "MLN131", title: "MLN131",
    status: "comingSoon", studyReady: false, features: FEATURES_NONE,
  },
  {
    id: "hcm202", code: "HCM202", title: "Tư tưởng Hồ Chí Minh",
    status: "ready", studyReady: true,
    features: { ...FEATURES_NONE, quiz: true, flashcards: true, search: true },
  },
  {
    id: "vnr201", code: "VNR201", title: "VNR201",
    status: "comingSoon", studyReady: false, features: FEATURES_NONE,
  },
];
const BANKS = {
  mln111: [{ id: "MLN111-C01-Q001" }],
  mln112: [{ id: "C01-Q001" }],
  hcm202: [{ id: "HCM202-C01-Q001" }],
};

function boot() {
  let source = TEMPLATE.slice(START, END);
  source = source
    .replace("/*__SUBJECT_CATALOG__*/[]", JSON.stringify(SUBJECTS))
    .replace("/*__QUESTION_BANKS__*/{}", JSON.stringify(BANKS))
    .replace("/*__LECTURE_CATALOGS__*/{}", "{}")
    + `\nglobalThis.__hubRouteTest={
      hasSubject,getSubject,getQuestionBank,getLectures,availableModes,questionKey,
      parseRoute,serializeRoute,decodeRouteSegment,routeEquals
    };`;
  const context = vm.createContext({
    document: {
      querySelector() { return null; },
      createElementNS() { throw new Error("DOM creation must not occur while parsing routes"); },
    },
    TextEncoder,
    encodeURIComponent,
    decodeURIComponent,
    requestAnimationFrame() {},
  });
  vm.runInContext(source, context, { filename: "template-catalog-routing.js" });
  return context.__hubRouteTest;
}

function parsed(api, hash) {
  return JSON.parse(JSON.stringify(api.parseRoute(hash)));
}

test("catalog accessors are own-property safe and feature modes are subject-derived", () => {
  const api = boot();
  assert.equal(api.hasSubject("mln111"), true);
  assert.equal(api.hasSubject("__proto__"), false);
  assert.equal(api.getSubject("constructor"), null);
  assert.equal(api.getQuestionBank("mln111").length, 1);
  assert.equal(api.getQuestionBank("missing").length, 0);
  assert.equal(api.getLectures("toString"), null);
  assert.deepEqual(
    Array.from(api.availableModes(api.getSubject("mln111")), (mode) => mode.id),
    ["quiz", "flash", "search"],
  );
  assert.deepEqual(
    Array.from(api.availableModes(api.getSubject("mln112")), (mode) => mode.id),
    ["quiz", "flash", "lecture", "search", "game"],
  );
  assert.deepEqual(
    Array.from(api.availableModes(api.getSubject("hcm202")), (mode) => mode.id),
    ["quiz", "flash", "search"],
  );
  assert.deepEqual(Array.from(api.availableModes(api.getSubject("mln131"))), []);
  assert.equal(api.questionKey("mln111", "Q1"), "mln111:Q1");
});

test("canonical route table accepts only ready subjects and enabled modes", () => {
  const api = boot();
  const cases = new Map([
    ["#/", [null, null, "#/"]],
    ["#/mln111", ["mln111", null, "#/mln111"]],
    ["#/mln111/quiz", ["mln111", "quiz", "#/mln111/quiz"]],
    ["#/mln111/flash", ["mln111", "flash", "#/mln111/flash"]],
    ["#/mln111/search", ["mln111", "search", "#/mln111/search"]],
    ["#/mln112/lecture", ["mln112", "lecture", "#/mln112/lecture"]],
    ["#/mln112/game", ["mln112", "game", "#/mln112/game"]],
    ["#/hcm202", ["hcm202", null, "#/hcm202"]],
    ["#/hcm202/quiz", ["hcm202", "quiz", "#/hcm202/quiz"]],
    ["#/hcm202/search", ["hcm202", "search", "#/hcm202/search"]],
    ["#/hcm202/game", ["hcm202", null, "#/hcm202"]],
    ["#/mln111/game", ["mln111", null, "#/mln111"]],
    ["#/mln131", ["mln131", null, "#/mln131"]],
    ["#/mln131/quiz", ["mln131", null, "#/mln131"]],
    ["#/unknown/quiz", [null, null, "#/"]],
  ]);
  for (const [hash, expected] of cases) {
    const result = parsed(api, hash);
    assert.deepEqual(
      [result.route.subjectId, result.route.mode, result.canonical],
      expected,
      hash,
    );
  }
});

test("hostile and malformed fragments recover to the closest safe overview", () => {
  const api = boot();
  const subjectFallbacks = [
    "#/mln111/quiz?answer=1",
    "#/mln111/quiz/extra",
    "#/mln111/%",
    "#/mln111/%2F",
    "#/mln111/%5C",
    "#/mln111/%00",
    "#/mln111/.",
    "#mln111/quiz",
    "#/mln111/quiz#repeat",
  ];
  for (const hash of subjectFallbacks) {
    const result = parsed(api, hash);
    assert.deepEqual(result.route, { subjectId: "mln111", mode: null }, hash);
    assert.equal(result.canonical, "#/mln111", hash);
    assert.equal(result.corrected, true, hash);
  }
  for (const hash of ["#/unknown?x=1", "#/%", "##/mln111/quiz", "#/\x00"]) {
    const result = parsed(api, hash);
    assert.deepEqual(result.route, { subjectId: null, mode: null }, JSON.stringify(hash));
    assert.equal(result.canonical, "#/", JSON.stringify(hash));
  }
  const oversized = "#/" + "a".repeat(513);
  assert.deepEqual(parsed(api, oversized).route, { subjectId: null, mode: null });
});

test("route serialization round-trips canonically and is idempotent", () => {
  const api = boot();
  const routes = [
    { subjectId: null, mode: null },
    { subjectId: "mln111", mode: null },
    { subjectId: "mln111", mode: "quiz" },
    { subjectId: "mln112", mode: "game" },
    { subjectId: "hcm202", mode: "flash" },
    { subjectId: "mln131", mode: null },
  ];
  for (const route of routes) {
    const hash = api.serializeRoute(route);
    const once = parsed(api, hash);
    const twice = parsed(api, once.canonical);
    assert.equal(once.canonical, hash);
    assert.equal(twice.canonical, hash);
    assert.equal(twice.corrected, false);
  }
});
