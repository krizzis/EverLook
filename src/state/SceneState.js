/**
 * SceneState — Scene state data model and validation.
 *
 * Owns the canonical shape of a scene state object.
 * Provides factory, validation, and immutable update methods.
 *
 * Design decisions:
 * - Immutable updates: update() returns a new instance, never mutates the original.
 *   This aligns with design.md §2.1 ("state updates are atomic — apply all or none").
 * - Factory pattern: All creation via static create() / createDefault() / fromJSON().
 *   Constructor validates all fields — no invalid states can exist.
 * - Serialization: toJSON() / fromJSON() for chat state persistence (T-003).
 *
 * @see design.md §3.3 — Data Model
 * @implements T-002
 */

import {
    POSES,
    EMOTIONS,
    ACTIONS,
    DAYTIMES,
    WEATHER,
    DEFAULT_DAYTIME,
    DEFAULT_WEATHER,
    normalize,
    normalizeAndWarn,
    normalizeStrict,
} from './constants.js';

// ── SceneState Class ─────────────────────────────────────────────────────────

export class SceneState {
    /**
     * @param {Object} data - Validated scene state data
     * @private — Use static factory methods instead
     */
    constructor(data) {
        /** @type {string} Current chat identifier */
        this._chatId = data.chatId;

        /** @type {string} Character name from card (immutable) */
        this._characterName = data.characterName;

        /** @type {string|null} Character lora trigger from card (immutable) */
        this._characterLora = data.characterLora;

        /** @type {Appearance} Character appearance (immutable after init) */
        this._appearance = Object.freeze({ ...data.appearance });

        /** @type {string|null} Current pose */
        this._pose = data.pose;

        /** @type {string|null} Current emotion */
        this._emotion = data.emotion;

        /** @type {Location} Current location */
        this._location = Object.freeze({ ...data.location });

        /** @type {Action} Current action */
        this._action = Object.freeze({ ...data.action });

        /** @type {string[]} Current outfit items */
        this._outfit = Object.freeze([...data.outfit]);

        // Freeze the instance to prevent external mutation
        Object.freeze(this);
    }

    // ── Getters ──────────────────────────────────────────────────────────────

    /** @returns {string} */
    get chatId() { return this._chatId; }

    /** @returns {string} */
    get characterName() { return this._characterName; }

    /** @returns {string|null} */
    get characterLora() { return this._characterLora; }

    /** @returns {{description: string}} */
    get appearance() { return this._appearance; }

    /** @returns {string|null} */
    get pose() { return this._pose; }

    /** @returns {string|null} */
    get emotion() { return this._emotion; }

    /** @returns {{name: string|null, daytime: string, weather: string}} */
    get location() { return this._location; }

    /** @returns {{name: string|null, interaction: boolean}} */
    get action() { return this._action; }

    /** @returns {ReadonlyArray<string>} */
    get outfit() { return this._outfit; }

    // ── Static Factory Methods ───────────────────────────────────────────────

    /**
     * Create a new SceneState with full validation.
     *
     * @param {Object} params
     * @param {string} params.chatId - Chat identifier
     * @param {string} params.characterName - Character name from card
     * @param {string|null} [params.characterLora=null] - Character lora trigger
     * @param {Object} [params.appearance] - Character appearance
     * @param {string} [params.appearance.description=''] - Appearance description
     * @param {string|null} [params.pose=null] - Current pose
     * @param {string|null} [params.emotion=null] - Current emotion
     * @param {Object} [params.location] - Current location
     * @param {string|null} [params.location.name=null] - Location name
     * @param {string} [params.location.daytime='day'] - Time of day
     * @param {string} [params.location.weather='clear'] - Weather condition
     * @param {Object} [params.action] - Current action
     * @param {string|null} [params.action.name=null] - Action name
     * @param {boolean} [params.action.interaction=false] - Interacting with user
     * @param {string[]} [params.outfit=[]] - Current outfit items
     * @returns {SceneState} Validated SceneState instance
     * @throws {Error} If required fields are missing or types are invalid
     */
    static create(params) {
        const validated = SceneState._validateAndNormalize(params);
        return new SceneState(validated);
    }

    /**
     * Create a default empty SceneState for a new chat.
     *
     * @param {string} chatId - Chat identifier
     * @param {string} characterName - Character name
     * @param {string|null} [characterLora=null] - Character lora trigger
     * @param {string} [appearanceDescription=''] - Appearance description
     * @returns {SceneState}
     */
    static createDefault(chatId, characterName, characterLora = null, appearanceDescription = '') {
        return SceneState.create({
            chatId,
            characterName,
            characterLora,
            appearance: { description: appearanceDescription },
            pose: null,
            emotion: null,
            location: { name: null, daytime: DEFAULT_DAYTIME, weather: DEFAULT_WEATHER },
            action: { name: null, interaction: false },
            outfit: [],
        });
    }

