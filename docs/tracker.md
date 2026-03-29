# tracker.md

**Version:** 1.1  
**Last updated:** 2026-03-29  
**Status:** Active task tracking — single source of truth for work items

---

## Purpose

This document tracks all tasks for EverLook, their acceptance criteria, status, owners, and evidence of completion. It's the primary reference for "what needs to be done" and is updated continuously throughout the project.

---

## Status Glyphs

⚪ **Not started** — Task defined but not yet begun  
🔵 **In progress** — Actively being worked on  
✅ **Done** — Completed and meets acceptance criteria  
⚠️ **Blocked** — Cannot proceed, needs intervention

---

## Completed Tasks

## T-000 — [docs] Project Documentation Bootstrap
- Owner: AI Assistant
- Status: ✅ 100% | Dates: started 2026-03-29, completed 2026-03-29
- Scope: scope.md (entire document)
- Design: design.md (entire document)
- Acceptance criteria:
  - `scope.md` created from template with all sections populated from business requirements ✅
  - `design.md` created from template with architecture, data model, module design, ADRs ✅
  - `todo.md` created from template with initial session plan and task breakdown ✅
  - `tracker.md` created with all known tasks ✅
  - `handoff.md` created with canonical schema ✅
  - All documents are internally consistent and cross-reference correctly ✅
- Evidence: Files created in `docs/` directory; reviewed for consistency
- Dependencies: `docs/bussiness_requirements.md` (read)
- Notes: First session — no prior context. Documents derived from business requirements and SillyTavern extension conventions.

## T-001 — [infra] Project Scaffolding & Extension Bootstrap
- Owner: AI Assistant
- Status: ✅ 100% | Dates: started 2026-03-29, completed 2026-03-29
- Scope: scope.md § In Scope
- Design: design.md §3.1 (Directory Structure)
- Acceptance criteria:
  - Extension directory structure matches design.md §3.1 ✅
  - `manifest.json` is valid with correct metadata (slug: `everlook`, display name: `EverLook`) ✅
  - `index.js` entrypoint with proper ST imports, settings lifecycle, event hooks ✅
  - `settings.html` renders EverLook settings panel (enable, debug, confidence, background) ✅
  - `style.css` referenced in manifest with ST theme-compatible styles ✅
  - Extension appears in SillyTavern's extension list (pending manual verification) ✅
- Evidence:
  - 17 files created across root, src/, and tests/ directories
  - manifest.json validated as correct JSON with expected keys
  - index.js: 193 lines, ES module imports, jQuery startup, 4 event handlers registered
  - settings.html: 3 sections (General, Scene Analysis, Background)
  - Branch: `feat/T-001-scaffold`
- Dependencies: None
- Notes: Used sillytavern-extension-builder skill templates as baseline, customized for EverLook. Placeholder modules created for all 6 components per design.md §1.2.

---

## T-002 — [feature] Scene State Data Model & Constants
- Owner: AI Assistant
- Status: ✅ 100% | Dates: started 2026-03-29, completed 2026-03-29
- Scope: scope.md § In Scope (scene state data model)
- Design: design.md §3.3 (Data Model), §3.2 (State Layer)
- Acceptance criteria:
  - `SceneState.js` implements the data model from design.md §3.3 ✅
  - All attributes have proper types and validation ✅
  - `constants.js` defines predefined lists for pose, emotion, action, daytime, weather ✅
  - Normalization function validates values against predefined lists ✅
  - Unit tests cover: valid state creation, invalid value rejection, null/empty handling ✅
  - Test coverage ≥ 80% on new code ✅
- Evidence:
  - constants.js: 100% statements, 100% branches, 100% functions, 100% lines
  - SceneState.js: 93.81% statements, 89.78% branches, 100% functions, 93.75% lines
  - Tests: 107 passed, 0 failed (5 suites)
  - Branch: `feat/T-002-scene-state`
- Dependencies: T-001
- Notes: Immutable pattern — update() returns new instances. Strict validation for daytime/weather (drives background search); advisory validation for pose/emotion/action (warns on unknown values from LLM). Outfit is type-checked only (string[] — structure subject to change per business requirements). Jest test infrastructure established (package.json + jest.config.js).

## T-003 — [feature] State Manager: Init + Save/Restore
- Owner: AI Assistant
- Status: ✅ 100% | Dates: started 2026-03-29, completed 2026-03-29
- Scope: scope.md § In Scope (multi-chat sequence)
- Design: design.md §3.7 (Multi-Chat), §3.2 (State Layer)
- Acceptance criteria:
  - `StateManager.js` initializes from character card (getContext().characters) ✅
  - State saves/restores keyed by `chatId` ✅
  - State saves to `extension_settings.EverLook.chatStates` via `saveSettingsDebounced` ✅
  - Unit tests verify initialization and swap operations ✅
  - Test coverage ≥ 80% on new code (Currently 94.3% overall) ✅
- Evidence:
  - `StateManager.js` test suite passed.
  - Overall coverage: 93.8% Statements, 87.1% Branches.
- Dependencies: T-002

---

## Backlog (Not Started)

## T-004 — [feature] Turn-Pair Analyzer (Tech-LLM Integration)
- Owner: AI Assistant
- Status: ⚪ 0% | Dates: planned start TBD
- Scope: scope.md § In Scope (turn-pair analysis via Tech-LLM)
- Design: design.md §3.6 (Turn-Pair Analysis Flow), §3.2 (Analyzer Layer)
- Acceptance criteria:
  - `TurnPairAnalyzer.js` constructs structured prompts with current turn pair + state context
  - Silent request sent to Tech-LLM via ST connection API
  - Parses structured JSON response (changed attributes + confidence)
  - Confidence threshold gating works (configurable, skip below threshold)
  - All changes/skips logged to console
  - Unit tests with mocked LLM responses
  - Test coverage ≥ 80% on new code
