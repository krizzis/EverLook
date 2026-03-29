# docs/handoff.md

## Context Snapshot
- EverLook is a SillyTavern extension for single-character scene tracking during chat sessions.
- 7 tasks are now complete: T-000 through T-006.
- Scene state, per-chat persistence, Tech-LLM turn-pair analysis, deterministic prompt generation, and background matching are implemented and covered by Jest.
- Background switching now uses cascading substring search with injected runtime adapters so matching logic stays testable while SillyTavern's private background setter remains encapsulated.
- Character initialization reads `[APPEARANCE]`, `[LORA]`, and `[OUTFIT]` markers from the character description, with optional silent LLM fallback for appearance only.
- Group chats remain explicitly out of scope for MVP.

## Active Task(s)
- T-007: Scene Tracker UI Panel - Acceptance: `TrackerPanel.js` renders current scene state in human-readable form, user can edit mutable attributes and reset scene state, panel is toggleable via slash command, edits call `StateManager` methods, UI updates reactively, manual testing confirms usability.

## Decisions Made
- T-004 kept the analyzer decoupled from the concrete ST generation provider via injected `providerFn`.
- T-005 implements prompt generation as a pure static formatter so it can be reused by future image-hook and context-injection tasks without side effects.
- T-005 preserves the character lora trigger string casing while normalizing other textual tags to lowercase to avoid mangling external trigger syntax.
- Character card convention: `[APPEARANCE]`, `[LORA]`, and `[OUTFIT]` live in the description field; missing `[LORA]` is skipped, while missing `[APPEARANCE]` can use a silent extractor when a provider is available.
- T-006 keeps the background runtime seam injectable: EverLook fetches candidate filenames from `/api/backgrounds/all` and updates exported ST `background_settings` instead of importing the private `setBackground()` helper from `backgrounds.js`.

## Changes Since Last Session
- `src/background/BackgroundSwitcher.js` (+153/-0): Implemented cascading, case-insensitive substring matching with injected ST list/apply adapters.
- `tests/BackgroundSwitcher.test.js` (+165/-0): Added fallback, first-match, empty-name, setup-guard, and no-match coverage.
- `index.js` (+44/-1): Wired runtime background adapters, ST background inventory fetch, and a debug helper for manual background sync.
- `jest.config.js` (+1/-0): Added `src/background/**/*.js` to coverage collection.
- `docs/tracker.md` (pending in working tree): Marked T-006 complete and updated progress counts.

## Validation & Evidence
- Unit: 153/153 passing across 8 suites via `node --experimental-vm-modules ./node_modules/jest/bin/jest.js --coverage --runInBand`
- Coverage: 94.23% statements, 85.52% branches, 98.36% functions, 95.50% lines
- Background module coverage: `BackgroundSwitcher.js` 100% statements, 80% branches, 100% functions, 100% lines
- Branch: `feature/t-006-background-switcher`

## Risks & Unknowns
- ST Global Provider Binding: need to trace the exact SillyTavern global/provider entry point when wiring analyzer execution in `index.js` for later integration tasks. - owner: AI Assistant - review: 2026-03-31
- Background application currently mirrors exported ST background state because `backgrounds.js` keeps `setBackground()` private; if upstream changes the internal state contract, the adapter in `index.js` may need a refresh. - owner: AI Assistant - review: 2026-03-31
- Appearance fallback is implemented via injected provider contract, but the concrete ST Tech-LLM binding for init-time calls still needs to be wired in runtime code. - owner: AI Assistant - review: 2026-03-31
- Starting pose/emotion/location are still default-seeded; add a silent Tech-LLM init pass that reads scenario plus the character's first message so those fields start with meaningful values before normal turn analysis. - owner: AI Assistant - review: 2026-03-31

## Next Steps
1. Implement T-007 Scene Tracker UI Panel with edit/reset flows and slash-command toggle.
2. Add the pending silent Tech-LLM init extraction for starting pose, emotion, and location from scenario plus the character's first message.
3. Wire T-004 and T-006 together so confirmed location changes trigger the background switcher automatically during runtime.

## Status Summary
- ✅ 100% - T-000 (Documentation)
- ✅ 100% - T-001 (Project Scaffolding)
- ✅ 100% - T-002 (Scene State)
- ✅ 100% - T-003 (State Manager)
- ✅ 100% - T-004 (Turn-Pair Analyzer)
- ✅ 100% - T-005 (Prompt Builder)
- ✅ 100% - T-006 (Background Switcher)
- ⚪ 0% - T-007 through T-012 (not started)
