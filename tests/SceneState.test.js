/**
 * SceneState unit tests
 * @implements T-002
 */

import { jest } from '@jest/globals';
import { SceneState } from '../src/state/SceneState.js';
import { DEFAULT_DAYTIME, DEFAULT_WEATHER } from '../src/state/constants.js';

// ── Test Helpers ─────────────────────────────────────────────────────────────

/** Minimal valid params for SceneState.create() */
function validParams(overrides = {}) {
    return {
        chatId: 'chat-001',
        characterName: 'Alice',
        characterLora: '<lora:alice:1>',
        appearance: { description: 'long blonde hair, blue eyes' },
        pose: 'standing',
        emotion: 'happy',
        location: { name: 'park', daytime: 'day', weather: 'clear' },
        action: { name: 'talking', interaction: false },
        outfit: ['school uniform', 'skirt'],
        ...overrides,
    };
}

// ── suppress expected console warnings during tests ──
let warnSpy, errorSpy;
beforeEach(() => {
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => {
    warnSpy.mockRestore();
    errorSpy.mockRestore();
});

// ── Factory: create() ────────────────────────────────────────────────────────

describe('SceneState.create()', () => {
    test('creates a valid state with all fields populated', () => {
        const state = SceneState.create(validParams());
        expect(state.chatId).toBe('chat-001');
        expect(state.characterName).toBe('Alice');
        expect(state.characterLora).toBe('<lora:alice:1>');
        expect(state.appearance).toEqual({ description: 'long blonde hair, blue eyes' });
        expect(state.pose).toBe('standing');
        expect(state.emotion).toBe('happy');
        expect(state.location).toEqual({ name: 'park', daytime: 'day', weather: 'clear' });
        expect(state.action).toEqual({ name: 'talking', interaction: false });
        expect(state.outfit).toEqual(['school uniform', 'skirt']);
    });

    test('normalizes string values to lowercase', () => {
        const state = SceneState.create(validParams({
            pose: 'Standing',
            emotion: 'HAPPY',
        }));
        expect(state.pose).toBe('standing');
        expect(state.emotion).toBe('happy');
    });

    test('trims whitespace from string values', () => {
        const state = SceneState.create(validParams({
            chatId: '  chat-001  ',
            characterName: '  Alice  ',
            pose: '  standing  ',
        }));
        expect(state.chatId).toBe('chat-001');
        expect(state.characterName).toBe('Alice');
        expect(state.pose).toBe('standing');
    });

    test('accepts null for optional fields', () => {
        const state = SceneState.create(validParams({
            characterLora: null,
            pose: null,
            emotion: null,
        }));
        expect(state.characterLora).toBeNull();
        expect(state.pose).toBeNull();
        expect(state.emotion).toBeNull();
    });

    test('throws on missing chatId', () => {
        expect(() => SceneState.create(validParams({ chatId: '' }))).toThrow('chatId');
    });

    test('throws on missing characterName', () => {
        expect(() => SceneState.create(validParams({ characterName: '' }))).toThrow('characterName');
    });

    test('throws on invalid pose type (non-string)', () => {
        expect(() => SceneState.create(validParams({ pose: 123 }))).toThrow('pose');
    });

    test('throws on invalid emotion type (non-string)', () => {
        expect(() => SceneState.create(validParams({ emotion: true }))).toThrow('emotion');
    });

    test('throws on invalid outfit type (non-array)', () => {
        expect(() => SceneState.create(validParams({ outfit: 'dress' }))).toThrow('outfit');
    });

    test('throws on outfit with non-string items', () => {
        expect(() => SceneState.create(validParams({ outfit: [123, true] }))).toThrow('outfit');
    });

    test('accepts novel pose value with warning (advisory validation)', () => {
        const state = SceneState.create(validParams({ pose: 'handstand' }));
        expect(state.pose).toBe('handstand');
        expect(warnSpy).toHaveBeenCalled();
    });

    test('accepts novel emotion value with warning (advisory validation)', () => {
        const state = SceneState.create(validParams({ emotion: 'euphoric' }));
        expect(state.emotion).toBe('euphoric');
        expect(warnSpy).toHaveBeenCalled();
    });

    test('accepts novel action name with warning (advisory validation)', () => {
        const state = SceneState.create(validParams({
            action: { name: 'juggling', interaction: false },
        }));
        expect(state.action.name).toBe('juggling');
        expect(warnSpy).toHaveBeenCalled();
    });
});

// ── Factory: createDefault() ─────────────────────────────────────────────────

describe('SceneState.createDefault()', () => {
    test('creates a valid empty state', () => {
        const state = SceneState.createDefault('chat-001', 'Alice');
        expect(state.chatId).toBe('chat-001');
        expect(state.characterName).toBe('Alice');
        expect(state.characterLora).toBeNull();
        expect(state.appearance).toEqual({ description: '' });
        expect(state.pose).toBeNull();
        expect(state.emotion).toBeNull();
        expect(state.location).toEqual({ name: null, daytime: DEFAULT_DAYTIME, weather: DEFAULT_WEATHER });
        expect(state.action).toEqual({ name: null, interaction: false });
        expect(state.outfit).toEqual([]);
    });

    test('accepts optional characterLora and appearance', () => {
        const state = SceneState.createDefault('chat-001', 'Alice', '<lora:alice:1>', 'blonde hair');
        expect(state.characterLora).toBe('<lora:alice:1>');
        expect(state.appearance.description).toBe('blonde hair');
    });
});

// ── Location Validation (Strict) ─────────────────────────────────────────────

describe('Location validation', () => {
    test('accepts valid location with all fields', () => {
        const state = SceneState.create(validParams({
            location: { name: 'forest', daytime: 'night', weather: 'rainy' },
        }));
        expect(state.location).toEqual({ name: 'forest', daytime: 'night', weather: 'rainy' });
    });

    test('defaults daytime when not provided', () => {
        const state = SceneState.create(validParams({
            location: { name: 'forest' },
        }));
        expect(state.location.daytime).toBe(DEFAULT_DAYTIME);
    });

    test('defaults weather when not provided', () => {
        const state = SceneState.create(validParams({
            location: { name: 'forest' },
        }));
        expect(state.location.weather).toBe(DEFAULT_WEATHER);
    });

    test('rejects invalid daytime value', () => {
        expect(() => SceneState.create(validParams({
            location: { name: 'forest', daytime: 'midnight', weather: 'clear' },
        }))).toThrow('daytime');
    });

    test('rejects invalid weather value', () => {
        expect(() => SceneState.create(validParams({
            location: { name: 'forest', daytime: 'day', weather: 'hailing' },
        }))).toThrow('weather');
    });

    test('accepts null location name', () => {
        const state = SceneState.create(validParams({
            location: { name: null, daytime: 'day', weather: 'clear' },
        }));
        expect(state.location.name).toBeNull();
    });

    test('normalizes location name', () => {
        const state = SceneState.create(validParams({
            location: { name: '  Forest  ', daytime: 'day', weather: 'clear' },
        }));
        expect(state.location.name).toBe('forest');
    });
});

// ── Action Validation ────────────────────────────────────────────────────────

describe('Action validation', () => {
    test('accepts valid action with interaction true', () => {
        const state = SceneState.create(validParams({
            action: { name: 'hugging', interaction: true },
        }));
        expect(state.action).toEqual({ name: 'hugging', interaction: true });
    });

    test('accepts null action name', () => {
        const state = SceneState.create(validParams({
            action: { name: null, interaction: false },
        }));
        expect(state.action.name).toBeNull();
    });

    test('defaults interaction to false when not provided', () => {
        const state = SceneState.create(validParams({
            action: { name: 'talking' },
        }));
        expect(state.action.interaction).toBe(false);
    });

    test('throws on invalid action.interaction type', () => {
        expect(() => SceneState.create(validParams({
            action: { name: 'talking', interaction: 'yes' },
        }))).toThrow('interaction');
    });

    test('throws on invalid action.name type', () => {
        expect(() => SceneState.create(validParams({
            action: { name: 123, interaction: false },
        }))).toThrow('action.name');
    });
});

// ── Outfit Validation ────────────────────────────────────────────────────────

describe('Outfit validation', () => {
    test('accepts array of strings', () => {
        const state = SceneState.create(validParams({
            outfit: ['dress', 'stockings', 'high heels'],
        }));
        expect(state.outfit).toEqual(['dress', 'stockings', 'high heels']);
    });

    test('treats null outfit as empty array', () => {
        const state = SceneState.create(validParams({ outfit: null }));
        expect(state.outfit).toEqual([]);
    });

    test('treats undefined outfit as empty array', () => {
        const params = validParams();
        delete params.outfit;
        const state = SceneState.create(params);
        expect(state.outfit).toEqual([]);
    });

    test('normalizes outfit items (trim + lowercase)', () => {
        const state = SceneState.create(validParams({
            outfit: ['  School Uniform  ', '  SKIRT  '],
        }));
        expect(state.outfit).toEqual(['school uniform', 'skirt']);
    });

    test('filters out empty/null outfit items', () => {
        const state = SceneState.create(validParams({
            outfit: ['dress', '', '  ', 'stockings'],
        }));
        expect(state.outfit).toEqual(['dress', 'stockings']);
    });

    test('throws on non-array outfit', () => {
        expect(() => SceneState.create(validParams({ outfit: 'dress' }))).toThrow('outfit');
    });
});

// ── Immutability ─────────────────────────────────────────────────────────────

describe('Immutability', () => {
    test('instance is frozen', () => {
        const state = SceneState.create(validParams());
        expect(Object.isFrozen(state)).toBe(true);
    });

    test('appearance is frozen', () => {
        const state = SceneState.create(validParams());
        expect(Object.isFrozen(state.appearance)).toBe(true);
    });

    test('location is frozen', () => {
        const state = SceneState.create(validParams());
        expect(Object.isFrozen(state.location)).toBe(true);
    });

    test('action is frozen', () => {
        const state = SceneState.create(validParams());
        expect(Object.isFrozen(state.action)).toBe(true);
    });

    test('outfit is frozen', () => {
        const state = SceneState.create(validParams());
        expect(Object.isFrozen(state.outfit)).toBe(true);
    });
});

// ── update() ─────────────────────────────────────────────────────────────────

describe('SceneState.update()', () => {
    test('returns a new instance', () => {
        const original = SceneState.create(validParams());
        const updated = original.update({ pose: 'sitting' });
        expect(updated).not.toBe(original);
        expect(updated).toBeInstanceOf(SceneState);
    });

    test('original remains unchanged', () => {
        const original = SceneState.create(validParams());
        original.update({ pose: 'sitting' });
        expect(original.pose).toBe('standing');
    });

    test('updates pose', () => {
        const state = SceneState.create(validParams()).update({ pose: 'sitting' });
        expect(state.pose).toBe('sitting');
    });

    test('updates emotion', () => {
        const state = SceneState.create(validParams()).update({ emotion: 'sad' });
        expect(state.emotion).toBe('sad');
    });

    test('updates location partially (name only)', () => {
        const state = SceneState.create(validParams()).update({
            location: { name: 'beach' },
        });
        expect(state.location.name).toBe('beach');
        expect(state.location.daytime).toBe('day');    // preserved
        expect(state.location.weather).toBe('clear');  // preserved
    });

    test('updates location partially (daytime only)', () => {
        const state = SceneState.create(validParams()).update({
            location: { daytime: 'night' },
        });
        expect(state.location.name).toBe('park');     // preserved
        expect(state.location.daytime).toBe('night');
    });

    test('updates action', () => {
        const state = SceneState.create(validParams()).update({
            action: { name: 'hugging', interaction: true },
        });
        expect(state.action).toEqual({ name: 'hugging', interaction: true });
    });

    test('updates outfit (full replacement)', () => {
        const state = SceneState.create(validParams()).update({
            outfit: ['bikini'],
        });
        expect(state.outfit).toEqual(['bikini']);
    });

    test('preserves immutable fields (characterName, characterLora, appearance)', () => {
        const state = SceneState.create(validParams()).update({ pose: 'sitting' });
        expect(state.characterName).toBe('Alice');
        expect(state.characterLora).toBe('<lora:alice:1>');
        expect(state.appearance.description).toBe('long blonde hair, blue eyes');
    });

    test('warns when attempting to update immutable fields', () => {
        const original = SceneState.create(validParams());
        original.update({ characterName: 'Bob' });
        expect(warnSpy).toHaveBeenCalledWith(
            expect.stringContaining('immutable field "characterName"'),
        );
    });

    test('throws on invalid changes object', () => {
        const state = SceneState.create(validParams());
        expect(() => state.update(null)).toThrow('changes must be a non-null object');
        expect(() => state.update('invalid')).toThrow('changes must be a non-null object');
    });

    test('validates updated values', () => {
        const state = SceneState.create(validParams());
        expect(() => state.update({ pose: 123 })).toThrow('pose');
    });

    test('multiple sequential updates work correctly', () => {
        const state1 = SceneState.create(validParams());
        const state2 = state1.update({ pose: 'sitting' });
        const state3 = state2.update({ emotion: 'sad', outfit: ['dress'] });

        expect(state1.pose).toBe('standing');
        expect(state1.emotion).toBe('happy');
        expect(state2.pose).toBe('sitting');
        expect(state2.emotion).toBe('happy');
        expect(state3.pose).toBe('sitting');
        expect(state3.emotion).toBe('sad');
        expect(state3.outfit).toEqual(['dress']);
    });
});

// ── Serialization ────────────────────────────────────────────────────────────

describe('Serialization (toJSON / fromJSON)', () => {
    test('toJSON returns a plain object with all fields', () => {
        const state = SceneState.create(validParams());
        const json = state.toJSON();

        expect(typeof json).toBe('object');
        expect(json).not.toBeInstanceOf(SceneState);
        expect(json.chatId).toBe('chat-001');
        expect(json.characterName).toBe('Alice');
        expect(json.characterLora).toBe('<lora:alice:1>');
        expect(json.appearance).toEqual({ description: 'long blonde hair, blue eyes' });
        expect(json.pose).toBe('standing');
        expect(json.emotion).toBe('happy');
        expect(json.location).toEqual({ name: 'park', daytime: 'day', weather: 'clear' });
        expect(json.action).toEqual({ name: 'talking', interaction: false });
        expect(json.outfit).toEqual(['school uniform', 'skirt']);
    });

    test('toJSON returns mutable copies (not frozen)', () => {
        const state = SceneState.create(validParams());
        const json = state.toJSON();

        // Should be mutable plain objects
        expect(Object.isFrozen(json)).toBe(false);
        expect(Object.isFrozen(json.location)).toBe(false);
        expect(Object.isFrozen(json.outfit)).toBe(false);
    });

    test('fromJSON round-trip preserves all fields', () => {
        const original = SceneState.create(validParams());
        const restored = SceneState.fromJSON(original.toJSON());

        expect(restored.chatId).toBe(original.chatId);
        expect(restored.characterName).toBe(original.characterName);
        expect(restored.characterLora).toBe(original.characterLora);
        expect(restored.appearance).toEqual(original.appearance);
        expect(restored.pose).toBe(original.pose);
        expect(restored.emotion).toBe(original.emotion);
        expect(restored.location).toEqual(original.location);
        expect(restored.action).toEqual(original.action);
        expect(restored.outfit).toEqual([...original.outfit]);
    });

    test('fromJSON round-trip with null optional fields', () => {
        const original = SceneState.create(validParams({
            characterLora: null,
            pose: null,
            emotion: null,
        }));
        const restored = SceneState.fromJSON(original.toJSON());

        expect(restored.characterLora).toBeNull();
        expect(restored.pose).toBeNull();
        expect(restored.emotion).toBeNull();
    });

    test('fromJSON throws on null input', () => {
        expect(() => SceneState.fromJSON(null)).toThrow('data must be a non-null object');
    });

    test('fromJSON throws on non-object input', () => {
        expect(() => SceneState.fromJSON('invalid')).toThrow('data must be a non-null object');
    });

    test('fromJSON throws on invalid data', () => {
        expect(() => SceneState.fromJSON({ chatId: '' })).toThrow('validation failed');
    });
});

// ── validate() ───────────────────────────────────────────────────────────────

describe('SceneState.validate()', () => {
    test('valid data returns { valid: true, errors: [] }', () => {
        const result = SceneState.validate(validParams());
        expect(result.valid).toBe(true);
        expect(result.errors).toEqual([]);
    });

    test('null returns invalid', () => {
        const result = SceneState.validate(null);
        expect(result.valid).toBe(false);
    });

    test('missing chatId returns error', () => {
        const result = SceneState.validate(validParams({ chatId: '' }));
        expect(result.valid).toBe(false);
        expect(result.errors).toContainEqual(expect.stringContaining('chatId'));
    });

    test('missing characterName returns error', () => {
        const result = SceneState.validate(validParams({ characterName: '' }));
        expect(result.valid).toBe(false);
        expect(result.errors).toContainEqual(expect.stringContaining('characterName'));
    });

    test('invalid pose type returns error', () => {
        const result = SceneState.validate(validParams({ pose: 123 }));
        expect(result.valid).toBe(false);
        expect(result.errors).toContainEqual(expect.stringContaining('pose'));
    });

    test('invalid location.daytime returns error', () => {
        const result = SceneState.validate(validParams({
            location: { name: 'park', daytime: 'midnight', weather: 'clear' },
        }));
        expect(result.valid).toBe(false);
        expect(result.errors).toContainEqual(expect.stringContaining('daytime'));
    });

    test('invalid location.weather returns error', () => {
        const result = SceneState.validate(validParams({
            location: { name: 'park', daytime: 'day', weather: 'hailing' },
        }));
        expect(result.valid).toBe(false);
        expect(result.errors).toContainEqual(expect.stringContaining('weather'));
    });

    test('invalid action.interaction type returns error', () => {
        const result = SceneState.validate(validParams({
            action: { name: 'talking', interaction: 'yes' },
        }));
        expect(result.valid).toBe(false);
        expect(result.errors).toContainEqual(expect.stringContaining('interaction'));
    });

    test('non-array outfit returns error', () => {
        const result = SceneState.validate(validParams({ outfit: 'dress' }));
        expect(result.valid).toBe(false);
        expect(result.errors).toContainEqual(expect.stringContaining('outfit'));
    });

    test('outfit with non-string item returns error', () => {
        const result = SceneState.validate(validParams({ outfit: [123] }));
        expect(result.valid).toBe(false);
        expect(result.errors).toContainEqual(expect.stringContaining('outfit[0]'));
    });

    test('accumulates multiple errors', () => {
        const result = SceneState.validate({
            chatId: '',
            characterName: '',
            pose: 123,
            outfit: 'invalid',
        });
        expect(result.valid).toBe(false);
        expect(result.errors.length).toBeGreaterThanOrEqual(4);
    });
});
