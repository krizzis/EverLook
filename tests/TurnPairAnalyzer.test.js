import { jest } from '@jest/globals';
import { turnPairAnalyzer } from '../src/analyzer/TurnPairAnalyzer.js';
import { SYSTEM_PROMPT, buildUserPrompt } from '../src/analyzer/prompts.js';

describe('TurnPairAnalyzer', () => {
    let mockProvider;

    beforeEach(() => {
        jest.clearAllMocks();
        mockProvider = jest.fn();
        turnPairAnalyzer.setup(mockProvider, 0.7);
        // Suppress expected logs during tests
        jest.spyOn(console, 'info').mockImplementation(() => {});
        jest.spyOn(console, 'warn').mockImplementation(() => {});
        jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    const dummyState = {
        pose: 'standing',
        emotion: 'neutral',
        location: { name: 'forest', daytime: 'day', weather: 'clear' },
        action: { name: 'talking', interaction: false },
        outfit: ['shirt']
    };

    const dummyTurnPair = {
        userMessage: 'Hello there!',
        characterResponse: '*I sit down and smile* General Kenobi!'
    };

    it('requires providerFn to be a function', () => {
        expect(() => turnPairAnalyzer.setup('not-a-function')).toThrow(TypeError);
    });

    it('successfully extracts and returns valid changes above confidence threshold', async () => {
        const mockedJson = {
            changes: {
                pose: { value: 'SITTING', confidence: 0.95 },
                emotion: { value: 'smiling', confidence: 0.8 },
                location: { value: { name: 'Desert', daytime: 'NIGHT', weather: 'clear' }, confidence: 0.85 }
            }
        };
        mockProvider.mockResolvedValueOnce(JSON.stringify(mockedJson));

        const result = await turnPairAnalyzer.analyze(dummyTurnPair, dummyState);
        
        expect(result.pose).toBe('sitting');
        expect(result.emotion).toBe('smiling');
        expect(result.location.name).toBe('desert');
        expect(result.location.daytime).toBe('night');
        
        expect(mockProvider).toHaveBeenCalledWith(SYSTEM_PROMPT, buildUserPrompt(dummyTurnPair, dummyState));
        expect(console.info).toHaveBeenCalledTimes(3);
    });

    it('filters out changes below confidence threshold', async () => {
        const mockedJson = {
            changes: {
                pose: { value: 'sitting', confidence: 0.65 }, // < 0.7
                emotion: { value: 'angry', confidence: 0.9 }  // >= 0.7
            }
        };
        mockProvider.mockResolvedValueOnce(JSON.stringify(mockedJson));

        const result = await turnPairAnalyzer.analyze(dummyTurnPair, dummyState);
        
        expect(result.pose).toBeUndefined();
        expect(result.emotion).toBe('angry');
        
        expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('Skipped attribute pose'));
    });

    it('gracefully handles markdown code block wrappers from LLMs', async () => {
        const mockedText = `Here are the changes:
\`\`\`json
{
    "changes": {
        "outfit": { "value": ["coat", "hat"], "confidence": 0.9 }
    }
}
\`\`\`
Hope this helps!`;
        mockProvider.mockResolvedValueOnce(mockedText);

        const result = await turnPairAnalyzer.analyze(dummyTurnPair, dummyState);
        expect(result.outfit).toEqual(['coat', 'hat']);
    });

    it('gracefully handles non-json and empty responses', async () => {
        mockProvider.mockResolvedValueOnce("I don't know.");
        
        const result = await turnPairAnalyzer.analyze(dummyTurnPair, dummyState);
        expect(result).toEqual({});
        expect(console.error).toHaveBeenCalledWith(expect.stringContaining('empty or non-JSON'));
    });

    it('gracefully handles malformed JSON parsing errors', async () => {
        mockProvider.mockResolvedValueOnce('{ "changes": { "broken: } }'); // Invalid JSON
        
        const result = await turnPairAnalyzer.analyze(dummyTurnPair, dummyState);
        expect(result).toEqual({});
        expect(console.error.mock.calls[0][0]).toContain('malformed JSON');
    });

    it('gracefully handles provider errors (e.g., network failure)', async () => {
        mockProvider.mockRejectedValueOnce(new Error('Network offline'));
        
        const result = await turnPairAnalyzer.analyze(dummyTurnPair, dummyState);
        expect(result).toEqual({});
        expect(console.error.mock.calls[0][0]).toContain('provider layer');
    });

    it('ignores invalid payload schemas safely', async () => {
        const mockedJson = {
            changes: {
                pose: "should-be-object",
                emotion: { value: "sad", confidence: "not-a-number" }
            }
        };
        mockProvider.mockResolvedValueOnce(JSON.stringify(mockedJson));

        const result = await turnPairAnalyzer.analyze(dummyTurnPair, dummyState);
        expect(result).toEqual({});
    });
});
