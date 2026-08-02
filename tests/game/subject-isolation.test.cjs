"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "../..");
const TEMPLATE = fs.readFileSync(path.join(ROOT, "template.html"), "utf8");
const START = TEMPLATE.indexOf("/* ====== Embedded multi-subject catalogs ====== */");
const END = TEMPLATE.indexOf("const LETTERS=", START);
assert.notEqual(START, -1, "catalog block is missing");
assert.notEqual(END, -1, "catalog block end is missing");

function bootCatalog() {
  const subjects = [
    { id: "mln111", status: "ready", studyReady: true },
    { id: "mln112", status: "ready", studyReady: true },
    { id: "hcm202", status: "ready", studyReady: true },
  ];
  const banks = {
    mln111: [{ id: "MLN111-C01-Q001" }],
    mln112: [{ id: "C01-Q001" }, { id: "C01-Q002" }],
    hcm202: [{ id: "HCM202-C01-Q001" }],
  };
  const source = TEMPLATE.slice(START, END)
    .replace("/*__SUBJECT_CATALOG__*/[]", JSON.stringify(subjects))
    .replace("/*__QUESTION_BANKS__*/{}", JSON.stringify(banks))
    .replace("/*__LECTURE_CATALOGS__*/{}", "{}")
    + "\nglobalThis.__catalogTest={getQuestionBank,getSubject};";
  const context = vm.createContext({});
  vm.runInContext(source, context, { filename: "template-fixed-game-bank.js" });
  return context;
}

test("legacy game alias is immutable and permanently resolves the MLN112 bank", () => {
  const context = bootCatalog();
  const descriptor = Object.getOwnPropertyDescriptor(context, "MLN222_QUESTIONS");
  assert.equal(descriptor.writable, false);
  assert.equal(descriptor.configurable, false);
  assert.equal(descriptor.enumerable, true);
  assert.deepEqual(Array.from(descriptor.value, (question) => question.id), ["C01-Q001", "C01-Q002"]);
  assert.equal(vm.runInContext("Reflect.set(globalThis,'MLN222_QUESTIONS',getQuestionBank('mln111'))", context), false);
  assert.deepEqual(Array.from(context.MLN222_QUESTIONS, (question) => question.id), ["C01-Q001", "C01-Q002"]);
});

test("switching a study-bank variable never changes the game question alias", () => {
  const context = bootCatalog();
  vm.runInContext("globalThis.__activeStudyBank=getQuestionBank('mln111')", context);
  assert.deepEqual(Array.from(context.__activeStudyBank, (question) => question.id), ["MLN111-C01-Q001"]);
  assert.deepEqual(Array.from(context.MLN222_QUESTIONS, (question) => question.id), ["C01-Q001", "C01-Q002"]);
  vm.runInContext("globalThis.__activeStudyBank=getQuestionBank('mln112')", context);
  assert.equal(context.__activeStudyBank, context.MLN222_QUESTIONS);
  assert.deepEqual(Array.from(context.MLN222_QUESTIONS, (question) => question.id), ["C01-Q001", "C01-Q002"]);
  vm.runInContext("globalThis.__activeStudyBank=getQuestionBank('hcm202')", context);
  assert.deepEqual(Array.from(context.__activeStudyBank, (question) => question.id), ["HCM202-C01-Q001"]);
  assert.deepEqual(Array.from(context.MLN222_QUESTIONS, (question) => question.id), ["C01-Q001", "C01-Q002"]);
});

test("game implementation consumes only the fixed legacy alias and reuses one app instance", () => {
  const gameApp = fs.readFileSync(path.join(ROOT, "game/ui/game-app.js"), "utf8");
  const controller = fs.readFileSync(path.join(ROOT, "game/ui/game-controller.js"), "utf8");
  const quizView = fs.readFileSync(path.join(ROOT, "game/ui/game-quiz-view.js"), "utf8");
  assert.match(gameApp, /var questions = root\.MLN222_QUESTIONS;/);
  assert.doesNotMatch(gameApp, /QUESTION_BANKS|getQuestionBank|activeSubject|mln111/i);
  assert.match(gameApp, /var instance = null;/);
  assert.match(gameApp, /function activate\(\)[\s\S]+if \(!instance\) instance = create\(\);[\s\S]+instance\.activate\(\)/);
  assert.doesNotMatch(controller, /mln111|mln-study-hub/);
  assert.match(quizView, /typeof source\.label === "string"/);
  assert.match(quizView, /typeof source\.section === "string"/);
  assert.match(quizView, /if \(parts\.length === 0\)/);
});

test("subject exit hides game presentation without touching campaign save keys", () => {
  const campaignSave = fs.readFileSync(path.join(ROOT, "game/storage/campaign-save.js"), "utf8");
  const browserStorage = fs.readFileSync(path.join(ROOT, "game/ui/browser-storage.js"), "utf8");
  const applyStart = TEMPLATE.indexOf("function applyRoute(route){");
  const applyEnd = TEMPLATE.indexOf("/* ====== Static event wiring ====== */", applyStart);
  const source = TEMPLATE.slice(applyStart, applyEnd);
  assert.match(source, /const leavingGame=previousRoute\.mode==="game"/);
  assert.match(source, /if\(leavingGame\)syncGameModalInert\(false\)/);
  assert.doesNotMatch(source, /localStorage|removeItem|campaign\.v1|campaign\.ui/);
  assert.match(campaignSave, /mln222\.campaign\.v1/);
  assert.match(browserStorage, /mln222\.campaign\.ui\.v1/);
});
