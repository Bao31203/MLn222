(function (root, factory) {
  "use strict";
  var game = root.MLN222Game;
  var required = ["contracts", "ui-utils", "question-deck"];
  if (!game || required.some(function (name) { return !game.hasModule(name); })) throw new Error("Load question deck and UI utilities before game-quiz-view.js.");
  var api = game.registerModule("game-quiz-view", factory(game, root));
  if (typeof module === "object" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function (game, root) {
  "use strict";

  var contracts = game.contracts;
  var utils = game["ui-utils"];
  var questionDeck = game["question-deck"];
  var LETTERS = Object.freeze(["A", "B", "C", "D"]);

  function requireElement(id) {
    var node = document.getElementById(id);
    if (!node) throw new Error("Quiz template element is missing: " + id);
    return node;
  }

  function sourceText(question) {
    if (!contracts.isPlainObject(question.source)) return "";
    var source = question.source;
    var parts = [];
    if (typeof source.file === "string" && source.file) parts.push(source.file);
    if (Number.isSafeInteger(source.page)) parts.push("trang " + source.page);
    if (contracts.isPlainObject(source.slide) && Number.isSafeInteger(source.slide.number)) parts.push("slide " + source.slide.number);
    return parts.join(" · ");
  }

  function questionMeta(question, score, answered) {
    var parts = [];
    if (typeof question.chapter === "string" && question.chapter) parts.push(question.chapter);
    else if (Number.isSafeInteger(question.chapterNum)) parts.push("Chương " + question.chapterNum);
    if (typeof question.difficulty === "string" && question.difficulty) parts.push(question.difficulty);
    if (typeof question.topic === "string" && question.topic) parts.push(question.topic);
    parts.push("Điểm " + score + "/" + answered);
    return parts.join(" · ");
  }

  function create(options) {
    if (!contracts.isPlainObject(options) || !options.controller) throw new TypeError("Game quiz view options are invalid.");
    var controller = options.controller;
    var onError = typeof options.onError === "function" ? options.onError : null;
    var questions = Array.isArray(options.questions) ? options.questions : root.MLN222_QUESTIONS;
    if (!Array.isArray(questions)) throw new TypeError("Game quiz question bank is missing.");
    questionDeck.createQuestionIndex(questions);
    var questionsById = Object.create(null);
    questions.forEach(function (question) { questionsById[question.id] = question; });

    var overlay = options.root || requireElement("gameQuizOverlay");
    var progress = requireElement("gameQuizProgress");
    var bar = requireElement("gameQuizBar");
    var meta = requireElement("gameQuizMeta");
    var questionNode = requireElement("gameQuizQuestion");
    var optionsNode = requireElement("gameQuizOptions");
    var feedback = requireElement("gameQuizFeedback");
    var explanation = requireElement("gameQuizExplanation");
    var result = requireElement("gameQuizResult");
    var nextButton = requireElement("gameQuizNextBtn");
    feedback.setAttribute("tabindex", "-1");

    var nextAction = null;
    var displayKey = "hidden";
    var previousFocus = null;
    var main = document.getElementById("main");
    var backgroundNodes = Array.from(main.children).filter(function (node) { return node !== overlay.parentElement; })
      .concat(Array.from(overlay.parentElement.children).filter(function (node) { return node !== overlay; }));
    var skipLink = document.querySelector(".skip-link");
    if (skipLink) backgroundNodes.push(skipLink);

    function setBackgroundInert(inert) {
      backgroundNodes.forEach(function (node) { node.inert = inert; });
    }

    function setVisible(visible) {
      var wasVisible = !overlay.classList.contains("hidden");
      if (visible === wasVisible) return;
      if (visible) {
        previousFocus = document.activeElement;
        setBackgroundInert(true);
      } else {
        setBackgroundInert(false);
      }
      overlay.classList.toggle("hidden", !visible);
      overlay.setAttribute("aria-hidden", String(!visible));
      if (!visible && previousFocus && previousFocus.isConnected && typeof previousFocus.focus === "function") previousFocus.focus();
      if (!visible) previousFocus = null;
    }

    function hideExplanation() {
      utils.clear(explanation);
      explanation.classList.add("hidden");
    }

    function hideResult() {
      utils.clear(result);
      result.classList.add("hidden");
    }

    function showResult(quiz, choice) {
      var choiceLabels = { food: "lương thực", coin: "tiền tệ", population: "dân số", unlock: "mở khóa binh chủng" };
      var outcome = quiz.score > 5 ? "Phần thưởng" : "Mức phạt";
      utils.clear(result);
      result.appendChild(utils.status(
        quiz.score > 5 ? "success" : "warning",
        outcome + " sẽ được áp dụng khi hoàn tất lượt",
        "Ưu tiên đã chọn: " + (choiceLabels[choice] || "lương thực") + ". Số liệu thực tế sẽ xuất hiện trong Báo cáo lượt."
      ));
      result.classList.remove("hidden");
    }

    function showExplanation(question) {
      utils.clear(explanation);
      explanation.appendChild(utils.element("p", "", question.explanation || "Chưa có phần giải thích cho câu này."));
      var source = sourceText(question);
      if (source) explanation.appendChild(utils.element("div", "game-quiz-meta", "Nguồn: " + source));
      explanation.classList.remove("hidden");
    }

    function updateProgress(position, labelPosition) {
      progress.textContent = labelPosition + "/" + questionDeck.QUIZ_SIZE;
      bar.style.width = Math.round(position / questionDeck.QUIZ_SIZE * 100) + "%";
    }

    function renderOptions(question, selectedOption, reviewing) {
      utils.clear(optionsNode);
      question.options.forEach(function (option, index) {
        var button = utils.element("button", "game-quiz-option");
        button.type = "button";
        button.appendChild(utils.element("span", "game-quiz-option-copy", LETTERS[index] + ". " + option));
        if (reviewing) {
          button.disabled = true;
          button.classList.toggle("correct", index === question.answer);
          button.classList.toggle("wrong", index === selectedOption && index !== question.answer);
          button.setAttribute("aria-pressed", String(index === selectedOption));
          if (index === question.answer) {
            button.prepend(utils.icon("circle-check", "game-quiz-state-icon"));
            button.appendChild(utils.element("span", "game-quiz-option-state", "Đáp án đúng"));
            button.setAttribute("aria-label", LETTERS[index] + ". " + option + ". Đáp án đúng.");
          } else if (index === selectedOption) {
            button.prepend(utils.icon("triangle-alert", "game-quiz-state-icon"));
            button.appendChild(utils.element("span", "game-quiz-option-state", "Bạn đã chọn"));
            button.setAttribute("aria-label", LETTERS[index] + ". " + option + ". Bạn đã chọn, chưa chính xác.");
          }
        } else {
          button.addEventListener("click", function () {
            try {
              controller.answerQuiz(index);
            } catch (caught) {
              if (onError) onError(caught);
              else throw caught;
            }
          });
        }
        optionsNode.appendChild(button);
      });
    }

    function renderQuestion(quiz, question, position) {
      var key = quiz.id + ":question:" + question.id;
      updateProgress(quiz.position, position + 1);
      meta.textContent = questionMeta(question, quiz.score, quiz.position);
      questionNode.textContent = question.stem;
      feedback.textContent = "";
      feedback.className = "game-quiz-feedback";
      hideExplanation();
      hideResult();
      renderOptions(question, null, false);
      nextButton.classList.add("hidden");
      nextAction = null;
      if (displayKey !== key) questionNode.focus();
      displayKey = key;
    }

    function renderReview(quiz, question, position, choice) {
      var selectedOption = quiz.answers[question.id];
      var correct = selectedOption === question.answer;
      var key = quiz.id + ":review:" + question.id;
      updateProgress(quiz.position, position + 1);
      meta.textContent = questionMeta(question, quiz.score, quiz.position);
      questionNode.textContent = question.stem;
      renderOptions(question, selectedOption, true);
      feedback.textContent = correct
        ? "Chính xác. Điểm hiện tại: " + quiz.score + "/" + quiz.position + "."
        : "Chưa đúng. Đáp án đúng là " + LETTERS[question.answer] + ". Điểm hiện tại: " + quiz.score + "/" + quiz.position + ".";
      feedback.className = "game-quiz-feedback " + (correct ? "is-success" : "is-danger");
      showExplanation(question);
      if (quiz.completed) showResult(quiz, choice);
      else hideResult();
      nextButton.textContent = quiz.completed ? "Hoàn tất lượt" : "Câu tiếp theo";
      nextButton.classList.remove("hidden");
      nextAction = quiz.completed ? function () {
        try {
          controller.completeQuiz();
        } catch (caught) {
          if (onError) onError(caught);
          else throw caught;
        }
      } : function () {
        controller.continueQuizReview();
      };
      if (displayKey !== key) feedback.focus();
      displayKey = key;
    }

    function renderCompleted(quiz, choice) {
      var key = quiz.id + ":completed";
      updateProgress(questionDeck.QUIZ_SIZE, questionDeck.QUIZ_SIZE);
      meta.textContent = "Kết quả thử thách cuối lượt";
      questionNode.textContent = "Bạn đã hoàn thành đủ 10 câu.";
      utils.clear(optionsNode);
      feedback.textContent = "Điểm: " + quiz.score + "/" + questionDeck.QUIZ_SIZE + ".";
      feedback.className = "game-quiz-feedback is-success";
      hideExplanation();
      showResult(quiz, choice);
      nextButton.textContent = "Hoàn tất lượt";
      nextButton.classList.remove("hidden");
      nextAction = function () {
        try {
          controller.completeQuiz();
        } catch (caught) {
          if (onError) onError(caught);
          else throw caught;
        }
      };
      if (displayKey !== key) questionNode.focus();
      displayKey = key;
    }

    function renderMissingQuestion(quiz) {
      updateProgress(quiz.position, Math.min(questionDeck.QUIZ_SIZE, quiz.position + 1));
      meta.textContent = "Không thể tải câu hỏi";
      questionNode.textContent = "Dữ liệu câu hỏi của lượt này không còn khả dụng.";
      utils.clear(optionsNode);
      feedback.textContent = "Hãy khôi phục lại bản dữ liệu câu hỏi ban đầu.";
      feedback.className = "game-quiz-feedback is-danger";
      hideExplanation();
      hideResult();
      nextButton.classList.add("hidden");
      nextAction = null;
      displayKey = quiz.id + ":missing";
    }

    function render(snapshot) {
      var quiz = snapshot && snapshot.state && snapshot.state.quiz ? snapshot.state.quiz.active : null;
      if (!quiz) {
        setVisible(false);
        nextAction = null;
        displayKey = "hidden";
        return;
      }

      setVisible(true);
      var reviewQuestionId = snapshot.quizReviewQuestionId;
      var reviewPosition = reviewQuestionId === null ? -1 : quiz.questionIds.indexOf(reviewQuestionId);
      if (reviewPosition !== quiz.position - 1 || !Object.prototype.hasOwnProperty.call(quiz.answers, reviewQuestionId)) {
        reviewPosition = -1;
      }

      if (reviewPosition >= 0) {
        var reviewedQuestion = questionsById[reviewQuestionId];
        if (reviewedQuestion) renderReview(quiz, reviewedQuestion, reviewPosition, snapshot.quizChoice);
        else renderMissingQuestion(quiz);
        return;
      }
      if (quiz.completed) {
        renderCompleted(quiz, snapshot.quizChoice);
        return;
      }
      var questionId = quiz.questionIds[quiz.position];
      var question = questionsById[questionId];
      if (question) renderQuestion(quiz, question, quiz.position);
      else renderMissingQuestion(quiz);
    }

    nextButton.addEventListener("click", function () {
      if (nextAction) nextAction();
    });
    overlay.addEventListener("keydown", function (event) {
      if (event.key !== "Tab") return;
      var focusable = Array.from(overlay.querySelectorAll('button:not([disabled]), input:not([disabled]), select:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'))
        .filter(function (node) { return node.getClientRects().length > 0; });
      if (focusable.length === 0) {
        event.preventDefault();
        overlay.focus();
        return;
      }
      var first = focusable[0];
      var last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });

    return { render: render };
  }

  return { create: create };
});
