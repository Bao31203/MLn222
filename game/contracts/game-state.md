# Deterministic game-state contract

This contract defines the serializable boundary shared by the campaign modules. The core is loaded as classic browser scripts and can also be required by Node without a bundler.

## Module order

Load core scripts in this order:

1. `namespace.js`
2. `rng.js`
3. `contracts.js`
4. `invariants.js`
5. `runtime.js`

All modules register beneath the single `globalThis.MLN222Game` namespace. Registering a module twice is an error.

## GameState

`GameState` is plain JSON. It cannot contain functions, class instances, cyclic references, non-finite numbers, `Map`, `Set`, or host objects.

```json
{
  "schemaVersion": 1,
  "campaignId": "campaign-1",
  "turn": 1,
  "phase": "setup",
  "rng": {
    "algorithm": "fnv1a-mix32-v1",
    "seed": "campaign-seed",
    "counters": { "ai": 0, "combat": 0, "events": 0, "quiz": 0 }
  },
  "factions": {},
  "provinces": {},
  "battles": {},
  "quiz": null,
  "effects": [],
  "eventLog": [],
  "eventSequence": 0
}
```

Valid phases are `setup`, `start`, `action`, `resolution`, `quiz`, and `complete`. Domain modules own the contents of factions, provinces, battles, quiz, and effects, while the core validates their JSON shape. If present, province population uses non-negative integer `capacity`, `civilians`, and `military`; civilians plus military cannot exceed capacity. If present, faction resources use non-negative integer `food` and `coin`.

Only the runtime may append `eventLog` entries or increment `eventSequence`.

## Action

```json
{
  "id": "turn-1-recruit-1",
  "type": "RECRUIT_UNITS",
  "payload": {},
  "expectedPhase": "action"
}
```

Action IDs are stable identifiers. Action types are uppercase registry keys. `expectedPhase` can be `null`; otherwise the runtime rejects the action when the current phase differs. Unknown or malformed actions return a failed result and never invoke a handler.

## Handler

A handler is registered by action type and called synchronously:

```js
function handler(draft, action, context) {
  var draw = context.rng.nextInt(draft.rng, "events", 1, 4);
  draft.rng = draw.state;
  context.emit("RESOURCE_GAINED", { amount: draw.value });
}
```

Handlers may mutate only the supplied draft. They must persist every returned RNG state. They emit ordered event drafts through `context.emit(type, payload)`, or return `{ state, events }`. They cannot return a promise or modify the event log directly. Dependencies are supplied through `context.dependencies`.

## Event and Result

The runtime turns an event draft into a committed event:

```json
{
  "sequence": 1,
  "actionId": "turn-1-recruit-1",
  "turn": 1,
  "type": "RESOURCE_GAINED",
  "payload": { "amount": 3 }
}
```

A successful dispatch returns `{ ok: true, state, events, errors: [] }`. A rejected dispatch returns `{ ok: false, state, events: [], errors }`, where `state` is the original object and every error has string fields `code`, `path`, and `message`.

## Determinism and persistence

Each random domain has an independent persisted counter: `ai`, `combat`, `events`, and `quiz`. A draw in one stream cannot perturb another stream. Given the same serialized state and ordered actions, dispatch must produce byte-equivalent serialized output.

Save by serializing the full state. Load by parsing it and running `invariants.validateState` before accepting it. Replays use the initial state plus the same ordered action envelopes. Numeric domain rules must use `contracts.clamp` and `contracts.roundInteger`, and ordering rules must use `contracts.stableSort`.
