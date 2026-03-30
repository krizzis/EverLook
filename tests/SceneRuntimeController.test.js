import { jest } from '@jest/globals';
import { SceneRuntimeController } from '../src/runtime/SceneRuntimeController.js';

describe('SceneRuntimeController', () => {
    let context;
    let stateManager;
    let analyzer;
    let backgroundSwitcher;
    let settings;
    let controller;

    beforeEach(() => {
        context = {
            chatId: 'chat-1',
            chat: [
                { is_user: true, is_system: false, mes: 'Sit with me.' },
                { is_user: false, is_system: false, mes: '*She sits on the bench and smiles.*' },
            ],
        };

        stateManager = {
            getState: jest.fn(() => ({
                pose: null,
                emotion: null,
                location: { name: null, daytime: 'day', weather: 'clear' },
                toJSON() {
                    return {
                        pose: null,
                        emotion: null,
                        location: { name: null, daytime: 'day', weather: 'clear' },
                    };
                },
            })),
            updateState: jest.fn(changes => ({
                ...changes,
                location: changes.location ?? { name: null, daytime: 'day', weather: 'clear' },
            })),
        };

        analyzer = {
            setup: jest.fn(),
            analyze: jest.fn(),
        };

        backgroundSwitcher = {
            switch: jest.fn(),
        };

        settings = {
            confidenceThreshold: 0.65,
            autoBackground: true,
        };

        controller = new SceneRuntimeController({
            getContextFn: () => context,
            stateManager,
            analyzer,
            backgroundSwitcher,
            getSettings: () => settings,
            logger: {
                warn: jest.fn(),
            },
        });
    });

    test('captures the latest user message', () => {
        expect(controller.captureUserMessage(0)).toEqual({
            chatId: 'chat-1',
            messageIndex: 0,
            text: 'Sit with me.',
        });
    });

    test('ignores non-user messages when capturing a pending turn', () => {
        expect(controller.captureUserMessage(1)).toBeNull();
    });

    test('runs turn-pair analysis and updates state', async () => {
        const providerFn = jest.fn();
        analyzer.analyze.mockResolvedValue({
            pose: 'sitting',
            emotion: 'smiling',
        });

        controller.setup({ providerFn });
        controller.captureUserMessage(0);

        const result = await controller.handleCharacterMessage(1, 'normal');

        expect(analyzer.setup).toHaveBeenCalledWith(providerFn, 0.65);
        expect(analyzer.analyze).toHaveBeenCalledWith(
            {
                userMessage: 'Sit with me.',
                characterResponse: '*She sits on the bench and smiles.*',
            },
            expect.any(Object),
        );
        expect(stateManager.updateState).toHaveBeenCalledWith({
            pose: 'sitting',
            emotion: 'smiling',
        });
        expect(result.changes.pose).toBe('sitting');
        expect(backgroundSwitcher.switch).not.toHaveBeenCalled();
    });

    test('triggers background switching when location changes', async () => {
        const providerFn = jest.fn();
        analyzer.analyze.mockResolvedValue({
            location: { name: 'park', daytime: 'evening', weather: 'clear' },
        });
        stateManager.updateState.mockReturnValue({
            location: { name: 'park', daytime: 'evening', weather: 'clear' },
        });

        controller.setup({ providerFn });
        controller.captureUserMessage(0);
        await controller.handleCharacterMessage(1, 'normal');

        expect(backgroundSwitcher.switch).toHaveBeenCalledWith({
            name: 'park',
            daytime: 'evening',
            weather: 'clear',
        });
    });

    test('skips runtime analysis for the initial greeting event', async () => {
        controller.setup({ providerFn: jest.fn() });

        await expect(controller.handleCharacterMessage(1, 'first_message')).resolves.toBeNull();
        expect(analyzer.analyze).not.toHaveBeenCalled();
    });

    test('syncs background for the current state when enabled', async () => {
        stateManager.getState.mockReturnValue({
            location: { name: 'forest', daytime: 'night', weather: 'foggy' },
        });
        controller.setup({ providerFn: jest.fn() });

        await controller.syncBackgroundForCurrentState();

        expect(backgroundSwitcher.switch).toHaveBeenCalledWith({
            name: 'forest',
            daytime: 'night',
            weather: 'foggy',
        });
    });

    test('returns null when runtime analysis has no active state', async () => {
        stateManager.getState.mockReturnValue(null);
        controller.setup({ providerFn: jest.fn() });

        await expect(controller.handleCharacterMessage(1, 'normal')).resolves.toBeNull();
        expect(analyzer.analyze).not.toHaveBeenCalled();
    });

    test('returns an empty result when analyzer finds no changes', async () => {
        analyzer.analyze.mockResolvedValue({});
        controller.setup({ providerFn: jest.fn() });
        controller.captureUserMessage(0);

        await expect(controller.handleCharacterMessage(1, 'normal')).resolves.toEqual({});
        expect(stateManager.updateState).not.toHaveBeenCalled();
    });

    test('skips background sync when the location is empty', async () => {
        controller.setup({ providerFn: jest.fn() });

        await expect(controller.syncBackground({ name: '   ' })).resolves.toBeNull();
        expect(backgroundSwitcher.switch).not.toHaveBeenCalled();
    });

    test('swallows background sync failures without crashing runtime analysis', async () => {
        backgroundSwitcher.switch.mockRejectedValue(new Error('missing background'));
        controller.setup({ providerFn: jest.fn() });

        await expect(controller.syncBackground({
            name: 'park',
            daytime: 'evening',
            weather: 'clear',
        })).resolves.toBeNull();
    });

    test('warns and preserves runtime flow when extracted changes fail state validation', async () => {
        const warn = jest.fn();
        analyzer.analyze.mockResolvedValue({
            emotion: 'smiling',
            location: { name: 'park', daytime: 'evening', weather: 'cool evening' },
        });
        stateManager.updateState.mockImplementation(() => {
            throw new Error('SceneState validation failed: location.weather is invalid.');
        });

        controller = new SceneRuntimeController({
            getContextFn: () => context,
            stateManager,
            analyzer,
            backgroundSwitcher,
            getSettings: () => settings,
            logger: { warn },
        });
        controller.setup({ providerFn: jest.fn() });
        controller.captureUserMessage(0);

        await expect(controller.handleCharacterMessage(1, 'normal')).resolves.toEqual({
            turnPair: {
                userMessage: 'Sit with me.',
                characterResponse: '*She sits on the bench and smiles.*',
            },
            changes: {
                emotion: 'smiling',
                location: { name: 'park', daytime: 'evening', weather: 'cool evening' },
            },
            updatedState: null,
            skipped: true,
            reason: 'invalid_scene_update',
        });
        expect(warn).toHaveBeenCalledWith(expect.stringContaining('Runtime scene update skipped'));
        expect(backgroundSwitcher.switch).not.toHaveBeenCalled();
    });
});
