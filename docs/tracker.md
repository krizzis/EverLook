# tracker.md

**Version:** 1.4
**Last updated:** 2026-03-30
**Status:** Active task tracking - single source of truth for work items

---

## Purpose

This document tracks all tasks for EverLook, their acceptance criteria, status, owners, and evidence of completion. It is the primary reference for current implementation progress.

---

## Status Glyphs

⚪ **Not started** - Task defined but not yet begun  
🔵 **In progress** - Actively being worked on  
✅ **Done** - Completed and meets acceptance criteria  
⚠️ **Blocked** - Cannot proceed, needs intervention

---

## Completed Tasks

## T-000 - [docs] Project Documentation Bootstrap
- Owner: AI Assistant
- Status: ✅ 100% | Dates: started 2026-03-29, completed 2026-03-29
- Scope: `scope.md` (entire document)
- Design: `design.md` (entire document)
- Acceptance criteria:
  - `scope.md` created from template with all sections populated from business requirements ✅
  - `design.md` created from template with architecture, data model, module design, ADRs ✅
  - `todo.md` created from template with initial session plan and task breakdown ✅
  - `tracker.md` created with all known tasks ✅
  - `handoff.md` created with canonical schema ✅
  - All documents are internally consistent and cross-reference correctly ✅
- Evidence: Files created in `docs/` and reviewed for consistency
- Dependencies: `docs/bussiness_requirements.md` (read)

## T-001 - [infra] Project Scaffolding & Extension Bootstrap
- Owner: AI Assistant
- Status: ✅ 100% | Dates: started 2026-03-29, completed 2026-03-29
- Scope: `scope.md` § In Scope
- Design: `design.md` §3.1 (Directory Structure)
- Acceptance criteria:
  - Extension directory structure matches `design.md` §3.1 ✅
  - `manifest.json` is valid with correct metadata ✅
  - `index.js` entrypoint with proper ST imports, settings lifecycle, event hooks ✅
  - `settings.html` renders EverLook settings panel ✅
  - `style.css` referenced in manifest with ST theme-compatible styles ✅
  - Extension appears in SillyTavern's extension list ✅
- Evidence:
  - 17 files created across root, `src/`, and `tests/`
  - Settings template and root entrypoint wired successfully
  - Branch: `feat/T-001-scaffold`
- Dependencies: None

## T-002 - [feature] Scene State Data Model & Constants
- Owner: AI Assistant
- Status: ✅ 100% | Dates: started 2026-03-29, completed 2026-03-29
- Scope: `scope.md` § In Scope (scene state data model)
- Design: `design.md` §3.3 (Data Model), §3.2 (State Layer)
- Acceptance criteria:
  - `SceneState.js` implements the data model from `design.md` §3.3 ✅
  - All attributes have proper types and validation ✅
  - `constants.js` defines predefined lists for pose, emotion, action, daytime, weather ✅
  - Normalization function validates values against predefined lists ✅
  - Unit tests cover valid state creation, invalid value rejection, and null/empty handling ✅
  - Test coverage ≥ 80% on new code ✅
- Evidence:
  - `constants.js`: 100% statements, branches, functions, lines
  - `SceneState.js`: 93.81% statements, 89.78% branches, 100% functions, 93.75% lines
  - Tests passed at completion time
- Dependencies: T-001

## T-003 - [feature] State Manager: Init + Save/Restore
- Owner: AI Assistant
- Status: ✅ 100% | Dates: started 2026-03-29, completed 2026-03-29
- Scope: `scope.md` § In Scope (multi-chat sequence)
- Design: `design.md` §3.7 (Multi-Chat), §3.2 (State Layer)
- Acceptance criteria:
  - `StateManager.js` initializes from character card (`getContext().characters`) ✅
  - State saves/restores keyed by `chatId` ✅
  - State saves to `extension_settings.EverLook.chatStates` via `saveSettingsDebounced` ✅
  - Unit tests verify initialization and swap operations ✅
  - Test coverage ≥ 80% on new code ✅
- Evidence:
  - `StateManager.js` test suite passed
  - Overall coverage at completion time exceeded thresholds
- Dependencies: T-002

