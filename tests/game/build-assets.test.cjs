"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const ROOT = path.resolve(__dirname, "..", "..");
const GAME = path.join(ROOT, "game");

function read(relative) {
  return fs.readFileSync(path.join(GAME, relative), "utf8");
}

function manifest() {
  return JSON.parse(read("build-manifest.json"));
}

test("build manifest has stable local assets in dependency order", () => {
  const value = manifest();
  assert.deepEqual(Object.keys(value).sort(), ["data", "images", "schemaVersion", "scripts", "styles", "svg"]);
  assert.equal(value.schemaVersion, 1);
  const paths = Object.values(value.data).concat(Object.values(value.images), value.svg, value.styles, value.scripts);
  assert.equal(new Set(paths).size, paths.length);
  for (const relative of paths) {
    const resolved = path.resolve(GAME, relative);
    assert.ok(resolved.startsWith(`${GAME}${path.sep}`));
    assert.ok(fs.statSync(resolved).isFile(), relative);
  }
  const order = value.scripts;
  assert.ok(order.indexOf("core/namespace.js") < order.indexOf("core/contracts.js"));
  assert.ok(order.indexOf("engine/campaign.js") < order.indexOf("ui/game-controller.js"));
  assert.ok(order.indexOf("ui/context-action-model.js") < order.indexOf("ui/context-command-menu.js"));
  assert.ok(order.indexOf("ui/context-command-menu.js") < order.indexOf("ui/order-tray.js"));
  assert.ok(order.indexOf("ui/context-command-menu.js") < order.indexOf("ui/game-app.js"));
  assert.ok(order.indexOf("ui/game-controller.js") < order.indexOf("ui/game-app.js"));
  assert.equal(order.at(-1), "ui/game-app.js");
});

