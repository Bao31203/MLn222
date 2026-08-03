"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "../..");
const TEMPLATE = fs.readFileSync(path.join(ROOT, "template.html"), "utf8");

function block(startText, endText) {
  const start = TEMPLATE.indexOf(startText);
  const end = TEMPLATE.indexOf(endText, start);
  assert.notEqual(start, -1, `missing block start: ${startText}`);
  assert.notEqual(end, -1, `missing block end: ${endText}`);
  return TEMPLATE.slice(start, end);
}

test("course home and workspace expose semantic keyboard and status contracts", () => {
  const ids = Array.from(TEMPLATE.matchAll(/\bid="([A-Za-z][A-Za-z0-9_-]*)"/g), (match) => match[1]);
  assert.equal(ids.length, new Set(ids).size);
  assert.match(TEMPLATE, /<main\b[^>]*id="main"/);
  assert.match(TEMPLATE, /<section id="courseHome"[^>]+aria-labelledby="courseHomeHeading"/);
  assert.match(TEMPLATE, /id="courseHomeHeading"[^>]+tabindex="-1"/);
  assert.match(TEMPLATE, /<label[^>]+for="subjectSelect"/);
  assert.match(TEMPLATE, /<select id="subjectSelect"/);
  assert.match(TEMPLATE, /<a[^>]+id="allSubjectsLink"[^>]+href="#\/"/);
  assert.match(TEMPLATE, /<nav[^>]+id="modeNav"[^>]+aria-label="Chế độ học"/);
  assert.match(TEMPLATE, /id="appStatus"[^>]+role="status"[^>]+aria-live="polite"/);
  assert.match(TEMPLATE, /\.course-card-action[^}]+min-height:44px/);
  assert.match(TEMPLATE, /@media\s*\(prefers-reduced-motion:reduce\)/);
  assert.match(TEMPLATE, /action\.setAttribute\("aria-describedby",statusId\)/);
  assert.match(TEMPLATE, /scheduleFocus\(\$\("#courseHomeHeading"\)\)/);
  assert.match(TEMPLATE, /scheduleFocus\(\$\("#subjectOverviewHeading"\)\)/);
});

