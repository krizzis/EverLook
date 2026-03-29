/**
 * constants.js unit tests
 * @implements T-002
 */

import { jest } from '@jest/globals';
import {
    POSES,
    EMOTIONS,
    ACTIONS,
    DAYTIMES,
    WEATHER,
    DEFAULT_DAYTIME,
    DEFAULT_WEATHER,
    normalize,
    isValidValue,
    normalizeAndWarn,
    normalizeStrict,
} from '../src/state/constants.js';

// ── Predefined Lists ─────────────────────────────────────────────────────────

describe('Predefined Lists', () => {
    test('POSES is a non-empty frozen array of strings', () => {
        expect(Array.isArray(POSES)).toBe(true);
        expect(POSES.length).toBeGreaterThan(0);
        expect(Object.isFrozen(POSES)).toBe(true);
        POSES.forEach(v => expect(typeof v).toBe('string'));
    });

    test('EMOTIONS is a non-empty frozen array of strings', () => {
        expect(Array.isArray(EMOTIONS)).toBe(true);
        expect(EMOTIONS.length).toBeGreaterThan(0);
        expect(Object.isFrozen(EMOTIONS)).toBe(true);
        EMOTIONS.forEach(v => expect(typeof v).toBe('string'));
    });

    test('ACTIONS is a non-empty frozen array of strings', () => {
        expect(Array.isArray(ACTIONS)).toBe(true);
        expect(ACTIONS.length).toBeGreaterThan(0);
        expect(Object.isFrozen(ACTIONS)).toBe(true);
        ACTIONS.forEach(v => expect(typeof v).toBe('string'));
    });

    test('DAYTIMES is a non-empty frozen array of strings', () => {
        expect(Array.isArray(DAYTIMES)).toBe(true);
        expect(DAYTIMES.length).toBe(8);
        expect(Object.isFrozen(DAYTIMES)).toBe(true);
        DAYTIMES.forEach(v => expect(typeof v).toBe('string'));
    });

    test('WEATHER is a non-empty frozen array of strings', () => {
        expect(Array.isArray(WEATHER)).toBe(true);
        expect(WEATHER.length).toBe(8);
        expect(Object.isFrozen(WEATHER)).toBe(true);
        WEATHER.forEach(v => expect(typeof v).toBe('string'));
    });

    test('POSES contains expected baseline values', () => {
        expect(POSES).toContain('standing');
        expect(POSES).toContain('sitting');
        expect(POSES).toContain('lying down');
    });

    test('EMOTIONS contains expected baseline values', () => {
        expect(EMOTIONS).toContain('happy');
        expect(EMOTIONS).toContain('sad');
        expect(EMOTIONS).toContain('neutral');
    });

    test('ACTIONS contains expected baseline values', () => {
        expect(ACTIONS).toContain('talking');
        expect(ACTIONS).toContain('eating');
        expect(ACTIONS).toContain('hugging');
    });

    test('DAYTIMES contains all required values from design.md', () => {
        const required = ['day', 'night', 'evening', 'morning', 'sunset', 'sunrise', 'dawn', 'dusk'];
        required.forEach(v => expect(DAYTIMES).toContain(v));
    });

    test('WEATHER contains all required values from design.md', () => {
        const required = ['clear', 'sunny', 'cloudy', 'rainy', 'snowy', 'foggy', 'windy', 'stormy'];
        required.forEach(v => expect(WEATHER).toContain(v));
    });

    test('lists cannot be mutated at runtime', () => {
        expect(() => { POSES.push('new pose'); }).toThrow();
        // ES modules run in strict mode — assignment to frozen array throws TypeError
        expect(() => { DAYTIMES[0] = 'midnight'; }).toThrow();
        expect(DAYTIMES[0]).toBe('day'); // Value unchanged
    });
});

// ── Defaults ─────────────────────────────────────────────────────────────────

describe('Defaults', () => {
    test('DEFAULT_DAYTIME is "day"', () => {
        expect(DEFAULT_DAYTIME).toBe('day');
    });

    test('DEFAULT_WEATHER is "clear"', () => {
        expect(DEFAULT_WEATHER).toBe('clear');
    });

    test('defaults are valid list values', () => {
        expect(DAYTIMES).toContain(DEFAULT_DAYTIME);
        expect(WEATHER).toContain(DEFAULT_WEATHER);
    });
});

// ── normalize() ──────────────────────────────────────────────────────────────

