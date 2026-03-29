# docs/handoff.md

## Context Snapshot
- EverLook is a SillyTavern extension for single-character scene tracking during chat sessions.
- 6 tasks are now complete: T-000 through T-005.
- Scene state, per-chat persistence, Tech-LLM turn-pair analysis, and deterministic prompt generation are implemented and covered by Jest.
- Prompt generation now follows the required order and handles interaction tags, empty outfit fallback, and optional-field omission deterministically.
- Group chats remain explicitly out of scope for MVP.

## Active Task(s)
- T-006: Background Switcher - Acceptance: cascading search (`name+daytime+weather -> name+daytime -> name`), case-insensitive substring matching, first-match selection, ST background API set on match, warning on no match, unit tests, coverage >=80%.

## Decisions Made
- T-004 kept the analyzer decoupled from the concrete ST generation provider via injected `providerFn`.
- T-005 implements prompt generation as a pure static formatter so it can be reused by future image-hook and context-injection tasks without side effects.
- T-005 preserves the character lora trigger string casing while normalizing other textual tags to lowercase to avoid mangling external trigger syntax.

## Changes Since Last Session
- `src/prompt/PromptBuilder.js` (+108/-0): Implemented deterministic Danbooru-style prompt generation helpers.
- `tests/PromptBuilder.test.js` (+93/-0): Added coverage for ordering, interaction behavior, empty outfit fallback, optional omission, determinism, and comma hygiene.
- `jest.config.js` (+1/-0): Added `src/prompt/**/*.js` to coverage collection.
- `docs/tracker.md` (+9/-9): Marked T-005 complete and advanced backlog counts.

## Validation & Evidence
- Unit: 136/136 passing across 6 suites via `node --experimental-vm-modules ./node_modules/jest/bin/jest.js --coverage --runInBand`
- Coverage: 95.03% statements, 86.17% branches, 97.67% functions, 96.32% lines
- Prompt module coverage: `PromptBuilder.js` 100% statements, 88.09% branches, 100% functions, 100% lines
- Branch: `feature/t-005-prompt-builder`

## Risks & Unknowns
- ST Global Provider Binding: need to trace the exact SillyTavern global/provider entry point when wiring analyzer execution in `index.js` for later integration tasks. - owner: AI Assistant - review: 2026-03-31
- Background API surface still needs verification against the local SillyTavern codebase before T-006 implementation to avoid guessing unsupported calls. - owner: AI Assistant - review: 2026-03-31

## Next Steps
1. Implement T-006 Background Switcher against the documented/local ST background API.
2. Wire T-005 into the future image-generation hook (T-008) once the pipeline interception point is confirmed.
3. Reconcile or replace the stale `docs/todo.md` kickoff plan so it no longer conflicts with current tracker/handoff state.

## Status Summary
- ✅ 100% - T-000 (Documentation)
- ✅ 100% - T-001 (Project Scaffolding)
- ✅ 100% - T-002 (Scene State)
- ✅ 100% - T-003 (State Manager)
- ✅ 100% - T-004 (Turn-Pair Analyzer)
- ✅ 100% - T-005 (Prompt Builder)
- ⚪ 0% - T-006 through T-011 (not started)
