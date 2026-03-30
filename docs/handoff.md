# docs/handoff.md

## Context Snapshot
- EverLook is a SillyTavern extension for single-character scene tracking during chat sessions.
- Eight tasks remain complete: T-000 through T-007.
- T-007 manual verification is complete: panel mount, slash-command toggle, edit/save, reset, and reactive chat updates all worked in SillyTavern.
- T-012 is now largely implemented: EverLook has a silent init-time extractor for starting pose/emotion/location plus live runtime Tech-LLM wiring for turn-pair analysis and background sync.
- Live SillyTavern verification exposed prompt-looseness issues around visible emotion labels, mixed daytime/weather phrases, and outfit changes from borrowed clothing.
- A stabilization pass tightened the Variant A prompts and added a safe runtime validation guard so invalid extracted payloads now log one clear warning and leave state unchanged.
- Automated validation for the expanded T-012 slice is complete; live SillyTavern re-verification is still pending for the new quiet-generation/runtime path.
- Group chats remain explicitly out of scope for MVP.

## Active Task(s)
- T-012: Init-Time Scene Extraction for Starting Pose/Emotion/Location - Acceptance: silent Tech-LLM init pass derives starting `pose`, `emotion`, and `location` from scenario plus the character's first message; runtime Tech-LLM wiring captures user/character turn pairs and applies accepted updates through `StateManager`; confirmed location changes trigger background sync when auto-background is enabled; extraction and analysis remain silent; failures preserve safe defaults or the existing scene state and log without blocking chat flow; unit tests cover prompt construction, successful seeding, failure/no-op behavior, runtime turn-pair capture, runtime updates, and background sync paths; coverage >= 80% on new code.
- T-013: Extractor Testing & Requirement Clarification - Acceptance: assemble a manually verified extractor test set, clarify expected semantics for emotion/action/outfit/location extraction, document current failure patterns, and produce recommendation notes without changing production code in that session.

## Decisions Made
- T-004 kept the analyzer decoupled from the concrete ST generation provider via injected `providerFn`.
- T-005 implements prompt generation as a pure static formatter so it can be reused by future image-hook and context-injection tasks without side effects.
- T-006 keeps the background runtime seam injectable: EverLook fetches candidate filenames from `/api/backgrounds/all` and mirrors exported ST background state instead of importing the private `setBackground()` helper from `backgrounds.js`.
- T-007 adds a lightweight `StateManager.subscribe()` / `resetState()` seam so the UI can react to canonical state changes without polling or pushing UI logic into `index.js`.
- T-012 now reuses SillyTavern's exported `generateQuietPrompt` helper as the shared silent Tech-LLM provider for appearance fallback, init-time extraction, and live runtime turn-pair analysis.
- The previously informal T-004/T-006 runtime integration follow-up was folded into T-012 so init extraction and live runtime analysis ship together and share the same provider/runtime helpers.
- Extractor-quality review and requirement clarification now have a dedicated follow-up task (T-013) so we can separate stabilization work from broader prompt/schema decisions.

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
- `src/analyzer/prompts.js` (+11/-1): Tightened Variant A runtime prompt guidance for visible emotion labels, simple location labels, and full outfit arrays.
- `src/analyzer/InitSceneExtractor.js` (+4/-2): Tightened init-time prompt guidance to discourage compound emotion and mixed daytime/weather labels.
- `src/runtime/SceneRuntimeController.js` (+15/-1): Added a safe runtime catch around state application so invalid extracted payloads log one clear warning and preserve state.
- `tests/TurnPairAnalyzer.test.js` (+5/-0): Added coverage for the tightened Variant A prompt guidance.
- `tests/InitSceneExtractor.test.js` (+10/-0): Added prompt-guidance coverage and silenced expected negative-path console noise.
- `tests/SceneRuntimeController.test.js` (+35/-0): Added regression coverage for invalid runtime state updates.

## Validation & Evidence
- Unit: 197/197 passing across 12 suites via `node --experimental-vm-modules ./node_modules/jest/bin/jest.js --coverage --runInBand`
- Coverage: 92.15% statements, 80.79% branches, 96.39% functions, 93.02% lines
- Focused unit: 26/26 passing across `TurnPairAnalyzer`, `SceneRuntimeController`, and `InitSceneExtractor` via `node --experimental-vm-modules ./node_modules/jest/bin/jest.js tests/TurnPairAnalyzer.test.js tests/SceneRuntimeController.test.js tests/InitSceneExtractor.test.js --runInBand`
- Runtime coverage: `SceneRuntimeController.js` 83.87% statements / 73.43% branches; `chatHelpers.js` 90.9% statements / 77.77% branches
- Init extraction coverage: `InitSceneExtractor.js` 89.28% statements, 63.15% branches, 100% functions, 92.45% lines
- Manual: T-007 manual verification remains complete; T-012 runtime/init path still needs live SillyTavern re-verification after the stabilization pass

## Risks & Unknowns
- Live SillyTavern verification is still needed for the new `generateQuietPrompt`-backed init/runtime analysis path; provider-specific formatting or model behavior may still require another prompt or post-processing tweak. - owner: AI Assistant - review: 2026-03-31
- Extractor semantics for visible emotion labels, borrowed/draped outfit changes, action vocabulary boundaries, and location normalization still need explicit review; T-013 now tracks that clarification work. - owner: AI Assistant - review: 2026-03-31
- Background application still mirrors exported ST background state because `backgrounds.js` keeps `setBackground()` private; if upstream changes the internal state contract, the adapter in `index.js` may need a refresh. - owner: AI Assistant - review: 2026-03-31
- Turn-pair capture currently prefers the latest pending or surrounding user message and skips when no pair can be resolved; continue/regenerate edge cases should be sanity-checked in a live ST session. - owner: AI Assistant - review: 2026-03-31

## Next Steps
1. Re-run the live SillyTavern verification pass for T-012 against the previously failing Carmen scenarios plus fresh-chat init seeding and auto-background behavior.
2. Run T-013 as a no-code extractor review session to collect pass/fail examples and clarify expected extractor semantics.
3. If the stabilized verification is clean, advance T-012 to done; otherwise use the T-013 notes to scope the next prompt/vocabulary/post-processing change.

## Status Summary
- ✅ 100% - T-000 (Documentation)
- ✅ 100% - T-001 (Project Scaffolding)
- ✅ 100% - T-002 (Scene State)
- ✅ 100% - T-003 (State Manager)
- ✅ 100% - T-004 (Turn-Pair Analyzer)
- ✅ 100% - T-005 (Prompt Builder)
- ✅ 100% - T-006 (Background Switcher)
- ✅ 100% - T-007 (Scene Tracker UI Panel)
- 🔵 92% - T-012 (Init-Time Extraction + Runtime Tech-LLM Wiring)
- ⚪ 0% - T-013 (Extractor Testing & Requirement Clarification)
- ⚪ 0% - T-008 through T-011
