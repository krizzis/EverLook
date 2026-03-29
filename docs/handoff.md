# handoff.md (canonical schema v1.1)

## Context Snapshot
- EverLook is a SillyTavern extension for scene state tracking during chat sessions (single active character)
- Project scaffolding completed (T-001): full directory structure, manifest, entry point, settings, styles
- Scene state data model completed (T-002): SceneState.js + constants.js with full validation and unit tests
- Extension successfully loads and initializes automatically in SillyTavern 1.16.0
- Settings panel renders with all controls (General, Scene Analysis, Background sections)
- Architecture defined: 6 modules (StateManager, TurnPairAnalyzer, PromptBuilder, BackgroundSwitcher, TrackerPanel, ImageHook)
- Jest test infrastructure established (package.json + jest.config.js) — ESM support via --experimental-vm-modules
- 3 tasks complete (T-000, T-001, T-002); 9 remaining (T-003 through T-011)
- Group chats explicitly out of scope for MVP

## Active Task(s)
- T-003: State Manager: Init + Save/Restore — Acceptance: StateManager.js initializes from character card, saves/restores per chatId, calls saveSettingsDebounced(), unit tests ≥80% coverage

## Decisions Made
- Client-side ST extension architecture (ADR-001: design.md §7.1)
- Tech-LLM for scene analysis over rule-based extraction (ADR-002: design.md §7.2)
- Danbooru tag normalization for prompt output (ADR-003: design.md §7.3)
- Modular architecture with 6 components (design.md §1.2)
- Scene state data model with typed attributes and predefined value lists (design.md §3.3)
- Settings stored under `extension_settings['EverLook']` with defaultSettings merge pattern (index.js)
- Events registered: APP_READY, CHAT_CHANGED, MESSAGE_RECEIVED, MESSAGE_SENT (index.js)
- **Extension init pattern**: Use jQuery(async () => {...}) with direct extension_settings access. Do NOT call loadExtensionSettings() — it's a global bootstrap function, not per-extension API
- **Template rendering**: Third-party extensions need `'third-party/EverLook'` prefix for renderExtensionTemplateAsync
- **Development setup**: Directory junction from ST install path to repo (not symlink — avoids admin requirement)
- **Validation strategy (T-002)**: Strict type validation + advisory value-list validation (warn on unknown pose/emotion/action, but accept). Strict validation for daytime/weather (drives background search — reject unknowns, fallback to default)
- **Immutable state pattern (T-002)**: SceneState.update() returns new frozen instances — never mutates. Aligns with design.md §2.1 ("state updates are atomic")
- **Outfit flexibility (T-002)**: Outfit is string[] with type-only validation (no value-list check) — structure subject to change per business requirements
- **Test infrastructure (T-002)**: Jest 29 with ESM support via `node --experimental-vm-modules`. Windows: use `./node_modules/jest/bin/jest.js` directly (not `.bin/jest` which is a bash script)

## Changes Since Last Session
- src/state/constants.js (+175/-3): Complete implementation — POSES, EMOTIONS, ACTIONS, DAYTIMES, WEATHER arrays + normalize/isValidValue/normalizeAndWarn/normalizeStrict helpers
- src/state/SceneState.js (+303/-5): Complete implementation — SceneState class with create/createDefault/fromJSON factories, immutable update(), toJSON(), validate(), full normalization
- package.json (+12/-0): [NEW] Dev-only package.json with Jest
- jest.config.js (+14/-0): [NEW] Jest config for ESM + 80% coverage threshold
- tests/constants.test.js (+193/-0): [NEW] Comprehensive constants test suite (26 tests)
- tests/SceneState.test.js (+350/-15): Complete test suite (81 tests) covering factory, validation, immutability, updates, serialization

## Validation & Evidence
- Unit: 107/107 passing, 0 failed — 5 test suites all green
- Coverage: constants.js 100%/100%/100%/100% | SceneState.js 93.81%/89.78%/100%/93.75%
- Overall: 95.27% statements, 90.96% branches, 100% functions, 95.23% lines (exceeds 80% threshold)
- Branch: `feat/T-002-scene-state`

## Risks & Unknowns
- Character card data structure for appearance extraction — not yet inspected — owner: AI Assistant — review: T-003
- Tech-LLM prompt design for structured JSON output — may need iteration — owner: AI Assistant — review: T-004
- Outfit attribute instability (per business requirements: "structure is subject to change") — owner: AI Assistant — review: ongoing
- StateManager.js has 0% coverage (placeholder only — will be implemented in T-003)

## Next Steps
1. Execute T-003: Implement StateManager with init from character card, save/restore per chatId
2. Execute T-005: Implement PromptBuilder (depends on T-002, now complete)
3. Verify settings persistence: toggle settings, refresh page, confirm values restored

## Status Summary
- ✅ 100% — T-000 (Documentation Bootstrap) complete
- ✅ 100% — T-001 (Project Scaffolding) complete — branch: `feat/T-001-scaffold`
- ✅ 100% — T-002 (Scene State Data Model & Constants) complete — branch: `feat/T-002-scene-state`
- ⚪ 0% — T-003 through T-011 (not started)
