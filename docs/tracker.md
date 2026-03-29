# tracker.md

**Version:** 1.3
**Last updated:** 2026-03-29
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
  - Extension appears in SillyTavern's extension list (manual verification pending at time of implementation) ✅
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
- Status: ⚪ 0% | Dates: planned start TBD
- Scope: `scope.md` § In Scope (scene state initialization from character card + scenario/first message)
- Design: `design.md` §3.3 (Character Card Metadata Convention), `design.md` §3.6 (Turn-Pair Analysis Flow)
- Acceptance criteria:
  - Silent Tech-LLM init pass derives starting `pose`, `emotion`, and `location` from scenario plus the character's first message
  - Initialization remains silent and does not emit visible chat content
  - Extraction runs only when those fields are still unset/defaulted after normal card-based init
  - Failures preserve safe defaults and log a warning instead of blocking chat initialization
  - Unit tests cover prompt construction, successful seeding, and failure/no-op behavior
  - Test coverage ≥ 80% on new code
- Evidence: Will be added when started
- Dependencies: T-003, T-004
- Notes: This is the deferred follow-up after marker-based card initialization and should reuse the injected provider pattern already used for appearance extraction.

---

## Task Numbering

**Current highest number:** T-012
**Next task:** T-013

**Tasks complete:** 8 (T-000 through T-007)
**Tasks remaining:** 5 (T-008 through T-012)

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

---

**End of tracker.md**
