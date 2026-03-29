# todo.md

**Session Date:** 2026-03-29  
**Time Budget:** 3 hours  
**Session Goal:** Scaffold EverLook extension and implement core scene state data model

---

## Active Tasks for This Session

### T-001 — Project Scaffolding & Extension Bootstrap

**Acceptance criteria:**
- Extension directory structure matches design.md §3.1
- `manifest.json` is valid with correct metadata (slug: `everlook`, display name: `EverLook`)
- `index.js` entrypoint loads cleanly in SillyTavern with no console errors
- `settings.html` renders a basic settings panel in ST extension settings
- `style.css` is referenced in manifest and loads
- Extension appears in SillyTavern's extension list

**Session-specific notes:**
- Use `sillytavern-extension-builder` skill for scaffold generation
- Minimum SillyTavern version TBD — check current stable
- Template mode: `default` (UI/event-focused)

**Expected progress this session:**
- Complete scaffolding (all files created and valid)

---

### T-002 — Scene State Data Model & Constants

**Acceptance criteria:**
- `SceneState.js` implements the data model from design.md §3.3
- All attributes have proper types and validation
- `constants.js` defines predefined lists for pose, emotion, action, daytime, weather
- Normalization function validates values against predefined lists
- Unit tests cover: valid state creation, invalid value rejection, null/empty handling
- Test coverage ≥ 80% on new code

**Session-specific notes:**
- Outfit attribute structure may change (per business requirements) — keep it simple and adaptable
- Empty/null outfit must normalize to "completely nude" in prompt context
- Pose, emotion, action are single string values normalized to list

**Expected progress this session:**
- Complete data model implementation
- Complete constants definitions
- Unit tests written and passing

---

### T-003 — State Manager: Init + Save/Restore

**Acceptance criteria:**
- `StateManager.js` initializes scene state from character card data
- State saves to `extension_settings['EverLook'].chatStates[chatId]`
- State restores correctly on chat switch
- New chat creates fresh state (different chatId)
- `saveSettingsDebounced()` called after state saves
- Unit tests for init, save, restore, chat switch scenarios

**Session-specific notes:**
- Depends on T-002 (SceneState model)
- Need to understand ST character card data structure for appearance extraction
- Multi-chat persistence pattern per design.md §3.7

**Expected progress this session:**
- May only partially complete if T-001/T-002 take longer than expected
- Core init + save/restore logic; chat switch handler may carry over

---

## Session Priorities

**Must complete (P0):**
- T-001: Project Scaffolding — Foundation for everything else

**Should complete (P1):**
- T-002: Scene State Data Model — Core data structure needed by all modules

**Could complete if time (P2):**
- T-003: State Manager Init — Starts bringing the model to life

---

## Context for This Session

**What happened last session:**
- Project kickoff — no prior sessions
- Business requirements documented in `docs/bussiness_requirements.md`
- `scope.md` and `design.md` created from requirements
- No code exists yet

**Current blockers/dependencies:**
- Need to verify SillyTavern extension API compatibility for event hooks
- Need to confirm character card data structure for appearance extraction
- Tech-LLM prompt design not needed yet (T-002/T-003 are state-only)

**Environment notes:**
- SillyTavern should be available locally for manual testing
- Jest or Vitest needed for unit tests (install as dev dependency)

---

## Success Criteria for This Session

By end of session, we should have:
- [ ] Extension scaffold created and loadable in SillyTavern
- [ ] Scene state data model implemented with validation
- [ ] Constants file with all predefined value lists
- [ ] Unit tests for data model (≥ 80% coverage on new code)
- [ ] State Manager initialized (if time permits)
- [ ] tracker.md created with T-001, T-002, T-003
- [ ] handoff.md updated with session results

If we don't complete everything:
- Minimum viable progress: T-001 (scaffold) + T-002 (data model) complete
- T-003 (State Manager) can safely carry over to next session

---

## Time Boxing

**Estimated breakdown:**
- T-001 (Scaffolding): 45 minutes
- T-002 (Data Model + Constants): 60 minutes
- T-002 (Unit Tests): 30 minutes
- T-003 (State Manager): 45 minutes
- Buffer for unexpected issues: 20 minutes
- Total: ~3 hours

---

## Notes & Reminders

**Before starting:**
- [ ] Read handoff.md if it exists (first session — none yet)
- [ ] Read sillytavern-extension-builder SKILL.md for scaffold workflow
- [ ] Review design.md §3.1 for directory structure
- [ ] Ensure SillyTavern is running for manual verification

**During session:**
- [ ] Run validation commands after each change
- [ ] Paste full outputs to AI (not summaries)
- [ ] Log decisions in design.md ADR section if new ones arise
- [ ] Follow conventional commits

**After session:**
- [ ] Generate Closing Report
- [ ] Create/update handoff.md using canonical schema
- [ ] Create tracker.md with initial tasks and statuses
- [ ] Commit and push changes

---

## Upcoming Tasks (not for this session)

These tasks will be added to tracker.md and tackled in future sessions:

- **T-004**: Turn-Pair Analyzer — Tech-LLM prompt design + structured response parsing
- **T-005**: Prompt Builder — Deterministic Danbooru tag generation
- **T-006**: Background Switcher — Cascading search + ST background API integration
- **T-007**: Scene Tracker UI — Panel rendering, edit, reset, slash command toggle
- **T-008**: Image Generation Hook — Inject EverLook prompt into ST pipeline
- **T-009**: Integration Testing — End-to-end flow validation
- **T-010**: Polish & Release Packaging — Final QA, manifest finalization, packaging

---

**End of todo.md**
