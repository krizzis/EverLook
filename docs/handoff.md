# handoff.md (canonical schema v1.1)

## Context Snapshot
- EverLook is a SillyTavern extension for scene state tracking during chat sessions (single active character)
- 4 tasks complete (T-000, T-001, T-002, T-003); 8 remaining (T-004 through T-011)
- Data model (SceneState) and multi-chat persistence (StateManager) are implemented and fully unit-tested.
- Extension initialization and `CHAT_CHANGED` hooks are wired to automatically read the current character and revive/create SceneState.
- Group chats explicitly out of scope for MVP.

## Active Task(s)
- T-003: State Manager: Init + Save/Restore — ✅ Complete.

## Decisions Made
- **Extension init pattern**: Use jQuery(async () => {...}) with direct extension_settings access. Do NOT call loadExtensionSettings().
- **Validation strategy (T-002)**: Strict type validation + advisory value-list validation for pose/emotion/action. Strict validation for daytime/weather.
- **Immutable state pattern (T-002)**: SceneState.update() returns new frozen instances — never mutates.
- **Debounced Save (T-003)**: Relies on ST's `saveSettingsDebounced()` callback to safely queue multi-chat switches without lagging UI.
- **ST Module Mocking (T-003)**: Configured Jest `moduleNameMapper` natively to hijack `../../../../extensions.js` during unit testing, creating a clean mock boundary.
- **Character Appearance Defaults (T-003)**: In absence of specialized extension structures, uses standard ST `.name`, `.description` (for appearance) and `.creator_notes` (for LoRA extraction fallback).

## Changes Since Last Session
- `src/state/StateManager.js` (NEW): Singleton manager handling SceneState. Init via `initChat()`, save payload via `#saveState()`.
- `index.js` (MODIFIED): Wired ST event hook `CHAT_CHANGED` into `StateManager`.
- `tests/StateManager.test.js` (NEW): Full Jest suite handling mock validation across initialization, state upgrades, backwards fallback, and corrupt data loads.
- `tests/__mocks__/extensions.js` (NEW): Module file to spoof ST's root module system safely in isolated environment.
- `jest.config.js` (MODIFIED): Attached `moduleNameMapper` mappings to correctly direct ST mock modules locally.

## Validation & Evidence
- Unit Tests: 132/132 tests green (6 suites)
- Coverage: 93.8% Statements, 87.1% Branches. Global values above 80% threshold required by SSOT.
- Branch: `feat/T-003-state-manager`

## Risks & Unknowns
- Appearance and LoRA extraction limits: We rely on default ST objects (`description`, `creator_notes`). If users operate distinct World Info or regex extensions that overwrite these attributes heavily, further configuration may be required (Ongoing).
- Tech-LLM prompt design for structured JSON output — owner: AI Assistant — review: T-004

## Next Steps
1. Execute T-004: Turn-Pair Analyzer (Tech-LLM Integration). Sends previous system response and user message to Tech-LLM to parse mutations.
2. Formulate `tests/TurnPairAnalyzer.test.js` structure against mocked `sendGenerationRequest()`.

## Status Summary
- ✅ 100% — T-000 (Documentation) complete
- ✅ 100% — T-001 (Project Scaffolding) complete — branch: `feat/T-001-scaffold`
- ✅ 100% — T-002 (Scene State) complete — branch: `feat/T-002-scene-state`
- ✅ 100% — T-003 (State Manager) complete — branch: `feat/T-003-state-manager`
- ⚪ 0% — T-004 through T-011 (not started)
