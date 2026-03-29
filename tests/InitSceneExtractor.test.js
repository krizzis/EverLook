import { jest } from '@jest/globals';
import { buildInitScenePrompt, InitSceneExtractor, INIT_SCENE_SYSTEM_PROMPT } from '../src/analyzer/InitSceneExtractor.js';

describe('InitSceneExtractor', () => {
    beforeEach(() => {
        jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    test('builds a prompt from scenario and first message context', () => {
        const prompt = buildInitScenePrompt({
            scenario: 'A rainy night in the city.',
            firstMessage: '*She waits under a streetlamp, soaked.*',
            currentState: { pose: null, emotion: null },
        });

        expect(prompt).toContain('SCENARIO:');
        expect(prompt).toContain('A rainy night in the city.');
        expect(prompt).toContain('FIRST CHARACTER MESSAGE:');
        expect(prompt).toContain('streetlamp');
        expect(prompt).toContain('"pose": null');
    });

    test('uses the tightened init prompt guidance', () => {
        expect(INIT_SCENE_SYSTEM_PROMPT).toContain('Emotion must describe a visible expression');
        expect(INIT_SCENE_SYSTEM_PROMPT).toContain('Do not combine them into phrases like "cool evening"');
    });

    test('returns null when no provider is configured', async () => {
        const extractor = new InitSceneExtractor();

        await expect(extractor.extract({
            scenario: 'Forest clearing',
            firstMessage: '*She stands in the mist.*',
        })).resolves.toBeNull();
    });

    test('extracts pose, emotion, and location from valid JSON', async () => {
        const extractor = new InitSceneExtractor();
        const providerFn = jest.fn().mockResolvedValue(
            '{"pose":"Standing","emotion":"Alert","location":{"name":"forest clearing","daytime":"night","weather":"foggy"}}',
        );

        extractor.setup(providerFn);

        await expect(extractor.extract({
            scenario: 'A foggy forest clearing at night.',
            firstMessage: '*She stands watch among the trees.*',
        })).resolves.toEqual({
            pose: 'standing',
            emotion: 'alert',
            location: {
                name: 'forest clearing',
                daytime: 'night',
                weather: 'foggy',
            },
        });

        expect(providerFn).toHaveBeenCalledWith(
            INIT_SCENE_SYSTEM_PROMPT,
            expect.stringContaining('A foggy forest clearing at night.'),
        );
    });

    test('accepts fenced JSON responses', async () => {
        const extractor = new InitSceneExtractor();
        extractor.setup(async () => '```json\n{"pose":"sitting","emotion":"calm","location":{"name":"library","daytime":"evening","weather":"clear"}}\n```');

        await expect(extractor.extract({
            scenario: 'A quiet library at dusk.',
            firstMessage: '*She sits by the window.*',
        })).resolves.toEqual({
            pose: 'sitting',
            emotion: 'calm',
            location: {
                name: 'library',
                daytime: 'evening',
                weather: 'clear',
            },
        });
    });

    test('returns null on malformed JSON', async () => {
        const extractor = new InitSceneExtractor();
        extractor.setup(async () => '{"pose":');

        await expect(extractor.extract({
            scenario: 'A beach at sunrise.',
            firstMessage: '*She smiles at the waves.*',
        })).resolves.toBeNull();
    });
});
