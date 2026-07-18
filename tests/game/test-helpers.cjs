"use strict";

const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "..", "..");
const CORE_FILES = [
  "namespace.js",
  "rng.js",
  "contracts.js",
  "invariants.js",
  "runtime.js",
];

function corePath(file) {
  return path.join(ROOT, "game", "core", file);
}

function loadNodeCore() {
  delete globalThis.MLN222Game;
  CORE_FILES.forEach((file) => {
    const resolved = require.resolve(corePath(file));
    delete require.cache[resolved];
  });
  CORE_FILES.forEach((file) => require(corePath(file)));
  return globalThis.MLN222Game;
}

function loadBrowserCore() {
  const context = vm.createContext({});
  CORE_FILES.forEach((file) => {
    const source = fs.readFileSync(corePath(file), "utf8");
    vm.runInContext(source, context, { filename: file });
  });
  return context.MLN222Game;
}

function serialize(value) {
  return JSON.stringify(value);
}

module.exports = {
  CORE_FILES,
  ROOT,
  corePath,
  loadBrowserCore,
  loadNodeCore,
  serialize,
};