test("feature flags alone derive available modes and coming-soon never enters a workspace", () => {
  const modeBlock = block("function availableModes(subject){", "function questionKey(subjectId,id)");
  const activateBlock = block("function activateSubject(subjectId){", "/* ====== Study sessions, filters, and rendering ====== */");
  const routeBlock = block("function applyRoute(route){", "/* ====== Static event wiring ====== */");
  assert.match(modeBlock, /MODE_DEFS\.filter/);
  assert.match(modeBlock, /subject\.features\[mode\.feature\]===true/);
  assert.match(activateBlock, /app\.questions=isReadySubject\(subject\)\?getQuestionBank\(subject\.id\):EMPTY_QUESTION_BANK/);
  assert.match(activateBlock, /if\(isReadySubject\(subject\)\)[\s\S]+loadSubjectStudy\(subject\)[\s\S]+else\{[\s\S]+createEmptyStudyState\(\)/);
  assert.doesNotMatch(activateBlock, /buildPool|enterStudyMode|MLN222GameUI\.activate|createElement\("iframe"\)/);
  assert.match(routeBlock, /if\(!isReadySubject\(app\.subject\)\|\|!route\.mode\)\{renderSubjectInfoView\(\);return;\}/);
  assert.match(routeBlock, /renderWorkspace\(route\.mode\)/);
});

test("subject persistence writes memory first and resets only declared active keys", () => {
  const persistence = block("function storageConfig(subjectId)", "/* ====== Home, subject metadata, and shared chrome ====== */");
  const persistStart = persistence.indexOf("function persistStudyState(){");
  const rememberCall = persistence.indexOf("rememberStudyState();", persistStart);
  const firstSet = persistence.indexOf("window.localStorage.setItem", persistStart);
  assert.ok(rememberCall > persistStart && rememberCall < firstSet);
  assert.match(TEMPLATE, /mln-study-hub\.v1\.mln111\.marked/);
  assert.match(TEMPLATE, /mln-study-hub\.v1\.mln111\.stats/);
  assert.match(TEMPLATE, /mln-study-hub\.v1\.mln111\.studyProgress/);
  assert.match(TEMPLATE, /mln-study-hub\.v1\.hcm202\.marked/);
  assert.match(TEMPLATE, /mln-study-hub\.v1\.hcm202\.stats/);
  assert.match(TEMPLATE, /mln-study-hub\.v1\.hcm202\.studyProgress/);
  assert.match(TEMPLATE, /mln-study-hub\.v1\.vnr202\.marked/);
  assert.match(TEMPLATE, /mln-study-hub\.v1\.vnr202\.stats/);
  assert.match(TEMPLATE, /mln-study-hub\.v1\.vnr202\.studyProgress/);
  assert.match(TEMPLATE, /marked:"mln222\.v2\.marked"/);
  assert.match(TEMPLATE, /stats:"mln222\.v2\.stats"/);
  assert.match(TEMPLATE, /progress:"mln222\.v3\.studyProgress"/);
  assert.match(TEMPLATE, /const MAX_STUDY_SESSIONS_PER_MODE=12/);
  assert.match(persistence, /boundedStoredSessionEntries\(storedSessions,value\.active\[mode\]\)/);
  assert.match(TEMPLATE, /function pruneStudySessions\(mode,keepKey\)/);
  assert.match(TEMPLATE, /while\(Object\.keys\(sessions\)\.length>MAX_STUDY_SESSIONS_PER_MODE\)/);
  const reset = persistence.slice(persistence.indexOf("function removeActiveStudyStorage(){"));
  assert.match(reset, /app\.memoryStudyBySubject\.delete\(app\.subject\.id\)/);
  assert.match(reset, /removeItem\(config\.marked\)/);
  assert.match(reset, /removeItem\(config\.stats\)/);
  assert.match(reset, /removeItem\(config\.progress\)/);
  assert.doesNotMatch(reset, /campaign|LAST_SUBJECT_KEY/);
});

test("question-start slider previews without persistence and commits one bounded transition", () => {
  const filters = block("function switchStudyFilters(update,options){", "function renderSourceInto(element,source){");
  const wiring = block("/* ====== Static event wiring ====== */", "window.addEventListener(\"hashchange\",handleLocation);");
  assert.match(filters, /saveStudySession\(false\)/);
  assert.match(filters, /if\(!options\|\|options\.focus!==false\)focusQuestion\(\)/);
  assert.match(wiring, /const previewQuestionStart=function\(value\)/);
  assert.match(wiring, /const integer=Number\.isFinite\(parsed\)\?Math\.trunc\(parsed\):1/);
  assert.match(wiring, /questionCountRange"\)\.oninput=function\(event\)\{previewQuestionStart/);
  assert.match(wiring, /questionCountRange"\)\.onchange=function\(event\)\{commitQuestionStart/);
  assert.match(wiring, /switchStudyFilters\(function\(\)\{app\.study\.questionStart=nextValue;\},\{focus:false\}\)/);
  assert.doesNotMatch(wiring, /questionCountRange"\)\.oninput[^\n]+switchStudyFilters/);
});

test("question-start preview normalizes decimal and non-finite values to safe integers", () => {
  const implementation = block(
    "const previewQuestionStart=function(value){",
    "const commitQuestionStart=function(value){",
  );
  const elements = {
    "#questionCountInput": { max: "10", value: "1" },
    "#questionCountRange": { value: "1" },
  };
  const context = vm.createContext({
    app: { questions: new Array(10) },
    $: (selector) => elements[selector],
  });
  vm.runInContext(
    `${implementation}\nglobalThis.__previewQuestionStart=previewQuestionStart;`,
    context,
    { filename: "template-question-start-normalization.js" },
  );
  assert.equal(context.__previewQuestionStart("2.5"), 2);
  assert.equal(elements["#questionCountRange"].value, "2");
  assert.equal(elements["#questionCountInput"].value, "2");
  assert.equal(context.__previewQuestionStart("Infinity"), 1);
  assert.equal(context.__previewQuestionStart("99"), 10);
});

test("session pruning keeps the active session and enforces the storage bound", () => {
  const implementation = block("function pruneStudySessions(mode,keepKey){", "function saveStudySession(shouldPersist){");
  const sessions = Object.create(null);
  for (let index = 0; index < 20; index += 1) sessions[`session-${index}`] = { index };
  const context = vm.createContext({
    app: { study: { progress: { sessions: { quiz: sessions } } } },
  });
  vm.runInContext(
    `const MAX_STUDY_SESSIONS_PER_MODE=12;
     function isPlainRecord(value){return Boolean(value)&&typeof value==="object"&&!Array.isArray(value);}
     ${implementation}
     pruneStudySessions("quiz","session-0");`,
    context,
    { filename: "template-session-pruning.js" },
  );
  assert.equal(Object.keys(sessions).length, 12);
  assert.equal(Object.hasOwn(sessions, "session-0"), true);
  assert.equal(Object.hasOwn(sessions, "session-19"), true);
});

test("flashcard uses native button semantics and hides the unrevealed face from assistive tech", () => {
  assert.match(TEMPLATE, /<button id="flashCard"[^>]+type="button"[^>]+aria-pressed="false"/);
  assert.doesNotMatch(TEMPLATE, /id="flashCard"[^>]+role="button"/);
  assert.doesNotMatch(TEMPLATE, /id="flashCard"[^>]+aria-label/);
  assert.match(TEMPLATE, /id="flashFront" aria-hidden="false"/);
  assert.match(TEMPLATE, /id="flashBack" aria-hidden="true"/);
  assert.match(TEMPLATE, /flashFront"\)\.setAttribute\("aria-hidden",String\(reveal\)\)/);
  assert.match(TEMPLATE, /flashBack"\)\.setAttribute\("aria-hidden",String\(!reveal\)\)/);
  assert.doesNotMatch(TEMPLATE, /flashCard"\)\.setAttribute\("aria-label"/);
  assert.doesNotMatch(TEMPLATE, /flashCard"\)\.onkeydown/);
});

test("search is pre-indexed, debounced, and highlights accent-insensitive matches", () => {
  assert.match(TEMPLATE, /let SEARCH_TEXT_BY_ID=new Map\(\)/);
  assert.match(TEMPLATE, /SEARCH_TEXT_BY_ID\.set\(question\.id,normalizeText/);
  assert.match(TEMPLATE, /const SEARCH_DEBOUNCE_MS=180/);
  assert.match(TEMPLATE, /function scheduleSearch\(\)/);
  assert.match(TEMPLATE, /searchInput"\)\.oninput=scheduleSearch/);
  assert.match(TEMPLATE, /SEARCH_TEXT_BY_ID\.get\(question\.id\)/);
  assert.match(TEMPLATE, /const needle=normalizeText\(keyword\)/);
  assert.match(TEMPLATE, /spans\.push\(\[offset,offset\+character\.length\]\)/);
});

test("accent-insensitive highlighting preserves the original Vietnamese glyphs", () => {
  const source = block("function normalizeText(value){", "function renderSearchEmpty(container,message){")
    + "\nglobalThis.__searchHelpers={normalizeText,appendHighlighted};";
  const document = {
    createTextNode(text) { return { kind: "text", textContent: text }; },
    createElement(name) { return { kind: name, textContent: "" }; },
  };
  const context = vm.createContext({ document });
  vm.runInContext(source, context, { filename: "template-search-highlight.js" });
  const parent = { children: [], append(...nodes) { this.children.push(...nodes); } };
  context.__searchHelpers.appendHighlighted(parent, "Tư tưởng Hồ Chí Minh", "tu tuong");
  assert.deepEqual(
    parent.children.map((node) => [node.kind, node.textContent]),
    [["mark", "Tư tưởng"], ["text", " Hồ Chí Minh"]],
  );
});

test("lecture iframe remains lazy, privacy-enhanced, chapter-linked, and torn down on exit", () => {
  const lecture = block("/* ====== Video lectures ====== */", "/* ====== Route application and mode lifecycle ====== */");
  const route = block("function applyRoute(route){", "/* ====== Static event wiring ====== */");
  assert.match(lecture, /https:\/\/www\.youtube-nocookie\.com\/embed\//);
  assert.match(lecture, /frame\.loading="lazy"/);
  assert.match(lecture, /frame\.referrerPolicy="strict-origin-when-cross-origin"/);
  const embedUrl = lecture.slice(lecture.indexOf("function lectureEmbedUrl(lecture){"), lecture.indexOf("function loadLecturePlayer(){"));
  assert.doesNotMatch(embedUrl, /autoplay/);
  assert.match(TEMPLATE, /app\.pendingStudyFilters=\{subjectId:app\.subject\.id,chapterId:lecture\.chapterId\}/);
  assert.match(route, /const leavingLecture=previousRoute\.mode==="lecture"/);
  assert.match(route, /if\(leavingLecture\)destroyLecturePlayer\(\)/);
  assert.match(TEMPLATE, /function destroyLecturePlayer\(\)[\s\S]+shell\.replaceChildren\(\)/);
});

test("question, source, search, and metadata rendering never interpolate HTML", () => {
  assert.doesNotMatch(TEMPLATE, /\.innerHTML\s*=/);
  assert.match(TEMPLATE, /title\.textContent=subject\.title/);
  assert.match(TEMPLATE, /description\.textContent=subject\.description/);
  assert.match(TEMPLATE, /\$\("#stem"\)\.textContent=question\.stem/);
  assert.match(TEMPLATE, /answer\.textContent=option/);
  assert.match(TEMPLATE, /label\.textContent="Nguồn:"/);
  assert.match(TEMPLATE, /document\.createTextNode\(" "\+\(source\.label/);
  assert.match(TEMPLATE, /source\.textContent="Nguồn: "\+question\.source\.label/);
  assert.match(TEMPLATE, /results\.replaceChildren\(fragment\)/);
});

test("route lifecycle updates canonical body state and preserves game event compatibility", () => {
  assert.match(TEMPLATE, /window\.addEventListener\("hashchange",handleLocation\)/);
  assert.match(TEMPLATE, /history\.replaceState\(history\.state,"",location\.pathname\+location\.search\+parsed\.canonical\)/);
  assert.match(TEMPLATE, /document\.body\.dataset\.view="home"/);
  assert.match(TEMPLATE, /document\.body\.dataset\.view=isReadySubject\(app\.subject\)\?"overview":"subject-info"/);
  assert.match(TEMPLATE, /document\.body\.dataset\.view="workspace"/);
  assert.match(TEMPLATE, /document\.body\.dataset\.experience=isGame\?"game":"study"/);
  assert.match(TEMPLATE, /new CustomEvent\("mln222:mode-change",\{detail:\{mode:mode\}\}\)/);
  assert.match(TEMPLATE, /if\(isGame\)[\s\S]+MLN222GameUI\.activate\(\)/);
});
