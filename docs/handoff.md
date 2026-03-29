# docs/handoff.md

## Context Snapshot
- EverLook is a SillyTavern extension for single-character scene tracking during chat sessions.
- Seven tasks are complete: T-000 through T-006.
- Scene state, per-chat persistence, Tech-LLM turn-pair analysis, deterministic prompt generation, marker-based character initialization, and background matching are implemented and covered by Jest.
- T-007 is now implemented in code: the tracker panel mounts into the SillyTavern UI, subscribes to scene-state changes, routes edits through `StateManager`, and exposes a slash-command toggle.
- Manual SillyTavern verification is still pending before T-007 can be marked fully complete.
- Group chats remain explicitly out of scope for MVP.

## Active Task(s)
- T-007: Scene Tracker UI Panel — Acceptance: `TrackerPanel.js` renders current scene state in human-readable form, user can edit mutable attributes and reset scene state, panel is toggleable via slash command, edits call `StateManager` methods, UI updates reactively, manual testing confirms usability.

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
- `index.js` (+217/-147): Wired tracker panel mount, slash command registration, toast helpers, debug toggle surface, and startup chat initialization.
- `tests/TrackerPanel.test.js` (new): Added helper, render, setup validation, reset, and submit-path coverage for the UI module.
- `tests/StateManager.test.js` (+44/-0): Added coverage for subscriptions and reset-to-baseline behavior.
- `jest.config.js` (+1/-0): Added `src/ui/**/*.js` to coverage collection.
- `docs/tracker.md` (rewritten): Marked T-007 in progress with evidence and restored readable status text.

## Validation & Evidence
- Unit: 167/167 passing across 9 suites via `node --experimental-vm-modules ./node_modules/jest/bin/jest.js --coverage --runInBand`
- Coverage: 93.64% statements, 85.53% branches, 95.55% functions, 94.55% lines
- UI module coverage: `TrackerPanel.js` 93.45% statements, 86.9% branches, 88.46% functions, 93.39% lines
- Focused validation: `node --experimental-vm-modules ./node_modules/jest/bin/jest.js tests/StateManager.test.js tests/TrackerPanel.test.js --runInBand`

## Risks & Unknowns
- T-007 still needs manual SillyTavern confirmation for panel mount, slash command usability, and edit/reset workflow. — owner: Human operator — review: 2026-03-29
- ST Global Provider Binding still needs tracing when wiring analyzer execution in `index.js` for later runtime tasks. — owner: AI Assistant — review: 2026-03-31
- Background application currently mirrors exported ST background state because `backgrounds.js` keeps `setBackground()` private; if upstream changes the internal state contract, the adapter in `index.js` may need a refresh. — owner: AI Assistant — review: 2026-03-31
- Starting pose/emotion/location are still default-seeded; add a silent Tech-LLM init pass that reads scenario plus the character's first message before normal turn analysis. — owner: AI Assistant — review: 2026-03-31

## Next Steps
1. Manually verify T-007 in the local SillyTavern instance: open the tracker panel, edit fields, reset to baseline, and exercise `/everlook-tracker show|hide|toggle`.
2. If manual verification passes, update `docs/tracker.md` and `docs/handoff.md` to mark T-007 complete.
3. Resume feature work with either T-012 (init-time scene extraction) or the T-006/T-004 runtime integration that triggers background switching on confirmed location changes.

## Status Summary
- ✅ 100% - T-000 (Documentation)
- ✅ 100% - T-001 (Project Scaffolding)
- ✅ 100% - T-002 (Scene State)
- ✅ 100% - T-003 (State Manager)
- ✅ 100% - T-004 (Turn-Pair Analyzer)
- ✅ 100% - T-005 (Prompt Builder)
- ✅ 100% - T-006 (Background Switcher)
- 🔵 90% - T-007 (Scene Tracker UI Panel)
- ⚪ 0% - T-008 through T-012
