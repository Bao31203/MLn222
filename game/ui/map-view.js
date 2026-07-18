(function (root, factory) {
  "use strict";
  var game = root.MLN222Game;
  if (!game || !game.hasModule("ui-utils")) throw new Error("Load UI utilities before map-view.js.");
  var api = game.registerModule("map-view", factory(game["ui-utils"]));
  if (typeof module === "object" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function (utils) {
  "use strict";

  var SVG_NS = "http://www.w3.org/2000/svg";
  var MAIN_VIEWBOX = Object.freeze({ x: 0, y: 0, width: 2380, height: 4901.01 });
  var INSET_SPECS = Object.freeze([
    Object.freeze({ assetId: "quan-dao-hoang-sa", label: "Hoàng Sa", fallback: Object.freeze({ x: 2486, y: 1933, width: 428, height: 311 }) }),
    Object.freeze({ assetId: "quan-dao-truong-sa", label: "Trường Sa", fallback: Object.freeze({ x: 2335, y: 4521, width: 492, height: 238 }) }),
  ]);
  var MIN_SCALE = 1;
  var DEFAULT_SCALE = 1.1;
  var MAX_SCALE = 3;
  var BUTTON_ZOOM_STEP = 0.2;
  var WHEEL_ZOOM_STEP = 0.12;
  var OWNER_COLORS = Object.freeze(["#8b6f47", "#786c91", "#9a625b", "#587d86", "#817a4c", "#6f7f59", "#8a5f78", "#536d9a"]);

  function colorFor(ownerId) {
    var hash = 0;
    for (var index = 0; index < ownerId.length; index += 1) hash = (Math.imul(hash, 31) + ownerId.charCodeAt(index)) >>> 0;
    return OWNER_COLORS[hash % OWNER_COLORS.length];
  }

  function paddedBox(group, fallback) {
    try {
      var measured = group.getBBox();
      if (measured.width > 0 && measured.height > 0) {
        var padding = Math.max(measured.width, measured.height) * 0.12;
        return { x: measured.x - padding, y: measured.y - padding, width: measured.width + padding * 2, height: measured.height + padding * 2 };
      }
    } catch (_caught) { /* Deterministic presentation fallback below. */ }
    var fallbackPadding = Math.max(fallback.width, fallback.height) * 0.12;
    return {
      x: fallback.x - fallbackPadding,
      y: fallback.y - fallbackPadding,
      width: fallback.width + fallbackPadding * 2,
      height: fallback.height + fallbackPadding * 2,
    };
  }

  function stripCloneIds(node) {
    if (node.nodeType !== 1) return;
    node.removeAttribute("id");
    node.removeAttribute("role");
    node.removeAttribute("tabindex");
    node.removeAttribute("aria-label");
    node.removeAttribute("aria-pressed");
    Array.from(node.children).forEach(stripCloneIds);
  }

  function create(options) {
    var data = options.data;
    var controller = options.controller;
    var viewport = document.getElementById("gameMapViewport");
    var canvas = document.getElementById("gameMapCanvas");
    var insetHost = document.getElementById("gameMapInsets");
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
    var groupsByAsset = Object.create(null);
    var latestSnapshot = null;
    var suppressClick = false;

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

    Array.from(svg.querySelectorAll(".province[data-p]")).forEach(function (group) {
      var assetId = group.getAttribute("data-p");
      var provinceId = assetOwners[assetId];
      if (!provinceId) return;
      groupsByAsset[assetId] = group;
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
      group.addEventListener("keydown", function (event) {
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

    INSET_SPECS.forEach(function (spec) {
      var source = groupsByAsset[spec.assetId];
      if (!source) return;
      var provinceId = assetOwners[spec.assetId];
      var wrapper = utils.element("div", "game-map-inset");
      wrapper.appendChild(utils.element("span", "", spec.label));
      var nested = document.createElementNS(SVG_NS, "svg");
      var box = paddedBox(source, spec.fallback);
      source.classList.add("game-map-inset-source");
      nested.setAttribute("viewBox", [box.x, box.y, box.width, box.height].join(" "));
      nested.setAttribute("preserveAspectRatio", "xMidYMid meet");
      nested.setAttribute("aria-hidden", "true");
      var clone = source.cloneNode(true);
      stripCloneIds(clone);
      clone.classList.remove("game-map-inset-source");
      clone.classList.add("game-map-inset-province");
      clone.setAttribute("aria-hidden", "true");
      nested.appendChild(clone);
      wrapper.appendChild(nested);
      insetHost.appendChild(wrapper);
      registerGroup(clone, provinceId);
    });

    var view = { x: 0, y: 0, scale: DEFAULT_SCALE };
    var drag = null;
    var activePointers = new Map();
    var pinch = null;

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
      view = { x: 0, y: 0, scale: MIN_SCALE };
      applyTransform();
    }

    function focusSelected() {
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
    }

    viewport.addEventListener("pointerdown", function (event) {
      if (event.pointerType === "mouse" && event.button !== 0) return;
      activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      if (activePointers.size >= 2) {
        beginPinch();
        return;
      }
      drag = { id: event.pointerId, startX: event.clientX, startY: event.clientY, originX: view.x, originY: view.y, moved: false };
    });
    viewport.addEventListener("pointermove", function (event) {
      if (activePointers.has(event.pointerId)) activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
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
        viewport.setPointerCapture(event.pointerId);
        viewport.classList.add("dragging");
        hideTooltip();
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
      activePointers.delete(event.pointerId);
      if (!pinch) {
        endDrag(event);
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
          group.classList.toggle("is-player", ownerId === "player");
          group.classList.toggle("is-allied", !!relation && relation.status === "alliance");
          group.classList.toggle("is-selected", snapshot.selectedProvinceId === provinceId);
          group.classList.toggle("has-warning", warningProvinces.has(provinceId));
          group.classList.toggle("has-battle", battleProvinces.has(provinceId));
          group.classList.toggle("is-occupied", !!provinceState && provinceState.occupation !== null);
          group.style.setProperty("--province-fill", ownerId === "player" ? "var(--jade)" : relation && relation.status === "alliance" ? "var(--river)" : colorFor(ownerId));
          if (primaryAssets[group.getAttribute("data-p")] === true) {
            group.setAttribute("aria-pressed", String(snapshot.selectedProvinceId === provinceId));
            group.setAttribute("aria-label", label);
          }
        });
      });
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
      presentationBounds: function () { return { main: MAIN_VIEWBOX, insets: INSET_SPECS }; },
    };
  }

  return { create: create };
});
