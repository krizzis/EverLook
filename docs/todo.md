# todo.md

**Session Date:** 2026-03-29
**Time Budget:** 1-2 hours
**Session Goal:** Finish T-007 by manually verifying the new tracker panel in SillyTavern, then roll into the next runtime-integrated slice.

---

## Active Tasks for Next Session

### T-007 - Scene Tracker UI Panel

**Acceptance criteria:**
- `TrackerPanel.js` renders current scene state in human-readable form
- User can edit mutable attributes and reset scene state
- Panel toggleable via slash command
- Edits call `StateManager` methods rather than mutating state directly
- UI updates reactively when state changes
- Manual testing in SillyTavern confirms usability

**Next-session notes:**
- Code and Jest coverage are already in place; remaining work is runtime verification
- Verify `renderExtensionTemplateAsync(..., 'src/ui/tracker')` resolves correctly in the live ST host
- Confirm the current chat is initialized on startup without requiring a manual chat switch

**Expected progress next session:**
- Complete manual verification and, if clean, mark T-007 done in `docs/tracker.md`
- Capture any runtime-only bugs or polish items discovered in ST

---

### T-012 - Init-Time Scene Extraction Follow-Up

**Acceptance criteria:**
- Silent Tech-LLM prompt derives starting `pose`, `emotion`, and `location` from scenario plus the character's first message
- Initialization remains silent and does not inject visible chat messages
- Extraction runs only when starting fields are still unset/defaulted
- Failures preserve existing defaults and log a warning instead of blocking chat init
- Unit tests cover prompt construction, fallback/no-op behavior, and successful state seeding
- Changed-lines test coverage >= 80%

**Next-session notes:**
- This is still the cleanest follow-up after T-007 verification
- Reuse the existing injected-provider pattern so runtime binding stays swappable
- Source text should come from scenario plus the first character message, not the full card description

**Expected progress next session:**
- Begin prompt and provider wiring once T-007 manual verification is no longer blocking the UI slice

---

## Session Priorities

**Must complete (P0):**
- Manually verify T-007 in the local SillyTavern runtime

**Should complete (P1):**
- If verification passes, mark T-007 complete in `docs/tracker.md` and `docs/handoff.md`

**Could complete if time permits (P2):**
- Start T-012 init-time pose/emotion/location extraction

---

## Context for Next Session

**What changed this session:**
- T-007 tracker panel was implemented in code with edit/reset UI, slash-command toggle, responsive styling, and startup mounting
- `StateManager` now supports subscriptions and baseline resets so UI updates reactively without polling
- Full Jest validation passed with coverage above thresholds, including direct coverage for `src/ui/TrackerPanel.js`

**Current blockers/dependencies:**
- T-007 still depends on manual verification inside SillyTavern before it can be closed honestly
- T-012 still depends on confirming the exact scenario/first-message sources and Tech-LLM binding in `index.js`

**Environment notes:**
- Current working branch: `feature/t-007-scene-tracker-ui`
- Validation command: `node --experimental-vm-modules ./node_modules/jest/bin/jest.js --coverage --runInBand`

---

## Success Criteria for Next Session

By end of the next session, we should have:
- [ ] Manual ST verification for T-007 captured with pass/fail notes
- [ ] `docs/tracker.md` updated to either `✅` or left `🔵` with a concrete blocker
- [ ] `docs/handoff.md` refreshed with the runtime evidence
- [ ] Clear decision on whether T-012 or runtime background-trigger integration is the next active code slice

---

## Manual Test Checklist for T-007

- [ ] Reload the extension in SillyTavern and confirm no startup errors
- [ ] Run `/everlook-tracker` to toggle the panel open
- [ ] Run `/everlook-tracker hide` and `/everlook-tracker show`
- [ ] Confirm the current chat state appears without switching chats manually
- [ ] Edit pose, emotion, action, location, and outfit; save; confirm values persist in the panel
- [ ] Click `Reset Scene` and confirm the state returns to the loaded chat baseline
- [ ] Switch chats and confirm the panel updates reactively for the newly active chat

---

## Upcoming Tasks

- **T-007**: Scene Tracker UI - Finish manual verification and close the task
- **T-012**: Init-Time Scene Extraction - Silent Tech-LLM pass for starting pose, emotion, and location
- **T-008**: Image Generation Hook - Inject EverLook prompt into the ST image pipeline
- **T-009**: Context Injection - Inject current scene state into chat context before user message
- **T-010**: Integration Testing - End-to-end validation for the full scene flow

---

**End of todo.md**
