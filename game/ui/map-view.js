(function (root, factory) {
  "use strict";
  var game = root.MLN222Game;
  if (!game || !game.hasModule("ui-utils")) throw new Error("Load UI utilities before map-view.js.");
  var api = game.registerModule("map-view", factory(game["ui-utils"]));
  if (typeof module === "object" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function (utils) {
  "use strict";

  var SVG_NS = "http://www.w3.org/2000/svg";
  var MAIN_VIEWBOX = Object.freeze({ x: 0, y: 0, width: 3129.7, height: 4901.01 });
  var MIN_SCALE = 1;
  var DEFAULT_SCALE = 1.1;
  var MAX_SCALE = 3;
  var BUTTON_ZOOM_STEP = 0.2;
  var WHEEL_ZOOM_STEP = 0.12;
  var OWNER_COLORS = Object.freeze(["#9b6959", "#6e7798", "#8a7b4f", "#4f7d78", "#80668b", "#58765e", "#a06f42", "#527792"]);
  var REGION_COLORS = Object.freeze({
    "bac-bo": "#66807a",
    "bac-trung-bo": "#7f7657",
    "nam-trung-bo": "#5f7890",
    "tay-nguyen": "#647957",
    "dong-nam-bo": "#8d675e",
    "tay-nam-bo": "#756b89",
  });

  function colorFor(ownerId) {
    var hash = 0;
    for (var index = 0; index < ownerId.length; index += 1) hash = (Math.imul(hash, 31) + ownerId.charCodeAt(index)) >>> 0;
    return OWNER_COLORS[hash % OWNER_COLORS.length];
  }

  function create(options) {
    var data = options.data;
    var controller = options.controller;
    var viewport = document.getElementById("gameMapViewport");
    var canvas = document.getElementById("gameMapCanvas");
    var tooltip = document.getElementById("gameMapTooltip");
    var zoomLevel = document.getElementById("gameZoomLevel");
    var zoomOutButton = document.getElementById("gameZoomOut");
    var zoomResetButton = document.getElementById("gameZoomReset");
    var zoomInButton = document.getElementById("gameZoomIn");
    var svg = canvas.querySelector("svg");
    if (!svg) throw new Error("Embedded campaign SVG is missing.");
    svg.classList.add("game-map");
    svg.setAttribute("viewBox", [MAIN_VIEWBOX.x, MAIN_VIEWBOX.y, MAIN_VIEWBOX.width, MAIN_VIEWBOX.height].join(" "));
    svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
    svg.setAttribute("aria-label", "Bản đồ 34 tỉnh thành");

    var assetOwners = Object.create(null);
    var primaryAssets = Object.create(null);
    data.provinces.provinces.forEach(function (province) {
      primaryAssets[province.svg.primary] = true;
      [province.svg.primary].concat(province.svg.islands).forEach(function (assetId) { assetOwners[assetId] = province.id; });
    });

    var groupsByProvince = Object.create(null);
    var primaryGroups = Object.create(null);
    var provinceDefinitions = Object.create(null);
    var latestSnapshot = null;
    var suppressClick = false;
    data.provinces.provinces.forEach(function (province) { provinceDefinitions[province.id] = province; });

    function registerGroup(group, provinceId) {
      if (!groupsByProvince[provinceId]) groupsByProvince[provinceId] = [];
      groupsByProvince[provinceId].push(group);
    }

    function provinceStateText(provinceId) {
      if (!latestSnapshot || !latestSnapshot.state) return "Chưa bắt đầu chiến dịch";
      var state = latestSnapshot.state;
      var province = state.provinces[provinceId];
      if (!province) return "Không có dữ liệu";
      var parts = [utils.factionName(data, province.ownerId)];
      var warning = state.effects.some(function (effect) {
        return effect.type === "attack-warning" && (effect.sourceProvinceId === provinceId || effect.targetProvinceId === provinceId);
      });
      var battle = Object.keys(state.battles).some(function (battleId) {
        var current = state.battles[battleId];
        return current.status === "active" && (current.sourceProvinceId === provinceId || current.targetProvinceId === provinceId);
      });
      if (battle) parts.push("đang giao chiến");
      else if (warning) parts.push("có cảnh báo tiến công");
      if (province.occupation) parts.push("đang chiếm đóng");
      return parts.join(" · ");
    }

    function placeTooltip(clientX, clientY) {
      var rect = viewport.getBoundingClientRect();
      var left = Math.max(8, Math.min(rect.width - 230, clientX - rect.left + 14));
      var top = Math.max(8, Math.min(rect.height - 76, clientY - rect.top + 14));
      tooltip.style.left = left + "px";
      tooltip.style.top = top + "px";
    }

    function showTooltip(provinceId, clientX, clientY) {
      tooltip.replaceChildren(
        utils.element("strong", "", utils.provinceName(data, provinceId)),
        utils.element("span", "", provinceStateText(provinceId))
      );
      tooltip.classList.remove("hidden");
      placeTooltip(clientX, clientY);
    }

    function hideTooltip() {
      tooltip.classList.add("hidden");
    }

    function dispatchMapEvent(name, detail) {
      viewport.dispatchEvent(new CustomEvent(name, { bubbles: true, detail: detail || {} }));
    }

    function requestContext(provinceId, clientX, clientY, source) {
      hideTooltip();
      dispatchMapEvent("mln222:map-context", {
        provinceId: provinceId,
        clientX: clientX,
        clientY: clientY,
        source: source,
      });
    }

    Array.from(svg.querySelectorAll(".province[data-p]")).forEach(function (group) {
      var assetId = group.getAttribute("data-p");
      var provinceId = assetOwners[assetId];
      if (!provinceId) return;
      registerGroup(group, provinceId);
      group.dataset.provinceId = provinceId;
      var isPrimary = primaryAssets[assetId] === true;
      if (isPrimary) {
        primaryGroups[provinceId] = group;
        group.setAttribute("role", "button");
        group.setAttribute("tabindex", "0");
        group.setAttribute("aria-label", utils.provinceName(data, provinceId));
      } else {
        group.setAttribute("aria-hidden", "true");
      }
      var title = document.createElementNS(SVG_NS, "title");
      title.textContent = utils.provinceName(data, provinceId);
      group.prepend(title);
      group.addEventListener("click", function () {
        if (!suppressClick) controller.selectProvince(provinceId);
      });
      group.addEventListener("contextmenu", function (event) {
        event.preventDefault();
        requestContext(provinceId, event.clientX, event.clientY, "pointer");
      });
      group.addEventListener("keydown", function (event) {
        if (isPrimary && (event.key === "ContextMenu" || (event.key === "F10" && event.shiftKey))) {
          event.preventDefault();
          var rect = group.getBoundingClientRect();
          requestContext(provinceId, rect.left + rect.width / 2, rect.top + rect.height / 2, "keyboard");
          return;
        }
        if (isPrimary && (event.key === "Enter" || event.key === " ")) {
          event.preventDefault();
          controller.selectProvince(provinceId);
        }
      });
      if (isPrimary) {
        group.addEventListener("pointerenter", function (event) { showTooltip(provinceId, event.clientX, event.clientY); });
        group.addEventListener("pointermove", function (event) { placeTooltip(event.clientX, event.clientY); });
        group.addEventListener("pointerleave", hideTooltip);
        group.addEventListener("focus", function () {
          var rect = group.getBoundingClientRect();
          showTooltip(provinceId, rect.right, rect.top + rect.height / 2);
        });
        group.addEventListener("blur", hideTooltip);
      }
    });

    var orderLayer = document.createElementNS(SVG_NS, "g");
    orderLayer.setAttribute("class", "game-map-order-layer");
    orderLayer.setAttribute("aria-hidden", "true");
    svg.appendChild(orderLayer);

    function provinceCenter(provinceId) {
      var group = primaryGroups[provinceId];
      if (!group) return null;
      var bounds = group.getBBox();
      return { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 };
    }

    function routeFor(action, state) {
      if (!action || !action.payload) return null;
      var payload = action.payload;
      if (action.type === "MOVE") return { source: payload.sourceProvinceId, target: payload.targetProvinceId, kind: "move" };
      if (action.type === "TRADE") return { source: payload.sourceProvinceId, target: payload.targetProvinceId, kind: "trade" };
      if (action.type === "WARN_ATTACK") return { source: payload.sourceProvinceId, target: payload.targetProvinceId, kind: "military" };
      if (action.type === "REINFORCE" && state && state.battles && state.battles[payload.battleId]) {
        var battle = state.battles[payload.battleId];
        return { source: battle.sourceProvinceId, target: battle.targetProvinceId, kind: "military" };
      }
      return null;
    }

    function renderOrderRoutes(snapshot) {
      orderLayer.replaceChildren();
      (snapshot.pendingActions || []).forEach(function (action, index) {
        var route = routeFor(action, snapshot.state);
        if (!route) return;
        var source = provinceCenter(route.source);
        var target = provinceCenter(route.target);
        if (!source || !target) return;
        var dx = target.x - source.x;
        var dy = target.y - source.y;
        var length = Math.max(1, Math.hypot(dx, dy));
        var bend = Math.min(170, Math.max(65, length * 0.12)) * (index % 2 === 0 ? 1 : -1);
        var controlX = (source.x + target.x) / 2 - dy / length * bend;
        var controlY = (source.y + target.y) / 2 + dx / length * bend;
        var group = document.createElementNS(SVG_NS, "g");
        group.setAttribute("class", "game-map-order is-" + route.kind);
        group.dataset.orderIndex = String(index);
        var path = document.createElementNS(SVG_NS, "path");
        path.setAttribute("d", "M " + source.x + " " + source.y + " Q " + controlX + " " + controlY + " " + target.x + " " + target.y);
        var start = document.createElementNS(SVG_NS, "circle");
        start.setAttribute("cx", String(source.x));
        start.setAttribute("cy", String(source.y));
        start.setAttribute("r", "13");
        start.setAttribute("class", "game-map-order-start");
        var end = document.createElementNS(SVG_NS, "circle");
        end.setAttribute("cx", String(target.x));
        end.setAttribute("cy", String(target.y));
        end.setAttribute("r", "22");
        end.setAttribute("class", "game-map-order-end");
        group.append(path, start, end);
        orderLayer.appendChild(group);
      });
    }

    var view = { x: 0, y: 0, scale: DEFAULT_SCALE };
    var drag = null;
    var activePointers = new Map();
    var pinch = null;
    var longPress = null;

    function cancelLongPress(pointerId) {
      if (!longPress || (pointerId !== undefined && longPress.id !== pointerId)) return;
      clearTimeout(longPress.timer);
      longPress = null;
    }

    function boundedScale(scale) {
      return Math.max(MIN_SCALE, Math.min(MAX_SCALE, Math.round(scale * 100) / 100));
    }

    function clampView() {
      var maxX = Math.max(0, viewport.clientWidth * (view.scale - 1) / 2);
      var maxY = Math.max(0, viewport.clientHeight * (view.scale - 1) / 2);
      view.x = Math.max(-maxX, Math.min(maxX, view.x));
      view.y = Math.max(-maxY, Math.min(maxY, view.y));
    }

    function applyTransform() {
      clampView();
      canvas.style.transform = "translate(" + view.x + "px," + view.y + "px) scale(" + view.scale + ")";
      var label = view.scale === MIN_SCALE ? "Fit" : Math.round(view.scale * 100) + "%";
      zoomLevel.textContent = label;
      zoomOutButton.disabled = view.scale <= MIN_SCALE;
      zoomInButton.disabled = view.scale >= MAX_SCALE;
      zoomResetButton.setAttribute("aria-label", "Vừa khung bản đồ. Mức hiện tại " + label);
    }

    function zoomTo(scale, clientX, clientY) {
      var previousScale = view.scale;
      var nextScale = boundedScale(scale);
      if (nextScale === previousScale) return;
      dispatchMapEvent("mln222:map-transform-start");
      var rect = viewport.getBoundingClientRect();
      var anchorX = Number.isFinite(clientX) ? clientX - rect.left - rect.width / 2 : 0;
      var anchorY = Number.isFinite(clientY) ? clientY - rect.top - rect.height / 2 : 0;
      var ratio = nextScale / previousScale;
      view.x = anchorX - (anchorX - view.x) * ratio;
      view.y = anchorY - (anchorY - view.y) * ratio;
      view.scale = nextScale;
      applyTransform();
    }

    function zoom(delta, clientX, clientY) {
      zoomTo(view.scale + delta, clientX, clientY);
    }

    function resetView() {
      dispatchMapEvent("mln222:map-transform-start");
      view = { x: 0, y: 0, scale: MIN_SCALE };
      applyTransform();
    }

    function focusSelected() {
      dispatchMapEvent("mln222:map-transform-start");
      var provinceId = latestSnapshot && latestSnapshot.selectedProvinceId;
      var group = provinceId ? primaryGroups[provinceId] : null;
      if (!group) { resetView(); return; }
      var box = group.getBBox();
      var centerX = box.x + box.width / 2;
      var centerY = box.y + box.height / 2;
      view.scale = 1.75;
      view.x = -(centerX - (MAIN_VIEWBOX.x + MAIN_VIEWBOX.width / 2)) / MAIN_VIEWBOX.width * viewport.clientWidth * view.scale;
      view.y = -(centerY - (MAIN_VIEWBOX.y + MAIN_VIEWBOX.height / 2)) / MAIN_VIEWBOX.height * viewport.clientHeight * view.scale;
      applyTransform();
      group.focus({ preventScroll: true });
    }

    zoomInButton.addEventListener("click", function () { zoom(BUTTON_ZOOM_STEP); });
    zoomOutButton.addEventListener("click", function () { zoom(-BUTTON_ZOOM_STEP); });
    zoomResetButton.addEventListener("click", resetView);
    document.getElementById("gameMapFocus").addEventListener("click", focusSelected);
    viewport.addEventListener("wheel", function (event) {
      event.preventDefault();
      zoom(event.deltaY < 0 ? WHEEL_ZOOM_STEP : -WHEEL_ZOOM_STEP, event.clientX, event.clientY);
    }, { passive: false });
    viewport.addEventListener("keydown", function (event) {
      if (event.key === "+" || event.key === "=") zoom(BUTTON_ZOOM_STEP);
      else if (event.key === "-" || event.key === "_") zoom(-BUTTON_ZOOM_STEP);
      else if (event.key === "0") resetView();
      else return;
      event.preventDefault();
    });

    function beginPinch() {
      cancelLongPress();
      var points = Array.from(activePointers.values()).slice(0, 2);
      if (points.length < 2) return;
      var dx = points[1].x - points[0].x;
      var dy = points[1].y - points[0].y;
      var distance = Math.hypot(dx, dy);
      if (distance < 1) return;
      var rect = viewport.getBoundingClientRect();
      var centerX = (points[0].x + points[1].x) / 2 - rect.left - rect.width / 2;
      var centerY = (points[0].y + points[1].y) / 2 - rect.top - rect.height / 2;
      pinch = {
        startDistance: distance,
        startScale: view.scale,
        mapX: (centerX - view.x) / view.scale,
        mapY: (centerY - view.y) / view.scale,
      };
      activePointers.forEach(function (_point, pointerId) {
        try { viewport.setPointerCapture(pointerId); } catch (_caught) { /* Synthetic or ended pointers need no capture. */ }
      });
      drag = null;
      viewport.classList.add("dragging");
      hideTooltip();
      dispatchMapEvent("mln222:map-transform-start");
    }

    viewport.addEventListener("pointerdown", function (event) {
      if (event.pointerType === "mouse" && event.button !== 0) return;
      activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      if (activePointers.size >= 2) {
        beginPinch();
        return;
      }
      drag = { id: event.pointerId, startX: event.clientX, startY: event.clientY, originX: view.x, originY: view.y, moved: false };
      if (event.pointerType === "touch" && event.target instanceof Element) {
        var provinceGroup = event.target.closest(".province[data-province-id]");
        if (provinceGroup) {
          longPress = {
            id: event.pointerId,
            startX: event.clientX,
            startY: event.clientY,
            fired: false,
            timer: setTimeout(function () {
              if (!longPress || longPress.id !== event.pointerId || !activePointers.has(event.pointerId)) return;
              longPress.fired = true;
              suppressClick = true;
              drag = null;
              viewport.classList.remove("dragging");
              requestContext(provinceGroup.dataset.provinceId, event.clientX, event.clientY, "touch");
            }, 520),
          };
        }
      }
    });
    viewport.addEventListener("pointermove", function (event) {
      if (activePointers.has(event.pointerId)) activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      if (longPress && longPress.id === event.pointerId && Math.abs(event.clientX - longPress.startX) + Math.abs(event.clientY - longPress.startY) > 10) cancelLongPress(event.pointerId);
      if (pinch && activePointers.size >= 2) {
        var points = Array.from(activePointers.values()).slice(0, 2);
        var dx = points[1].x - points[0].x;
        var dy = points[1].y - points[0].y;
        var distance = Math.hypot(dx, dy);
        var rect = viewport.getBoundingClientRect();
        var centerX = (points[0].x + points[1].x) / 2 - rect.left - rect.width / 2;
        var centerY = (points[0].y + points[1].y) / 2 - rect.top - rect.height / 2;
        view.scale = boundedScale(pinch.startScale * distance / pinch.startDistance);
        view.x = centerX - pinch.mapX * view.scale;
        view.y = centerY - pinch.mapY * view.scale;
        suppressClick = true;
        applyTransform();
        return;
      }
      if (!drag || drag.id !== event.pointerId) return;
      var dx = event.clientX - drag.startX;
      var dy = event.clientY - drag.startY;
      if (Math.abs(dx) + Math.abs(dy) > 7 && !drag.moved) {
        drag.moved = true;
        cancelLongPress(event.pointerId);
        viewport.setPointerCapture(event.pointerId);
        viewport.classList.add("dragging");
        hideTooltip();
        dispatchMapEvent("mln222:map-transform-start");
      }
      if (!drag.moved) return;
      view.x = drag.originX + dx;
      view.y = drag.originY + dy;
      applyTransform();
    });
    function endDrag(event) {
      if (!drag || drag.id !== event.pointerId) return;
      suppressClick = drag.moved;
      drag = null;
      viewport.classList.remove("dragging");
      setTimeout(function () { suppressClick = false; }, 0);
    }
    function finishPointer(event) {
      var longPressFired = Boolean(longPress && longPress.id === event.pointerId && longPress.fired);
      cancelLongPress(event.pointerId);
      activePointers.delete(event.pointerId);
      if (!pinch) {
        endDrag(event);
        if (longPressFired) {
          suppressClick = true;
          setTimeout(function () { suppressClick = false; }, 0);
        }
        return;
      }
      suppressClick = true;
      pinch = null;
      if (activePointers.size >= 2) beginPinch();
      else if (activePointers.size === 1) {
        var remaining = Array.from(activePointers.entries())[0];
        drag = { id: remaining[0], startX: remaining[1].x, startY: remaining[1].y, originX: view.x, originY: view.y, moved: true };
      } else {
        drag = null;
        viewport.classList.remove("dragging");
      }
      setTimeout(function () { suppressClick = false; }, 0);
    }
    viewport.addEventListener("pointerup", finishPointer);
    viewport.addEventListener("pointercancel", finishPointer);

    function update(snapshot) {
      latestSnapshot = snapshot;
      var state = snapshot.state;
      var warningProvinces = new Set();
      var battleProvinces = new Set();
      if (state) {
        state.effects.filter(function (effect) { return effect.type === "attack-warning"; }).forEach(function (effect) {
          warningProvinces.add(effect.sourceProvinceId);
          warningProvinces.add(effect.targetProvinceId);
        });
        Object.keys(state.battles).forEach(function (battleId) {
          var battle = state.battles[battleId];
          if (battle.status === "active") {
            battleProvinces.add(battle.sourceProvinceId);
            battleProvinces.add(battle.targetProvinceId);
          }
        });
      }
      Object.keys(groupsByProvince).forEach(function (provinceId) {
        var provinceState = state ? state.provinces[provinceId] : null;
        var ownerId = provinceState ? provinceState.ownerId : "neutral-" + provinceId;
        var relation = state && ownerId !== "player" ? state.factions.player.relations[ownerId] : null;
        var label = utils.provinceName(data, provinceId) + " · " + provinceStateText(provinceId);
        groupsByProvince[provinceId].forEach(function (group) {
          group.dataset.ownerId = ownerId;
          group.classList.toggle("is-player", ownerId === "player");
          group.classList.toggle("is-allied", !!relation && relation.status === "alliance");
          group.classList.toggle("is-selected", snapshot.selectedProvinceId === provinceId);
          group.classList.toggle("has-warning", warningProvinces.has(provinceId));
          group.classList.toggle("has-battle", battleProvinces.has(provinceId));
          group.classList.toggle("is-occupied", !!provinceState && provinceState.occupation !== null);
          var setupColor = REGION_COLORS[(provinceDefinitions[provinceId] || {}).region] || "#68766f";
          group.style.setProperty("--province-fill", ownerId === "player" ? "var(--jade)" : relation && relation.status === "alliance" ? "var(--river)" : state ? colorFor(ownerId) : setupColor);
          if (primaryAssets[group.getAttribute("data-p")] === true) {
            group.setAttribute("aria-pressed", String(snapshot.selectedProvinceId === provinceId));
            group.setAttribute("aria-label", label);
          }
        });
      });
      renderOrderRoutes(snapshot);
      document.getElementById("gameMapHint").textContent = utils.provinceName(data, snapshot.selectedProvinceId);
    }

    var resizeObserver = typeof ResizeObserver === "function" ? new ResizeObserver(function () { applyTransform(); }) : null;
    if (resizeObserver) resizeObserver.observe(viewport);
    else globalThis.addEventListener("resize", applyTransform);

    applyTransform();
    return {
      update: update,
      resetView: resetView,
      focusSelected: focusSelected,
      activate: function () { applyTransform(); },
      presentationBounds: function () { return { main: MAIN_VIEWBOX, islandsInline: true }; },
    };
  }

  return { create: create };
});
