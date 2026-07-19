(function (root, factory) {
  "use strict";
  var game = root.MLN222Game;
  if (!game || !game.hasModule("ui-utils") || !game.hasModule("context-action-model")) throw new Error("Load action formatters before order-tray.js.");
  var api = game.registerModule("order-tray", factory(game["ui-utils"], game["context-action-model"]));
  if (typeof module === "object" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function (utils, actionModel) {
  "use strict";

  function create(options) {
    var data = options.data;
    var controller = options.controller;
    var onError = typeof options.onError === "function" ? options.onError : function () {};
    var tray = document.getElementById("gameOrderTray");

    function remove(index) {
      try { controller.removePendingAction(index); }
      catch (caught) { onError(caught); }
    }

    function render(snapshot) {
      var actions = Array.isArray(snapshot.pendingActions) ? snapshot.pendingActions : [];
      tray.replaceChildren();
      tray.classList.toggle("hidden", actions.length === 0);
      tray.setAttribute("aria-label", actions.length + " lệnh đang chờ");
      if (!snapshot.state || actions.length === 0) return;
      actions.forEach(function (action, index) {
        var description = actionModel.describeAction(data, snapshot.state, action);
        var chip = utils.element("div", "game-order-chip");
        chip.setAttribute("role", "listitem");
        chip.appendChild(utils.element("span", "game-order-index", String(index + 1)));
        var copy = utils.element("span", "game-order-copy");
        copy.appendChild(utils.element("strong", "", description.label));
        copy.appendChild(utils.element("small", "", description.detail));
        chip.appendChild(copy);
        var button = utils.element("button", "game-order-remove");
        button.type = "button";
        button.title = "Bỏ lệnh " + description.label;
        button.setAttribute("aria-label", button.title);
        button.appendChild(utils.icon("x"));
        button.addEventListener("click", function () { remove(index); });
        chip.appendChild(button);
        tray.appendChild(chip);
      });
    }

    return { render: render };
  }

  return { create: create };
});
