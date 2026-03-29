# todo.md

**Session Date:** 2026-03-29  
**Time Budget:** 2-3 hours  
**Session Goal:** Keep post-T-005 follow-up work visible while preparing for T-006 and remaining init-time extraction gaps

---

## Active Tasks for This Session

### T-006 - Background Switcher

**Acceptance criteria:**
- `src/background/BackgroundSwitcher.js` implements cascading search: name+daytime+weather -> name+daytime -> name
- Search is case-insensitive and substring-based
- First matching background is selected
- Missing matches log a warning and do not throw
- Unit tests cover primary and fallback search paths
- Changed-lines test coverage >= 80%

**Session-specific notes:**
- Background API surface still needs confirmation against local SillyTavern code before runtime wiring
- Keep any SillyTavern background API dependency injectable or mockable for tests

**Expected progress this session:**
- Complete search logic and tests
- Record runtime API findings and evidence in `docs/tracker.md`

---

### T-012 - Init-Time Scene Extraction Follow-Up

**Acceptance criteria:**
- Silent Tech-LLM prompt derives starting `pose`, `emotion`, and `location` from scenario plus the character's first message
- Initialization remains silent and does not inject visible chat messages
- Extraction runs only when starting fields are still unset/defaulted
- Failures preserve existing defaults and log a warning instead of blocking chat init
- Unit tests cover prompt construction, fallback/no-op behavior, and successful state seeding
- Changed-lines test coverage >= 80%

**Session-specific notes:**
- This is a follow-up TODO, not the current active task
- Source text should come from scenario plus the first character message, not the full card description
- Reuse the existing injected-provider pattern so runtime binding stays swappable

**Expected progress this session:**
- Leave explicit TODOs in code/docs so the work can be picked up cleanly after T-006 if not started sooner

---

## Session Priorities

**Must complete (P0):**
- T-006 - Background Switcher

**Should complete (P1):**
- Keep init-time extraction follow-up visible in docs and code TODOs

**Could complete if time permits (P2):**
- Start T-012 init-time pose/emotion/location extraction design spike

---

## Context for This Session

**What happened last session:**
- T-005 finished successfully with deterministic prompt generation and test coverage
- Character initialization gained marker parsing for `[APPEARANCE]`, `[LORA]`, and `[OUTFIT]`
- Appearance fallback now has an injected silent extractor path, but other init-time scene fields are still default-seeded

**Current blockers/dependencies:**
- T-006 runtime integration will still need SillyTavern background API confirmation later
- T-012 depends on confirming the exact scenario/first-message sources and Tech-LLM binding in `index.js`

**Environment notes:**
- Project branch should be a fresh `feature/<slug>` branch before implementation
- Use the existing Jest setup; no new test framework is needed

---

## Success Criteria for This Session

By end of session, we should have:
- [ ] `src/background/BackgroundSwitcher.js` implemented
- [ ] `tests/BackgroundSwitcher.test.js` implemented and passing
- [ ] Test output recorded with coverage >= 80%
- [ ] `docs/tracker.md` updated with T-006 status and evidence
- [ ] T-012 follow-up is explicitly captured in docs/code TODOs

If we do not complete everything:
- Minimum viable progress: documented API findings for T-006 and explicit TODO coverage for T-012
- Do not start T-012 runtime wiring without confirming the ST provider entry point

---

## Time Boxing

**Estimated breakdown:**
- T-006 implementation: 60 minutes
- T-006 unit tests: 45 minutes
- Validation and tracker/handoff updates: 20 minutes
- Optional T-012 design/trace pass: 30-45 minutes

---

## Notes & Reminders

**Before starting:**
- [ ] Re-read `docs/design.md` Section 3.5 for background search rules
- [ ] Confirm available SillyTavern background API calls from local source
- [ ] Keep T-012 source inputs limited to scenario + first character message

**During session:**
- [ ] Keep runtime dependencies injectable for tests
- [ ] Avoid blocking chat init on silent extractor failures
- [ ] Add tests alongside implementation, not afterward

**After session:**
- [ ] Capture exact validation command and full output
- [ ] Update `docs/tracker.md` with evidence and status
- [ ] Refresh `docs/handoff.md` using the canonical schema in `docs/methodology.md` Section 4

---

## Upcoming Tasks

- **T-006**: Background Switcher - Cascading search plus SillyTavern background API integration
- **T-012**: Init-Time Scene Extraction - Silent Tech-LLM pass for starting pose, emotion, and location
- **T-007**: Scene Tracker UI - Panel rendering, edit, reset, slash command toggle
- **T-008**: Image Generation Hook - Inject EverLook prompt into the ST image pipeline
- **T-009**: Context Injection - Inject current scene state into chat context before user message
- **T-010**: Integration Testing - End-to-end validation for the full scene flow

---

**End of todo.md**
