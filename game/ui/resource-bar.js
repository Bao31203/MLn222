(function (root, factory) {
  "use strict";
  var game = root.MLN222Game;
  if (!game || !game.hasModule("ui-utils")) throw new Error("Load UI utilities before resource-bar.js.");
  var api = game.registerModule("resource-bar", factory(game["ui-utils"]));
  if (typeof module === "object" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function (utils) {
  "use strict";

  function findElement(scope, id) {
    var node = typeof scope.getElementById === "function"
      ? scope.getElementById(id)
      : scope.querySelector("#" + id);
    if (!node) throw new Error("Campaign resource element is missing: " + id);
    return node;
  }

  function create(options) {
    var scope = options && options.root ? options.root : document;
    var bar = findElement(scope, "gameResourceBar");
    var fields = {
      turn: findElement(scope, "gameTurn"),
      food: findElement(scope, "gameFood"),
      coin: findElement(scope, "gameCoin"),
      civilians: findElement(scope, "gameCivilians"),
      military: findElement(scope, "gameMilitary"),
      capacity: findElement(scope, "gameCapacity"),
      actionPoints: findElement(scope, "gameActionPoints"),
    };

    function latestQuizDelta(events) {
      if (!Array.isArray(events)) return null;
      for (var index = events.length - 1; index >= 0; index -= 1) {
        var event = events[index];
        if (event && event.type === "QUIZ_REWARD_APPLIED" && event.payload && typeof event.payload === "object") return event.payload;
      }
      return null;
    }

    function renderDelta(field, value) {
      var item = field.closest(".game-resource-item");
      var current = item.querySelector(".game-resource-delta");
      if (!Number.isFinite(value) || value === 0) {
        if (current) current.remove();
        return;
      }
      if (!current) {
        current = document.createElement("small");
        current.className = "game-resource-delta";
        item.appendChild(current);
      }
      current.textContent = (value > 0 ? "+" : "") + utils.formatInteger(value);
      current.classList.toggle("is-negative", value < 0);
    }

    function render(snapshot) {
      var state = snapshot && snapshot.state;
      var player = state && state.factions ? state.factions.player : null;
      bar.classList.toggle("hidden", !player);
      if (!player) return;

      var totals = Object.keys(state.provinces || {}).reduce(function (result, provinceId) {
        var province = state.provinces[provinceId];
        if (!province || province.ownerId !== "player" || !province.population) return result;
        result.civilians += province.population.civilians;
        result.military += province.population.military;
        result.capacity += province.population.capacity;
        return result;
      }, { civilians: 0, military: 0, capacity: 0 });
      var totalActionPoints = Number.isSafeInteger(player.actionPoints) ? player.actionPoints : 0;
      var stagedActionCount = Array.isArray(snapshot.pendingActions) ? snapshot.pendingActions.length : 0;
      var remainingActionPoints = Math.max(0, totalActionPoints - stagedActionCount);

      fields.turn.textContent = utils.formatInteger(state.turn);
      fields.food.textContent = utils.formatInteger(player.resources && player.resources.food);
      fields.coin.textContent = utils.formatInteger(player.resources && player.resources.coin);
      fields.civilians.textContent = utils.formatInteger(totals.civilians);
      fields.military.textContent = utils.formatInteger(totals.military);
      fields.capacity.textContent = utils.formatInteger(totals.capacity);
      fields.actionPoints.textContent = remainingActionPoints + "/" + totalActionPoints;
      bar.classList.toggle("is-ap-empty", remainingActionPoints === 0);

      var reward = latestQuizDelta(snapshot.reportEvents);
      renderDelta(fields.food, reward && reward.resourceDeltas ? reward.resourceDeltas.food : 0);
      renderDelta(fields.coin, reward && reward.resourceDeltas ? reward.resourceDeltas.coin : 0);
      renderDelta(fields.civilians, reward ? reward.populationDelta : 0);
    }

    return { render: render, update: render };
  }

  return { create: create };
});