## T-004 - [feature] Turn-Pair Analyzer (Tech-LLM Integration)
- Owner: AI Assistant
- Status: ✅ 100% | Dates: started 2026-03-29, completed 2026-03-29
- Scope: `scope.md` § In Scope (turn-pair analysis via Tech-LLM)
- Design: `design.md` §3.6 (Turn-Pair Analysis Flow), §3.2 (Analyzer Layer)
- Acceptance criteria:
  - `TurnPairAnalyzer.js` constructs structured prompts with current turn pair + state context ✅
  - Silent request sent to Tech-LLM via ST connection API ✅
  - Parses structured JSON response (changed attributes + confidence) ✅
  - Confidence threshold gating works ✅
  - All changes/skips logged to console ✅
  - Unit tests with mocked LLM responses ✅
  - Test coverage ≥ 80% on new code ✅
- Evidence:
  - Tests passed at completion time
  - Analyzer coverage exceeded thresholds
  - Branch: `feat/T-004-turn-pair-analyzer`
- Dependencies: T-003

## T-005 - [feature] Prompt Builder (Danbooru Tag Generation)
- Owner: AI Assistant
- Status: ✅ 100% | Dates: started 2026-03-29, completed 2026-03-29
- Scope: `scope.md` § In Scope (deterministic prompt generation)
- Design: `design.md` §3.4 (Prompt Generation Logic), §3.2 (Prompt Layer)
- Acceptance criteria:
  - `PromptBuilder.js` converts scene state to Danbooru-style tag string ✅
  - Tag order matches business requirements ✅
  - `action.interaction` flag correctly controls subject/action tags ✅
  - Empty/null outfit becomes `completely nude` ✅
  - Null/empty attributes omitted ✅
  - Deterministic output ✅
  - No trailing or double commas ✅
  - Unit tests cover ordering, null handling, interaction, determinism, and comma hygiene ✅
  - Test coverage ≥ 80% on new code ✅
- Evidence:
  - `PromptBuilder.js` 100% statements, 88.09% branches, 100% functions, 100% lines
  - Full test run passed at completion time
  - Branch: `feature/t-005-prompt-builder`
- Dependencies: T-002
- Notes: Implemented as a pure formatter to keep T-008 and T-009 integration straightforward.

## T-006 - [feature] Background Switcher
- Owner: AI Assistant
- Status: ✅ 100% | Dates: started 2026-03-29, completed 2026-03-29
- Scope: `scope.md` § In Scope (dynamic background set)
- Design: `design.md` §3.5 (Background Search Strategy), §3.2 (Background Layer)
- Acceptance criteria:
  - `BackgroundSwitcher.js` implements cascading search ✅
  - Search is case-insensitive and substring-based ✅
  - Sets background via ST background API on match ✅
  - Uses first result if multiple matches ✅
  - Skips background change if no match ✅
  - Unit tests for fallback scenarios ✅
  - Test coverage ≥ 80% on new code ✅
- Evidence:
  - `BackgroundSwitcher.js`: 100% statements, 80% branches, 100% functions, 100% lines
  - Full test run: 153/153 passing across 8 suites at completion time
  - Validation command: `node --experimental-vm-modules ./node_modules/jest/bin/jest.js --coverage --runInBand`
  - Runtime seam: background inventory fetched from `/api/backgrounds/all`; apply step mirrors exported ST background state because `backgrounds.js` does not export its private setter
  - Branch: `feature/t-006-background-switcher`
- Dependencies: T-003
- Notes: Implemented with injected `listBackgroundsFn` / `applyBackgroundFn` adapters to keep matching logic testable and resilient to ST API drift.

## T-007 - [feature] Scene Tracker UI Panel
- Owner: AI Assistant
- Status: ✅ 100% | Dates: started 2026-03-29, completed 2026-03-29
- Scope: `scope.md` § In Scope (scene tracker UI)
- Design: `design.md` §3.2 (UI Layer)
- Acceptance criteria:
  - `TrackerPanel.js` renders current scene state in human-readable form ✅
  - User can edit mutable attributes (all except `characterName` and `characterLora`) ✅
  - User can reset scene state ✅
  - Panel toggleable via slash command ✅
  - Edits call `StateManager` methods (no direct state mutation) ✅
  - UI updates reactively when state changes ✅
  - Manual testing in SillyTavern confirms usability ✅
