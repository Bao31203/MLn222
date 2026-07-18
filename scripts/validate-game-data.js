"use strict";

const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const DEFAULT_PATHS = Object.freeze({
  provinces: path.join(ROOT, "game", "data", "provinces.json"),
  adjacency: path.join(ROOT, "game", "data", "adjacency.json"),
  units: path.join(ROOT, "game", "data", "units.json"),
  svg: path.join(ROOT, "game", "assets", "vietnam-map.svg"),
});

const ID_PATTERN = /^[a-z][a-z0-9-]{0,63}$/;
const MODIFIER_FIELDS = Object.freeze(["agriculture", "capacity", "commerce", "defense"]);

function error(code, pathName, message) {
  return { code, path: pathName, message };
}

function isObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function compareText(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function loadDefaultData() {
  return {
    provinces: readJson(DEFAULT_PATHS.provinces),
    adjacency: readJson(DEFAULT_PATHS.adjacency),
    units: readJson(DEFAULT_PATHS.units),
    svg: fs.readFileSync(DEFAULT_PATHS.svg, "utf8"),
  };
}

function validateNamedDefinitions(values, expectedCount, pathName, errors) {
  if (!Array.isArray(values)) {
    errors.push(error("DEFINITION_LIST", pathName, "Definitions must be an array."));
    return new Set();
  }
  if (values.length !== expectedCount) {
    errors.push(error("DEFINITION_COUNT", pathName, `Expected ${expectedCount} definitions.`));
  }
  const ids = new Set();
  values.forEach((entry, index) => {
    const entryPath = `${pathName}[${index}]`;
    if (!isObject(entry)) {
      errors.push(error("DEFINITION_TYPE", entryPath, "Definition must be an object."));
      return;
    }
    if (!ID_PATTERN.test(entry.id || "")) {
      errors.push(error("DEFINITION_ID", `${entryPath}.id`, "Definition ID is invalid."));
    } else if (ids.has(entry.id)) {
      errors.push(error("DEFINITION_DUPLICATE", `${entryPath}.id`, "Definition ID must be unique."));
    } else {
      ids.add(entry.id);
    }
    if (typeof entry.name !== "string" || entry.name.trim() === "") {
      errors.push(error("DEFINITION_NAME", `${entryPath}.name`, "Definition name is required."));
    }
  });
  return ids;
}

function validateProvinceData(data) {
  const errors = [];
  const context = {
    provinceIds: new Set(),
    mappedSlugs: new Map(),
    islandCount: 0,
    startingModifierSpread: 0,
  };
  const summary = { provinceCount: 0, regionCount: 0, islandCount: 0, mappedSlugCount: 0, startingModifierSpread: 0 };

  if (!isObject(data)) {
    return { errors: [error("PROVINCE_ROOT", "provinces", "Province data must be an object.")], context, summary };
  }
  if (data.schemaVersion !== 1) {
    errors.push(error("PROVINCE_SCHEMA", "provinces.schemaVersion", "Province schema version must be 1."));
  }

  const regionIds = validateNamedDefinitions(data.regions, 6, "provinces.regions", errors);
  const terrainIds = validateNamedDefinitions(data.terrains, 6, "provinces.terrains", errors);
  summary.regionCount = regionIds.size;

  const capacityTiers = isObject(data.capacityTiers) ? data.capacityTiers : {};
  const capacityIds = Object.keys(capacityTiers).sort(compareText);
  if (capacityIds.length !== 3) {
    errors.push(error("CAPACITY_TIER_COUNT", "provinces.capacityTiers", "Exactly three capacity tiers are required."));
  }
  capacityIds.forEach((id) => {
    const tier = capacityTiers[id];
    const tierPath = `provinces.capacityTiers.${id}`;
    if (!ID_PATTERN.test(id) || !isObject(tier)) {
      errors.push(error("CAPACITY_TIER", tierPath, "Capacity tier is invalid."));
      return;
    }
    if (!Number.isSafeInteger(tier.baseCapacity) || tier.baseCapacity <= 0) {
      errors.push(error("CAPACITY_VALUE", `${tierPath}.baseCapacity`, "Base capacity must be a positive safe integer."));
    }
    if (!Number.isFinite(tier.territoryWeight) || tier.territoryWeight <= 0) {
      errors.push(error("CAPACITY_WEIGHT", `${tierPath}.territoryWeight`, "Territory weight must be positive and finite."));
    }
  });

  const traitPackages = isObject(data.traitPackages) ? data.traitPackages : {};
  const traitIds = Object.keys(traitPackages).sort(compareText);
  if (traitIds.length === 0) {
    errors.push(error("TRAIT_EMPTY", "provinces.traitPackages", "At least one trait package is required."));
  }
  traitIds.forEach((id) => {
    const trait = traitPackages[id];
    const traitPath = `provinces.traitPackages.${id}`;
    if (!ID_PATTERN.test(id) || !isObject(trait) || !isObject(trait.modifiers)) {
      errors.push(error("TRAIT_PACKAGE", traitPath, "Trait package is invalid."));
      return;
    }
    const modifierKeys = Object.keys(trait.modifiers).sort(compareText);
    if (JSON.stringify(modifierKeys) !== JSON.stringify(MODIFIER_FIELDS)) {
      errors.push(error("TRAIT_MODIFIERS", `${traitPath}.modifiers`, "Trait modifiers must define the four gameplay fields."));
      return;
    }
    modifierKeys.forEach((field) => {
      const value = trait.modifiers[field];
      if (!Number.isFinite(value) || value < 0.8 || value > 1.2) {
        errors.push(error("TRAIT_MODIFIER_VALUE", `${traitPath}.modifiers.${field}`, "Trait modifier must be between 0.8 and 1.2."));
      }
    });
    if (
      !MODIFIER_FIELDS.includes(trait.advantage) ||
      !MODIFIER_FIELDS.includes(trait.weakness) ||
      trait.advantage === trait.weakness ||
      trait.modifiers[trait.advantage] <= 1 ||
      trait.modifiers[trait.weakness] >= 1
    ) {
      errors.push(error("TRAIT_TRADEOFF", traitPath, "Trait must identify one positive advantage and one negative weakness."));
    }
    const average = modifierKeys.reduce((sum, field) => sum + trait.modifiers[field], 0) / modifierKeys.length;
    if (Math.abs(average - 1) > 0.000001) {
      errors.push(error("TRAIT_BALANCE", traitPath, "Trait modifier average must remain neutral."));
    }
  });

  if (!Array.isArray(data.provinces)) {
    errors.push(error("PROVINCE_LIST", "provinces.provinces", "Provinces must be an array."));
    return { errors, context, summary };
  }
  summary.provinceCount = data.provinces.length;
  if (data.provinces.length !== 34) {
    errors.push(error("PROVINCE_COUNT", "provinces.provinces", "Exactly 34 playable provinces are required."));
  }

  const names = new Set();
  const startingScores = [];
  function addSvgSlug(slug, provinceId, slugPath, island) {
    if (!ID_PATTERN.test(slug || "")) {
      errors.push(error("SVG_SLUG", slugPath, "SVG slug is invalid."));
      return;
    }
    if (context.mappedSlugs.has(slug)) {
      errors.push(error("SVG_MAPPING_DUPLICATE", slugPath, `SVG slug is already mapped to ${context.mappedSlugs.get(slug).provinceId}.`));
      return;
    }
    context.mappedSlugs.set(slug, { provinceId, island });
    if (island) {
      context.islandCount += 1;
    }
  }

  data.provinces.forEach((province, index) => {
    const provincePath = `provinces.provinces[${index}]`;
    if (!isObject(province)) {
      errors.push(error("PROVINCE_TYPE", provincePath, "Province record must be an object."));
      return;
    }
    if (!ID_PATTERN.test(province.id || "")) {
      errors.push(error("PROVINCE_ID", `${provincePath}.id`, "Province ID is invalid."));
    } else if (context.provinceIds.has(province.id)) {
      errors.push(error("PROVINCE_DUPLICATE", `${provincePath}.id`, "Province ID must be unique."));
    } else {
      context.provinceIds.add(province.id);
    }
    if (!isObject(province.display)) {
      errors.push(error("PROVINCE_DISPLAY", `${provincePath}.display`, "Display metadata is required."));
    } else {
      ["name", "shortName", "capital"].forEach((field) => {
        if (typeof province.display[field] !== "string" || province.display[field].trim() === "") {
          errors.push(error("PROVINCE_DISPLAY_FIELD", `${provincePath}.display.${field}`, "Display field is required."));
        }
      });
      if (!["province", "municipality"].includes(province.display.administrativeType)) {
        errors.push(error("PROVINCE_ADMIN_TYPE", `${provincePath}.display.administrativeType`, "Administrative type is invalid."));
      }
      if (names.has(province.display.name)) {
        errors.push(error("PROVINCE_NAME_DUPLICATE", `${provincePath}.display.name`, "Province name must be unique."));
      }
      names.add(province.display.name);
    }
    if (!regionIds.has(province.region)) {
      errors.push(error("PROVINCE_REGION", `${provincePath}.region`, "Province region is unknown."));
    }
    if (!terrainIds.has(province.terrain)) {
      errors.push(error("PROVINCE_TERRAIN", `${provincePath}.terrain`, "Province terrain is unknown."));
    }
    if (!Object.prototype.hasOwnProperty.call(capacityTiers, province.capacityTier)) {
      errors.push(error("PROVINCE_CAPACITY", `${provincePath}.capacityTier`, "Province capacity tier is unknown."));
    }
    if (!Object.prototype.hasOwnProperty.call(traitPackages, province.trait)) {
      errors.push(error("PROVINCE_TRAIT", `${provincePath}.trait`, "Province trait is unknown."));
    }
    if (!isObject(province.svg) || !Array.isArray(province.svg.islands)) {
      errors.push(error("PROVINCE_SVG", `${provincePath}.svg`, "Province SVG metadata is invalid."));
    } else {
      addSvgSlug(province.svg.primary, province.id, `${provincePath}.svg.primary`, false);
      province.svg.islands.forEach((slug, islandIndex) => {
        addSvgSlug(slug, province.id, `${provincePath}.svg.islands[${islandIndex}]`, true);
      });
    }

    const tier = capacityTiers[province.capacityTier];
    const trait = traitPackages[province.trait];
    if (isObject(tier) && Number.isFinite(tier.baseCapacity) && isObject(trait) && isObject(trait.modifiers)) {
      const average = MODIFIER_FIELDS.reduce((sum, field) => sum + trait.modifiers[field], 0) / MODIFIER_FIELDS.length;
      if (Number.isFinite(average)) {
        startingScores.push((tier.baseCapacity / 1000) * average);
      }
    }
  });

  summary.islandCount = context.islandCount;
  summary.mappedSlugCount = context.mappedSlugs.size;
  if (context.islandCount !== 10) {
    errors.push(error("ISLAND_COUNT", "provinces.provinces", "Exactly 10 island SVG groups must inherit province ownership."));
  }
  if (context.mappedSlugs.size !== 44) {
    errors.push(error("SVG_MAPPING_COUNT", "provinces.provinces", "Exactly 44 unique SVG groups must be mapped."));
  }
  if (startingScores.length > 0) {
    const minimum = Math.min(...startingScores);
    const maximum = Math.max(...startingScores);
    context.startingModifierSpread = (maximum - minimum) / minimum;
    summary.startingModifierSpread = context.startingModifierSpread;
    if (context.startingModifierSpread > 0.2 + Number.EPSILON) {
      errors.push(error("STARTING_SPREAD", "provinces.provinces", "Starting modifier spread cannot exceed 20%."));
    }
  }
  return { errors, context, summary };
}

function validateAdjacency(data, provinceContext) {
  const errors = [];
  const summary = { edgeCount: 0, connectedCount: 0 };
  if (!isObject(data) || !isObject(data.neighbors)) {
    return { errors: [error("ADJACENCY_ROOT", "adjacency", "Adjacency data must contain a neighbors object.")], summary };
  }
  if (data.schemaVersion !== 1) {
    errors.push(error("ADJACENCY_SCHEMA", "adjacency.schemaVersion", "Adjacency schema version must be 1."));
  }
  const provinceIds = provinceContext.provinceIds;
  const graph = data.neighbors;
  Object.keys(graph).sort(compareText).forEach((id) => {
    if (!provinceIds.has(id)) {
      errors.push(error("ADJACENCY_EXTRA_NODE", `adjacency.neighbors.${id}`, "Adjacency node has no province record."));
    }
  });

  let degreeTotal = 0;
  Array.from(provinceIds).sort(compareText).forEach((id) => {
    const nodePath = `adjacency.neighbors.${id}`;
    const values = graph[id];
    if (!Array.isArray(values)) {
      errors.push(error("ADJACENCY_NODE", nodePath, "Every province needs a neighbor array."));
      return;
    }
    if (values.length === 0) {
      errors.push(error("ADJACENCY_EMPTY", nodePath, "Every province needs at least one land neighbor."));
    }
    degreeTotal += values.length;
    const sorted = values.slice().sort(compareText);
    if (JSON.stringify(values) !== JSON.stringify(sorted)) {
      errors.push(error("ADJACENCY_ORDER", nodePath, "Neighbor IDs must be sorted."));
    }
    const seen = new Set();
    values.forEach((neighbor, index) => {
      const edgePath = `${nodePath}[${index}]`;
      if (neighbor === id) {
        errors.push(error("ADJACENCY_SELF", edgePath, "Province cannot border itself."));
      }
      if (seen.has(neighbor)) {
        errors.push(error("ADJACENCY_DUPLICATE", edgePath, "Neighbor entry must be unique."));
      }
      seen.add(neighbor);
      if (!provinceIds.has(neighbor)) {
        errors.push(error("ADJACENCY_UNKNOWN", edgePath, "Neighbor has no province record."));
      } else if (!Array.isArray(graph[neighbor]) || !graph[neighbor].includes(id)) {
        errors.push(error("ADJACENCY_ASYMMETRIC", edgePath, `${neighbor} must also reference ${id}.`));
      }
    });
  });
  summary.edgeCount = degreeTotal / 2;

  const orderedIds = Array.from(provinceIds).sort(compareText);
  const visited = new Set();
  if (orderedIds.length > 0) {
    const queue = [orderedIds[0]];
    visited.add(orderedIds[0]);
    while (queue.length > 0) {
      const current = queue.shift();
      const neighbors = Array.isArray(graph[current]) ? graph[current] : [];
      neighbors.forEach((neighbor) => {
        if (provinceIds.has(neighbor) && !visited.has(neighbor)) {
          visited.add(neighbor);
          queue.push(neighbor);
        }
      });
    }
  }
  summary.connectedCount = visited.size;
  if (visited.size !== provinceIds.size) {
    errors.push(error("ADJACENCY_DISCONNECTED", "adjacency.neighbors", "Province graph must be connected."));
  }
  return { errors, summary };
}

function parseAttributes(source) {
  const attributes = Object.create(null);
  const pattern = /([:\w-]+)\s*=\s*(["'])(.*?)\2/g;
  let match;
  while ((match = pattern.exec(source)) !== null) {
    attributes[match[1]] = match[3];
  }
  return attributes;
}

function validateSvg(svg, provinceContext) {
  const errors = [];
  const summary = { provinceGroupCount: 0, pathCount: 0 };
  if (typeof svg !== "string" || svg.trim() === "") {
    return { errors: [error("SVG_ROOT", "svg", "SVG source must be a non-empty string.")], summary };
  }
  const rootOpenings = svg.match(/<\s*(?:[a-z_][\w.-]*:)?svg(?=[\s/>])/gi) || [];
  const rootClosings = svg.match(/<\/\s*(?:[a-z_][\w.-]*:)?svg\s*>/gi) || [];
  if (
    !/^\s*<svg\b/i.test(svg) ||
    !/<\/svg>\s*$/i.test(svg) ||
    rootOpenings.length !== 1 ||
    rootClosings.length !== 1
  ) {
    errors.push(error("SVG_DOCUMENT", "svg", "SVG must contain one complete root document."));
  }
  if (!/<svg\b[^>]*\bviewBox\s*=\s*["'][^"']+["']/i.test(svg)) {
    errors.push(error("SVG_VIEWBOX", "svg.viewBox", "SVG root must preserve a viewBox."));
  }
  if (/<!DOCTYPE|<!ENTITY|<\?xml-stylesheet/i.test(svg)) {
    errors.push(error("SVG_DECLARATION", "svg", "Unsafe XML declarations are not allowed."));
  }
  ["script", "style", "foreignObject", "iframe", "object", "embed", "image", "use", "a"].forEach((tag) => {
    if (new RegExp(`<\\s*(?:[a-z_][\\w.-]*:)?${tag}\\b`, "i").test(svg)) {
      errors.push(error("SVG_FORBIDDEN_TAG", `svg.${tag}`, `SVG tag ${tag} is not allowed.`));
    }
  });
  if (/\son[a-z0-9_-]+\s*=/i.test(svg)) {
    errors.push(error("SVG_EVENT_HANDLER", "svg", "Inline SVG event handlers are not allowed."));
  }
  if (/\sstyle\s*=/i.test(svg)) {
    errors.push(error("SVG_STYLE_ATTRIBUTE", "svg", "Inline style attributes are not allowed."));
  }

  const ids = new Set();
  const idPattern = /\bid\s*=\s*(["'])(.*?)\1/gi;
  let idMatch;
  while ((idMatch = idPattern.exec(svg)) !== null) {
    ids.add(idMatch[2]);
  }
  const hrefPattern = /(?:xlink:)?href\s*=\s*(["'])(.*?)\1/gi;
  let hrefMatch;
  while ((hrefMatch = hrefPattern.exec(svg)) !== null) {
    const target = hrefMatch[2];
    if (!target.startsWith("#")) {
      errors.push(error("SVG_EXTERNAL_REFERENCE", "svg.href", "SVG references must be local fragments."));
    } else if (!ids.has(target.slice(1))) {
      errors.push(error("SVG_REFERENCE_MISSING", "svg.href", `Missing local SVG target ${target}.`));
    }
  }
  const urlPattern = /url\(\s*(["']?)(.*?)\1\s*\)/gi;
  let urlMatch;
  while ((urlMatch = urlPattern.exec(svg)) !== null) {
    if (!urlMatch[2].startsWith("#")) {
      errors.push(error("SVG_EXTERNAL_URL", "svg.url", "SVG URL references must be local fragments."));
    }
  }

  const svgGroups = new Set();
  const groupPattern = /<g\b([^>]*)>/gi;
  let groupMatch;
  while ((groupMatch = groupPattern.exec(svg)) !== null) {
    const attributes = parseAttributes(groupMatch[1]);
    const classes = (attributes.class || "").split(/\s+/).filter(Boolean);
    if (!classes.includes("province")) {
      continue;
    }
    const slug = attributes["data-p"];
    if (!ID_PATTERN.test(slug || "")) {
      errors.push(error("SVG_GROUP_SLUG", "svg.g[data-p]", "Province SVG group needs a valid data-p slug."));
    } else if (svgGroups.has(slug)) {
      errors.push(error("SVG_GROUP_DUPLICATE", `svg.g[data-p=${slug}]`, "Province SVG group slug must be unique."));
    } else {
      svgGroups.add(slug);
    }
  }
  summary.provinceGroupCount = svgGroups.size;
  summary.pathCount = (svg.match(/<path\b/gi) || []).length;
  if (svgGroups.size !== 44) {
    errors.push(error("SVG_GROUP_COUNT", "svg", "SVG must contain exactly 44 province groups."));
  }
  if (summary.pathCount === 0) {
    errors.push(error("SVG_PATHS", "svg", "SVG must contain path geometry."));
  }
  provinceContext.mappedSlugs.forEach((mapping, slug) => {
    if (!svgGroups.has(slug)) {
      errors.push(error("SVG_COVERAGE", `svg.g[data-p=${slug}]`, "Mapped SVG group is missing from the asset."));
    }
  });
  svgGroups.forEach((slug) => {
    if (!provinceContext.mappedSlugs.has(slug)) {
      errors.push(error("SVG_MAPPING_MISSING", `svg.g[data-p=${slug}]`, "SVG group has no province owner mapping."));
    }
  });
  return { errors, summary };
}

function containsNumber(value) {
  if (typeof value === "number") {
    return true;
  }
  if (Array.isArray(value)) {
    return value.some(containsNumber);
  }
  if (isObject(value)) {
    return Object.keys(value).some((key) => containsNumber(value[key]));
  }
  return false;
}

function validateUnits(data) {
  const errors = [];
  const summary = { unitCount: 0 };
  if (!isObject(data) || !Array.isArray(data.units)) {
    return { errors: [error("UNIT_ROOT", "units", "Unit data must contain a units array.")], summary };
  }
  if (data.schemaVersion !== 1) {
    errors.push(error("UNIT_SCHEMA", "units.schemaVersion", "Unit schema version must be 1."));
  }
  summary.unitCount = data.units.length;
  if (data.units.length !== 5) {
    errors.push(error("UNIT_COUNT", "units.units", "Exactly five semantic unit records are required."));
  }
  const expected = ["archer", "cavalry", "engineer", "infantry", "militia"];
  const ids = new Set();
  const balanceKeys = new Set();
  let startingCount = 0;
  data.units.forEach((unit, index) => {
    const unitPath = `units.units[${index}]`;
    if (!isObject(unit)) {
      errors.push(error("UNIT_TYPE", unitPath, "Unit record must be an object."));
      return;
    }
    if (!ID_PATTERN.test(unit.id || "") || ids.has(unit.id)) {
      errors.push(error("UNIT_ID", `${unitPath}.id`, "Unit ID must be valid and unique."));
    }
    ids.add(unit.id);
    ["name", "role", "trainingClass", "balanceKey"].forEach((field) => {
      if (typeof unit[field] !== "string" || unit[field].trim() === "") {
        errors.push(error("UNIT_FIELD", `${unitPath}.${field}`, "Unit semantic field is required."));
      }
    });
    if (balanceKeys.has(unit.balanceKey)) {
      errors.push(error("UNIT_BALANCE_KEY", `${unitPath}.balanceKey`, "Unit balance key must be unique."));
    }
    balanceKeys.add(unit.balanceKey);
    if (!Array.isArray(unit.tags) || unit.tags.length === 0 || unit.tags.some((tag) => !ID_PATTERN.test(tag))) {
      errors.push(error("UNIT_TAGS", `${unitPath}.tags`, "Unit tags must be a non-empty stable-ID array."));
    }
    if (!isObject(unit.unlock) || !["starting", "research"].includes(unit.unlock.kind)) {
      errors.push(error("UNIT_UNLOCK", `${unitPath}.unlock`, "Unit unlock metadata is invalid."));
    } else if (unit.unlock.kind === "starting") {
      startingCount += 1;
      if (unit.id !== "militia") {
        errors.push(error("UNIT_STARTING", `${unitPath}.unlock`, "Only militia can be available at campaign start."));
      }
    } else if (!ID_PATTERN.test(unit.unlock.key || "")) {
      errors.push(error("UNIT_RESEARCH_KEY", `${unitPath}.unlock.key`, "Research unlock key is invalid."));
    }
    if (containsNumber(unit)) {
      errors.push(error("UNIT_BALANCE_EMBEDDED", unitPath, "Semantic unit records cannot embed tunable numeric coefficients."));
    }
  });
  if (JSON.stringify(Array.from(ids).sort(compareText)) !== JSON.stringify(expected)) {
    errors.push(error("UNIT_SET", "units.units", "Unit records must define the approved five unit IDs."));
  }
  if (startingCount !== 1) {
    errors.push(error("UNIT_STARTING_COUNT", "units.units", "Exactly one starting unit is required."));
  }
  return { errors, summary };
}

function validateAll(input) {
  const provinceResult = validateProvinceData(input.provinces);
  const adjacencyResult = validateAdjacency(input.adjacency, provinceResult.context);
  const svgResult = validateSvg(input.svg, provinceResult.context);
  const unitResult = validateUnits(input.units);
  const errors = provinceResult.errors
    .concat(adjacencyResult.errors, svgResult.errors, unitResult.errors)
    .sort((left, right) => compareText(left.path, right.path) || compareText(left.code, right.code));
  return {
    ok: errors.length === 0,
    errors,
    summary: {
      provinceCount: provinceResult.summary.provinceCount,
      regionCount: provinceResult.summary.regionCount,
      islandCount: provinceResult.summary.islandCount,
      mappedSlugCount: provinceResult.summary.mappedSlugCount,
      svgGroupCount: svgResult.summary.provinceGroupCount,
      svgPathCount: svgResult.summary.pathCount,
      adjacencyEdgeCount: adjacencyResult.summary.edgeCount,
      connectedProvinceCount: adjacencyResult.summary.connectedCount,
      unitCount: unitResult.summary.unitCount,
      startingModifierSpread: provinceResult.summary.startingModifierSpread,
    },
  };
}

function validateDefaultData() {
  return validateAll(loadDefaultData());
}

if (require.main === module) {
  const result = validateDefaultData();
  if (!result.ok) {
    console.error(`Game data validation failed with ${result.errors.length} error(s):`);
    result.errors.forEach((item) => {
      console.error(`- [${item.code}] ${item.path}: ${item.message}`);
    });
    process.exitCode = 1;
  } else {
    console.log("Game data validation passed.");
    console.log(`- Provinces: ${result.summary.provinceCount}`);
    console.log(`- Regions: ${result.summary.regionCount}`);
    console.log(`- SVG groups: ${result.summary.svgGroupCount} (${result.summary.islandCount} island groups)`);
    console.log(`- Adjacency edges: ${result.summary.adjacencyEdgeCount}`);
    console.log(`- Unit definitions: ${result.summary.unitCount}`);
    console.log(`- Starting modifier spread: ${(result.summary.startingModifierSpread * 100).toFixed(2)}%`);
  }
}

module.exports = {
  DEFAULT_PATHS,
  ROOT,
  loadDefaultData,
  validateAdjacency,
  validateAll,
  validateDefaultData,
  validateProvinceData,
  validateSvg,
  validateUnits,
};
