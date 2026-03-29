# docs/handoff.md

## Context Snapshot
- EverLook is a SillyTavern extension for single-character scene tracking during chat sessions.
- Eight tasks remain complete: T-000 through T-007.
- T-007 manual verification is complete: panel mount, slash-command toggle, edit/save, reset, and reactive chat updates all worked in SillyTavern.
- T-012 is now largely implemented: EverLook has a silent init-time extractor for starting pose/emotion/location plus live runtime Tech-LLM wiring for turn-pair analysis and background sync.
- Automated validation for the expanded T-012 slice is complete; live SillyTavern verification is still pending for the new quiet-generation/runtime path.
- Group chats remain explicitly out of scope for MVP.

## Active Task(s)
- T-012: Init-Time Scene Extraction for Starting Pose/Emotion/Location - Acceptance: silent Tech-LLM init pass derives starting `pose`, `emotion`, and `location` from scenario plus the character's first message; runtime Tech-LLM wiring captures user/character turn pairs and applies accepted updates through `StateManager`; confirmed location changes trigger background sync when auto-background is enabled; extraction and analysis remain silent; failures preserve safe defaults or the existing scene state and log without blocking chat flow; unit tests cover prompt construction, successful seeding, failure/no-op behavior, runtime turn-pair capture, runtime updates, and background sync paths; coverage >= 80% on new code.

## Decisions Made
- T-004 kept the analyzer decoupled from the concrete ST generation provider via injected `providerFn`.
- T-005 implements prompt generation as a pure static formatter so it can be reused by future image-hook and context-injection tasks without side effects.
- T-006 keeps the background runtime seam injectable: EverLook fetches candidate filenames from `/api/backgrounds/all` and mirrors exported ST background state instead of importing the private `setBackground()` helper from `backgrounds.js`.
- T-007 adds a lightweight `StateManager.subscribe()` / `resetState()` seam so the UI can react to canonical state changes without polling or pushing UI logic into `index.js`.
- T-012 now reuses SillyTavern's exported `generateQuietPrompt` helper as the shared silent Tech-LLM provider for appearance fallback, init-time extraction, and live runtime turn-pair analysis.
- The previously informal T-004/T-006 runtime integration follow-up was folded into T-012 so init extraction and live runtime analysis ship together and share the same provider/runtime helpers.

## Changes Since Last Session
- `src/analyzer/InitSceneExtractor.js` (+118/-0): Added a silent init-time extractor plus prompt builder for starting pose, emotion, and location.
- `src/runtime/chatHelpers.js` (+98/-0): Added shared scenario/first-message resolution, turn-pair construction, location checks, and Tech-LLM prompt helpers.
- `src/runtime/SceneRuntimeController.js` (+117/-0): Added runtime orchestration for pending user-turn capture, analyzer execution, state updates, and optional background sync.
- `src/state/StateManager.js` (+69/-7): Extended setup to accept the init-scene provider and seed default pose/emotion/location from scenario plus the first character message.
- `index.js` (+33/-4): Wired `generateQuietPrompt` into the shared Tech-LLM provider, runtime controller, init-time extraction, and chat-change background sync.
- `tests/InitSceneExtractor.test.js` (+70/-0): Added prompt, JSON parsing, fenced JSON, and malformed-response coverage for the new init extractor.
- `tests/chatHelpers.test.js` (+116/-0): Added deterministic coverage for scenario/first-message selection, turn-pair resolution, and location/default helpers.
- `tests/SceneRuntimeController.test.js` (+153/-0): Added runtime-controller coverage for user-turn capture, analyzer execution, no-op paths, and background sync handling.
- `tests/StateManager.test.js` (+42/-0): Added init-scene seeding and safe-default fallback coverage.
- `jest.config.js` (+1/-0): Added `src/runtime/**/*.js` to coverage collection.

## Validation & Evidence
- Unit: 197/197 passing across 12 suites via `node --experimental-vm-modules ./node_modules/jest/bin/jest.js --coverage --runInBand`
- Coverage: 92.15% statements, 80.79% branches, 96.39% functions, 93.02% lines
- Runtime coverage: `SceneRuntimeController.js` 83.87% statements / 73.43% branches; `chatHelpers.js` 90.9% statements / 77.77% branches
- Init extraction coverage: `InitSceneExtractor.js` 89.28% statements, 63.15% branches, 100% functions, 92.45% lines
- Manual: T-007 manual verification remains complete; T-012 runtime/init path still needs live SillyTavern verification

## Risks & Unknowns
- Live SillyTavern verification is still needed for the new `generateQuietPrompt`-backed init/runtime analysis path; provider-specific formatting or model behavior may still require a prompt tweak. - owner: AI Assistant - review: 2026-03-31
- Background application still mirrors exported ST background state because `backgrounds.js` keeps `setBackground()` private; if upstream changes the internal state contract, the adapter in `index.js` may need a refresh. - owner: AI Assistant - review: 2026-03-31
- Turn-pair capture currently prefers the latest pending or surrounding user message and skips when no pair can be resolved; continue/regenerate edge cases should be sanity-checked in a live ST session. - owner: AI Assistant - review: 2026-03-31

## Next Steps
1. Run a live SillyTavern verification pass for T-012: fresh chat init seeding, normal turn-pair updates, and auto-background behavior.
2. If the live verification is clean, advance T-012 to done and pick the next major feature slice between T-008 and T-009.
3. If runtime edge cases appear during manual validation, tighten the prompt or turn-pair resolution helper and rerun the Jest and ST checks.

## Status Summary
- ✅ 100% - T-000 (Documentation)
- ✅ 100% - T-001 (Project Scaffolding)
- ✅ 100% - T-002 (Scene State)
- ✅ 100% - T-003 (State Manager)
- ✅ 100% - T-004 (Turn-Pair Analyzer)
- ✅ 100% - T-005 (Prompt Builder)
- ✅ 100% - T-006 (Background Switcher)
- ✅ 100% - T-007 (Scene Tracker UI Panel)
- 🔵 90% - T-012 (Init-Time Extraction + Runtime Tech-LLM Wiring)
- ⚪ 0% - T-008 through T-011