- Evidence:
  - `TrackerPanel.js` implemented with mounted side panel, reactive state subscriptions, edit/reset handlers, and slash-command toggle wiring
  - `StateManager.js` exposes subscription and baseline reset seams so the UI reacts without polling
  - Full test run: 167/167 passing across 9 suites
  - Coverage: 93.64% statements, 85.53% branches, 95.55% functions, 94.55% lines
  - UI module coverage: `TrackerPanel.js` 93.45% statements, 86.9% branches, 88.46% functions, 93.39% lines
  - Validation command: `node --experimental-vm-modules ./node_modules/jest/bin/jest.js --coverage --runInBand`
  - Manual verification completed in SillyTavern: panel mount, slash-command toggle, edit/save, reset, and reactive chat updates confirmed
- Dependencies: T-003

---

## Active / Backlog

## T-008 - [feature] Image Generation Hook
- Owner: AI Assistant
- Status: ⚪ 0% | Dates: planned start TBD
- Scope: `scope.md` § In Scope (provide input for image generation)
- Design: `design.md` §1.2 (Image Hook component)
- Acceptance criteria:
  - Intercepts SillyTavern image generation requests
  - Injects EverLook-generated prompt (from PromptBuilder) into pipeline
  - Works with ComfyUI integration
  - Manual testing confirms prompt appears in the image generation request
- Evidence: Will be added when started
- Dependencies: T-005

## T-009 - [feature] Context Injection (Scene State into Chat)
- Owner: AI Assistant
- Status: ⚪ 0% | Dates: planned start TBD
- Scope: `scope.md` § In Scope (maintain up-to-date scene context)
- Design: `design.md` §3.2 (Entry Layer - event registration)
- Acceptance criteria:
  - Current scene state injected into chat context before user message
  - Injection uses documented ST injection priorities
  - Does not conflict with other extensions
  - Manual testing confirms RP-LLM receives scene context
- Evidence: Will be added when started
- Dependencies: T-003

## T-010 - [infra] Integration Testing & End-to-End Validation
- Owner: AI Assistant
- Status: ⚪ 0% | Dates: planned start TBD
- Scope: `scope.md` § Success Metrics
- Design: `design.md` §3.8 (Testing Strategy)
- Acceptance criteria:
  - Integration tests cover init -> analysis -> state update -> prompt generation flow
  - End-to-end manual test in SillyTavern confirms full user scenario
  - All SLOs from `scope.md` verified where measurable
  - Test coverage ≥ 80% across project
- Evidence: Will be added when started
- Dependencies: T-004, T-005, T-006, T-007, T-008, T-009

## T-011 - [infra] Polish & Release Packaging
- Owner: AI Assistant
- Status: ⚪ 0% | Dates: planned start TBD
- Scope: `scope.md` § Milestones (M7)
- Design: `design.md` (full)
- Acceptance criteria:
  - `manifest.json` finalized with correct version and file references
  - All runtime files included; no dev-only files
  - README with install instructions, feature overview, and configuration guide
  - No console errors or warnings on load
  - Clean extension list appearance in SillyTavern
- Evidence: Will be added when started
- Dependencies: T-010

## T-012 - [tech-debt] Init-Time Scene Extraction for Starting Pose/Emotion/Location
- Owner: AI Assistant
- Status: 🔵 92% | Dates: started 2026-03-29, updated 2026-03-30
- Scope: `scope.md` § In Scope (scene state initialization from character card + scenario/first message)
- Design: `design.md` §3.3 (Character Card Metadata Convention), `design.md` §3.6 (Turn-Pair Analysis Flow)
- Acceptance criteria:
  - Silent Tech-LLM init pass derives starting `pose`, `emotion`, and `location` from scenario plus the character's first message
  - Silent Tech-LLM runtime wiring captures user/character turn pairs from ST events and applies accepted changes through `StateManager`
  - Confirmed location changes from init/runtime analysis trigger the background switcher automatically when auto-background is enabled
  - Initialization remains silent and does not emit visible chat content
  - Extraction runs only when those fields are still unset/defaulted after normal card-based init
  - Failures preserve safe defaults or the existing scene state and log without blocking chat initialization or chat flow
  - Unit tests cover prompt construction, successful seeding, failure/no-op behavior, turn-pair capture, runtime updates, and background sync paths
  - Test coverage ≥ 80% on new code
