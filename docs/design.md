# design.md

**Version:** 1.0  
**Last updated:** 2026-03-29  
**Status:** Living document — updated as architecture evolves  
**Authority:** Technical decisions source of truth; must align with `scope.md`

---

## Purpose

This document defines the technical architecture, design patterns, and implementation guidelines for EverLook. It answers "how are we building this?" and serves as the reference for all code decisions during implementation and PR reviews.

---

## 1. Architecture Overview

### 1.1 System Context

- SillyTavern third-party extension that runs client-side within the ST web application
- Integrates with: SillyTavern extension API, SillyTavern chat system, Tech-LLM (via ST connection API), SillyTavern image generation pipeline (ComfyUI), SillyTavern background system
- Serves: Single active character scene tracking per chat session
- Does not handle: Image generation execution, character card editing, group chats, multi-character tracking

### 1.2 High-Level Architecture

Architecture style: Event-driven modular extension (single-page client-side, SillyTavern hosted)

```
┌─────────────────────────────────────────────────────┐
│                   SillyTavern Host                  │
│                                                     │
│  ┌───────────────────────────────────────────────┐  │
│  │              EverLook Extension                │  │
│  │                                                │  │
│  │  ┌──────────┐  ┌──────────────┐  ┌─────────┐  │  │
│  │  │  Scene    │  │  Turn-Pair   │  │ Prompt  │  │  │
│  │  │  State    │◄─┤  Analyzer    │  │ Builder │  │  │
│  │  │  Manager  │  │  (Tech-LLM)  │  │         │  │  │
│  │  └─────┬─────┘  └──────────────┘  └────┬────┘  │  │
│  │        │                                │       │  │
│  │  ┌─────▼─────┐  ┌──────────────┐  ┌────▼────┐  │  │
│  │  │ Background│  │  Tracker UI  │  │  Image  │  │  │
│  │  │ Switcher  │  │  Panel       │  │  Hook   │  │  │
│  │  └───────────┘  └──────────────┘  └─────────┘  │  │
│  │                                                │  │
│  └───────────────────────────────────────────────┘  │
│                                                     │
│  ┌──────────┐ ┌──────────┐ ┌────────────────────┐  │
│  │ Chat API │ │ LLM API  │ │ Image Gen Pipeline │  │
│  └──────────┘ └──────────┘ └────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

Component responsibilities:
- **Scene State Manager**: Owns the canonical scene state object; handles init, update, save/restore per chat; exposes state to other modules
- **Turn-Pair Analyzer**: Sends silent prompts to Tech-LLM with current turn pair; parses response for changed attributes + confidence; triggers state updates
- **Prompt Builder**: Converts current scene state into deterministic Danbooru-style tag prompt in specified order
- **Background Switcher**: Watches location attribute changes; searches background folder; sets chat background via ST API
- **Tracker UI Panel**: Renders current scene state in human-readable form; supports manual edit/reset; toggleable via slash command
- **Image Hook**: Intercepts SillyTavern image generation requests; injects EverLook-generated prompt

### 1.3 Technology Stack

| Layer | Technology | Version | Rationale |
|-------|-----------|---------|-----------|
| Runtime | Browser JavaScript (ES modules) | ES2020+ | ST extension standard; client-side execution |
| UI Framework | jQuery (ST-provided) | 3.x | Required by SillyTavern; all extensions use it |
| Templating | HTML templates | — | ST `renderExtensionTemplateAsync` pattern |
| Styling | CSS | — | Vanilla CSS per ST conventions |
| State Storage | SillyTavern chat metadata / extension_settings | — | Per-chat persistence via ST APIs |
| Testing | Jest (or Vitest) | Latest | Unit testing for pure logic modules |
| Build | None (raw JS) | — | ST extensions are not bundled; raw file serving |

Constraints:
- ✅ Must use SillyTavern extension APIs for settings, chat events, background, and image generation hooks
- ✅ Must store settings under `extension_settings['EverLook']`
- ✅ Must use `jQuery(async () => { ... })` for initialization
- ❌ Must not bundle or require build step (ST serves raw files)
- ❌ Must not introduce heavy third-party dependencies

Development environment:
- SillyTavern installation: `E:\AI_Tools\SillyTavern`
- SillyTavern local URL: `http://127.0.0.1:8088/`
- Extension target: `E:\AI_Tools\SillyTavern\public\scripts\extensions\third-party\EverLook`
- AI Assistant: **read-only access approved** to ST source for API reference and import path verification

