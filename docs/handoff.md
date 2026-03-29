# handoff.md (canonical schema v1.1)

## Context Snapshot
- EverLook is a SillyTavern extension for scene state tracking during chat sessions (single active character)
- Project scaffolding completed (T-001): full directory structure, manifest, entry point, settings, styles
- Extension successfully loads and initializes automatically in SillyTavern 1.16.0
- Settings panel renders with all controls (General, Scene Analysis, Background sections) — verified via browser
- Architecture defined: 6 modules (StateManager, TurnPairAnalyzer, PromptBuilder, BackgroundSwitcher, TrackerPanel, ImageHook)
- All module placeholder files created with JSDoc headers and TODO references
- 2 tasks complete (T-000, T-001); 10 remaining (T-002 through T-011)
- Group chats explicitly out of scope for MVP

## Active Task(s)
- T-002: Scene State Data Model & Constants — Acceptance: SceneState.js implements design.md §3.3, constants.js defines value lists, normalization validates values, unit tests ≥80% coverage

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

## Changes Since Last Session
- index.js (+200/-193): Fixed critical init bug — removed loadExtensionSettings() call (global API, not per-extension), added try/catch error boundary, improved JSDoc
- docs/scope.md (+1): Added SillyTavern local URL (http://127.0.0.1:8088/)
- docs/design.md (+1): Added SillyTavern local URL (http://127.0.0.1:8088/)
- Created directory junction: `E:\AI_Tools\SillyTavern\public\scripts\extensions\third-party\EverLook` → `E:\AI_Tools\SoulForge_project\repo\EverLook`

## Validation & Evidence
- Extension loads automatically on SillyTavern page load — no console errors
- Console confirms: `[EverLook] Extension initialized` and `[EverLook] App ready — extension loaded`
- Settings panel visible in Extensions drawer with all controls functional:
  - Enable extension checkbox ✅
  - Enable debug logging checkbox (unchecked)
  - Confidence threshold slider at 0.50
  - Auto-update background checkbox ✅
- Browser verification screenshots captured (see walkthrough.md)
- Directory junction verified: `Get-Item` shows `LinkType: Junction`

## Risks & Unknowns
- Character card data structure for appearance extraction — not yet inspected — owner: AI Assistant — review: T-002
- Tech-LLM prompt design for structured JSON output — may need iteration — owner: AI Assistant — review: T-004
- Outfit attribute instability (per business requirements: "structure is subject to change") — owner: AI Assistant — review: ongoing

## Next Steps
1. Execute T-002: Implement SceneState data model + constants.js with predefined value lists + unit tests
2. Execute T-003: Implement StateManager with init from character card, save/restore per chatId
3. Verify settings persistence: toggle settings, refresh page, confirm values restored

## Status Summary
- ✅ 100% — T-000 (Documentation Bootstrap) complete
- ✅ 100% — T-001 (Project Scaffolding) complete — branch: `feat/T-001-scaffold`
- ⚪ 0% — T-002 through T-011 (not started)
