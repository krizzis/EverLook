# todo.md

**Session Date:** 2026-03-29  
**Time Budget:** 2-3 hours  
**Session Goal:** Advance post-T-006 work by preparing the tracker UI slice and keeping init-time extraction follow-up visible

---

## Active Tasks for This Session

### T-007 - Scene Tracker UI Panel

**Acceptance criteria:**
- `TrackerPanel.js` renders current scene state in human-readable form
- User can edit mutable attributes and reset scene state
- Panel toggleable via slash command
- Edits call `StateManager` methods rather than mutating state directly
- UI updates reactively when state changes
- Manual testing in SillyTavern confirms usability

**Session-specific notes:**
- Reuse the existing `src/ui/tracker.html` shell and keep DOM wiring in the UI layer
- Avoid leaking business logic into `index.js`; keep it to event/slash wiring only
- Manual verification will matter more than pure unit coverage for this slice

**Expected progress this session:**
- Complete panel rendering and edit/reset handlers
- Sketch the slash-command toggle seam in `index.js`
- Record manual test steps once the panel is runnable

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
- Leave explicit TODOs in code/docs so the work can be picked up cleanly after T-007 if not started sooner

---

## Session Priorities

**Must complete (P0):**
- T-007 - Scene Tracker UI Panel

**Should complete (P1):**
- Keep init-time extraction follow-up visible in docs and code TODOs

**Could complete if time permits (P2):**
- Start T-012 init-time pose/emotion/location extraction design spike

---

## Context for This Session

**What happened last session:**
- T-006 finished successfully with cascading background search, runtime adapters, and Jest coverage
- T-005 prompt generation and marker-based character initialization remain stable
- Appearance fallback still uses an injected silent extractor path, but other init-time scene fields are still default-seeded

**Current blockers/dependencies:**
- T-007 needs the least-coupled slash command and UI refresh seam in `index.js`
- T-012 depends on confirming the exact scenario/first-message sources and Tech-LLM binding in `index.js`

**Environment notes:**
- Project branch should be a fresh `feature/<slug>` branch before implementation
- Use the existing Jest setup; no new test framework is needed

---

## Success Criteria for This Session

By end of session, we should have:
- [ ] `src/ui/TrackerPanel.js` implemented
- [ ] UI rendering and edit/reset wiring available from the extension runtime
- [ ] Manual verification steps recorded for the panel
- [ ] `docs/tracker.md` updated with T-007 status and evidence
- [ ] T-012 follow-up is explicitly captured in docs/code TODOs

If we do not complete everything:
- Minimum viable progress: panel rendering scaffold plus documented manual test steps
- Do not start T-012 runtime wiring without confirming the ST provider entry point

---

## Time Boxing

**Estimated breakdown:**
- T-007 UI implementation: 75 minutes
- T-007 manual verification and polish: 30 minutes
- Validation and tracker/handoff updates: 20 minutes
- Optional T-012 design/trace pass: 30-45 minutes

---

## Notes & Reminders

**Before starting:**
- [ ] Re-read `docs/design.md` Section 3.2 for UI responsibilities
- [ ] Keep T-012 source inputs limited to scenario plus the first character message

**During session:**
- [ ] Keep mutable scene edits routed through `StateManager`
- [ ] Preserve single-source-of-truth state ownership
- [ ] Add manual verification notes alongside implementation

**After session:**
- [ ] Capture exact validation command and full output
- [ ] Update `docs/tracker.md` with evidence and status
- [ ] Refresh `docs/handoff.md` using the canonical schema in `docs/methodology.md` Section 4

---

## Upcoming Tasks

- **T-007**: Scene Tracker UI - Panel rendering, edit, reset, slash command toggle
- **T-012**: Init-Time Scene Extraction - Silent Tech-LLM pass for starting pose, emotion, and location
- **T-008**: Image Generation Hook - Inject EverLook prompt into the ST image pipeline
- **T-009**: Context Injection - Inject current scene state into chat context before user message
- **T-010**: Integration Testing - End-to-end validation for the full scene flow

---

**End of todo.md**