describe('normalize()', () => {
    test('trims whitespace', () => {
        expect(normalize('  standing  ')).toBe('standing');
    });

    test('lowercases text', () => {
        expect(normalize('Standing')).toBe('standing');
        expect(normalize('HAPPY')).toBe('happy');
    });

    test('trims and lowercases combined', () => {
        expect(normalize('  SITTING  ')).toBe('sitting');
    });

    test('returns null for null', () => {
        expect(normalize(null)).toBeNull();
    });

    test('returns null for undefined', () => {
        expect(normalize(undefined)).toBeNull();
    });

    test('returns null for empty string', () => {
        expect(normalize('')).toBeNull();
    });

    test('returns null for whitespace-only string', () => {
        expect(normalize('   ')).toBeNull();
    });

    test('returns null for non-string types', () => {
        expect(normalize(123)).toBeNull();
        expect(normalize(true)).toBeNull();
        expect(normalize({})).toBeNull();
        expect(normalize([])).toBeNull();
    });
});

// ── isValidValue() ───────────────────────────────────────────────────────────

describe('isValidValue()', () => {
    test('returns true for exact list match', () => {
        expect(isValidValue('standing', POSES)).toBe(true);
        expect(isValidValue('happy', EMOTIONS)).toBe(true);
        expect(isValidValue('day', DAYTIMES)).toBe(true);
    });

    test('matches case-insensitively', () => {
        expect(isValidValue('Standing', POSES)).toBe(true);
        expect(isValidValue('HAPPY', EMOTIONS)).toBe(true);
    });

    test('matches with surrounding whitespace', () => {
        expect(isValidValue('  standing  ', POSES)).toBe(true);
    });

    test('returns false for non-list value', () => {
        expect(isValidValue('flying kick', POSES)).toBe(false);
        expect(isValidValue('unknown_emotion', EMOTIONS)).toBe(false);
    });

    test('returns false for null', () => {
        expect(isValidValue(null, POSES)).toBe(false);
    });

    test('returns false for empty string', () => {
        expect(isValidValue('', POSES)).toBe(false);
    });

    test('returns false for non-string', () => {
        expect(isValidValue(42, POSES)).toBe(false);
    });
});

// ── normalizeAndWarn() ───────────────────────────────────────────────────────

describe('normalizeAndWarn()', () => {
    let warnSpy;

    beforeEach(() => {
        warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    });

    afterEach(() => {
        warnSpy.mockRestore();
    });

    test('returns normalized value for known list value', () => {
        expect(normalizeAndWarn('Standing', POSES, 'pose')).toBe('standing');
        expect(warnSpy).not.toHaveBeenCalled();
    });

    test('returns normalized value and warns for unknown value', () => {
        const result = normalizeAndWarn('backflipping', POSES, 'pose');
        expect(result).toBe('backflipping');
        expect(warnSpy).toHaveBeenCalledTimes(1);
        expect(warnSpy.mock.calls[0][0]).toContain('Unknown pose value');
        expect(warnSpy.mock.calls[0][0]).toContain('backflipping');
    });

    test('returns null for null input without warning', () => {
        expect(normalizeAndWarn(null, POSES, 'pose')).toBeNull();
        expect(warnSpy).not.toHaveBeenCalled();
    });

    test('returns null for empty string without warning', () => {
        expect(normalizeAndWarn('', POSES, 'pose')).toBeNull();
        expect(warnSpy).not.toHaveBeenCalled();
    });
});

// ── normalizeStrict() ────────────────────────────────────────────────────────

describe('normalizeStrict()', () => {
    let errorSpy;

    beforeEach(() => {
        errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        errorSpy.mockRestore();
    });

    test('returns normalized value for valid list value', () => {
        expect(normalizeStrict('Day', DAYTIMES, DEFAULT_DAYTIME, 'daytime')).toBe('day');
        expect(errorSpy).not.toHaveBeenCalled();
    });

    test('returns default and logs error for invalid value', () => {
        const result = normalizeStrict('midnight', DAYTIMES, DEFAULT_DAYTIME, 'daytime');
        expect(result).toBe(DEFAULT_DAYTIME);
        expect(errorSpy).toHaveBeenCalledTimes(1);
        expect(errorSpy.mock.calls[0][0]).toContain('Invalid daytime value');
    });

    test('returns default for null input', () => {
        expect(normalizeStrict(null, DAYTIMES, DEFAULT_DAYTIME, 'daytime')).toBe(DEFAULT_DAYTIME);
        expect(errorSpy).not.toHaveBeenCalled();
    });

    test('returns default for empty string', () => {
        expect(normalizeStrict('', DAYTIMES, DEFAULT_DAYTIME, 'daytime')).toBe(DEFAULT_DAYTIME);
        expect(errorSpy).not.toHaveBeenCalled();
    });

    test('works for weather validation', () => {
        expect(normalizeStrict('Rainy', WEATHER, DEFAULT_WEATHER, 'weather')).toBe('rainy');
        expect(normalizeStrict('hailing', WEATHER, DEFAULT_WEATHER, 'weather')).toBe(DEFAULT_WEATHER);
    });
});
