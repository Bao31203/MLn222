(function (root, factory) {
  "use strict";
  var game = root.MLN222Game;
  if (!game || !game.hasModule("contracts") || !game.hasModule("invariants") || !game.hasModule("rng")) {
    throw new Error("Load the core modules before save-validation.js.");
  }
  var api = game.registerModule("save-validation", factory(game.contracts, game.invariants, game.rng));
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function (contracts, invariants, rng) {
  "use strict";

  var SAVE_SCHEMA_VERSION = 1;
  var ENVELOPE_FIELDS = Object.freeze(["schemaVersion", "payload", "rng", "checksum"]);

  function error(code, path, message) {
    return { code: code, path: path, message: message };
  }

  function canonicalize(value) {
    if (value === null || typeof value !== "object") {
      return JSON.stringify(value);
    }
    if (Array.isArray(value)) {
      return "[" + value.map(canonicalize).join(",") + "]";
    }
    if (!contracts.isPlainObject(value)) {
      throw new TypeError("Canonical save values must be plain JSON objects.");
    }
    return "{" + Object.keys(value).sort().map(function (key) {
      return JSON.stringify(key) + ":" + canonicalize(value[key]);
    }).join(",") + "}";
  }

  function checksumText(text) {
    var hash = 0x811c9dc5;
    for (var index = 0; index < text.length; index += 1) {
      hash ^= text.charCodeAt(index);
      hash = Math.imul(hash, 0x01000193) >>> 0;
    }
    return hash.toString(16).padStart(8, "0");
  }

  function checksumData(schemaVersion, payload, rngState) {
    return checksumText(canonicalize({
      schemaVersion: schemaVersion,
      payload: payload,
      rng: rngState,
    }));
  }

  function exactFields(value, fields) {
    return contracts.isPlainObject(value) &&
      JSON.stringify(Object.keys(value).sort()) === JSON.stringify(fields.slice().sort());
  }

  function validateActiveQuiz(quiz, path) {
    var errors = [];
    if (!exactFields(quiz, ["id", "questionIds", "position", "answers", "score", "completed"])) {
      return [error("SAVE_QUIZ_FIELDS", path, "Saved quiz has unknown or missing fields.")];
    }
    if (typeof quiz.id !== "string" || !/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,63}$/.test(quiz.id)) {
      errors.push(error("SAVE_QUIZ_ID", path + ".id", "Saved quiz ID is invalid."));
    }
    if (!Array.isArray(quiz.questionIds) || quiz.questionIds.length !== 10 || new Set(quiz.questionIds).size !== 10 || quiz.questionIds.some(function (id) { return typeof id !== "string"; })) {
      errors.push(error("SAVE_QUIZ_IDS", path + ".questionIds", "Saved quiz must contain ten unique question IDs."));
    }
    if (!Number.isSafeInteger(quiz.position) || quiz.position < 0 || quiz.position > 10) {
      errors.push(error("SAVE_QUIZ_POSITION", path + ".position", "Saved quiz position is invalid."));
    }
    if (!contracts.isPlainObject(quiz.answers)) {
      errors.push(error("SAVE_QUIZ_ANSWERS", path + ".answers", "Saved quiz answers must be an object."));
    } else {
      var answerIds = Object.keys(quiz.answers);
      if (!Number.isSafeInteger(quiz.position) || answerIds.length !== quiz.position) {
        errors.push(error("SAVE_QUIZ_ANSWER_COUNT", path + ".answers", "Saved answer count must equal quiz position."));
      }
      answerIds.forEach(function (id) {
        if (!Array.isArray(quiz.questionIds) || quiz.questionIds.indexOf(id) === -1 || !Number.isSafeInteger(quiz.answers[id]) || quiz.answers[id] < 0 || quiz.answers[id] > 3) {
          errors.push(error("SAVE_QUIZ_ANSWER", path + ".answers." + id, "Saved quiz answer is invalid."));
        }
      });
    }
    if (!Number.isSafeInteger(quiz.score) || quiz.score < 0 || !Number.isSafeInteger(quiz.position) || quiz.score > quiz.position) {
      errors.push(error("SAVE_QUIZ_SCORE", path + ".score", "Saved quiz score is invalid."));
    }
    if (typeof quiz.completed !== "boolean" || quiz.completed !== (quiz.position === 10)) {
      errors.push(error("SAVE_QUIZ_COMPLETION", path + ".completed", "Saved quiz completion is inconsistent."));
    }
    return errors;
  }

  function validateQuizPayload(quiz, path) {
    if (quiz === null) {
      return [];
    }
    if (!contracts.isPlainObject(quiz)) {
      return [error("SAVE_QUIZ", path, "Saved quiz state must be an object or null.")];
    }
    if (Object.prototype.hasOwnProperty.call(quiz, "deckState")) {
      var errors = [];
      if (!exactFields(quiz, ["deckState", "active", "completedTurns"])) {
        errors.push(error("SAVE_QUIZ_WRAPPER_FIELDS", path, "Saved campaign quiz wrapper has unknown or missing fields."));
      }
      if (!contracts.isPlainObject(quiz.deckState) || !Array.isArray(quiz.deckState.remaining) || !contracts.isPlainObject(quiz.deckState.difficultyCounts) || !contracts.isPlainObject(quiz.deckState.chapterCounts)) {
        errors.push(error("SAVE_DECK_STATE", path + ".deckState", "Saved question deck state is invalid."));
      }
      if (quiz.active !== null) {
        errors.push.apply(errors, validateActiveQuiz(quiz.active, path + ".active"));
      }
      if (!Array.isArray(quiz.completedTurns)) {
        errors.push(error("SAVE_QUIZ_HISTORY", path + ".completedTurns", "Saved quiz history must be an array."));
      } else {
        quiz.completedTurns.forEach(function (entry, index) {
          var entryPath = path + ".completedTurns[" + index + "]";
          if (!exactFields(entry, ["turn", "quizId", "score", "questionIds"]) || !Number.isSafeInteger(entry.turn) || entry.turn < 1 || !Number.isSafeInteger(entry.score) || entry.score < 0 || entry.score > 10 || !Array.isArray(entry.questionIds) || entry.questionIds.length !== 10 || new Set(entry.questionIds).size !== 10) {
            errors.push(error("SAVE_QUIZ_HISTORY_ENTRY", entryPath, "Saved quiz history entry is invalid."));
          }
        });
      }
      return errors;
    }
    return validateActiveQuiz(quiz, path);
  }

  function createEnvelope(gameState) {
    var stateErrors = invariants.validateState(gameState);
    if (contracts.isPlainObject(gameState)) {
      stateErrors = stateErrors.concat(validateQuizPayload(gameState.quiz, "state.quiz"));
    }
    if (stateErrors.length > 0) {
      throw new TypeError(stateErrors[0].message + " Path: " + stateErrors[0].path);
    }
    var payload = contracts.cloneGameState(gameState);
    var rngState = rng.cloneRngState(payload.rng);
    return {
      schemaVersion: SAVE_SCHEMA_VERSION,
      payload: payload,
      rng: rngState,
      checksum: checksumData(SAVE_SCHEMA_VERSION, payload, rngState),
    };
  }

  function validateEnvelope(envelope) {
    if (!contracts.isPlainObject(envelope)) {
      return [error("SAVE_ENVELOPE", "save", "Save envelope must be an object.")];
    }
    var errors = [];
    var fields = Object.keys(envelope).sort();
    if (JSON.stringify(fields) !== JSON.stringify(ENVELOPE_FIELDS.slice().sort())) {
      errors.push(error("SAVE_FIELDS", "save", "Save envelope has unknown or missing fields."));
    }
    if (envelope.schemaVersion !== SAVE_SCHEMA_VERSION) {
      errors.push(error("SAVE_VERSION", "save.schemaVersion", "Save schema version is unsupported."));
    }
    if (typeof envelope.checksum !== "string" || !/^[0-9a-f]{8}$/.test(envelope.checksum)) {
      errors.push(error("SAVE_CHECKSUM_FORMAT", "save.checksum", "Save checksum format is invalid."));
    }
    if (!contracts.isPlainObject(envelope.payload)) {
      errors.push(error("SAVE_PAYLOAD", "save.payload", "Save payload must be an object."));
    } else {
      invariants.validateState(envelope.payload).forEach(function (item) {
        errors.push(error(item.code, "save.payload." + item.path, item.message));
      });
      errors.push.apply(errors, validateQuizPayload(envelope.payload.quiz, "save.payload.quiz"));
    }
    rng.validateRngState(envelope.rng, "save.rng").forEach(function (item) { errors.push(item); });
    if (
      contracts.isPlainObject(envelope.payload) &&
      contracts.isPlainObject(envelope.payload.rng) &&
      contracts.isPlainObject(envelope.rng) &&
      canonicalize(envelope.payload.rng) !== canonicalize(envelope.rng)
    ) {
      errors.push(error("SAVE_RNG_MISMATCH", "save.rng", "Envelope RNG must match payload RNG."));
    }
    if (
      errors.every(function (item) {
        return item.code !== "SAVE_VERSION" && item.code !== "SAVE_PAYLOAD" && item.code !== "SAVE_CHECKSUM_FORMAT";
      })
    ) {
      var expected = checksumData(envelope.schemaVersion, envelope.payload, envelope.rng);
      if (expected !== envelope.checksum) {
        errors.push(error("SAVE_CHECKSUM", "save.checksum", "Save checksum does not match its payload."));
      }
    }
    return errors;
  }

  return {
    SAVE_SCHEMA_VERSION: SAVE_SCHEMA_VERSION,
    canonicalize: canonicalize,
    checksumText: checksumText,
    checksumData: checksumData,
    createEnvelope: createEnvelope,
    validateEnvelope: validateEnvelope,
    validateQuizPayload: validateQuizPayload,
  };
});
