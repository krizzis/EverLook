import {
    buildTechLlmQuietPrompt,
    buildTurnPair,
    findLatestUserMessage,
    getFirstCharacterMessage,
    getScenarioText,
    hasMeaningfulLocation,
    isDefaultLocation,
    needsInitialSceneExtraction,
    normalizeMessageText,
} from '../src/runtime/chatHelpers.js';

describe('chatHelpers', () => {
    test('normalizes message text safely', () => {
        expect(normalizeMessageText('  hello  ')).toBe('hello');
        expect(normalizeMessageText('   ')).toBeNull();
        expect(normalizeMessageText(null)).toBeNull();
    });

    test('builds a quiet Tech-LLM prompt with labeled sections', () => {
        const prompt = buildTechLlmQuietPrompt('System rules', 'User task');

        expect(prompt).toBe('SYSTEM:\nSystem rules\n\nUSER:\nUser task');
    });

    test('resolves scenario from chat metadata before character card data', () => {
        expect(getScenarioText(
            { chatMetadata: { scenario: 'Chat override' } },
            { scenario: 'Character scenario' },
        )).toBe('Chat override');
    });

    test('falls back to character scenario text when chat metadata is empty', () => {
        expect(getScenarioText(
            { chatMetadata: {} },
            { data: { scenario: 'Card scenario' } },
        )).toBe('Card scenario');
    });

    test('finds the first character message from active chat before card fallback', () => {
        const message = getFirstCharacterMessage(
            {
                chat: [
                    { is_user: true, is_system: false, mes: 'Hello' },
                    { is_user: false, is_system: false, mes: '*She waits by the door.*' },
                ],
            },
            { first_mes: '*Fallback greeting*' },
        );

        expect(message).toBe('*She waits by the door.*');
    });

    test('falls back to the card first message when chat history is empty', () => {
        expect(getFirstCharacterMessage(
            { chat: [] },
            { data: { first_mes: '*Fallback greeting*' } },
        )).toBe('*Fallback greeting*');
    });

    test('finds the latest user message before a character response', () => {
        const chat = [
            { is_user: true, is_system: false, mes: 'First' },
            { is_user: false, is_system: false, mes: 'Reply one' },
            { is_user: true, is_system: false, mes: 'Second' },
            { is_user: false, is_system: false, mes: 'Reply two' },
        ];

        expect(findLatestUserMessage(chat, 3)).toEqual({ index: 2, text: 'Second' });
    });

    test('searches from the end when no explicit upper bound is provided', () => {
        const chat = [
            { is_user: true, is_system: false, mes: 'First' },
            { is_user: false, is_system: false, mes: 'Reply one' },
            { is_user: true, is_system: false, mes: 'Latest user message' },
        ];

        expect(findLatestUserMessage(chat)).toEqual({ index: 2, text: 'Latest user message' });
    });

    test('builds a turn pair from a pending user message when available', () => {
        const chat = [
            { is_user: true, is_system: false, mes: 'Walk with me.' },
            { is_user: false, is_system: false, mes: '*She nods and follows.*' },
        ];

        expect(buildTurnPair(chat, 1, {
            chatId: 'chat-1',
            messageIndex: 0,
            text: 'Walk with me.',
        }, 'chat-1')).toEqual({
            userMessage: 'Walk with me.',
            characterResponse: '*She nods and follows.*',
        });
    });

    test('falls back to chat search when no pending user message exists', () => {
        const chat = [
            { is_user: true, is_system: false, mes: 'Sit down.' },
            { is_user: false, is_system: false, mes: '*She sits beside you.*' },
        ];

        expect(buildTurnPair(chat, 1, null, 'chat-2')).toEqual({
            userMessage: 'Sit down.',
            characterResponse: '*She sits beside you.*',
        });
    });

    test('returns null when a turn pair cannot be resolved', () => {
        expect(buildTurnPair([
            { is_user: false, is_system: false, mes: '*No user prompt preceded this.*' },
        ], 0, null, 'chat-3')).toBeNull();
    });

    test('detects default and meaningful locations', () => {
        expect(isDefaultLocation({ name: null, daytime: 'day', weather: 'clear' })).toBe(true);
        expect(isDefaultLocation({ name: 'forest', daytime: 'day', weather: 'clear' })).toBe(false);
        expect(hasMeaningfulLocation({ name: 'forest' })).toBe(true);
        expect(hasMeaningfulLocation({ name: '   ' })).toBe(false);
    });

    test('detects whether initial scene extraction is still needed', () => {
        expect(needsInitialSceneExtraction({
            pose: null,
            emotion: 'happy',
            location: { name: null, daytime: 'day', weather: 'clear' },
        })).toBe(true);

        expect(needsInitialSceneExtraction({
            pose: 'standing',
            emotion: 'happy',
            location: { name: 'forest', daytime: 'night', weather: 'foggy' },
        })).toBe(false);
    });
});