---

## 2. Design Principles

### 2.1 Core Principles

**1. Event-Driven Reactivity**
- What it means: EverLook reacts to SillyTavern events (message sent, message received, chat switched) rather than polling
- How we apply it: Register event handlers for `MESSAGE_SENT`, `MESSAGE_RECEIVED`, `CHAT_CHANGED` etc.
- Example: Turn-pair analysis triggers only after character response completes

**2. Single Source of Truth for Scene State**
- What it means: One canonical state object per chat; all modules read from and write to it through the Scene State Manager
- How we apply it: No module stores its own copy of scene attributes; all access via getter/setter API
- Example: Prompt Builder reads `sceneState.getOutfit()` — never caches outfit locally

**3. Fail Gracefully, Log Always**
- What it means: If Tech-LLM fails or returns garbage, scene state remains unchanged; errors surface as toast messages; all state changes log to console
- How we apply it: Every async operation wraps in try/catch; state updates are atomic (apply all or none of a change set)
- Example: If confidence < threshold, log "Skipped attribute X (confidence: 0.3 < 0.5)" and don't update

**4. Deterministic Prompt Generation**
- What it means: Given identical scene state, prompt output is always identical (no randomness, no timestamp-based variation)
- How we apply it: Prompt Builder is a pure function: `sceneState → string`
- Example: Same outfit + pose + location always produces same tag sequence

**5. Minimal Footprint**
- What it means: Extension should not noticeably impact SillyTavern performance or UX
- How we apply it: Lazy initialization; debounced saves; no blocking operations in UI thread
- Example: Background search runs asynchronously; UI updates are batched

### 2.2 Error Handling Strategy

**Error types:**
- **Operational (recoverable)**: Tech-LLM timeout, background file not found, malformed LLM response → Strategy: Log warning, show toast, continue with unchanged state
- **Configuration**: Missing character card data, invalid settings → Strategy: Log error, show toast with guidance, use sensible defaults
- **Programmer (bugs)**: Unexpected null, type errors → Strategy: Log error with stack trace to console, show generic toast, don't crash ST

**Error response pattern:**
```javascript
try {
  const result = await techLlmAnalyze(turnPair);
  applyChanges(result);
} catch (error) {
  console.error('[EverLook] Turn-pair analysis failed:', error);
  toastr.error('Scene analysis failed. State unchanged.', 'EverLook');
  // State remains as-is — no partial updates
}
```

**Never expose:**
- Raw LLM responses to end users (only structured results)
- Internal module errors beyond human-readable toast messages

### 2.3 Logging Strategy

**Format:** Console logging with `[EverLook]` prefix

**Log levels:**
- **ERROR**: Caught exceptions, failed LLM calls, corrupted state → `console.error('[EverLook]', ...)`
- **WARN**: Low confidence skips, missing background files, fallback behavior → `console.warn('[EverLook]', ...)`
- **INFO**: State changes (attribute name + old value → new value), initialization, chat switches → `console.info('[EverLook]', ...)`
- **DEBUG**: Full LLM prompts/responses, search paths, raw attribute parsing → `console.debug('[EverLook]', ...)`

**Always log:**
- ✅ Every scene state change (attribute, old value, new value, confidence)
- ✅ Tech-LLM calls (prompt sent, response received, parse result)
- ✅ Background search attempts and results
- ✅ Chat switch events (save/restore actions)

**Never log:**
- ❌ Full chat message content (privacy)
- ❌ User credentials or API keys

---

## 3. Module Design

### 3.1 Directory Structure

