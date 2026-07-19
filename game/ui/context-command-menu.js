(function (root, factory) {
  "use strict";
  var game = root.MLN222Game;
  if (!game || !game.hasModule("ui-utils") || !game.hasModule("context-action-model")) {
    throw new Error("Load context action dependencies before context-command-menu.js.");
  }
  var api = game.registerModule("context-command-menu", factory(game["ui-utils"], game["context-action-model"]));
  if (typeof module === "object" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function (utils, actionModel) {
  "use strict";

  function create(options) {
    var data = options.data;
    var controller = options.controller;
    var reportError = typeof options.onError === "function" ? options.onError : function () {};
    var gameRoot = document.getElementById("gameRoot");
    var viewport = document.getElementById("gameMapViewport");
    var menu = document.getElementById("gameContextMenu");
    var sheet = document.getElementById("gameContextActionSheet");
    var targetButton = document.getElementById("gameTargetActionBtn");
    var targetName = document.getElementById("gameContextTargetName");
    var targetOwner = document.getElementById("gameContextTargetOwner");
    var sheetTitle = document.getElementById("gameContextSheetTitle");
    var sheetMeta = document.getElementById("gameContextSheetMeta");
    var actionList = document.getElementById("gameContextActionList");
    var confirmButton = document.getElementById("gameContextConfirm");
    var backButton = document.getElementById("gameContextBack");
    var closeButton = document.getElementById("gameContextClose");
    var groupButtons = Array.from(menu.querySelectorAll("[data-context-group]"));
    var latestSnapshot = null;
    var currentModel = null;
    var targetProvinceId = null;
    var activeGroupId = null;
    var selectedItem = null;
    var priorFocus = null;
    var anchor = { left: 8, top: 8 };

    function isVisible(node) {
      return !node.classList.contains("hidden");
    }

    function isOpen() {
      return isVisible(menu) || isVisible(sheet);
    }

    function findGroup(groupId) {
      return currentModel && currentModel.groups.find(function (group) { return group.id === groupId; }) || null;
    }

    function close(restoreFocus) {
      if (!isOpen()) return;
      menu.classList.add("hidden");
      menu.setAttribute("aria-hidden", "true");
      sheet.classList.add("hidden");
      sheet.setAttribute("aria-hidden", "true");
      activeGroupId = null;
      selectedItem = null;
      currentModel = null;
      targetProvinceId = null;
      if (restoreFocus !== false && priorFocus && typeof priorFocus.focus === "function" && document.contains(priorFocus)) {
        priorFocus.focus({ preventScroll: true });
      }
      priorFocus = null;
    }

    function menuPosition(clientX, clientY) {
      var rect = viewport.getBoundingClientRect();
      var size = 236;
      var desiredLeft = Number.isFinite(clientX) ? clientX - rect.left - size / 2 : rect.width / 2 - size / 2;
      var desiredTop = Number.isFinite(clientY) ? clientY - rect.top - size / 2 : rect.height / 2 - size / 2;
      anchor.left = Math.max(8, Math.min(rect.width - size - 8, desiredLeft));
      anchor.top = Math.max(8, Math.min(rect.height - size - 8, desiredTop));
      menu.style.left = anchor.left + "px";
      menu.style.top = anchor.top + "px";
    }

    function sheetPosition() {
      var rect = viewport.getBoundingClientRect();
      var width = Math.min(352, Math.max(280, rect.width - 16));
      var rightCandidate = anchor.left + 246;
      var left = rightCandidate + width + 8 <= rect.width ? rightCandidate : anchor.left - width - 10;
      left = Math.max(8, Math.min(rect.width - width - 8, left));
      var top = Math.max(8, Math.min(rect.height - 360, anchor.top));
      sheet.style.left = left + "px";
      sheet.style.top = top + "px";
      sheet.style.width = width + "px";
    }

    function renderGroupButtons() {
      groupButtons.forEach(function (button) {
        var group = findGroup(button.dataset.contextGroup);
        var count = button.querySelector(".game-context-count");
        var available = Boolean(group && group.available);
        button.dataset.available = String(available);
        button.removeAttribute("aria-disabled");
        button.title = available
          ? group.label + (group.actions.length ? " · " + group.actions.length + " lựa chọn" : "")
          : group.label + " · " + group.reason;
        button.setAttribute("aria-label", button.title);
        if (count) {
          count.textContent = group && group.actions.length ? String(group.actions.length) : "";
          count.classList.toggle("hidden", !group || group.actions.length === 0);
        }
      });
      targetName.textContent = currentModel.target.provinceName;
      targetOwner.textContent = currentModel.target.ownerName;
    }

    function buildModel(provinceId) {
      var legalActions = [];
      try { legalActions = controller.legalActions(); } catch (caught) { reportError(caught); }
      return actionModel.build({
        data: data,
        snapshot: controller.snapshot(),
        provinceId: provinceId,
        legalActions: legalActions,
      });
    }

    function open(detail) {
      var provinceId = detail && detail.provinceId;
      if (!provinceId) return false;
      var before = controller.snapshot();
      if (!before.state || !before.state.provinces[provinceId]) {
        close(false);
        return false;
      }
      controller.selectProvince(provinceId);
      var snapshot = controller.snapshot();
      var province = snapshot.state.provinces[provinceId];
      if (!province || province.ownerId === "player") {
        close(false);
        controller.setActivePanel("province");
        return false;
      }
      close(false);
      priorFocus = document.activeElement;
      targetProvinceId = provinceId;
      currentModel = buildModel(provinceId);
      renderGroupButtons();
      menuPosition(detail.clientX, detail.clientY);
      menu.dataset.source = detail.source || "pointer";
      menu.classList.remove("hidden");
      menu.setAttribute("aria-hidden", "false");
      sheet.classList.add("hidden");
      sheet.setAttribute("aria-hidden", "true");
      var first = groupButtons[0];
      if (first && (detail.source === "keyboard" || detail.source === "button")) first.focus({ preventScroll: true });
      return true;
    }

    function setSelected(item, button) {
      selectedItem = item;
      Array.from(actionList.querySelectorAll(".game-context-action-option")).forEach(function (option) {
        var selected = option === button;
        option.classList.toggle("is-selected", selected);
        option.setAttribute("aria-pressed", String(selected));
      });
      confirmButton.disabled = false;
      confirmButton.textContent = item.kind === "navigation" ? "Mở bảng thông tin" : "Xác nhận lệnh";
    }

    function renderActionSheet(group) {
      sheetTitle.textContent = group.label + " · " + currentModel.target.provinceName;
      sheetMeta.textContent = currentModel.target.ownerName + " · " + currentModel.target.relationLabel;
      actionList.replaceChildren();
      selectedItem = null;
      confirmButton.disabled = true;
      confirmButton.textContent = group.available ? "Chọn một phương án" : "Không có lệnh hợp lệ";
      if (!group.available) {
        actionList.appendChild(utils.status("disabled", "Chưa thể thực hiện", group.reason));
        return;
      }
      group.actions.forEach(function (item) {
        var button = utils.element("button", "game-context-action-option");
        button.type = "button";
        button.setAttribute("aria-pressed", "false");
        button.appendChild(utils.icon(group.icon));
        var copy = utils.element("span", "game-context-action-copy");
        copy.appendChild(utils.element("strong", "", item.label));
        copy.appendChild(utils.element("small", "", item.detail));
        button.appendChild(copy);
        button.addEventListener("click", function () { setSelected(item, button); });
        actionList.appendChild(button);
      });
    }

    function openGroup(groupId) {
      var group = findGroup(groupId);
      if (!group) return;
      activeGroupId = groupId;
      renderActionSheet(group);
      menu.classList.add("hidden");
      menu.setAttribute("aria-hidden", "true");
      sheetPosition();
      sheet.classList.remove("hidden");
      sheet.setAttribute("aria-hidden", "false");
      var focusTarget = actionList.querySelector("button") || closeButton;
      focusTarget.focus({ preventScroll: true });
    }

    function returnToWheel() {
      if (!currentModel) return;
      sheet.classList.add("hidden");
      sheet.setAttribute("aria-hidden", "true");
      menu.classList.remove("hidden");
      menu.setAttribute("aria-hidden", "false");
      var active = groupButtons.find(function (button) { return button.dataset.contextGroup === activeGroupId; }) || groupButtons[0];
      if (active) active.focus({ preventScroll: true });
      activeGroupId = null;
      selectedItem = null;
    }

    groupButtons.forEach(function (button) {
      button.addEventListener("click", function () { openGroup(button.dataset.contextGroup); });
    });
    backButton.addEventListener("click", returnToWheel);
    closeButton.addEventListener("click", function () { close(true); });
    confirmButton.addEventListener("click", function () {
      if (!selectedItem) return;
      try {
        if (selectedItem.kind === "navigation") {
          controller.selectProvince(targetProvinceId);
          controller.setActivePanel("province");
          gameRoot.dispatchEvent(new CustomEvent("mln222:open-campaign-sheet", { bubbles: true, detail: { panel: "province" } }));
        } else {
          controller.stageAction(utils.clone(selectedItem.action));
          var group = findGroup(activeGroupId);
          if (group) controller.setActivePanel(group.panel);
        }
        close(false);
      } catch (caught) {
        reportError(caught);
        currentModel = buildModel(targetProvinceId);
        var refreshed = findGroup(activeGroupId);
        if (refreshed) renderActionSheet(refreshed);
      }
    });

    viewport.addEventListener("mln222:map-context", function (event) { open(event.detail || {}); });
    viewport.addEventListener("mln222:map-transform-start", function () { close(false); });
    targetButton.addEventListener("click", function () {
      var rect = viewport.getBoundingClientRect();
      open({
        provinceId: latestSnapshot && latestSnapshot.selectedProvinceId,
        clientX: rect.left + rect.width / 2,
        clientY: rect.top + rect.height / 2,
        source: "button",
      });
    });
    document.addEventListener("pointerdown", function (event) {
      if (!isOpen() || menu.contains(event.target) || sheet.contains(event.target) || targetButton.contains(event.target)) return;
      close(false);
    }, true);
    document.addEventListener("keydown", function (event) {
      if (!isOpen()) return;
      if (event.key === "Escape") {
        event.preventDefault();
        if (isVisible(sheet)) returnToWheel();
        else close(true);
        return;
      }
      if (!isVisible(menu) || ["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp", "Home", "End"].indexOf(event.key) === -1) return;
      event.preventDefault();
      var index = Math.max(0, groupButtons.indexOf(document.activeElement));
      if (event.key === "Home") index = 0;
      else if (event.key === "End") index = groupButtons.length - 1;
      else index = (index + ((event.key === "ArrowRight" || event.key === "ArrowDown") ? 1 : -1) + groupButtons.length) % groupButtons.length;
      groupButtons[index].focus({ preventScroll: true });
    });
    document.addEventListener("mln222:mode-change", function (event) {
      if (!event.detail || event.detail.mode !== "game") close(false);
    });
    globalThis.addEventListener("resize", function () { close(false); });

    function render(snapshot) {
      latestSnapshot = snapshot;
      var state = snapshot.state;
      var selected = state && state.provinces[snapshot.selectedProvinceId];
      var foreign = Boolean(selected && selected.ownerId !== "player");
      targetButton.classList.toggle("hidden", !foreign);
      targetButton.disabled = !foreign;
      targetButton.setAttribute("aria-label", foreign ? "Mở hành động với " + utils.provinceName(data, snapshot.selectedProvinceId) : "Chọn tỉnh của thế lực khác để mở hành động");
      if (!isOpen()) return;
      if (!state || !state.provinces[targetProvinceId] || state.provinces[targetProvinceId].ownerId === "player" || (state.quiz && state.quiz.active)) {
        close(false);
        return;
      }
      currentModel = buildModel(targetProvinceId);
      renderGroupButtons();
      if (isVisible(sheet) && activeGroupId) {
        var group = findGroup(activeGroupId);
        if (group) renderActionSheet(group);
      }
    }

    return { render: render, open: open, close: close };
  }

  return { create: create };
});
