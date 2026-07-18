# Campaign API contract

Version: 2

This contract describes the production campaign boundary. Browser views call the
controller, while simulations and tests may call the deterministic campaign
engine directly. Neither client retains a mutable engine state reference.

## Browser controller

Create a controller with `game-controller.create({ deps, questions, storage })`.
The controller exposes commands and a cloned read model:

| Method | Purpose |
|---|---|
| `subscribe(listener)` / `snapshot()` | Read a detached campaign/UI snapshot. |
| `startCampaign(provinceId, seed)` | Create and persist a campaign, then prepare turn 1. |
| `resume()` / `save()` / `reset()` | Restore, persist, or remove campaign data safely. |
| `legalActions()` | Return legal player actions for the remaining action points. |
| `stageAction(action)` / `clearOrders()` | Validate and persist pending turn orders. |
| `setTactic(battleId, tacticId)` | Validate and persist a player battle tactic. |
| `selectProvince(provinceId)` | Change the UI selection without mutating engine state. |
| `beginQuiz(choice)` | Persist the deterministic ten-question turn quiz. |
| `answerQuiz(option)` | Commit one answer and persist immediately. |
| `completeQuiz()` | Require ten answers, resolve the turn, and prepare the next turn. |
| `setQuizChoice(choice)` | Select the bounded quiz reward category. |

The snapshot contains a deep-cloned `state` plus UI fields such as selected
province, pending actions, tactic selections, report events, status/error text,
and resume availability. Views may project this clone but must not call engine
mutation functions or write browser storage directly.

## Campaign engine

The production engine exports these deterministic boundaries:

- `createCampaign(options, deps)` creates one player faction and one NPC faction
  for every other playable province.
- `prepareCampaignTurn(state, deps)` settles economy, occupation, warnings, and
  pending transitions before entering the action phase.
- `validatePlayerActions(state, playerId, actions, deps)` dry-runs staged actions
  against a cloned state and consumes no RNG or events.
- `completeCampaignTurn(state, input, deps)` validates player actions and a
  completed ten-question quiz, resolves NPC decisions and battles, applies the
  reward, and advances the strategic turn.
- `advanceCampaignTurn(state, input, deps)` is the headless prepare-and-complete
  convenience operation used by simulations.
- `validateCampaignState(state, deps)` returns structured invariant errors.
- `filterEvents(events, playerId, state)` returns player-relevant report events.
- `evaluateOutcome`, `ownedProvinceIds`, `territoryPointsByFaction`, and
  `regionalControl` are read-only projections.

Player/NPC action values are plain objects with a `type` and `payload`. Production
types are `RECRUIT`, `UNLOCK`, `MOVE`, `REINFORCE`, `TRADE`, `PROPOSE_TREATY`,
`RESPOND_TREATY`, `WARN_ATTACK`, and `WAIT`. Every non-wait payload identifies the
acting faction and stable province/faction/unit IDs required by that action.
Actions are validated through the same campaign path for player and NPC use.

## Phase 06 vertical-slice compatibility

The headless acceptance scenario remains available for regression testing. Its
runtime command names are `START_TURN_ECONOMY`, `RECRUIT_UNITS`,
`DECLARE_ATTACK_INTENT`, `START_BATTLE`, `RESOLVE_BATTLE_PULSE`,
`START_TURN_QUIZ`, `ANSWER_TURN_QUIZ`, and `APPLY_QUIZ_RESULT`. Its documented
read projections include `getCampaignSummary`, `getMapView`, `getProvinceView`,
`getBattleView`, `getQuizView`, and `getTurnReport`.

These names belong to the Phase 06 scenario adapter; the production browser uses
the controller and campaign engine boundaries above. The compatibility scenario
continues to use the isolated `mln222.game.v1` save key.

## Quiz proof

`completeCampaignTurn` accepts only a completed current-turn quiz. The proof has
the current turn, player faction ID, ten unique question IDs, ten bounded answers,
position 10, completion flag, and score 0-10. A supplied score cannot override or
bypass the persisted quiz result.

## Events

Committed events are JSON values with uppercase type names and stable payload IDs.
The main families are economy, recruitment, diplomacy, battle, occupation, quiz,
territory, and campaign completion. Full events remain available to tests and
diagnostics; browser reports use `filterEvents`.

## Persistence boundary

- Campaign state key: `mln222.campaign.v1`.
- Controller UI sidecar key: `mln222.campaign.ui.v1`.
- Phase 5 scenario saves may still use `mln222.game.v1`; that key is not the
  production campaign key.
- Study progress remains under `mln222.v2.*` and is never removed by game reset.
- The campaign codec validates checksum, schema, size, known fields, RNG state,
  quiz state, battle reservations, and campaign invariants before resume.
- Save after every accepted staged action, tactic, quiz answer, and completed turn.
- Missing, corrupt, oversized, malicious, future-version, or unavailable storage
  returns a structured failure and leaves the current in-memory state intact.

## Determinism

Stable inputs plus persisted RNG state produce byte-equivalent terminal state and
events. Economy, combat, quiz, and AI use deterministic RNG streams. Validation,
snapshot creation, queries, and event filtering consume no RNG and commit no
events.