```
EverLook/
├── index.js              # Extension entrypoint: lifecycle, event wiring, settings
├── manifest.json         # ST extension manifest
├── style.css             # Extension styles
├── settings.html         # Settings panel template
├── src/
│   ├── state/
│   │   ├── SceneState.js       # Scene state data model + validation
│   │   ├── StateManager.js     # Init, update, save/restore, multi-chat
│   │   └── constants.js        # Predefined lists (poses, emotions, actions, daytimes, weather)
│   ├── analyzer/
│   │   ├── TurnPairAnalyzer.js # Tech-LLM integration for turn-pair analysis
│   │   └── prompts.js          # System/user prompt templates for Tech-LLM
│   ├── prompt/
│   │   └── PromptBuilder.js    # Deterministic Danbooru prompt generation
│   ├── background/
│   │   └── BackgroundSwitcher.js # Background search + set logic
│   └── ui/
│       ├── TrackerPanel.js     # Scene tracker UI rendering + edit handlers
│       └── tracker.html        # Tracker panel HTML template
├── docs/                 # Project documentation (scope, design, etc.)
└── tests/
    ├── SceneState.test.js
    ├── PromptBuilder.test.js
    ├── BackgroundSwitcher.test.js
    └── TurnPairAnalyzer.test.js
```

**Conventions:**
- PascalCase for class/module files
- camelCase for utility files and non-class exports
- Tests co-located in `tests/` directory (not next to source — ST convention)
- `index.js` is the only entry point; all other modules are internal

### 3.2 Layer Responsibilities

**Entry Layer (`index.js`):**

Purpose: Extension lifecycle, event registration, settings management

Responsibilities:
- ✅ Register SillyTavern event handlers (chat change, message received, etc.)
- ✅ Load and save extension settings
- ✅ Wire modules together (init StateManager, register UI, etc.)
- ✅ Register slash commands
- ❌ Must NOT contain business logic (delegate to modules)
- ❌ Must NOT directly manipulate DOM beyond settings panel

---

**State Layer (`src/state/`):**

Purpose: Own and manage the canonical scene state

Responsibilities:
- ✅ Define scene state data model with validation
- ✅ Initialize state from character card + scenario
- ✅ Apply validated attribute updates
- ✅ Save/restore state per chatId
- ✅ Provide read-only access to current state
- ❌ Must NOT call LLM APIs
- ❌ Must NOT manipulate DOM

---

**Analyzer Layer (`src/analyzer/`):**

Purpose: Extract scene attribute changes from turn pairs via Tech-LLM

Responsibilities:
- ✅ Construct prompts for Tech-LLM with current turn pair and state context
- ✅ Send silent requests to Tech-LLM via ST connection API
- ✅ Parse structured responses (changed attributes + confidence)
- ✅ Return parsed change set to caller (does not apply changes directly)
- ❌ Must NOT update state directly (returns data to StateManager)
- ❌ Must NOT interact with UI

---

**Prompt Layer (`src/prompt/`):**

Purpose: Generate deterministic image prompts from scene state

Responsibilities:
- ✅ Convert scene state attributes to Danbooru-style tags
- ✅ Order tags per business requirements (subject → appearance → pose → outfit → emotion → action → background → lora)
- ✅ Handle null/empty outfit as "completely nude"
- ✅ Handle action.interaction flag for subject/action tag logic
- ❌ Must NOT read state directly (receives state as input parameter)
- ❌ Must NOT have side effects (pure function)

---

**Background Layer (`src/background/`):**

Purpose: Match and set chat background based on location attributes

Responsibilities:
- ✅ Search background folder with cascading strategy (name+daytime+weather → name+daytime → name)
- ✅ Set matched background via ST API
- ✅ Handle no-match gracefully (skip change, log)
- ❌ Must NOT manage background files
- ❌ Must NOT modify scene state

---

**UI Layer (`src/ui/`):**

Purpose: Render scene tracker panel and handle user interactions

Responsibilities:
- ✅ Render current scene state in human-readable form
- ✅ Allow manual editing of mutable attributes
- ✅ Allow scene state reset
- ✅ Toggle visibility (slash command integration)
- ❌ Must NOT directly modify state (call StateManager methods)
- ❌ Must NOT call LLM APIs

### 3.3 Data Model

#### Scene State Object