    /**
     * Deserialize a SceneState from a plain object (e.g., from storage).
     *
     * @param {Object} data - Plain object with scene state fields
     * @returns {SceneState}
     * @throws {Error} If data is invalid
     */
    static fromJSON(data) {
        if (!data || typeof data !== 'object') {
            throw new Error('[EverLook] SceneState.fromJSON: data must be a non-null object');
        }
        return SceneState.create(data);
    }

    // ── Instance Methods ─────────────────────────────────────────────────────

    /**
     * Create a new SceneState with changes applied.
     * Returns a NEW instance — the original is never mutated.
     *
     * Only mutable fields can be updated: pose, emotion, location, action, outfit.
     * Immutable fields (chatId, characterName, characterLora, appearance) are preserved.
     *
     * @param {Object} changes - Partial update object
     * @param {string|null} [changes.pose] - New pose value
     * @param {string|null} [changes.emotion] - New emotion value
     * @param {Object} [changes.location] - Partial location update
     * @param {Object} [changes.action] - Partial action update
     * @param {string[]} [changes.outfit] - New outfit array (replaces fully)
     * @returns {SceneState} New SceneState with changes applied
     * @throws {Error} If changes contain invalid types
     */
    update(changes) {
        if (!changes || typeof changes !== 'object') {
            throw new Error('[EverLook] SceneState.update: changes must be a non-null object');
        }

        // Disallow updating immutable fields
        const immutableFields = ['chatId', 'characterName', 'characterLora', 'appearance'];
        for (const field of immutableFields) {
            if (field in changes) {
                console.warn(
                    `[EverLook] Ignoring update to immutable field "${field}". ` +
                    'Only pose, emotion, location, action, outfit can be updated.',
                );
            }
        }

        // Merge location and action partially (allow updating sub-fields)
        const mergedLocation = changes.location
            ? { ...this._location, ...changes.location }
            : { ...this._location };

        const mergedAction = changes.action
            ? { ...this._action, ...changes.action }
            : { ...this._action };

        return SceneState.create({
            chatId: this._chatId,
            characterName: this._characterName,
            characterLora: this._characterLora,
            appearance: { ...this._appearance },
            pose: 'pose' in changes ? changes.pose : this._pose,
            emotion: 'emotion' in changes ? changes.emotion : this._emotion,
            location: mergedLocation,
            action: mergedAction,
            outfit: 'outfit' in changes ? changes.outfit : [...this._outfit],
        });
    }

    /**
     * Serialize to a plain object for storage.
     *
     * @returns {Object} Plain object representation
     */
    toJSON() {
        return {
            chatId: this._chatId,
            characterName: this._characterName,
            characterLora: this._characterLora,
            appearance: { ...this._appearance },
            pose: this._pose,
            emotion: this._emotion,
            location: { ...this._location },
            action: { ...this._action },
            outfit: [...this._outfit],
        };
    }

    // ── Static Validation ────────────────────────────────────────────────────