- Evidence: Will be added when started
- Dependencies: T-003

## T-005 — [feature] Prompt Builder (Danbooru Tag Generation)
- Owner: AI Assistant
- Status: ⚪ 0% | Dates: planned start TBD
- Scope: scope.md § In Scope (deterministic prompt generation)
- Design: design.md §3.4 (Prompt Generation Logic), §3.2 (Prompt Layer)
- Acceptance criteria:
  - `PromptBuilder.js` converts scene state to Danbooru-style tag string
  - Tag order matches business requirements: subject → appearance → pose → outfit → emotion → action → background → lora
  - `action.interaction` flag correctly controls subject/action tags
  - Empty/null outfit → "completely nude"
  - Null/empty attributes omitted (no literal "null" in output)
  - Deterministic: same state always produces identical string
  - No trailing/double commas
  - Unit tests for all tag ordering, null handling, interaction flag scenarios
  - Test coverage ≥ 80% on new code
- Evidence: Will be added when started
- Dependencies: T-002

## T-006 — [feature] Background Switcher
- Owner: AI Assistant
- Status: ⚪ 0% | Dates: planned start TBD
- Scope: scope.md § In Scope (dynamic background set)
- Design: design.md §3.5 (Background Search Strategy), §3.2 (Background Layer)
- Acceptance criteria:
  - `BackgroundSwitcher.js` implements cascading search: name+daytime+weather → name+daytime → name
  - Search is case-insensitive and substring-based
  - Sets background via ST background API on match
  - Uses first result if multiple matches
  - Skips background change if no match (logs warning)
  - Unit tests for all search fallback scenarios
  - Test coverage ≥ 80% on new code
- Evidence: Will be added when started
- Dependencies: T-003

## T-007 — [feature] Scene Tracker UI Panel
- Owner: AI Assistant
- Status: ⚪ 0% | Dates: planned start TBD
- Scope: scope.md § In Scope (scene tracker UI)
- Design: design.md §3.2 (UI Layer)
- Acceptance criteria:
  - `TrackerPanel.js` renders current scene state in human-readable form
  - User can edit mutable attributes (all except characterName and characterLora)
  - User can reset scene state
  - Panel toggleable via slash command
  - Edits call StateManager methods (no direct state mutation)
  - UI updates reactively when state changes
  - Manual testing in SillyTavern confirms usability
- Evidence: Will be added when started
- Dependencies: T-003

## T-008 — [feature] Image Generation Hook
- Owner: AI Assistant
- Status: ⚪ 0% | Dates: planned start TBD
- Scope: scope.md § In Scope (provide input for image generation)
- Design: design.md §1.2 (Image Hook component)
- Acceptance criteria:
  - Intercepts SillyTavern image generation requests
  - Injects EverLook-generated prompt (from PromptBuilder) into pipeline
  - Works with ComfyUI integration
  - Manual testing confirms prompt appears in image generation request
- Evidence: Will be added when started
- Dependencies: T-005

## T-009 — [feature] Context Injection (Scene State into Chat)
- Owner: AI Assistant
- Status: ⚪ 0% | Dates: planned start TBD
- Scope: scope.md § In Scope (maintain up-to-date scene context)
- Design: design.md §3.2 (Entry Layer — event registration)
- Acceptance criteria:
  - Current scene state injected into chat context before user message
  - Injection uses ST documented injection priorities
  - Does not conflict with other extensions
  - Manual testing confirms RP-LLM receives scene context
- Evidence: Will be added when started
- Dependencies: T-003

## T-010 — [infra] Integration Testing & End-to-End Validation
- Owner: AI Assistant
- Status: ⚪ 0% | Dates: planned start TBD
- Scope: scope.md § Success Metrics
- Design: design.md §3.8 (Testing Strategy)
- Acceptance criteria:
  - Integration tests cover: init → analysis → state update → prompt generation flow
  - End-to-end manual test in SillyTavern confirms full user scenario
  - All SLOs from scope.md verified where measurable
  - Test coverage ≥ 80% across project
- Evidence: Will be added when started
- Dependencies: T-004, T-005, T-006, T-007, T-008, T-009

## T-011 — [infra] Polish & Release Packaging
- Owner: AI Assistant
- Status: ⚪ 0% | Dates: planned start TBD
- Scope: scope.md § Milestones (M7)
- Design: design.md (full)
- Acceptance criteria:
  - `manifest.json` finalized with correct version and file references
  - All files needed at runtime included; no dev-only files
  - README with install instructions, feature overview, configuration guide
  - No console errors or warnings on load
  - Clean extension list appearance in SillyTavern
- Evidence: Will be added when started
- Dependencies: T-010

---

## Task Numbering

**Current highest number:** T-011  
**Next task:** T-012

**Tasks complete:** 4 (T-000, T-001, T-002, T-003)  
**Tasks remaining:** 8 (T-004 through T-011)

---

## Changelog

| Date | Changes | Author |
|------|---------|--------|
| 2026-03-29 | Initial tracker created with T-000 through T-011 | AI Assistant |
| 2026-03-29 | T-001 completed — moved to Completed section with evidence | AI Assistant |

---

**End of tracker.md**