```javascript
/**
 * @typedef {Object} SceneState
 * @property {string} chatId - Current chat identifier (for multi-chat logic)
 * @property {string} characterName - Character name from card (immutable)
 * @property {string|null} characterLora - Character lora trigger from card (immutable)
 * @property {Appearance} appearance - Character appearance (initialized once, immutable)
 * @property {string|null} pose - Current pose (normalized to predefined list)
 * @property {string|null} emotion - Current emotion (normalized to predefined list)
 * @property {Location} location - Current location object
 * @property {Action} action - Current action object
 * @property {string[]} outfit - Current outfit items (normalized values)
 */

/**
 * @typedef {Object} Appearance
 * @property {string} description - Extracted from character card (immutable after init)
 */

/**
 * @typedef {Object} Location
 * @property {string|null} name - Location name
 * @property {string} daytime - Time of day (day|night|evening|morning|sunset|sunrise|dawn|dusk)
 * @property {string} weather - Weather condition (clear|sunny|cloudy|rainy|snowy|foggy|windy|stormy)
 */

/**
 * @typedef {Object} Action
 * @property {string|null} name - Action name (normalized to predefined list)
 * @property {boolean} interaction - Whether character is interacting with user
 */
```

#### Predefined Value Lists (constants.js)

```javascript
export const POSES = [
  'standing', 'sitting', 'kneeling', 'lying down', 'leaning',
  'crouching', 'walking', 'running', 'jumping', 'flying',
  // ... extend as needed
];

export const EMOTIONS = [
  'happy', 'sad', 'angry', 'surprised', 'scared', 'disgusted',
  'neutral', 'embarrassed', 'smiling', 'crying', 'blushing',
  'laughing', 'serious', 'confused', 'shy', 'excited',
  // ... extend as needed
];

export const ACTIONS = [
  'talking', 'eating', 'drinking', 'reading', 'writing',
  'sleeping', 'cooking', 'fighting', 'dancing', 'singing',
  'hugging', 'kissing', 'holding hands', 'pointing',
  // ... extend as needed
];

export const DAYTIMES = [
  'day', 'night', 'evening', 'morning', 'sunset', 'sunrise', 'dawn', 'dusk'
];

export const WEATHER = [
  'clear', 'sunny', 'cloudy', 'rainy', 'snowy', 'foggy', 'windy', 'stormy'
];
```

### 3.4 Prompt Generation Logic

Tag order (per business requirements):

1. **Subject**: `"1girl"` if `action.interaction === true`, else `"1girl, solo"`
2. **Appearance**: Tags from appearance description (extracted at init)
3. **Pose**: Normalized pose value
4. **Outfit**: Array of normalized outfit tags; if empty/null → `"completely nude"`
5. **Emotion**: Normalized emotion value
6. **Action**: If `action.interaction === true` → `"1boy, <action.name>"`; else → `"<action.name>"`
7. **Background**: `"<location.name> background"`, `<location.daytime>`, `<location.weather>`
8. **Character Lora**: Lora trigger string from character card

Rules:
- Omit any attribute that is `null` or empty (do not include literal `"null"` in prompt)
- Exception: outfit empty/null → include `"completely nude"`
- All tags normalized to lowercase, comma-separated
- No trailing commas or double commas in output

```javascript
// Example output for a populated state:
// "1girl, solo, long blonde hair, blue eyes, standing, school uniform, skirt, happy, reading, classroom background, day, clear, <lora:character_name:1>"
```

### 3.5 Background Search Strategy

When `location` attribute changes, execute cascading search:

```
Step 1: Search for file containing: <name> + <daytime> + <weather>
        e.g., "forest_night_rainy.png"
Step 2: If not found → search for: <name> + <daytime>
        e.g., "forest_night.png"
Step 3: If not found → search for: <name>
        e.g., "forest.png"
Step 4: If not found → skip background change (log warning)
```

- Search is case-insensitive
- Match is substring-based (filename _contains_ search terms)
- If multiple files match, use first result
- Background is set via SillyTavern's background API

### 3.6 Turn-Pair Analysis Flow

```
1. RP-LLM responds to user message
2. EverLook captures turn pair: { userMessage, characterResponse }
3. EverLook constructs analysis prompt:
   - System: "You are a scene analyzer. Given the conversation turn, extract any changed scene attributes..."
   - User: Current state + turn pair text
4. EverLook sends silent request to Tech-LLM
5. Tech-LLM returns structured JSON:
   {
     "changes": {
       "pose": { "value": "sitting", "confidence": 0.9 },
       "location": { "name": "park", "daytime": "evening", "confidence": 0.8 }
     }
   }
6. For each changed attribute:
   - If confidence >= threshold → update state
   - If confidence < threshold → log skip, no update
7. If location changed → trigger BackgroundSwitcher
8. Log all changes/skips to console
```

