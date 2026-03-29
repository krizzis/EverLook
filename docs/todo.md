# todo.md

**Session Date:** 2026-03-29
**Time Budget:** 2-3 hours
**Session Goal:** Start the next post-T-007 slice by implementing init-time scene extraction for starting pose, emotion, and location.

---

## Active Tasks for Next Session

### T-012 - Init-Time Scene Extraction Follow-Up

**Acceptance criteria:**
- Silent Tech-LLM prompt derives starting `pose`, `emotion`, and `location` from scenario plus the character's first message
- Initialization remains silent and does not inject visible chat messages
- Extraction runs only when starting fields are still unset/defaulted
- Failures preserve existing defaults and log a warning instead of blocking chat init
- Unit tests cover prompt construction, fallback/no-op behavior, and successful state seeding
- Changed-lines test coverage >= 80%

**Next-session notes:**
- Reuse the existing injected-provider pattern so runtime binding stays swappable
- Source text should come from scenario plus the first character message, not the full card description
- Keep the init pass optional and non-blocking so chat startup remains resilient

**Expected progress next session:**
- Add the init prompt helper and provider seam
- Seed default pose/emotion/location only when the card/init data has not already set them
- Add deterministic unit tests for success and failure/no-op paths

---

### T-006/T-004 Runtime Integration Follow-Up

**Acceptance criteria:**
- Confirmed location changes from turn-pair analysis trigger background switching automatically
- Runtime failures leave scene state intact and log a warning instead of breaking chat flow
- Tests cover the integration seam where practical

**Next-session notes:**
- This is the next runtime cohesion task after T-012
- Keep the background runtime adapter injectable and avoid importing private ST internals

**Expected progress next session:**
- Trace the location-change path through `index.js`
- Decide whether the hook belongs directly after analyzer application or inside a state-change observer

---

## Session Priorities

**Must complete (P0):**
- Start T-012 init-time extraction

**Should complete (P1):**
- Keep the runtime location-change/background trigger work visible and scoped

**Could complete if time permits (P2):**
- Begin T-006/T-004 integration after T-012 scaffolding is stable

---

## Context for Next Session

**What changed last session:**
- T-007 tracker panel is fully complete, including manual SillyTavern verification
- `StateManager` now supports subscriptions and baseline resets so UI updates reactively without polling
- Full Jest validation passed with coverage above thresholds, including `src/ui/TrackerPanel.js`

**Current blockers/dependencies:**
- T-012 still depends on confirming the exact scenario/first-message sources and Tech-LLM binding in `index.js`
- Runtime background triggering still depends on the eventual analyzer-to-state application seam in the entry layer

**Environment notes:**
- Current working branch: `feature/t-007-scene-tracker-ui`
- Validation command: `node --experimental-vm-modules ./node_modules/jest/bin/jest.js --coverage --runInBand`

---

## Success Criteria for Next Session

By end of the next session, we should have:
- [ ] T-012 prompt/provider seam implemented
- [ ] Unit tests for init-time extraction added and passing
- [ ] `docs/tracker.md` and `docs/handoff.md` updated with T-012 status/evidence
- [ ] Clear next move for runtime background-trigger integration

---

## Upcoming Tasks

- **T-012**: Init-Time Scene Extraction - Silent Tech-LLM pass for starting pose, emotion, and location
- **T-008**: Image Generation Hook - Inject EverLook prompt into the ST image pipeline
- **T-009**: Context Injection - Inject current scene state into chat context before user message
- **T-010**: Integration Testing - End-to-end validation for the full scene flow
- **T-011**: Polish & Release Packaging

---

**End of todo.md**
