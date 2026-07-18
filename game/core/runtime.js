(function (root, factory) {
  "use strict";
  var game = root.MLN222Game;
  if (
    !game ||
    !game.hasModule("rng") ||
    !game.hasModule("contracts") ||
    !game.hasModule("invariants")
  ) {
    throw new Error("Load the core modules before runtime.js.");
  }
  var api = game.registerModule("runtime", factory(game.contracts, game.invariants, game.rng));
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function (contracts, invariants, rng) {
  "use strict";

  function error(code, path, message) {
    return { code: code, path: path, message: message };
  }

  function failure(state, errors) {
    return { ok: false, state: state, events: [], errors: errors };
  }

  function success(state, events) {
    return { ok: true, state: state, events: events, errors: [] };
  }

  function copyDependencies(source) {
    if (!contracts.isPlainObject(source)) {
      throw new TypeError("Runtime dependencies must be an object.");
    }
    var copied = Object.create(null);
    Object.keys(source).sort().forEach(function (key) {
      if (key === "__proto__" || key === "constructor" || key === "prototype") {
        throw new TypeError("Unsafe runtime dependency key: " + key);
      }
      copied[key] = source[key];
    });
    return Object.freeze(copied);
  }

  function copyHandlers(source) {
    if (!contracts.isPlainObject(source)) {
      throw new TypeError("Runtime handlers must be an object.");
    }
    var copied = Object.create(null);
    Object.keys(source).sort().forEach(function (type) {
      if (!/^[A-Z][A-Z0-9_]{0,63}$/.test(type)) {
        throw new TypeError("Invalid handler action type: " + type);
      }
      if (typeof source[type] !== "function") {
        throw new TypeError("Runtime handler must be a function: " + type);
      }
      copied[type] = source[type];
    });
    return Object.freeze(copied);
  }

  function validateHandlerResult(result) {
    if (result === undefined) {
      return [];
    }
    if (result && typeof result.then === "function") {
      return [error("HANDLER_ASYNC", "result", "Runtime handlers must be synchronous.")];
    }
    if (!contracts.isPlainObject(result)) {
      return [error("HANDLER_RESULT", "result", "Handler result must be an object or undefined.")];
    }
    var errors = [];
    Object.keys(result).forEach(function (key) {
      if (key !== "state" && key !== "events") {
        errors.push(error("HANDLER_RESULT_KEY", "result." + key, "Unknown handler result field."));
      }
    });
    if (result.state !== undefined && !contracts.isPlainObject(result.state)) {
      errors.push(error("HANDLER_STATE", "result.state", "Returned state must be an object."));
    }
    if (result.events !== undefined && !Array.isArray(result.events)) {
      errors.push(error("HANDLER_EVENTS", "result.events", "Returned events must be an array."));
    }
    return errors;
  }

  function sameJson(left, right) {
    return JSON.stringify(contracts.cloneJson(left)) === JSON.stringify(contracts.cloneJson(right));
  }

  function createRuntime(options) {
    var input = options === undefined ? {} : options;
    if (!contracts.isPlainObject(input)) {
      throw new TypeError("Runtime options must be an object.");
    }
    var handlers = copyHandlers(input.handlers === undefined ? {} : input.handlers);
    var dependencies = copyDependencies(input.dependencies === undefined ? {} : input.dependencies);
    var additionalInvariants = input.additionalInvariants === undefined ? [] : input.additionalInvariants;
    if (!Array.isArray(additionalInvariants) || additionalInvariants.some(function (check) {
      return typeof check !== "function";
    })) {
      throw new TypeError("Additional invariants must be an array of functions.");
    }
    additionalInvariants = additionalInvariants.slice();

    function dispatch(state, action) {
      var stateErrors = invariants.validateState(state, additionalInvariants);
      if (stateErrors.length > 0) {
        return failure(state, stateErrors);
      }
      var actionErrors = contracts.validateAction(action);
      if (actionErrors.length > 0) {
        return failure(state, actionErrors);
      }
      if (action.expectedPhase !== null && action.expectedPhase !== state.phase) {
        return failure(state, [error(
          "ACTION_PHASE_MISMATCH",
          "action.expectedPhase",
          "Action does not match the current game phase."
        )]);
      }
      if (!Object.prototype.hasOwnProperty.call(handlers, action.type)) {
        return failure(state, [error("ACTION_UNKNOWN", "action.type", "No handler is registered for this action.")]);
      }

      var draft;
      var safeAction;
      try {
        draft = contracts.cloneGameState(state);
        safeAction = contracts.cloneJson(action);
      } catch (caught) {
        return failure(state, [error(
          "RUNTIME_CLONE",
          "state",
          caught && caught.message ? caught.message : "Runtime input could not be cloned."
        )]);
      }

      var emitted = [];
      function emit(type, payload) {
        var eventDraft = {
          type: type,
          payload: payload === undefined ? {} : payload,
        };
        var eventErrors = contracts.validateEventDraft(eventDraft);
        if (eventErrors.length > 0) {
          throw new TypeError(eventErrors[0].message + " Path: " + eventErrors[0].path);
        }
        emitted.push(contracts.cloneJson(eventDraft));
      }

      var handlerResult;
      try {
        handlerResult = handlers[action.type](draft, safeAction, {
          dependencies: dependencies,
          emit: emit,
          rng: rng,
        });
      } catch (caught) {
        return failure(state, [error(
          "HANDLER_EXCEPTION",
          "action.type",
          caught && caught.message ? caught.message : "Action handler failed."
        )]);
      }

      var resultErrors = validateHandlerResult(handlerResult);
      if (resultErrors.length > 0) {
        return failure(state, resultErrors);
      }
      var candidate = handlerResult && handlerResult.state !== undefined ? handlerResult.state : draft;
      var returnedEvents = handlerResult && handlerResult.events !== undefined ? handlerResult.events : [];

      var nextState;
      try {
        nextState = contracts.cloneGameState(candidate);
      } catch (caught) {
        return failure(state, [error(
          "HANDLER_STATE_CLONE",
          "result.state",
          caught && caught.message ? caught.message : "Handler state could not be cloned."
        )]);
      }

      if (nextState.eventSequence !== state.eventSequence || !sameJson(nextState.eventLog, state.eventLog)) {
        return failure(state, [error(
          "RUNTIME_EVENT_OWNERSHIP",
          "state.eventLog",
          "Handlers cannot modify eventLog or eventSequence directly."
        )]);
      }

      var eventDrafts = emitted.concat(returnedEvents);
      var clonedEvents = [];
      for (var eventIndex = 0; eventIndex < eventDrafts.length; eventIndex += 1) {
        var eventErrors = contracts.validateEventDraft(eventDrafts[eventIndex]);
        if (eventErrors.length > 0) {
          return failure(state, eventErrors.map(function (item) {
            return error(item.code, "result.events[" + eventIndex + "]" + item.path.slice("event".length), item.message);
          }));
        }
        try {
          clonedEvents.push(contracts.cloneJson(eventDrafts[eventIndex]));
        } catch (caught) {
          return failure(state, [error(
            "EVENT_CLONE",
            "result.events[" + eventIndex + "]",
            caught && caught.message ? caught.message : "Event could not be cloned."
          )]);
        }
      }

      var committedEvents = [];
      for (var index = 0; index < clonedEvents.length; index += 1) {
        if (!Number.isSafeInteger(nextState.eventSequence + 1)) {
          return failure(state, [error(
            "EVENT_SEQUENCE_OVERFLOW",
            "state.eventSequence",
            "Event sequence exceeded the safe-integer range."
          )]);
        }
        nextState.eventSequence += 1;
        var committed = {
          sequence: nextState.eventSequence,
          actionId: action.id,
          turn: state.turn,
          type: clonedEvents[index].type,
          payload: clonedEvents[index].payload,
        };
        nextState.eventLog.push(contracts.cloneJson(committed));
        committedEvents.push(contracts.cloneJson(committed));
      }

      var nextErrors = invariants.validateState(nextState, additionalInvariants);
      if (nextErrors.length > 0) {
        return failure(state, nextErrors);
      }
      return success(nextState, committedEvents);
    }

    return Object.freeze({
      dispatch: dispatch,
      listActionTypes: function listActionTypes() {
        return Object.keys(handlers).sort();
      },
    });
  }

  return {
    createRuntime: createRuntime,
  };
});
