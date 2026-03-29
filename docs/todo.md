# todo.md

**Session Date:** 2026-03-29
**Time Budget:** 2-3 hours
**Session Goal:** Finish live verification and close out the expanded T-012 slice after the init-time extractor and runtime Tech-LLM wiring landed.

---

## Active Tasks for Next Session

### T-012 - Manual Verification / Closeout

**Acceptance criteria:**
- Fresh-chat startup silently seeds `pose`, `emotion`, and `location` from scenario plus the first character message
- Normal user/character turns silently trigger runtime Tech-LLM analysis and update state through `StateManager`
- Confirmed location changes trigger auto-background sync when enabled
- Failures preserve state/defaults and do not inject visible chat messages
- Live SillyTavern verification confirms the new quiet-generation/runtime path behaves as expected

**Next-session notes:**
- Code and automated validation are complete on branch `feature/t-012-tech-llm-runtime`
- Remaining work is live SillyTavern verification for the new `generateQuietPrompt`-backed init/runtime path
- Focus on fresh chat creation, first-message seeding, follow-up turn updates, and auto-background behavior

**Expected progress next session:**
- Validate T-012 end-to-end in SillyTavern and collect exact pass/fail evidence
- If verification is clean, update `tracker.md` and `handoff.md` to mark T-012 done
- If edge cases show up, adjust prompt/turn-pair logic and rerun tests

---

### Next Feature Selection

**Acceptance criteria:**
- One next major slice is chosen after T-012 closes: either T-008 image-generation hook or T-009 context injection
- The selected task has a concrete <=1-day implementation plan before the next coding session starts

**Next-session notes:**
- T-012 absorbed the earlier T-004/T-006 runtime integration follow-up
- Pick the next task only after the live verification result is known

**Expected progress next session:**
- Choose between T-008 and T-009 based on which runtime seam feels cleaner after verification
- Capture the first concrete acceptance test for the chosen task in `tracker.md`

---

## Session Priorities

**Must complete (P0):**
- Manually verify the expanded T-012 runtime/init path in SillyTavern

**Should complete (P1):**
- Close T-012 if the live verification passes

**Could complete if time permits (P2):**
- Select and scope the next major feature slice (T-008 or T-009)

---

## Context for Next Session

**What changed last session:**
- Added `InitSceneExtractor` for silent init-time pose/emotion/location seeding from scenario plus the first character message
- Added shared runtime helpers plus `SceneRuntimeController` to wire pending user turns, Tech-LLM runtime analysis, and auto-background sync
- Wired SillyTavern's `generateQuietPrompt` into appearance fallback, init extraction, and runtime turn-pair analysis
- Full Jest validation passed: 197/197 tests, 92.15% statements, 80.79% branches, 96.39% functions, 93.02% lines

**Current blockers/dependencies:**
- No coding blocker remains for T-012
- The only meaningful remaining dependency is live SillyTavern verification of the new runtime/init path with the active provider/model setup

**Environment notes:**
- Current working branch: `feature/t-012-tech-llm-runtime`
- Validation command: `node --experimental-vm-modules ./node_modules/jest/bin/jest.js --coverage --runInBand`

---

## Success Criteria for Next Session

By end of the next session, we should have:
- [ ] Fresh-chat init seeding manually verified in SillyTavern
- [ ] Runtime turn-pair analysis manually verified in SillyTavern
- [ ] Background sync on location changes manually verified in SillyTavern
- [ ] `docs/tracker.md` and `docs/handoff.md` updated to either mark T-012 done or record the exact runtime issue found

---

## Upcoming Tasks

- **T-012**: Init-Time Scene Extraction - Silent Tech-LLM pass for starting pose, emotion, and location
- **T-008**: Image Generation Hook - Inject EverLook prompt into the ST image pipeline
- **T-009**: Context Injection - Inject current scene state into chat context before user message
- **T-010**: Integration Testing - End-to-end validation for the full scene flow
- **T-011**: Polish & Release Packaging

---

**End of todo.md**
