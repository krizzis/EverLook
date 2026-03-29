# docs/handoff.md

## Context Snapshot
- EverLook is a SillyTavern extension for single-character scene tracking during chat sessions.
- Eight tasks are complete: T-000 through T-007.
- Scene state, per-chat persistence, Tech-LLM turn-pair analysis, deterministic prompt generation, marker-based character initialization, background matching, and the tracker UI panel are implemented and verified.
- T-007 manual verification is complete: panel mount, slash-command toggle, edit/save, reset, and reactive chat updates all worked in SillyTavern.
- The next major slice is still the deferred init-time extraction work for starting pose, emotion, and location.
- Group chats remain explicitly out of scope for MVP.

## Active Task(s)
- T-012: Init-Time Scene Extraction for Starting Pose/Emotion/Location — Acceptance: silent Tech-LLM init pass derives starting `pose`, `emotion`, and `location` from scenario plus the character's first message; extraction remains silent; runs only when fields are still unset/defaulted; failures preserve safe defaults and log a warning; unit tests cover prompt construction, successful seeding, and failure/no-op behavior; coverage ≥ 80% on new code.

## Decisions Made
- T-004 kept the analyzer decoupled from the concrete ST generation provider via injected `providerFn`.
- T-005 implements prompt generation as a pure static formatter so it can be reused by future image-hook and context-injection tasks without side effects.
- T-006 keeps the background runtime seam injectable: EverLook fetches candidate filenames from `/api/backgrounds/all` and mirrors exported ST background state instead of importing the private `setBackground()` helper from `backgrounds.js`.
- T-007 adds a lightweight `StateManager.subscribe()` / `resetState()` seam so the UI can react to canonical state changes without polling or pushing UI logic into `index.js`.

## Changes Since Last Session
- `src/ui/TrackerPanel.js` (+358/-0): Implemented tracker panel rendering, parsing helpers, edit/reset handlers, visibility controls, and state subscription wiring.
- `src/ui/tracker.html` (+26/-0): Replaced placeholder markup with a mounted panel shell, status area, and close control.
- `style.css` (+142/-24): Added tracker panel layout, responsive form styling, and section/field treatment for the side panel.
- `src/state/StateManager.js` (+76/-9): Added subscriber notifications, baseline reset support, and reactive save/update hooks for the UI layer.
- `index.js` (+219/-149 across follow-up fixes): Wired tracker panel mount, slash command registration, toast helpers, debug toggle surface, startup chat initialization, and corrected slash-command import paths.
- `tests/TrackerPanel.test.js` (new): Added helper, render, setup validation, reset, and submit-path coverage for the UI module.
- `tests/StateManager.test.js` (+44/-0): Added coverage for subscriptions and reset-to-baseline behavior.
- `jest.config.js` (+1/-0): Added `src/ui/**/*.js` to coverage collection.
- `docs/tracker.md` and `docs/todo.md`: Advanced T-007 to complete and repointed the next-session plan to T-012.

## Validation & Evidence
- Unit: 167/167 passing across 9 suites via `node --experimental-vm-modules ./node_modules/jest/bin/jest.js --coverage --runInBand`
- Coverage: 93.64% statements, 85.53% branches, 95.55% functions, 94.55% lines
- UI module coverage: `TrackerPanel.js` 93.45% statements, 86.9% branches, 88.46% functions, 93.39% lines
- Manual: SillyTavern verification completed for T-007 panel mount, slash command toggle, edit/save, reset, and reactive chat updates

## Risks & Unknowns
- ST Global Provider Binding still needs tracing when wiring analyzer execution in `index.js` for later runtime tasks. — owner: AI Assistant — review: 2026-03-31
- Background application currently mirrors exported ST background state because `backgrounds.js` keeps `setBackground()` private; if upstream changes the internal state contract, the adapter in `index.js` may need a refresh. — owner: AI Assistant — review: 2026-03-31
- Starting pose/emotion/location are still default-seeded; add a silent Tech-LLM init pass that reads scenario plus the character's first message before normal turn analysis. — owner: AI Assistant — review: 2026-03-31

## Next Steps
1. Implement T-012 init-time extraction for starting pose, emotion, and location using the existing injected provider pattern.
2. Wire T-004 and T-006 together so confirmed location changes trigger the background switcher automatically during runtime.
3. After that, move to T-008 image-generation hook or T-009 context injection depending on the runtime seam that proves clearer first.

## Status Summary
- ✅ 100% - T-000 (Documentation)
- ✅ 100% - T-001 (Project Scaffolding)
- ✅ 100% - T-002 (Scene State)
- ✅ 100% - T-003 (State Manager)
- ✅ 100% - T-004 (Turn-Pair Analyzer)
- ✅ 100% - T-005 (Prompt Builder)
- ✅ 100% - T-006 (Background Switcher)
- ✅ 100% - T-007 (Scene Tracker UI Panel)
- ⚪ 0% - T-008 through T-012
