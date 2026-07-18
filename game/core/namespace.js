(function (root, factory) {
  "use strict";
  var namespace = factory(root);
  if (typeof module === "object" && module.exports) {
    module.exports = namespace;
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function (root) {
  "use strict";

  var own = Object.prototype.hasOwnProperty;
  var marker = typeof Symbol === "function"
    ? Symbol.for("MLN222Game.namespace.v1")
    : "__MLN222GameNamespaceV1__";
  var existing = root.MLN222Game;

  function isTrustedNamespace(value) {
    if (!value || typeof value !== "object") {
      return false;
    }
    var brand = Object.getOwnPropertyDescriptor(value, "__brand");
    var identity = Object.getOwnPropertyDescriptor(value, marker);
    return Boolean(
      brand &&
      brand.value === "MLN222Game" &&
      brand.writable === false &&
      brand.configurable === false &&
      identity &&
      identity.value === true &&
      identity.writable === false &&
      identity.configurable === false &&
      value.version === 1 &&
      typeof value.registerModule === "function" &&
      typeof value.getModule === "function" &&
      typeof value.hasModule === "function" &&
      typeof value.listModules === "function"
    );
  }

  if (existing !== undefined) {
    if (!isTrustedNamespace(existing)) {
      throw new Error("MLN222Game namespace is already occupied.");
    }
    return existing;
  }

  var modules = Object.create(null);
  var namespace = {};

  Object.defineProperty(namespace, "__brand", {
    value: "MLN222Game",
    enumerable: false,
  });

  Object.defineProperty(namespace, marker, {
    value: true,
    enumerable: false,
  });

  Object.defineProperty(namespace, "version", {
    value: 1,
    enumerable: true,
  });

  namespace.registerModule = function registerModule(name, api) {
    if (typeof name !== "string" || !/^[a-z][a-z0-9-]{0,47}$/.test(name)) {
      throw new TypeError("Module name must be a lowercase stable identifier.");
    }
    if (!api || typeof api !== "object" || Array.isArray(api)) {
      throw new TypeError("Module API must be an object.");
    }
    if (own.call(modules, name) || own.call(namespace, name)) {
      throw new Error("Module already registered: " + name);
    }

    var exported = Object.freeze(Object.assign({}, api));
    modules[name] = exported;
    Object.defineProperty(namespace, name, {
      value: exported,
      enumerable: true,
    });
    return exported;
  };

  namespace.getModule = function getModule(name) {
    if (!own.call(modules, name)) {
      throw new Error("Unknown module: " + name);
    }
    return modules[name];
  };

  namespace.hasModule = function hasModule(name) {
    return own.call(modules, name);
  };

  namespace.listModules = function listModules() {
    return Object.keys(modules).sort();
  };

  Object.defineProperty(root, "MLN222Game", {
    value: namespace,
    configurable: true,
    enumerable: true,
    writable: false,
  });

  return namespace;
});
