# todo.md

**Session Date:** 2026-03-30
**Time Budget:** 2-3 hours
**Session Goal:** Re-run T-012 live verification after the stabilization pass and schedule a no-code extractor review to tighten requirements before broader prompt/schema changes.

---

## Active Tasks for Next Session

### T-012 - Manual Verification / Stabilized Recheck

**Acceptance criteria:**
- Fresh-chat startup silently seeds `pose`, `emotion`, and `location` from scenario plus the first character message
- Normal user/character turns silently trigger runtime Tech-LLM analysis and update state through `StateManager`
- Confirmed location changes trigger auto-background sync when enabled
- Failures preserve state/defaults and do not inject visible chat messages
- Live SillyTavern verification confirms the new quiet-generation/runtime path behaves as expected

**Next-session notes:**
- Runtime prompt guidance was tightened with Variant A instructions for visible-emotion labels, simple daytime/weather labels, and borrowed-clothing outfit updates
- `SceneRuntimeController` now catches invalid extracted change payloads and logs a single clear warning instead of surfacing a validation stack
- Recheck the previously failing Carmen scenarios plus fresh chat creation, first-message seeding, follow-up turn updates, and auto-background behavior

**Expected progress next session:**
- Validate T-012 end-to-end in SillyTavern against the previously failing scenarios and collect exact pass/fail evidence
- If verification is clean, update `tracker.md` and `handoff.md` to mark T-012 done
- If edge cases still show up, capture them for T-013 rather than expanding code scope in the verification session

---

### T-013 - Extractor Testing & Requirement Clarification (No Code Change Session)

**Acceptance criteria:**
- Real turn-pair examples are collected for pass/fail review across pose, emotion, location, action, outfit, and no-change cases
- Expected extractor semantics are clarified for visible emotion labels, borrowed/draped outfit changes, action vocabulary, and location normalization
- A concrete recommendation is produced for next prompt/schema/vocabulary work without changing production code in that session

**Next-session notes:**
- Treat this as a review/spike session only: gather examples, expected outputs, and recommendation notes
- Use the Carmen failures as seed cases and add at least a few clean no-change examples to avoid overfitting

**Expected progress next session:**
- Produce a small manually verified extractor test set and a short recommendation for the next implementation pass
- Decide whether the next change should be prompt-only, vocabulary expansion, or analyzer post-processing

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
- Manually verify the stabilized T-012 runtime/init path in SillyTavern

**Should complete (P1):**
- Run the no-code T-013 extractor review and requirement-clarification pass

**Could complete if time permits (P2):**
- Close T-012 if the live verification passes
- Select and scope the next major feature slice (T-008 or T-009)

---

## Context for Next Session

**What changed last session:**
- Tightened the Variant A runtime/init Tech-LLM prompts to push visible-emotion labels, simple daytime/weather labels, and full outfit arrays for borrowed clothing changes
- Added a runtime guard in `SceneRuntimeController` so invalid extracted change payloads now log one clear warning and leave state unchanged
- Added focused regression tests for the new prompt guidance and runtime validation-guard path
- Focused Jest validation passed: 26/26 tests across `TurnPairAnalyzer`, `SceneRuntimeController`, and `InitSceneExtractor`

**Current blockers/dependencies:**
- No coding blocker remains for the stabilization pass itself
- T-012 still depends on live SillyTavern verification with the active provider/model setup
- T-013 depends on collecting representative real chat examples before deciding whether prompt-only changes are sufficient

**Environment notes:**
- Current working branch: `feature/t-012-tech-llm-runtime`
- Validation command: `node --experimental-vm-modules ./node_modules/jest/bin/jest.js --coverage --runInBand`

---

## Success Criteria for Next Session

By end of the next session, we should have:
- [ ] Fresh-chat init seeding manually re-verified in SillyTavern
- [ ] Runtime turn-pair analysis manually re-verified against the Carmen edge cases
- [ ] Background sync on location changes manually re-verified in SillyTavern
- [ ] T-013 notes captured for extractor semantics and requirement clarification without changing production code in that session
- [ ] `docs/tracker.md` and `docs/handoff.md` updated to either mark T-012 done or record the exact remaining runtime issue found

---

## Upcoming Tasks

- **T-012**: Init-Time Scene Extraction - Silent Tech-LLM pass for starting pose, emotion, and location
- **T-013**: Extractor Testing & Requirement Clarification - No-code review of failing/pass cases and expected extractor semantics
- **T-008**: Image Generation Hook - Inject EverLook prompt into the ST image pipeline
- **T-009**: Context Injection - Inject current scene state into chat context before user message
- **T-010**: Integration Testing - End-to-end validation for the full scene flow
- **T-011**: Polish & Release Packaging

---

**End of todo.md**