- Evidence:
  - Added `InitSceneExtractor.js` for silent init-time pose/emotion/location seeding
  - Added shared runtime helpers and `SceneRuntimeController.js` to wire pending user-turn capture, Tech-LLM runtime analysis, state updates, and auto-background sync
  - `index.js` now uses SillyTavern's exported `generateQuietPrompt` for appearance fallback, init extraction, and runtime turn-pair analysis
  - Full test run: 197/197 passing across 12 suites
  - Coverage: 92.15% statements, 80.79% branches, 96.39% functions, 93.02% lines
  - Stabilization pass: Variant A runtime/init prompt guidance tightened to discourage compound emotion labels, mixed weather/daytime phrases, and missed borrowed-clothing outfit changes
  - Runtime guard: `SceneRuntimeController` now catches invalid extracted change payloads during state application and logs one clear warning while preserving the existing state
  - Focused validation: 26/26 passing across `TurnPairAnalyzer`, `SceneRuntimeController`, and `InitSceneExtractor`
  - Validation command: `node --experimental-vm-modules ./node_modules/jest/bin/jest.js --coverage --runInBand`
  - Focused validation command: `node --experimental-vm-modules ./node_modules/jest/bin/jest.js tests/TurnPairAnalyzer.test.js tests/SceneRuntimeController.test.js tests/InitSceneExtractor.test.js --runInBand`
- Dependencies: T-003, T-004
- Notes: Scope expanded during the 2026-03-29 session to absorb the previously informal T-004/T-006 runtime wiring follow-up so init extraction and live runtime analysis ship as one cohesive slice. Remaining work is live SillyTavern verification of the new quiet-generation/runtime path plus extractor-quality review now tracked in T-013.

---

## T-013 - [spike] Extractor Testing & Requirement Clarification
- Owner: AI Assistant
- Status: ⚪ 0% | Dates: planned start TBD
- Scope: `scope.md` � Success Metrics (attribute change detection accuracy), `scope.md` � In Scope (turn-pair analysis via Tech-LLM)
- Design: `design.md` �2.2 (Error Handling Strategy), `design.md` �3.3 (Data Model), `design.md` �3.6 (Turn-Pair Analysis Flow), `design.md` �5.2 (Tech Debt Tracking)
- Acceptance criteria:
  - Assemble a manually verified extractor test set from real chat turn pairs covering pose, emotion, location, action, outfit, and no-change cases
  - Clarify expected extractor semantics for visible emotion labels, outfit-change rules, action vocabulary boundaries, and location normalization limits
  - Compare current extractor outputs against the verified examples and document at least the top failure patterns with reproduction text
  - Recommend prompt, schema, vocabulary, or post-processing changes with explicit tradeoffs
  - Session produces docs/test-plan artifacts only; no production code changes are made during the clarification pass
- Evidence: Will be added when started
- Dependencies: T-012

---

## Task Numbering

**Current highest number:** T-013  
**Next task:** T-014

**Tasks complete:** 8 (T-000 through T-007)  
**Tasks remaining:** 6 (T-008 through T-013)

---

## Changelog

| Date | Changes | Author |
|------|---------|--------|
| 2026-03-29 | Initial tracker created with T-000 through T-011 | AI Assistant |
| 2026-03-29 | T-001 completed - moved to Completed section with evidence | AI Assistant |
| 2026-03-29 | T-004 moved into Completed Tasks; tracker metadata aligned to T-005 as next implementation task | AI Assistant |
| 2026-03-29 | T-005 completed - prompt builder implementation and evidence recorded | AI Assistant |
| 2026-03-29 | Added T-012 for deferred silent init extraction of starting pose, emotion, and location | AI Assistant |
| 2026-03-29 | T-006 completed - background switcher implemented with injected ST runtime adapters and Jest coverage evidence | AI Assistant |
| 2026-03-29 | T-007 advanced to in-progress with implemented tracker panel, reactive state seam, slash command toggle, and full Jest evidence | AI Assistant |
| 2026-03-29 | T-007 completed after manual SillyTavern verification confirmed tracker panel usability | AI Assistant |
| 2026-03-29 | T-012 advanced to in-progress after adding silent init extraction, live runtime Tech-LLM wiring, background sync integration, and full Jest coverage evidence | AI Assistant |
| 2026-03-30 | T-012 stabilization pass tightened Variant A prompts, added runtime validation-guard behavior, and introduced T-013 for extractor testing/requirements clarification | AI Assistant |

---

**End of tracker.md**