test("runtime sources are inline-safe and make no network requests", () => {
  const value = manifest();
  const scripts = value.scripts.map(read).join("\n");
  const styles = value.styles.map(read).join("\n");
  const svg = read(value.svg);
  assert.doesNotMatch(scripts, /<\/script/i);
  assert.doesNotMatch(styles, /<\/style/i);
  assert.doesNotMatch(scripts, /\bfetch\s*\(|XMLHttpRequest|WebSocket\s*\(/);
  assert.doesNotMatch(scripts, /(?:src|href)\s*=\s*["']https?:\/\//i);
  assert.doesNotMatch(styles, /@import|url\(/i);
  assert.doesNotMatch(svg, /<style\b|@import|<\?xml-stylesheet/i);
  assert.doesNotMatch(svg, /(?:href|src)\s*=\s*["']https?:\/\//i);
  const texture = fs.readFileSync(path.join(GAME, value.images.mapTexture));
  assert.equal(texture.subarray(0, 4).toString("ascii"), "RIFF");
  assert.equal(texture.subarray(8, 12).toString("ascii"), "WEBP");
});

test("map and province data expose exactly 34 playable keyboard targets", () => {
  const provinces = JSON.parse(read("data/provinces.json")).provinces;
  const svg = read("assets/vietnam-map.svg");
  const mapView = read("ui/map-view.js");
  assert.equal(provinces.length, 34);
  assert.equal(new Set(provinces.map((province) => province.id)).size, 34);
  for (const province of provinces) {
    assert.match(svg, new RegExp(`data-p=["']${province.svg.primary}["']`));
  }
  assert.match(mapView, /primaryAssets\[province\.svg\.primary\]/);
  assert.match(mapView, /if \(isPrimary\).*setAttribute\("role", "button"\)/s);
});

test("campaign and study storage keys stay separated", () => {
  const campaignSave = read("storage/campaign-save.js");
  const browserStorage = read("ui/browser-storage.js");
  const template = fs.readFileSync(path.join(ROOT, "template.html"), "utf8");
  assert.match(campaignSave, /mln222\.campaign\.v1/);
  assert.match(browserStorage, /mln222\.campaign\.ui\.v1/);
  assert.match(template, /mln222\.v2\.marked/);
  assert.match(template, /mln222\.v2\.stats/);
  assert.doesNotMatch(`${campaignSave}\n${browserStorage}`, /mln222\.v2\./);
});

test("shared app shell icons are local, unique, and covered by a license notice", () => {
  const template = fs.readFileSync(path.join(ROOT, "template.html"), "utf8");
  const uiUtils = read("ui/ui-utils.js");
  const notice = fs.readFileSync(path.join(ROOT, "docs", "third-party-notices.md"), "utf8");
  const expected = [
    "landmark", "book-open", "layers", "search", "castle", "shuffle", "bookmark",
    "rotate-ccw", "chevron-left", "chevron-right", "chevron-up", "chevron-down",
    "zoom-in", "zoom-out", "maximize-2", "locate-fixed", "wheat", "coins", "users",
    "shield", "gauge", "handshake", "swords", "scroll-text", "info", "triangle-alert",
    "circle-check", "clock-3", "lock-keyhole", "save", "plus", "trash-2",
    "sliders-horizontal", "x", "list-checks",
  ];
  const symbols = Array.from(template.matchAll(/<symbol id="(ui-icon-[a-z0-9-]+)"/g), (match) => match[1]);
  assert.equal(new Set(symbols).size, symbols.length);
  assert.deepEqual(symbols, expected.map((name) => `ui-icon-${name}`));
  const references = Array.from(template.matchAll(/href=["']#(ui-icon-[a-z0-9-]+)["']/g), (match) => match[1]);
  references.forEach((reference) => assert.equal(symbols.includes(reference), true, reference));
  assert.doesNotMatch(template, /<use\b[^>]+href=["']https?:\/\//i);
  assert.match(uiUtils, /createElementNS\(SVG_NS, "svg"\)/);
  assert.match(uiUtils, /use\.setAttribute\("href", "#ui-icon-" \+ name\)/);
  assert.match(template, /Copyright \(c\) 2026 Lucide Icons and Contributors/);
  assert.match(template, /Copyright \(c\) 2013-present Cole Bemis/);
  assert.match(notice, /Lucide Icons/);
  assert.match(notice, /License: ISC/);
  assert.match(notice, /Feather-derived icon notice/);
  assert.match(notice, /MIT license/);
  assert.match(notice, /2013-present Cole Bemis/);
});

test("redesigned UI remains offline, deterministic, and presentation-only", () => {
  const template = fs.readFileSync(path.join(ROOT, "template.html"), "utf8");
  const mapView = read("ui/map-view.js");
  const gameApp = read("ui/game-app.js");
  const quizView = read("ui/game-quiz-view.js");
  const battlePanel = read("ui/battle-panel.js");
  const turnReport = read("ui/turn-report.js");
  const gameStyles = read("styles/game.css");
  const ids = Array.from(template.matchAll(/\bid=["']([A-Za-z][A-Za-z0-9_-]*)["']/g), (match) => match[1]);
  assert.equal(ids.length, new Set(ids).size);
  ["gameResourceToggle", "gameMapFocus", "gameMapTooltip", "gameSheetToggle", "gameQuizResult", "gameRewardBanner",
    "gameTargetActionBtn", "gameContextMenu", "gameContextActionSheet", "gameOrderTray"].forEach((id) => {
    assert.match(template, new RegExp(`id=["']${id}["']`));
  });
  assert.match(mapView, /width: 3129\.7, height: 4901\.01/);
  assert.match(mapView, /islandsInline: true/);
  assert.doesNotMatch(mapView, /INSET_SPECS|cloneNode\(true\)|gameMapInsets/);
  assert.match(gameStyles, /province\[data-p="quan-dao-hoang-sa"\]/);
  assert.match(gameStyles, /background:var\(--map-texture\)/);
  assert.doesNotMatch(gameStyles, /province path[^}]+vector-effect:non-scaling-stroke/);
  assert.match(template, /--map-texture:url\("__GAME_MAP_TEXTURE__"\)/);
  assert.match(mapView, /DEFAULT_SCALE = 1\.1/);
  assert.match(mapView, /MAX_SCALE = 3/);
  assert.match(mapView, /function zoomTo\(scale, clientX, clientY\)/);
  assert.match(mapView, /function beginPinch\(\)/);
  assert.match(mapView, /activePointers\.size >= 2/);
  assert.match(mapView, /event\.key === "ContextMenu"/);
  assert.match(mapView, /event\.key === "F10" && event\.shiftKey/);
  assert.match(mapView, /source: "touch"|"touch"\);/);
  assert.match(mapView, /event\.key === "\+"/);
  assert.match(gameApp, /var sheetState = "collapsed"/);
  assert.match(gameApp, /var resourcesExpanded = false/);
  assert.doesNotMatch(gameApp, /storage\.(?:setItem|writeUi).*sheetState/s);
  assert.match(gameStyles, /env\(safe-area-inset-bottom\)/);
  assert.match(gameStyles, /data-sheet-state="expanded"/);
  assert.match(gameStyles, /data-sheet-state="collapsed"[^}]+position:sticky/);
  assert.match(gameStyles, /data-resources-expanded="true"/);
  assert.match(gameStyles, /height:calc\(100dvh - var\(--app-nav-height\)\);display:flex;flex-direction:column/);
  assert.match(gameStyles, /\.game-btn\.hidden[^}]+display:none/);
  assert.match(gameStyles, /game-reward-banner:not\(\.hidden\)~\.game-layout[^}]+100dvh - 321px/);
  assert.match(quizView, /if \(quiz\.completed\) showResult\(quiz, choice\)/);
  assert.match(battlePanel, /setAttribute\("role", "progressbar"\)/);
  assert.match(battlePanel, /setAttribute\("aria-valuenow", String\(bounded\)\)/);
  assert.match(gameApp, /classList\.toggle\("is-warning", reward\.warning\)/);
  const contextMenu = read("ui/context-command-menu.js");
  const controller = read("ui/game-controller.js");
  assert.match(contextMenu, /controller\.legalActions\(\)/);
  assert.match(contextMenu, /controller\.stageAction\(utils\.clone\(selectedItem\.action\)\)/);
  assert.doesNotMatch(contextMenu, /queryLegalActions/);
  assert.match(controller, /function removePendingAction\(index\)/);
  assert.match(turnReport, /QUIZ_REWARD_APPLIED[^\n]+payload\.score > 5[^\n]+"success"[^\n]+"warning"/);
  assert.match(turnReport, /PROVINCE_CAPTURED[\s\S]+newOwnerId === PLAYER_ID[\s\S]+previousOwnerId === PLAYER_ID/);
  assert.match(turnReport, /BATTLE_ENDED[^\n]+winnerFactionId === PLAYER_ID[^\n]+"success"[^\n]+"danger"/);
  assert.doesNotMatch(`${mapView}\n${gameApp}`, /\bfetch\s*\(|XMLHttpRequest|WebSocket\s*\(/);
});
