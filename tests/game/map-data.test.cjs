"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const {
  loadDefaultData,
  validateAll,
  validateDefaultData,
} = require("../../scripts/validate-game-data.js");
const fs = require("node:fs");
const path = require("node:path");

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function hasCode(result, code) {
  return result.errors.some((item) => item.code === code);
}

test("map data validates 34 territories and 44 SVG groups", () => {
  const result = validateDefaultData();
  assert.equal(result.ok, true, JSON.stringify(result.errors, null, 2));
  assert.equal(result.summary.provinceCount, 34);
  assert.equal(result.summary.regionCount, 6);
  assert.equal(result.summary.svgGroupCount, 44);
  assert.equal(result.summary.mappedSlugCount, 44);
  assert.equal(result.summary.islandCount, 10);
  assert.equal(result.summary.connectedProvinceCount, 34);
  assert.equal(result.summary.unitCount, 5);
  assert.equal(result.summary.svgPathCount > 0, true);
  assert.equal(result.summary.startingModifierSpread <= 0.2, true);
});

test("all island groups inherit one playable province owner", () => {
  const data = loadDefaultData();
  const owners = new Map();
  data.provinces.provinces.forEach((province) => {
    province.svg.islands.forEach((slug) => owners.set(slug, province.id));
  });
  assert.equal(owners.size, 10);
  assert.equal(owners.get("cat-ba"), "hai-phong");
  assert.equal(owners.get("quan-dao-hoang-sa"), "da-nang");
  assert.equal(owners.get("quan-dao-truong-sa"), "khanh-hoa");
  assert.equal(owners.get("dao-con-son"), "ho-chi-minh");
  assert.equal(owners.get("dao-phu-quoc"), "an-giang");
});

test("map presentation keeps the source viewBox and renders islands in geographic position", () => {
  const source = fs.readFileSync(path.resolve(__dirname, "..", "..", "game", "ui", "map-view.js"), "utf8");
  assert.match(source, /MAIN_VIEWBOX = Object\.freeze\(\{ x: 0, y: 0, width: 3129\.7, height: 4901\.01 \}\)/);
  assert.match(source, /islandsInline: true/);
  assert.doesNotMatch(source, /INSET_SPECS|cloneNode\(true\)|gameMapInsets/);
  assert.match(source, /group\.setAttribute\("tabindex", "0"\)/);
});

test("adjacency graph contains only playable province nodes", () => {
  const data = loadDefaultData();
  const provinceIds = new Set(data.provinces.provinces.map((province) => province.id));
  const graphIds = Object.keys(data.adjacency.neighbors);
  assert.equal(graphIds.length, 34);
  graphIds.forEach((id) => {
    assert.equal(provinceIds.has(id), true);
    data.adjacency.neighbors[id].forEach((neighbor) => assert.equal(provinceIds.has(neighbor), true));
  });
  ["cat-ba", "dao-con-son", "quan-dao-hoang-sa"].forEach((island) => {
    assert.equal(Object.prototype.hasOwnProperty.call(data.adjacency.neighbors, island), false);
  });
});

test("validator rejects a missing island mapping", () => {
  const data = loadDefaultData();
  const provinces = clone(data.provinces);
  provinces.provinces.find((province) => province.id === "an-giang").svg.islands.pop();
  const result = validateAll({ ...data, provinces });
  assert.equal(result.ok, false);
  assert.equal(hasCode(result, "ISLAND_COUNT"), true);
  assert.equal(hasCode(result, "SVG_MAPPING_MISSING"), true);
});

test("validator rejects an asymmetric adjacency edge", () => {
  const data = loadDefaultData();
  const adjacency = clone(data.adjacency);
  adjacency.neighbors["ha-noi"] = adjacency.neighbors["ha-noi"].filter((id) => id !== "phu-tho");
  const result = validateAll({ ...data, adjacency });
  assert.equal(result.ok, false);
  assert.equal(hasCode(result, "ADJACENCY_ASYMMETRIC"), true);
});

test("validator requires one adjacency list for every province", () => {
  const data = loadDefaultData();
  const adjacency = clone(data.adjacency);
  delete adjacency.neighbors["lai-chau"];
  const result = validateAll({ ...data, adjacency });
  assert.equal(result.ok, false);
  assert.equal(hasCode(result, "ADJACENCY_NODE"), true);
  assert.equal(hasCode(result, "ADJACENCY_ASYMMETRIC"), true);
});

test("validator rejects duplicate SVG ownership", () => {
  const data = loadDefaultData();
  const provinces = clone(data.provinces);
  provinces.provinces.find((province) => province.id === "lai-chau").svg.islands.push("cat-ba");
  const result = validateAll({ ...data, provinces });
  assert.equal(result.ok, false);
  assert.equal(hasCode(result, "SVG_MAPPING_DUPLICATE"), true);
});

test("validator rejects external SVG references", () => {
  const data = loadDefaultData();
  const svg = data.svg.replace("</svg>", '<use href="https://invalid.example/shape.svg#x"></use></svg>');
  const result = validateAll({ ...data, svg });
  assert.equal(result.ok, false);
  assert.equal(hasCode(result, "SVG_FORBIDDEN_TAG"), true);
  assert.equal(hasCode(result, "SVG_EXTERNAL_REFERENCE"), true);
});

test("validator rejects namespace-prefixed active SVG elements", () => {
  const data = loadDefaultData();
  const svg = data.svg.replace("</svg>", "<svg:script></svg:script></svg>");
  const result = validateAll({ ...data, svg });
  assert.equal(result.ok, false);
  assert.equal(hasCode(result, "SVG_FORBIDDEN_TAG"), true);
});

test("validator rejects multiple SVG root documents", () => {
  const data = loadDefaultData();
  const result = validateAll({ ...data, svg: `${data.svg}<svg viewBox="0 0 1 1"></svg>` });
  assert.equal(result.ok, false);
  assert.equal(hasCode(result, "SVG_DOCUMENT"), true);
});

test("validator rejects unknown province traits", () => {
  const data = loadDefaultData();
  const provinces = clone(data.provinces);
  provinces.provinces[0].trait = "unbounded-bonus";
  const result = validateAll({ ...data, provinces });
  assert.equal(result.ok, false);
  assert.equal(hasCode(result, "PROVINCE_TRAIT"), true);
});

test("validator rejects invalid trait tradeoff identifiers", () => {
  const data = loadDefaultData();
  const provinces = clone(data.provinces);
  provinces.traitPackages.agrarian.advantage = "unbounded";
  const result = validateAll({ ...data, provinces });
  assert.equal(result.ok, false);
  assert.equal(hasCode(result, "TRAIT_TRADEOFF"), true);
});

test("unit records remain semantic and defer numeric balance", () => {
  const data = loadDefaultData();
  data.units.units.forEach((unit) => {
    assert.equal(Object.values(unit).some((value) => typeof value === "number"), false);
    assert.equal(typeof unit.balanceKey, "string");
  });
  const units = clone(data.units);
  units.units[0].power = 1.5;
  const result = validateAll({ ...data, units });
  assert.equal(result.ok, false);
  assert.equal(hasCode(result, "UNIT_BALANCE_EMBEDDED"), true);
});
