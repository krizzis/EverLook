/**
 * constants.js — Predefined value lists for scene state normalization.
 *
 * All pose, emotion, action, daytime, and weather values that are
 * considered valid for scene state attributes. Lists are frozen to
 * prevent accidental mutation at runtime.
 *
 * Daytime and weather are strictly validated (they drive background search).
 * Pose, emotion, and action are advisory (warn on unknown, but accept).
 *
 * @see design.md §3.3 — Predefined Value Lists
 * @implements T-002
 */

// ── Predefined Value Lists ───────────────────────────────────────────────────

/**
 * Valid pose values for scene state.
 * Normalized to lowercase Danbooru-style tags.
 * @type {ReadonlyArray<string>}
 */
export const POSES = Object.freeze([
    'standing',
    'sitting',
    'kneeling',
    'lying down',
    'leaning',
    'crouching',
    'walking',
    'running',
    'jumping',
    'flying',
    'squatting',
    'crawling',
    'bending over',
    'arms crossed',
    'hands on hips',
]);

/**
 * Valid emotion values for scene state.
 * Normalized to lowercase Danbooru-style tags.
 * @type {ReadonlyArray<string>}
 */
export const EMOTIONS = Object.freeze([
    'happy',
    'sad',
    'angry',
    'surprised',
    'scared',
    'disgusted',
    'neutral',
    'embarrassed',
    'smiling',
    'crying',
    'blushing',
    'laughing',
    'serious',
    'confused',
    'shy',
    'excited',
    'annoyed',
    'worried',
    'pensive',
    'determined',
]);

/**
 * Valid action values for scene state.
 * Normalized to lowercase Danbooru-style tags.
 * @type {ReadonlyArray<string>}
 */
export const ACTIONS = Object.freeze([
    'talking',
    'eating',
    'drinking',
    'reading',
    'writing',
    'sleeping',
    'cooking',
    'fighting',
    'dancing',
    'singing',
    'hugging',
    'kissing',
    'holding hands',
    'pointing',
    'waving',
    'stretching',
    'bathing',
    'dressing',
    'undressing',
    'meditating',
]);

/**
 * Valid daytime values for location.
 * STRICTLY validated — drives background search strategy.
 * @type {ReadonlyArray<string>}
 */
export const DAYTIMES = Object.freeze([
    'day',
    'night',
    'evening',
    'morning',
    'sunset',
    'sunrise',
    'dawn',
    'dusk',
]);

/**
 * Valid weather values for location.
 * STRICTLY validated — drives background search strategy.
 * @type {ReadonlyArray<string>}
 */
export const WEATHER = Object.freeze([
    'clear',
    'sunny',
    'cloudy',
    'rainy',
    'snowy',
    'foggy',
    'windy',
    'stormy',
]);

// ── Defaults ─────────────────────────────────────────────────────────────────

/** Default daytime when not specified or on init. */
export const DEFAULT_DAYTIME = 'day';

/** Default weather when not specified or on init. */
export const DEFAULT_WEATHER = 'clear';

// ── Normalization Helpers ────────────────────────────────────────────────────

/**
 * Normalize a string value: trim whitespace and lowercase.
 * Returns null for null/undefined/empty inputs.
 *
 * @param {*} value — raw input value
 * @returns {string|null} — normalized string or null
 */
export function normalize(value) {
    if (value === null || value === undefined) {
        return null;
    }

    if (typeof value !== 'string') {
        return null;
    }

    const trimmed = value.trim().toLowerCase();
    return trimmed.length === 0 ? null : trimmed;
}

/**
 * Check whether a normalized value exists in a predefined list.
 * Normalizes the input before comparison.
 *
 * @param {*} value — raw input value
 * @param {ReadonlyArray<string>} list — predefined list to check against
 * @returns {boolean} — true if value is in the list
 */
export function isValidValue(value, list) {
    const normalized = normalize(value);
    if (normalized === null) {
        return false;
    }
    return list.includes(normalized);
}

/**
 * Validate and normalize a value against a predefined list.
 * Returns the normalized value if valid, null if the raw input is empty/null.
 * Logs a warning for non-null values that aren't in the list but still returns them.
 *
 * @param {*} value — raw input value
 * @param {ReadonlyArray<string>} list — predefined list to check against
 * @param {string} fieldName — name of the field (for warning messages)
 * @returns {string|null} — normalized value (even if not in list) or null
 */
export function normalizeAndWarn(value, list, fieldName) {
    const normalized = normalize(value);
    if (normalized === null) {
        return null;
    }
    if (!list.includes(normalized)) {
        console.warn(
            `[EverLook] Unknown ${fieldName} value: "${normalized}". ` +
            `Known values: [${list.join(', ')}]`,
        );
    }
    return normalized;
}

/**
 * Strictly validate a value against a predefined list.
 * Returns the normalized value if valid, or the fallback default if invalid.
 * Logs an error for invalid values.
 *
 * Used for daytime and weather where values must match known set
 * (they drive background file search).
 *
 * @param {*} value — raw input value
 * @param {ReadonlyArray<string>} list — predefined list to validate against
 * @param {string} defaultValue — fallback if value is invalid or null
 * @param {string} fieldName — name of the field (for error messages)
 * @returns {string} — validated value or default
 */
export function normalizeStrict(value, list, defaultValue, fieldName) {
    const normalized = normalize(value);
    if (normalized === null) {
        return defaultValue;
    }
    if (!list.includes(normalized)) {
        console.error(
            `[EverLook] Invalid ${fieldName} value: "${normalized}". ` +
            `Allowed: [${list.join(', ')}]. Using default: "${defaultValue}".`,
        );
        return defaultValue;
    }
    return normalized;
}
