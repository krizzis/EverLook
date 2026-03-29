# todo.md

**Session Date:** 2026-03-29  
**Time Budget:** 2-3 hours  
**Session Goal:** Implement T-005 Prompt Builder and leave the project ready for T-006

---

## Active Tasks for This Session

### T-005 - Prompt Builder (Danbooru Tag Generation)

**Acceptance criteria:**
- `src/prompt/PromptBuilder.js` converts scene state to a Danbooru-style tag string
- Tag order matches design.md Section 3.4: subject -> appearance -> pose -> outfit -> emotion -> action -> background -> lora
- `action.interaction` correctly controls subject and action tags
- Empty or null outfit normalizes to `completely nude`
- Null or empty attributes are omitted from output
- Output is deterministic for identical input
- Output has no trailing commas or double commas
- `tests/PromptBuilder.test.js` covers ordering, null handling, interaction handling, and determinism
- Changed-lines test coverage >= 80%

**Session-specific notes:**
- `src/prompt/PromptBuilder.js` currently exists only as a placeholder scaffold
- Keep the module pure: no DOM access, no state reads, no side effects
- Reuse `SceneState` shape exactly as defined in `docs/design.md` Section 3.3

**Expected progress this session:**
- Complete implementation and unit tests
- Record evidence in `docs/tracker.md`

---

### T-006 - Background Switcher (follow only if T-005 finishes early)

**Acceptance criteria:**
- `src/background/BackgroundSwitcher.js` implements cascading search: name+daytime+weather -> name+daytime -> name
- Search is case-insensitive and substring-based
- First matching background is selected
- Missing matches log a warning and do not throw
- Unit tests cover primary and fallback search paths
- Changed-lines test coverage >= 80%

**Session-specific notes:**
- This task is blocked on nothing structural, but it is lower priority than completing T-005 cleanly
- Keep any SillyTavern background API dependency injectable or mockable for tests

**Expected progress this session:**
- Only start if T-005 is fully validated and documented

---

## Session Priorities

**Must complete (P0):**
- T-005 - Prompt Builder

**Should complete (P1):**
- Update tracker and handoff with T-005 evidence after validation

**Could complete if time permits (P2):**
- Start T-006 background search logic and tests

---

## Context for This Session

**What happened last session:**
- T-004 finished successfully with analyzer prompt construction, provider injection, response parsing, and confidence-threshold filtering
- Repository structure already includes placeholders for prompt, background, and UI modules
- Tests and coverage tooling are already configured through Jest

**Current blockers/dependencies:**
- No blocker for T-005
- T-006 runtime integration will still need SillyTavern background API confirmation later
- T-009 still carries a known unknown around the exact ST provider binding in `index.js`

**Environment notes:**
- Project branch should be a fresh `feature/<slug>` branch before implementation
- Use the existing Jest setup; no new test framework is needed

---

## Success Criteria for This Session

By end of session, we should have:
- [ ] `src/prompt/PromptBuilder.js` implemented
- [ ] `tests/PromptBuilder.test.js` implemented and passing
- [ ] Test output recorded with coverage >= 80%
- [ ] `docs/tracker.md` updated with T-005 status and evidence
- [ ] `docs/handoff.md` updated with the next active task

If we do not complete everything:
- Minimum viable progress: prompt builder implementation plus failing or partial tests documented clearly
- Do not begin T-006 unless T-005 is complete and evidence is captured

---

## Time Boxing

**Estimated breakdown:**
- T-005 implementation: 60 minutes
- T-005 unit tests: 45 minutes
- Validation and tracker/handoff updates: 20 minutes
- Optional T-006 start: 30-45 minutes

---

## Notes & Reminders

**Before starting:**
- [ ] Re-read `docs/design.md` Section 3.4 for prompt ordering rules
- [ ] Confirm `SceneState` field names in `src/state/SceneState.js`
- [ ] Create a task branch if not already on one

**During session:**
- [ ] Keep prompt generation deterministic
- [ ] Avoid introducing business logic into `index.js`
- [ ] Add tests alongside implementation, not afterward

**After session:**
- [ ] Capture exact validation command and full output
- [ ] Update `docs/tracker.md` with evidence and status
- [ ] Refresh `docs/handoff.md` using the canonical schema in `docs/methodology.md` Section 4

---

## Upcoming Tasks

- **T-006**: Background Switcher - Cascading search plus SillyTavern background API integration
- **T-007**: Scene Tracker UI - Panel rendering, edit, reset, slash command toggle
- **T-008**: Image Generation Hook - Inject EverLook prompt into the ST image pipeline
- **T-009**: Context Injection - Inject current scene state into chat context before user message
- **T-010**: Integration Testing - End-to-end validation for the full scene flow
- **T-011**: Polish and Release Packaging - README, manifest finalization, runtime QA

---

**End of todo.md**
