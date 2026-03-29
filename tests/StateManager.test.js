import { jest } from '@jest/globals';

// Set up globals before importing the module under test
global.extension_settings = {
    EverLook: {
        chatStates: {}
    }
};

const mockContext = {
    chatId: 'test-chat-1',
    characterId: 10,
    characters: {
        10: {
            name: 'Alice',
            description: '[APPEARANCE]\nlong blonde hair, blue eyes\n\n[LORA]\n<lora:alice:1>\n\n[OUTFIT]\nschool uniform, skirt'
        }
    },
    saveSettingsDebounced: jest.fn()
};

// We no longer rely on module importing for global ST objects.
// D.I. handles it now natively.

const { stateManager } = await import('../src/state/StateManager.js');
const { SceneState } = await import('../src/state/SceneState.js');

describe('StateManager', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        global.extension_settings.EverLook.chatStates = {};
        mockContext.characters = {
            10: {
                name: 'Alice',
                description: '[APPEARANCE]\nlong blonde hair, blue eyes\n\n[LORA]\n<lora:alice:1>\n\n[OUTFIT]\nschool uniform, skirt',
            },
        };
        
        // Inject fake ST environment variables
        stateManager.setup(global.extension_settings, () => mockContext);
        
        // Reset state
        return stateManager.initChat(null, null); // Forces reset
    });

    it('returns null state before initialization', () => {
        expect(stateManager.getState()).toBeNull();
    });

    it('creates a fresh state from ST context if explicit markers exist', async () => {
        await stateManager.initChat('test-chat-1', 10);
        const state = stateManager.getState();

        expect(state).not.toBeNull();
        expect(state.chatId).toBe('test-chat-1');
        expect(state.characterName).toBe('Alice');
        expect(state.appearance.description).toBe('long blonde hair, blue eyes');
        expect(state.characterLora).toBe('<lora:alice:1>');
        expect(state.outfit).toEqual(['school uniform', 'skirt']);

        // It should have saved to settings immediately
        const savedData = global.extension_settings.EverLook.chatStates['test-chat-1'];
        expect(savedData).toBeDefined();
        expect(savedData.chatId).toBe('test-chat-1');
        // Debounce save called
        expect(mockContext.saveSettingsDebounced).toHaveBeenCalledTimes(1);
    });

    it('creates a fresh state from inline marker syntax', async () => {
        mockContext.characters[10].description = '[APPEARANCE] adult, wavy long black hair, brown eyes, small breasts\n\n[LORA] <lora:carmen_pd_v1:1>\n\n[OUTFIT] white blouse, black skirt, stockings';

        await stateManager.initChat('test-chat-inline', 10);
        const state = stateManager.getState();

        expect(state.appearance.description).toBe('adult, wavy long black hair, brown eyes, small breasts');
        expect(state.characterLora).toBe('<lora:carmen_pd_v1:1>');
        expect(state.outfit).toEqual(['white blouse', 'black skirt', 'stockings']);
    });

    it('revives state from saved extension_settings', async () => {
        const dummySavedState = SceneState.createDefault('saved-chat-99', 'Bob').update({ pose: 'sitting' }).toJSON();
        global.extension_settings.EverLook.chatStates['saved-chat-99'] = dummySavedState;

        await stateManager.initChat('saved-chat-99');
        const state = stateManager.getState();

        expect(state).not.toBeNull();
        expect(state.chatId).toBe('saved-chat-99');
        expect(state.characterName).toBe('Bob');
        expect(state.pose).toBe('sitting'); // Verifies it was revived properly
    });

    it('falls back to fresh state if revived state JSON is invalid/corrupt', async () => {
        // Feed it bad data (e.g. invalid type)
        global.extension_settings.EverLook.chatStates['corrupt-chat'] = { chatId: 'corrupt-chat', characterName: 12345 }; // number instead of string

        // Temporarily suppress console.error for clean test output
        const spyError = jest.spyOn(console, 'error').mockImplementation(() => {});

        await stateManager.initChat('corrupt-chat', 10); // Should try to revive, fail, and fallback to fresh Character 10
        const state = stateManager.getState();

        expect(state.chatId).toBe('corrupt-chat');
        expect(state.characterName).toBe('Alice'); // Fallback fresh state extracted from char 10

        spyError.mockRestore();
    });

    it('returns null from updateState if not initialized', () => {
        const result = stateManager.updateState({ pose: 'standing' });
        expect(result).toBeNull();
    });

    it('updates state immutably and saves to settings', async () => {
        await stateManager.initChat('test-chat-1', 10);
        const initialState = stateManager.getState();
        
        mockContext.saveSettingsDebounced.mockClear();

        const newState = stateManager.updateState({ pose: 'standing' });

        expect(newState).not.toBe(initialState);
        expect(newState.pose).toBe('standing');
        expect(stateManager.getState()).toBe(newState);

        // Check if settings got updated
        const savedData = global.extension_settings.EverLook.chatStates['test-chat-1'];
        expect(savedData.pose).toBe('standing');
        expect(mockContext.saveSettingsDebounced).toHaveBeenCalledTimes(1);
    });

    it('notifies subscribers on init, update, reset, and chat clear', async () => {
        const listener = jest.fn();
        const unsubscribe = stateManager.subscribe(listener);

        await stateManager.initChat('test-chat-1', 10);
        const baselineState = listener.mock.calls.at(-1)[0];
        expect(baselineState.characterName).toBe('Alice');

        stateManager.updateState({ pose: 'standing' });
        expect(listener.mock.calls.at(-1)[0].pose).toBe('standing');

        stateManager.resetState();
        expect(listener.mock.calls.at(-1)[0].pose).toBeNull();

        await stateManager.initChat(null, null);
        expect(listener.mock.calls.at(-1)[0]).toBeNull();

        unsubscribe();
    });

    it('resets the current state to the chat baseline', async () => {
        await stateManager.initChat('test-chat-1', 10);
        stateManager.updateState({
            pose: 'standing',
            emotion: 'happy',
            location: { name: 'classroom', daytime: 'night', weather: 'rainy' },
            outfit: ['hoodie'],
        });

        const resetState = stateManager.resetState();

        expect(resetState.pose).toBeNull();
        expect(resetState.emotion).toBeNull();
        expect(resetState.location).toEqual({ name: null, daytime: 'day', weather: 'clear' });
        expect(resetState.outfit).toEqual(['school uniform', 'skirt']);
        expect(mockContext.saveSettingsDebounced).toHaveBeenCalled();
    });

    it('handles undefined ST context attributes gracefully when creating fresh state', async () => {
        const spyError = jest.spyOn(console, 'error').mockImplementation(() => {});
        const spyWarn = jest.spyOn(console, 'warn').mockImplementation(() => {});

        // Mock context without character
        const emptyContext = {};
        mockContext.characters = {}; 

        await stateManager.initChat('no-char-chat', 999);
        const state = stateManager.getState();

        // Should fallback
        expect(state.characterName).toBe('Unknown Character');
        expect(state.appearance.description).toBe('');
        expect(state.characterLora).toBeNull();

        spyError.mockRestore();
        spyWarn.mockRestore();
        
        // Restore context for other tests
        mockContext.characters = { 10: { name: 'Alice', description: '[APPEARANCE]\nlong blonde hair, blue eyes\n\n[LORA]\n<lora:alice:1>\n\n[OUTFIT]\nschool uniform, skirt' } };
    });

    it('uses LLM fallback for appearance when [APPEARANCE] is missing', async () => {
        const appearanceProviderFn = jest.fn().mockResolvedValue('{"appearance":["silver hair","green eyes"]}');
        stateManager.setup(global.extension_settings, () => mockContext, { appearanceProviderFn });
        mockContext.characters[10].description = 'A mysterious elf woman with silver hair and green eyes who guards the forest.';

        await stateManager.initChat('test-chat-llm', 10);
        const state = stateManager.getState();

        expect(appearanceProviderFn).toHaveBeenCalledTimes(1);
        expect(state.appearance.description).toBe('silver hair, green eyes');
        expect(state.characterLora).toBeNull();
        expect(state.outfit).toEqual([]);
    });

    it('skips lora when [LORA] marker is missing', async () => {
        mockContext.characters[10].description = '[APPEARANCE]\nshort black hair\n\n[OUTFIT]\nblazer, pencil skirt';

        await stateManager.initChat('test-chat-no-lora', 10);
        const state = stateManager.getState();

        expect(state.appearance.description).toBe('short black hair');
        expect(state.characterLora).toBeNull();
        expect(state.outfit).toEqual(['blazer', 'pencil skirt']);
    });
});
