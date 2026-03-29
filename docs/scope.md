# scope.md

**Version:** 1.0  
**Last updated:** 2026-03-29  
**Status:** Active — defines project boundaries and success criteria

---

## Purpose

This document defines what we're building, why we're building it, what success looks like, and what's explicitly out of scope for EverLook.

---

## Vision

EverLook is a SillyTavern extension that automatically tracks and maintains a structured scene state for the active character during a chat session. It analyzes turn pairs (user message + character response), extracts scene attributes (outfit, pose, emotion, location, action), and uses this data to maintain live scene context, dynamically update chat backgrounds, and generate deterministic image-generation prompts via SillyTavern's native pipeline (e.g., ComfyUI).

The goal is to give users a seamless, context-aware visual experience without manual prompt engineering — the scene "just knows" what's happening.

---

## Goals (what success looks like)

- Scene state initializes automatically on chat start from character card and scenario data
- Turn-pair analysis via Tech-LLM accurately detects and updates changed scene attributes with confidence thresholds
- Chat background updates dynamically when location changes (fallback search: name+daytime+weather → name+daytime → name only)
- Deterministic Danbooru-style prompt generation from scene state for SD image generation via SillyTavern pipeline
- Scene state persists per chat and restores correctly on chat switch (multi-chat support)
- User can view, edit, and reset scene state via a toggleable UI panel
- All state changes are logged to dev console; all exceptions surface as SillyTavern toast messages

---

## Success Metrics (SLOs)

- Scene state initialization on chat start: < 2 seconds (p95)
- Turn-pair analysis latency: < 5 seconds (p95, dependent on Tech-LLM response time)
- Attribute change detection accuracy: ≥ 85% (against manually verified test set)
- Background image match rate: ≥ 90% when matching backgrounds exist in folder
- Prompt generation: deterministic — same scene state always produces identical prompt string
- Multi-chat state restore: 100% fidelity (no attribute loss on chat switch)
- Changed-lines test coverage ≥ 80% on merged PRs

---

## In Scope

- Scene state data model (chatId, character name/lora, appearance, pose, emotion, location, action, outfit)
- Scene state initialization from character card + scenario/first message
- Turn-pair analysis via Tech-LLM (silent prompt, changed attributes + confidence)
- Confidence-threshold gating for state updates (configurable)
- Dynamic background search and set based on location attributes
- Deterministic prompt generation with Danbooru-style tags in specified order
- Scene tracker UI: toggleable panel, human-readable display, manual edit/reset
- Multi-chat state persistence (save/restore per chatId)
- Extension settings UI (Tech-LLM configuration, confidence threshold, etc.)
- Logging: state changes to dev console, exceptions as toast messages
- Slash command(s) for toggling scene tracker UI

---

## Out of Scope (for now)

- Group chat support (explicitly excluded from MVP per business requirements)
- Multi-character scene tracking (single active character only)
- Custom character lora management (lora value comes from character card, read-only)
- Image generation execution (EverLook creates the prompt; SillyTavern pipeline handles generation)
- Background image creation or management (user provides background files)
- Chat history re-analysis (only current turn pair is analyzed)
- Custom tag vocabularies beyond Danbooru-style normalization
- Mobile-specific UI optimizations

---

## Constraints & Assumptions

**Constraints:**
- Must conform to SillyTavern third-party extension API and packaging rules
- Extension settings stored under `extension_settings['EverLook']` per ST conventions
- Tech-LLM interaction must be "silent" (not visible to user in chat)
- All imports must resolve from the extension directory; minimal third-party dependencies
- No secrets in code; any API keys for separate Tech-LLM handled via SillyTavern's existing connection settings
- Must work with SillyTavern's existing image generation pipeline (ComfyUI integration)

**Assumptions:**
- Users have SillyTavern installed and running with at least one LLM connection configured
- Character cards contain usable appearance/description data for initialization
- Background image files follow a nameable convention (location name in filename)
- Tech-LLM can be the same as RP-LLM (with overridden system prompt) or a separate connection
- Pose, emotion, and action values can be normalized to predefined lists (Danbooru tags)
- Users understand basic SillyTavern extension installation workflow

**Development Environment:**
- SillyTavern installation path: `E:\AI_Tools\SillyTavern`
- SillyTavern local URL: `http://127.0.0.1:8088/`
- Extension install path: `E:\AI_Tools\SillyTavern\public\scripts\extensions\third-party\EverLook`
- AI Assistant has **read-only access** to the SillyTavern codebase for API reference, import path verification, and event type inspection. No modifications to ST source are permitted.

---

## Stakeholders

| Stakeholder | Role | Responsibility |
|-------------|------|----------------|
| Project Owner | Sponsor | Approves scope, resolves conflicts, defines business requirements |
| AI Assistant | Actor | Implements features per methodology, generates code and tests |
| SillyTavern Users | End Users | Use extension, provide feedback on UX and accuracy |

---

## Risks (initial)

- **Tech-LLM accuracy** — Scene attribute extraction may be unreliable with weaker models → Mitigation: Confidence threshold gating; log all changes for debugging; allow manual override via UI
- **Danbooru normalization drift** — Predefined tag lists may not cover all scenarios → Mitigation: Start with core tag set, make lists configurable, iterate based on usage
- **Background search performance** — Large background folders could slow search → Mitigation: Cache file listings; search only on location change
- **SillyTavern API changes** — Upstream API may evolve between versions → Mitigation: Pin minimum ST version in manifest; keep API usage conservative
- **Outfit attribute instability** — Business requirements note "attribute structure is subject to change" → Mitigation: Isolate outfit handling behind an adapter; document expected changes
- **Context injection ordering** — Injecting scene state before user message may conflict with other extensions → Mitigation: Use documented injection priorities; test with common extensions

---

## Milestones (target dates, adjust as needed)

- **M1**: Project scaffolding + scene state data model + initialization logic — Target: TBD
- **M2**: Turn-pair analysis via Tech-LLM + confidence-based state updates — Target: TBD
- **M3**: Prompt generation (Danbooru tags in specified order) — Target: TBD
- **M4**: Dynamic background search and set — Target: TBD
- **M5**: Scene tracker UI (display, edit, reset) + slash commands — Target: TBD
- **M6**: Multi-chat state persistence — Target: TBD
- **M7**: Integration testing + polish + release packaging — Target: TBD

---

## Dependencies

- SillyTavern runtime: Required, user-provided, must be compatible version
- LLM connection (RP-LLM): Required for chat functionality, user-configured
- Tech-LLM connection: Required for scene analysis, can share RP-LLM or separate; user-configured
- ComfyUI / image generation pipeline: Optional, user-configured, needed only for image generation feature
- Background image files: Optional, user-provided, needed only for dynamic background feature
- Character cards with description data: Required for appearance initialization

---

## Non-Goals (what we explicitly won't do)

- This is not an image generation tool (it produces prompts, not images)
- This is not a character card editor (it reads card data, doesn't modify it)
- This is not a chat history analyzer (only processes current turn pair)
- This is not a background image manager (user manages their own files)
- This is not a multi-character/group-chat tracker (single character per chat only)
- This is not a general-purpose LLM orchestrator (Tech-LLM is used only for scene extraction)

---

## Changelog

| Date | Version | Changes | Author |
|------|---------|---------|--------|
| 2026-03-29 | 1.0 | Initial scope defined from business requirements | AI Assistant |
| | | | |

---

**End of scope.md**
