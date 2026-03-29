/**
 * PromptBuilder unit tests
 * @implements T-005
 */

import { SceneState } from '../src/state/SceneState.js';
import { PromptBuilder } from '../src/prompt/PromptBuilder.js';

function createState(overrides = {}) {
    return SceneState.create({
        chatId: 'chat-005',
        characterName: 'Alice',
        characterLora: '<lora:alice:1>',
        appearance: { description: 'Long Blonde Hair, Blue Eyes' },
        pose: 'standing',
        emotion: 'happy',
        location: { name: 'park', daytime: 'day', weather: 'clear' },
        action: { name: 'talking', interaction: false },
        outfit: ['School Uniform', 'Skirt'],
        ...overrides,
    });
}

describe('PromptBuilder', () => {
    test('generates tags in the required order', () => {
        const prompt = PromptBuilder.build(createState());

        expect(prompt).toBe(
            '1girl, solo, long blonde hair, blue eyes, standing, school uniform, skirt, happy, talking, park background, day, clear, <lora:alice:1>',
        );
    });

    test('handles interaction flag for subject and action tags', () => {
        const prompt = PromptBuilder.build(createState({
            action: { name: 'hugging', interaction: true },
        }));

        expect(prompt).toContain('1girl, long blonde hair');
        expect(prompt).not.toContain('1girl, solo');
        expect(prompt).toContain('happy, 1boy, hugging, park background');
    });

    test('handles empty outfit as completely nude', () => {
        const prompt = PromptBuilder.build(createState({ outfit: [] }));

        expect(prompt).toContain('standing, completely nude, happy');
    });

    test('omits null and empty attributes while keeping valid defaults', () => {
        const prompt = PromptBuilder.build(createState({
            characterLora: null,
            pose: null,
            emotion: '   ',
            appearance: { description: '  ' },
            action: { name: null, interaction: false },
            location: { name: null, daytime: 'night', weather: 'foggy' },
        }));

        expect(prompt).toBe('1girl, solo, school uniform, skirt, night, foggy');
        expect(prompt).not.toContain('null');
        expect(prompt).not.toContain('undefined');
    });

    test('keeps 1boy when interaction is true even without an action name', () => {
        const prompt = PromptBuilder.build(createState({
            action: { name: null, interaction: true },
        }));

        expect(prompt).toContain('happy, 1boy, park background');
    });

    test('produces deterministic output for identical state input', () => {
        const state = createState();

        expect(PromptBuilder.build(state)).toBe(PromptBuilder.build(state));
        expect(PromptBuilder.build(state.toJSON())).toBe(PromptBuilder.build(state));
    });

    test('avoids trailing and double commas when optional fields are absent', () => {
        const prompt = PromptBuilder.build(createState({
            characterLora: null,
            appearance: { description: 'blue eyes, , long hair' },
            pose: null,
            emotion: null,
            action: { name: null, interaction: false },
            location: { name: 'forest', daytime: 'day', weather: 'clear' },
            outfit: ['dress'],
        }));

        expect(prompt).toBe('1girl, solo, blue eyes, long hair, dress, forest background, day, clear');
        expect(prompt).not.toContain(', ,');
        expect(prompt.endsWith(',')).toBe(false);
    });

    test('throws on invalid state input', () => {
        expect(() => PromptBuilder.build(null)).toThrow('sceneState must be a non-null object');
    });
});
