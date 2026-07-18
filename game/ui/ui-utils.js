(function (root, factory) {
  "use strict";
  var game = root.MLN222Game;
  if (!game || !game.hasModule("contracts")) throw new Error("Load contracts before ui-utils.js.");
  var api = game.registerModule("ui-utils", factory(game.contracts));
  if (typeof module === "object" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function (contracts) {
  "use strict";

  var RELATION_LABELS = Object.freeze({ neutral: "Trung lập", "non-aggression": "Không xâm phạm", alliance: "Đồng minh", war: "Chiến tranh" });
  var TACTIC_LABELS = Object.freeze({ siege: "Công phá", engage: "Giao chiến", assault: "Tổng công kích", consolidate: "Củng cố", retreat: "Rút lui" });
  var UNIT_LABELS = Object.freeze({ militia: "Dân quân", infantry: "Bộ binh", archer: "Cung thủ", cavalry: "Kỵ binh", engineer: "Công binh" });
  var STATUS_ICONS = Object.freeze({ neutral: "info", success: "circle-check", warning: "triangle-alert", danger: "swords", pending: "clock-3", disabled: "lock-keyhole" });
  var SVG_NS = "http://www.w3.org/2000/svg";

  function element(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined && text !== null) node.textContent = String(text);
    return node;
  }

  function clear(node) {
    node.replaceChildren();
    return node;
  }

  function icon(name, className) {
    if (typeof name !== "string" || !/^[a-z0-9-]+$/.test(name)) throw new TypeError("Icon name is invalid.");
    var svg = document.createElementNS(SVG_NS, "svg");
    var use = document.createElementNS(SVG_NS, "use");
    svg.setAttribute("class", className ? "ui-icon " + className : "ui-icon");
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("focusable", "false");
    use.setAttribute("href", "#ui-icon-" + name);
    svg.appendChild(use);
    return svg;
  }

  function formatInteger(value) {
    return new Intl.NumberFormat("vi-VN").format(Number.isFinite(value) ? Math.round(value) : 0);
  }

  function status(tone, label, description) {
    if (!Object.prototype.hasOwnProperty.call(STATUS_ICONS, tone)) throw new TypeError("Status tone is invalid.");
    var row = element("div", "game-status game-status-" + tone);
    row.appendChild(icon(STATUS_ICONS[tone], "game-status-icon"));
    var copy = element("div", "game-status-copy");
    copy.appendChild(element("strong", "", label));
    if (description) copy.appendChild(element("span", "", description));
    row.appendChild(copy);
    return row;
  }

  function provinceDefinition(data, provinceId) {
    return data.provinces.provinces.find(function (province) { return province.id === provinceId; }) || null;
  }

  function provinceName(data, provinceId) {
    var province = provinceDefinition(data, provinceId);
    return province ? province.display.name : provinceId;
  }

  function factionName(data, factionId) {
    if (factionId === "player") return "Thế lực của bạn";
    return factionId.indexOf("npc-") === 0 ? provinceName(data, factionId.slice(4)) : factionId;
  }

  function actionKey(action) {
    return action.type + ":" + JSON.stringify(action.payload);
  }

  function clone(value) {
    return contracts.cloneJson(value);
  }

  return {
    RELATION_LABELS: RELATION_LABELS,
    TACTIC_LABELS: TACTIC_LABELS,
    UNIT_LABELS: UNIT_LABELS,
    element: element,
    clear: clear,
    icon: icon,
    status: status,
    formatInteger: formatInteger,
    provinceDefinition: provinceDefinition,
    provinceName: provinceName,
    factionName: factionName,
    actionKey: actionKey,
    clone: clone,
  };
});