    /**
     * Validate a plain object as scene state data.
     * Returns a result object with valid flag and list of errors.
     *
     * @param {Object} data - Plain object to validate
     * @returns {{ valid: boolean, errors: string[] }}
     */
    static validate(data) {
        const errors = [];

        if (!data || typeof data !== 'object') {
            return { valid: false, errors: ['Data must be a non-null object'] };
        }

        // Required fields
        if (!data.chatId || typeof data.chatId !== 'string') {
            errors.push('chatId is required and must be a non-empty string');
        }
        if (!data.characterName || typeof data.characterName !== 'string') {
            errors.push('characterName is required and must be a non-empty string');
        }

        // Optional string fields
        if (data.characterLora !== null && data.characterLora !== undefined
            && typeof data.characterLora !== 'string') {
            errors.push('characterLora must be a string or null');
        }

        // Appearance
        if (data.appearance !== undefined && data.appearance !== null) {
            if (typeof data.appearance !== 'object') {
                errors.push('appearance must be an object');
            } else if (data.appearance.description !== undefined
                && typeof data.appearance.description !== 'string') {
                errors.push('appearance.description must be a string');
            }
        }

        // Pose
        if (data.pose !== null && data.pose !== undefined && typeof data.pose !== 'string') {
            errors.push('pose must be a string or null');
        }

        // Emotion
        if (data.emotion !== null && data.emotion !== undefined && typeof data.emotion !== 'string') {
            errors.push('emotion must be a string or null');
        }

        // Location
        if (data.location !== undefined && data.location !== null) {
            if (typeof data.location !== 'object') {
                errors.push('location must be an object');
            } else {
                if (data.location.name !== null && data.location.name !== undefined
                    && typeof data.location.name !== 'string') {
                    errors.push('location.name must be a string or null');
                }
                if (data.location.daytime !== null && data.location.daytime !== undefined) {
                    const normalizedDaytime = normalize(data.location.daytime);
                    if (normalizedDaytime !== null && !DAYTIMES.includes(normalizedDaytime)) {
                        errors.push(
                            `location.daytime "${data.location.daytime}" is not valid. ` +
                            `Allowed: [${DAYTIMES.join(', ')}]`,
                        );
                    }
                }
                if (data.location.weather !== null && data.location.weather !== undefined) {
                    const normalizedWeather = normalize(data.location.weather);
                    if (normalizedWeather !== null && !WEATHER.includes(normalizedWeather)) {
                        errors.push(
                            `location.weather "${data.location.weather}" is not valid. ` +
                            `Allowed: [${WEATHER.join(', ')}]`,
                        );
                    }
                }
            }
        }

        // Action
        if (data.action !== undefined && data.action !== null) {
            if (typeof data.action !== 'object') {
                errors.push('action must be an object');
            } else {
                if (data.action.name !== null && data.action.name !== undefined
                    && typeof data.action.name !== 'string') {
                    errors.push('action.name must be a string or null');
                }
                if (data.action.interaction !== undefined
                    && typeof data.action.interaction !== 'boolean') {
                    errors.push('action.interaction must be a boolean');
                }
            }
        }

        // Outfit
        if (data.outfit !== undefined && data.outfit !== null) {
            if (!Array.isArray(data.outfit)) {
                errors.push('outfit must be an array');
            } else {
                for (let i = 0; i < data.outfit.length; i++) {
                    if (typeof data.outfit[i] !== 'string') {
                        errors.push(`outfit[${i}] must be a string`);
                    }
                }
            }
        }

        return { valid: errors.length === 0, errors };
    }

    // ── Private Validation & Normalization ────────────────────────────────────

    /**
     * Validate and normalize raw params into a clean data object.
     * Throws on type errors; warns on unknown advisory values.
     *
     * @param {Object} params - Raw input params
     * @returns {Object} Validated and normalized data
     * @throws {Error} If required fields are missing or types are invalid
     * @private
     */
    static _validateAndNormalize(params) {
        const validation = SceneState.validate(params);
        if (!validation.valid) {
            throw new Error(
                `[EverLook] SceneState validation failed:\n  - ${validation.errors.join('\n  - ')}`,
            );
        }

        // Normalize pose (advisory — warn on unknown values)
        const pose = params.pose !== undefined
            ? normalizeAndWarn(params.pose, POSES, 'pose')
            : null;

        // Normalize emotion (advisory — warn on unknown values)
        const emotion = params.emotion !== undefined
            ? normalizeAndWarn(params.emotion, EMOTIONS, 'emotion')
            : null;

        // Normalize location (strict daytime/weather validation)
        const rawLocation = params.location || {};
        const location = {
            name: rawLocation.name != null ? normalize(rawLocation.name) : null,
            daytime: normalizeStrict(
                rawLocation.daytime, DAYTIMES, DEFAULT_DAYTIME, 'daytime',
            ),
            weather: normalizeStrict(
                rawLocation.weather, WEATHER, DEFAULT_WEATHER, 'weather',
            ),
        };

        // Normalize action (advisory name — warn on unknown values)
        const rawAction = params.action || {};
        const action = {
            name: rawAction.name !== undefined
                ? normalizeAndWarn(rawAction.name, ACTIONS, 'action')
                : null,
            interaction: typeof rawAction.interaction === 'boolean'
                ? rawAction.interaction
                : false,
        };

        // Normalize appearance
        const rawAppearance = params.appearance || {};
        const appearance = {
            description: typeof rawAppearance.description === 'string'
                ? rawAppearance.description.trim()
                : '',
        };

        // Normalize outfit (type-only validation, no value-list check)
        const outfit = Array.isArray(params.outfit)
            ? params.outfit
                .map(item => normalize(item))
                .filter(item => item !== null)
            : [];

        // Character lora — normalize but don't validate against a list
        const characterLora = params.characterLora != null
            ? (typeof params.characterLora === 'string' ? params.characterLora.trim() : null)
            : null;

        return {
            chatId: params.chatId.trim(),
            characterName: params.characterName.trim(),
            characterLora: characterLora || null,
            appearance,
            pose,
            emotion,
            location,
            action,
            outfit,
        };
    }
}
