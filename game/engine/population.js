(function (root, factory) {
  "use strict";
  var game = root.MLN222Game;
  if (!game || !game.hasModule("contracts")) {
    throw new Error("Load the core contracts before population.js.");
  }
  var api = game.registerModule("population", factory(game.contracts));
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function (contracts) {
  "use strict";

  var FACTOR_FIELDS = Object.freeze(["effects", "quiz", "stability", "trait"]);

  function error(code, path, message) {
    return { code: code, path: path, message: message };
  }

  function isNonNegativeInteger(value) {
    return Number.isSafeInteger(value) && value >= 0;
  }

  function validatePopulation(value, path) {
    var basePath = path || "population";
    var errors = [];
    if (!contracts.isPlainObject(value)) {
      return [error("POPULATION_TYPE", basePath, "Population must be an object.")];
    }
    ["capacity", "civilians", "military"].forEach(function (field) {
      if (!isNonNegativeInteger(value[field])) {
        errors.push(error(
          "POPULATION_VALUE",
          basePath + "." + field,
          "Population fields must be non-negative safe integers."
        ));
      }
    });
    if (
      isNonNegativeInteger(value.capacity) &&
      isNonNegativeInteger(value.civilians) &&
      isNonNegativeInteger(value.military) &&
      value.civilians + value.military > value.capacity
    ) {
      errors.push(error("POPULATION_CAPACITY", basePath, "Civilian and military population cannot exceed capacity."));
    }
    return errors;
  }

  function assertPopulation(value) {
    var errors = validatePopulation(value);
    if (errors.length > 0) {
      throw new RangeError(errors[0].message + " Path: " + errors[0].path);
    }
  }

  function requireFactor(value, name) {
    var selected = value === undefined ? 1 : value;
    if (!Number.isFinite(selected) || selected < 0) {
      throw new RangeError("Population factor must be non-negative and finite: " + name);
    }
    return selected;
  }

  function factorBreakdown(input) {
    var factors = input === undefined ? {} : input;
    if (!contracts.isPlainObject(factors)) {
      throw new TypeError("Population factors must be an object.");
    }
    var result = {};
    FACTOR_FIELDS.forEach(function (field) {
      result[field] = requireFactor(factors[field], field);
    });
    result.total = FACTOR_FIELDS.reduce(function (product, field) {
      return product * result[field];
    }, 1);
    if (!Number.isFinite(result.total)) {
      throw new RangeError("Population factor product must be finite.");
    }
    return result;
  }

  function validateGrowthConfig(config) {
    if (!contracts.isPlainObject(config)) {
      throw new TypeError("Population growth config must be an object.");
    }
    if (!Number.isFinite(config.peakOccupancy) || config.peakOccupancy <= 0 || config.peakOccupancy >= 1) {
      throw new RangeError("Peak occupancy must be between zero and one.");
    }
    if (!Number.isFinite(config.baseGrowthRate) || config.baseGrowthRate < 0) {
      throw new RangeError("Base growth rate must be non-negative and finite.");
    }
    if (!Number.isFinite(config.militaryPenalty) || config.militaryPenalty < 0) {
      throw new RangeError("Military growth penalty must be non-negative and finite.");
    }
    if (
      !Number.isFinite(config.minimumMilitaryFactor) ||
      config.minimumMilitaryFactor < 0 ||
      config.minimumMilitaryFactor > 1
    ) {
      throw new RangeError("Minimum military factor must be between zero and one.");
    }
    if (typeof config.roundingMode !== "string") {
      throw new TypeError("Population rounding mode must be configured.");
    }
    contracts.roundInteger(0, config.roundingMode);
  }

  function civilianOccupancy(population) {
    assertPopulation(population);
    if (population.capacity === 0) {
      return 0;
    }
    return population.civilians / population.capacity;
  }

  function mobilizationRatio(population) {
    assertPopulation(population);
    var total = population.civilians + population.military;
    return total === 0 ? 0 : population.military / total;
  }

  function populationCurve(population, config) {
    validateGrowthConfig(config);
    var occupancy = civilianOccupancy(population);
    if (occupancy <= config.peakOccupancy) {
      return occupancy / config.peakOccupancy;
    }
    return (1 - occupancy) / (1 - config.peakOccupancy);
  }

  function calculateGrowth(population, factors, config) {
    assertPopulation(population);
    validateGrowthConfig(config);
    var factorValues = factorBreakdown(factors);
    var occupancy = civilianOccupancy(population);
    var curve = populationCurve(population, config);
    var mobilization = mobilizationRatio(population);
    var militaryFactor = Math.max(
      config.minimumMilitaryFactor,
      1 - config.militaryPenalty * mobilization
    );
    var remainingCapacity = population.capacity - population.civilians - population.military;
    var baseGrowth = population.capacity * config.baseGrowthRate;
    var rawGrowth = baseGrowth * curve * militaryFactor * factorValues.total;
    if (!Number.isFinite(rawGrowth) || rawGrowth < 0) {
      throw new RangeError("Calculated population growth must be non-negative and finite.");
    }
    var roundedGrowth = contracts.roundInteger(rawGrowth, config.roundingMode);
    var delta = contracts.clamp(roundedGrowth, 0, remainingCapacity);
    return {
      delta: delta,
      occupancy: occupancy,
      curve: curve,
      mobilization: mobilization,
      militaryFactor: militaryFactor,
      remainingCapacity: remainingCapacity,
      baseGrowth: baseGrowth,
      rawGrowth: rawGrowth,
      roundedGrowth: roundedGrowth,
      factors: factorValues,
    };
  }

  function applyGrowth(population, factors, config) {
    var breakdown = calculateGrowth(population, factors, config);
    var next = contracts.cloneJson(population);
    next.civilians += breakdown.delta;
    return { population: next, breakdown: breakdown };
  }

  return {
    FACTOR_FIELDS: FACTOR_FIELDS,
    validatePopulation: validatePopulation,
    civilianOccupancy: civilianOccupancy,
    mobilizationRatio: mobilizationRatio,
    populationCurve: populationCurve,
    calculateGrowth: calculateGrowth,
    applyGrowth: applyGrowth,
  };
});
