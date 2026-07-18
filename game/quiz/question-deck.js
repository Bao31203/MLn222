(function (root, factory) {
  "use strict";
  var game = root.MLN222Game;
  if (!game || !game.hasModule("contracts") || !game.hasModule("rng")) {
    throw new Error("Load the core modules before question-deck.js.");
  }
  var api = game.registerModule("question-deck", factory(game.contracts, game.rng));
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function (contracts, rng) {
  "use strict";

  var DECK_SCHEMA_VERSION = 1;
  var QUIZ_SIZE = 10;
  var DIFFICULTIES = Object.freeze(["Nhan biet", "Thong hieu", "Van dung"]);
  var DIFFICULTY_WEIGHTS = Object.freeze({
    "Nhan biet": 0.4,
    "Thong hieu": 0.4,
    "Van dung": 0.2,
  });
  var ID_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9._-]{0,63}$/;

  function normalizeText(value) {
    if (typeof value !== "string") {
      return "";
    }
    return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D");
  }

  function normalizeDifficulty(value) {
    var normalized = normalizeText(value).toLowerCase().replace(/\s+/g, " ").trim();
    if (normalized === "nhan biet") {
      return "Nhan biet";
    }
    if (normalized === "thong hieu") {
      return "Thong hieu";
    }
    if (normalized === "van dung") {
      return "Van dung";
    }
    throw new RangeError("Unsupported question difficulty: " + String(value));
  }

  function requireChapter(value) {
    if (!Number.isSafeInteger(value) || value < 1 || value > 99) {
      throw new RangeError("Question chapterNum must be a positive safe integer.");
    }
    return String(value);
  }

  function createQuestionIndex(questions) {
    if (!Array.isArray(questions) || questions.length < QUIZ_SIZE) {
      throw new TypeError("Question bank must contain at least ten questions.");
    }
    var byId = Object.create(null);
    var ids = [];
    var chapterIds = [];
    questions.forEach(function (question, index) {
      if (!contracts.isPlainObject(question)) {
        throw new TypeError("Question at index " + index + " must be an object.");
      }
      if (typeof question.id !== "string" || !ID_PATTERN.test(question.id)) {
        throw new RangeError("Question ID is invalid at index " + index + ".");
      }
      if (Object.prototype.hasOwnProperty.call(byId, question.id)) {
        throw new RangeError("Duplicate question ID: " + question.id);
      }
      var difficulty = normalizeDifficulty(question.difficulty);
      var chapter = requireChapter(question.chapterNum);
      if (!Array.isArray(question.options) || question.options.length !== 4) {
        throw new RangeError("Question must define exactly four options: " + question.id);
      }
      if (!Number.isSafeInteger(question.answer) || question.answer < 0 || question.answer > 3) {
        throw new RangeError("Question answer is invalid: " + question.id);
      }
      byId[question.id] = Object.freeze({
        id: question.id,
        difficulty: difficulty,
        chapter: chapter,
        answer: question.answer,
      });
      ids.push(question.id);
      if (chapterIds.indexOf(chapter) === -1) {
        chapterIds.push(chapter);
      }
    });
    chapterIds.sort(function (left, right) { return Number(left) - Number(right); });
    return Object.freeze({ byId: byId, ids: Object.freeze(ids), chapters: Object.freeze(chapterIds) });
  }

  function zeroCounts(keys) {
    var result = {};
    keys.forEach(function (key) { result[key] = 0; });
    return result;
  }

  function validateCounts(value, keys, path) {
    if (!contracts.isPlainObject(value)) {
      throw new TypeError(path + " must be an object.");
    }
    var actualKeys = Object.keys(value).sort();
    var expectedKeys = keys.slice().sort();
    if (JSON.stringify(actualKeys) !== JSON.stringify(expectedKeys)) {
      throw new RangeError(path + " contains unknown or missing keys.");
    }
    keys.forEach(function (key) {
      if (!Number.isSafeInteger(value[key]) || value[key] < 0) {
        throw new RangeError(path + "." + key + " must be a non-negative safe integer.");
      }
    });
  }

  function validateDeckState(state, index) {
    if (!contracts.isPlainObject(state)) {
      throw new TypeError("Deck state must be an object.");
    }
    var allowed = ["schemaVersion", "cycle", "remaining", "totalDrawn", "difficultyCounts", "chapterCounts"];
    if (Object.keys(state).some(function (key) { return allowed.indexOf(key) === -1; })) {
      throw new RangeError("Deck state contains an unknown field.");
    }
    if (state.schemaVersion !== DECK_SCHEMA_VERSION) {
      throw new RangeError("Unsupported deck schema version.");
    }
    if (!Number.isSafeInteger(state.cycle) || state.cycle < 1 || !Number.isSafeInteger(state.totalDrawn) || state.totalDrawn < 0) {
      throw new RangeError("Deck cycle counters are invalid.");
    }
    if (!Array.isArray(state.remaining) || state.remaining.length > index.ids.length) {
      throw new RangeError("Deck remaining IDs are invalid.");
    }
    var seen = Object.create(null);
    state.remaining.forEach(function (id) {
      if (!Object.prototype.hasOwnProperty.call(index.byId, id) || seen[id]) {
        throw new RangeError("Deck contains an unknown or duplicate question ID.");
      }
      seen[id] = true;
    });
    validateCounts(state.difficultyCounts, DIFFICULTIES, "difficultyCounts");
    validateCounts(state.chapterCounts, index.chapters, "chapterCounts");
    var difficultyTotal = DIFFICULTIES.reduce(function (total, key) { return total + state.difficultyCounts[key]; }, 0);
    var chapterTotal = index.chapters.reduce(function (total, key) { return total + state.chapterCounts[key]; }, 0);
    var completedBeforeCycle = (state.cycle - 1) * index.ids.length;
    var consumedInCycle = index.ids.length - state.remaining.length;
    if (
      !Number.isSafeInteger(completedBeforeCycle) ||
      !Number.isSafeInteger(completedBeforeCycle + consumedInCycle) ||
      state.totalDrawn !== completedBeforeCycle + consumedInCycle ||
      difficultyTotal !== state.totalDrawn ||
      chapterTotal !== state.totalDrawn
    ) {
      throw new RangeError("Deck counters, cycle, and remaining IDs are inconsistent.");
    }
    return true;
  }

  function createDeckState(questions, rngState) {
    var index = createQuestionIndex(questions);
    var shuffled = rng.shuffle(rngState, "quiz", index.ids);
    return {
      state: {
        schemaVersion: DECK_SCHEMA_VERSION,
        cycle: 1,
        remaining: shuffled.value,
        totalDrawn: 0,
        difficultyCounts: zeroCounts(DIFFICULTIES),
        chapterCounts: zeroCounts(index.chapters),
      },
      rngState: shuffled.state,
    };
  }

  function refill(state, index, rngState, excluded) {
    var shuffled = rng.shuffle(rngState, "quiz", index.ids);
    var excludedSet = Object.create(null);
    excluded.forEach(function (id) { excludedSet[id] = true; });
    var first = [];
    var deferred = [];
    shuffled.value.forEach(function (id) {
      (excludedSet[id] ? deferred : first).push(id);
    });
    state.remaining = first.concat(deferred);
    state.cycle += 1;
    return shuffled.state;
  }

  function difficultyPriority(state, availableDifficulties) {
    var nextTotal = state.totalDrawn + 1;
    return availableDifficulties.slice().sort(function (left, right) {
      var leftDebt = nextTotal * DIFFICULTY_WEIGHTS[left] - state.difficultyCounts[left];
      var rightDebt = nextTotal * DIFFICULTY_WEIGHTS[right] - state.difficultyCounts[right];
      if (rightDebt !== leftDebt) {
        return rightDebt - leftDebt;
      }
      return DIFFICULTIES.indexOf(left) - DIFFICULTIES.indexOf(right);
    })[0];
  }

  function candidateIndex(state, index) {
    var available = [];
    state.remaining.forEach(function (id) {
      var difficulty = index.byId[id].difficulty;
      if (available.indexOf(difficulty) === -1) {
        available.push(difficulty);
      }
    });
    var chosenDifficulty = difficultyPriority(state, available);
    var nextChapterTarget = (state.totalDrawn + 1) / index.chapters.length;
    var bestIndex = -1;
    var bestDebt = -Infinity;
    state.remaining.forEach(function (id, position) {
      var meta = index.byId[id];
      if (meta.difficulty !== chosenDifficulty) {
        return;
      }
      var debt = nextChapterTarget - state.chapterCounts[meta.chapter];
      if (debt > bestDebt) {
        bestDebt = debt;
        bestIndex = position;
      }
    });
    return bestIndex;
  }

  function drawQuiz(deckState, questions, rngState, size) {
    var requestedSize = size === undefined ? QUIZ_SIZE : size;
    if (!Number.isSafeInteger(requestedSize) || requestedSize < 1 || requestedSize > QUIZ_SIZE) {
      throw new RangeError("Quiz size must be between one and ten.");
    }
    var index = createQuestionIndex(questions);
    validateDeckState(deckState, index);
    var state = contracts.cloneJson(deckState);
    var nextRng = rng.cloneRngState(rngState);
    var selected = [];
    while (selected.length < requestedSize) {
      if (state.remaining.length === 0) {
        nextRng = refill(state, index, nextRng, selected);
      }
      var position = candidateIndex(state, index);
      if (position < 0) {
        throw new Error("Deck could not select a valid question.");
      }
      var id = state.remaining.splice(position, 1)[0];
      var meta = index.byId[id];
      selected.push(id);
      state.totalDrawn += 1;
      state.difficultyCounts[meta.difficulty] += 1;
      state.chapterCounts[meta.chapter] += 1;
    }
    return { state: state, rngState: nextRng, questionIds: selected };
  }

  function createQuiz(deckState, questions, rngState, quizId) {
    if (typeof quizId !== "string" || !ID_PATTERN.test(quizId)) {
      throw new RangeError("Quiz ID is invalid.");
    }
    var draw = drawQuiz(deckState, questions, rngState, QUIZ_SIZE);
    return {
      deckState: draw.state,
      rngState: draw.rngState,
      quiz: {
        id: quizId,
        questionIds: draw.questionIds,
        position: 0,
        answers: {},
        score: 0,
        completed: false,
      },
    };
  }

  function validateQuizState(quiz, index) {
    if (!contracts.isPlainObject(quiz) || typeof quiz.id !== "string" || !ID_PATTERN.test(quiz.id)) {
      throw new TypeError("Quiz state is invalid.");
    }
    if (!Array.isArray(quiz.questionIds) || quiz.questionIds.length !== QUIZ_SIZE || new Set(quiz.questionIds).size !== QUIZ_SIZE) {
      throw new RangeError("Quiz must contain ten unique question IDs.");
    }
    quiz.questionIds.forEach(function (id) {
      if (!Object.prototype.hasOwnProperty.call(index.byId, id)) {
        throw new RangeError("Quiz references an unknown question ID.");
      }
    });
    if (!Number.isSafeInteger(quiz.position) || quiz.position < 0 || quiz.position > QUIZ_SIZE) {
      throw new RangeError("Quiz position is invalid.");
    }
    if (!contracts.isPlainObject(quiz.answers) || !Number.isSafeInteger(quiz.score) || quiz.score < 0 || quiz.score > QUIZ_SIZE) {
      throw new RangeError("Quiz answers or score are invalid.");
    }
    var answerIds = Object.keys(quiz.answers);
    if (answerIds.length !== quiz.position) {
      throw new RangeError("Quiz answer count must equal its position.");
    }
    var computedScore = 0;
    answerIds.forEach(function (id) {
      if (quiz.questionIds.indexOf(id) < 0 || !Number.isSafeInteger(quiz.answers[id]) || quiz.answers[id] < 0 || quiz.answers[id] > 3) {
        throw new RangeError("Quiz contains an invalid answer.");
      }
      if (quiz.answers[id] === index.byId[id].answer) {
        computedScore += 1;
      }
    });
    if (computedScore !== quiz.score || quiz.completed !== (quiz.position === QUIZ_SIZE)) {
      throw new RangeError("Quiz score or completion flag is inconsistent.");
    }
    return true;
  }

  function answerQuiz(quiz, questions, selectedOption) {
    var index = createQuestionIndex(questions);
    validateQuizState(quiz, index);
    if (quiz.completed) {
      throw new RangeError("Completed quiz cannot accept another answer.");
    }
    if (!Number.isSafeInteger(selectedOption) || selectedOption < 0 || selectedOption > 3) {
      throw new RangeError("Selected option must be between zero and three.");
    }
    var next = contracts.cloneJson(quiz);
    var questionId = next.questionIds[next.position];
    next.answers[questionId] = selectedOption;
    if (selectedOption === index.byId[questionId].answer) {
      next.score += 1;
    }
    next.position += 1;
    next.completed = next.position === QUIZ_SIZE;
    return next;
  }

  return {
    DECK_SCHEMA_VERSION: DECK_SCHEMA_VERSION,
    QUIZ_SIZE: QUIZ_SIZE,
    DIFFICULTIES: DIFFICULTIES,
    createQuestionIndex: createQuestionIndex,
    createDeckState: createDeckState,
    validateDeckState: validateDeckState,
    drawQuiz: drawQuiz,
    createQuiz: createQuiz,
    validateQuizState: validateQuizState,
    answerQuiz: answerQuiz,
  };
});