### 3.7 Multi-Chat State Persistence

- State is keyed by `chatId`
- On chat switch:
  1. Save current state to `extension_settings['EverLook'].chatStates[currentChatId]`
  2. Load state for new chatId (if exists) or initialize fresh
- On new chat with same character:
  - Initialize new state (new chatId = new scene)
- `saveSettingsDebounced()` called after every state save

### 3.8 Testing Strategy

**Unit Tests:**
- Purpose: Test pure logic modules in isolation
- Scope: SceneState validation, PromptBuilder output, BackgroundSwitcher search logic, constants normalization
- Mocking: Mock SillyTavern APIs, LLM responses, file system
- Coverage target: ≥80% on changed lines (per methodology.md §7)
- Run: `npx jest` or `npx vitest`

**Integration Tests:**
- Purpose: Test module interactions (StateManager + Analyzer + PromptBuilder)
- Scope: End-to-end flow from turn pair to prompt output
- Environment: Mocked ST environment
- When to run: Before merge

**Manual Verification:**
- Test within running SillyTavern instance
- Verify UI rendering, background switching, prompt injection
- Test multi-chat switch scenarios

---

## 4. Security Guidelines

### 4.1 Data Protection

**Secrets:**
- No secrets stored in extension code
- Tech-LLM API credentials managed by SillyTavern's existing connection settings
- Per methodology.md §8: Never commit secrets

**Sensitive data:**
- Chat content passed to Tech-LLM is transient (not stored by extension)
- Scene state is stored in ST's extension settings (browser localStorage)
- No external network calls beyond ST's existing LLM connection

### 4.2 Input Validation

**Validation approach:** Manual validation with predefined lists

**Where:** State layer (SceneState.js)

**Validate:**
- ✅ All pose/emotion/action values against predefined lists
- ✅ Location daytime/weather against allowed values
- ✅ Confidence values are numeric and 0-1 range
- ✅ Tech-LLM response is valid JSON with expected structure

**Sanitize:**
- Trim and lowercase all normalized values
- Strip HTML from any user-edited state values
- Validate chatId format before storage operations

---

## 5. Extension Points & Future Work

### 5.1 Extension Points

**Designed for extension:**
- Predefined value lists (poses, emotions, actions) — add entries without code changes
- Prompt tag order — configurable via settings (future)
- Tech-LLM prompt templates — editable in settings (future)
- Background search strategy — pluggable matchers

**Planned extensions:**
- Group chat support (multi-character state tracking)
- Custom tag vocabularies
- Prompt template editor in UI
- State history / undo functionality
- Integration with additional image generation backends

### 5.2 Tech Debt Tracking

**Document debt:**
- In code: `// TODO(T-XXX): [Description]`
- In tracker.md: Task with type "tech-debt"
- In handoff.md: If blocking future work

**Review cadence:** Each session

**Priority criteria:**
- Blocks feature work → immediate
- Security risk → immediate
- Code clarity → next available slot

---

## 6. Coding Standards

### 6.1 Language-Specific Conventions

**Naming:**
- Classes/Modules: PascalCase (`SceneState`, `PromptBuilder`)
- Functions/methods: camelCase (`getOutfit()`, `updateLocation()`)
- Variables: camelCase (`currentState`, `turnPair`)
- Constants: UPPER_SNAKE_CASE (`DEFAULT_DAYTIME`, `CONFIDENCE_THRESHOLD`)
- Private fields: underscore prefix (`_state`, `_chatId`)

**Language features:**
- ✅ Use: `const`/`let` (never `var`)
- ✅ Use: `async`/`await` for all async operations
- ✅ Use: ES module `import`/`export`
- ✅ Use: Template literals for string construction
- ❌ Avoid: Global variable pollution
- ❌ Avoid: `eval()` or dynamic code execution
- ❌ Avoid: Synchronous blocking operations

