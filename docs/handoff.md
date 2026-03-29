# handoff.md (canonical schema v1.1)

## Context Snapshot
- EverLook is a SillyTavern extension for scene state tracking during chat sessions (single active character)
- 5 tasks complete (T-000, T-001, T-002, T-003, T-004); 7 remaining (T-005 through T-011)
- Data model (SceneState) and multi-chat persistence (StateManager) are fully implemented.
- Turn-Pair Analyzer (Tech-LLM) integration is complete, parsing prompts safely with confidence threshold gating.
- Group chats explicitly out of scope for MVP.

## Active Task(s)
- T-004: Turn-Pair Analyzer (Tech-LLM Integration) — ✅ Complete.

## Decisions Made
- **LLM Decoupling (T-004):** Abstracted ST's internal text generation function away from the Analyzer, enabling `providerFn` DI during `.setup()`.
- **Confidence Output Gating (T-004):** Only extracts keys matching the required schema if confidence is >= threshold. Values are lowercased internally before returning to state manager to ensure Danbooru compliance.
- **Fail Gracefully Strategy (T-004):** Catches parse/malformed failures and empty output silently (logs to console), allowing fallback without disrupting chatter logic.

## Changes Since Last Session
- `src/analyzer/prompts.js` (NEW): Built structured instruction guidelines (`SYSTEM_PROMPT`) to enforce exact schema extraction from the LLM.
- `src/analyzer/TurnPairAnalyzer.js` (NEW): Constructed the service to map `TurnPair` elements, execute queries against the `providerFn`, and parse filtered state.
- `tests/TurnPairAnalyzer.test.js` (NEW): Tested full validation and extraction paths, including threshold filtering and provider failures.
- `jest.config.js` (MODIFIED): Added `src/analyzer/**/*.js` to `.collectCoverageFrom`.

## Validation & Evidence
- Unit: 134/134 passing — Coverage: 94.64% Statements (Analyzer module specifically: 94.44% Stmts, 84.61% Branch)
- Logs: Jest run clean, verified fallback paths via console mock asserts. 
- Branch: `feat/T-004-turn-pair-analyzer`

## Risks & Unknowns
- ST Global Provider Binding: Need to trace exactly which global ST object exposes the text generator inside `index.js` when we wire it later (T-009). Will trace `window.sendGenerationRequest` or similar. — owner: AI Assistant — review: 2026-03-31

## Next Steps
1. Execute T-005: Prompt Builder (Danbooru Tag Generation). Converts scene state object to Danbooru format via structured fallback rules.
2. Execute T-006: Background Switcher. Implement cascading background search based on location attribute changes.

## Status Summary
- ✅ 100% — T-000 (Documentation)
- ✅ 100% — T-001 (Project Scaffolding)
- ✅ 100% — T-002 (Scene State)
- ✅ 100% — T-003 (State Manager)
- ✅ 100% — T-004 (Turn-Pair Analyzer)
- ⚪ 0% — T-005 through T-011 (not started)