### 6.2 Comments & Documentation

**Comment when:**
- ✅ Non-obvious "why" decisions (business rule explanations)
- ✅ Complex prompt construction logic
- ✅ Gotchas and SillyTavern API quirks
- ✅ Normalization rules and tag ordering rationale
- ❌ Not for: obvious getter/setter logic

**Documentation format:**
- Public APIs: JSDoc with `@param`, `@returns`, `@throws`
- Inline: Brief comments explaining rationale

### 6.3 Git Commit Messages

**Format:** Conventional Commits

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat`: New feature or capability
- `fix`: Bug fix
- `docs`: Documentation changes
- `refactor`: Code restructuring without behavior change
- `test`: Adding or updating tests
- `chore`: Build, config, or tooling changes

**Examples:**
```
feat(state): add scene state data model with validation
feat(analyzer): implement turn-pair analysis via Tech-LLM
fix(prompt): handle empty outfit as completely nude
test(prompt): add unit tests for tag ordering logic
```

---

## 7. Decision Log (ADRs)

### 7.1 ADR-001: Client-Side Extension Architecture

**Date:** 2026-03-29  
**Status:** Accepted

**Context:**
EverLook needs to integrate with SillyTavern. ST extensions run client-side in the browser. Server-side extensions are possible but add complexity.

**Decision:**
Build as a pure client-side ST third-party extension using browser JavaScript and ST extension APIs.

**Consequences:**
- ✅ Simple deployment (drop files into extensions folder)
- ✅ No server infrastructure needed
- ✅ Direct access to ST chat events and UI
- ❌ Limited to browser capabilities (no direct filesystem access for background search — must use ST API)
- ❌ State persistence limited to localStorage/ST settings

### 7.2 ADR-002: Tech-LLM for Scene Analysis (vs. Rule-Based Extraction)

**Date:** 2026-03-29  
**Status:** Accepted

**Context:**
Need to extract scene changes from narrative text. Options: regex/rule-based parsing or LLM-based analysis.

**Decision:**
Use a secondary LLM call (Tech-LLM) with structured output for scene attribute extraction.

**Consequences:**
- ✅ Handles natural language variation (narrative text is unpredictable)
- ✅ Confidence scoring enables quality gating
- ✅ Can improve with better prompts without code changes
- ❌ Adds latency (LLM round-trip per turn pair)
- ❌ Costs tokens/compute for each analysis
- ❌ Accuracy depends on LLM quality

**Alternatives Considered:**
- **Regex/keyword extraction**: Fast but brittle; can't handle narrative variations
- **Hybrid (regex first, LLM fallback)**: Complex; dual maintenance burden

### 7.3 ADR-003: Danbooru Tag Normalization for Prompt Output

**Date:** 2026-03-29  
**Status:** Accepted

**Context:**
Image generation via Stable Diffusion requires structured prompts. Need a consistent tag format.

**Decision:**
Normalize all scene attributes to Danbooru-style tags with predefined lists for validation.

**Consequences:**
- ✅ Deterministic output for same input
- ✅ Compatible with most SD models trained on Danbooru-tagged data
- ✅ Predefined lists catch invalid values early
- ❌ Tag lists need maintenance as new scenarios arise
- ❌ May not cover all possible outfit/pose combinations initially

---

## 8. Changelog

| Date | Version | Changes | Author |
|------|---------|---------|--------|
| 2026-03-29 | 1.0 | Initial design document from business requirements | AI Assistant |

---

## Appendix A: Useful References

**Internal:**
- [scope.md](file:///e:/AI_Tools/SoulForge_project/repo/EverLook/docs/scope.md): Project scope and boundaries
- [business_requirements.md](file:///e:/AI_Tools/SoulForge_project/repo/EverLook/docs/bussiness_requirements.md): Original business requirements
- [methodology.md](file:///e:/AI_Tools/SoulForge_project/repo/EverLook/docs/methodology.md): SSOT for process gates

**SillyTavern:**
- SillyTavern Extension API documentation
- ST extension example: `city-unit/st-extension-example`

**External:**
- Danbooru tag wiki (for tag normalization reference)
- Stable Diffusion prompt engineering guides

---

**End of design.md**
