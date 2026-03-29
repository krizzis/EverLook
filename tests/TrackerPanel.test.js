import { jest } from '@jest/globals';
import { SceneState } from '../src/state/SceneState.js';
import {
    TrackerPanel,
    buildTrackerMarkup,
    formatTrackerState,
    parseTrackerFormValues,
} from '../src/ui/TrackerPanel.js';

function createFakeNode({ length = 1 } = {}) {
    return {
        length,
        _classes: new Set(),
        _attrs: {},
        _children: {},
        _events: [],
        _html: '',
        _text: '',
        _appended: null,
        _removed: false,
        addClass(className) {
            this._classes.add(className);
            return this;
        },
        removeClass(className) {
            this._classes.delete(className);
            return this;
        },
        hasClass(className) {
            return this._classes.has(className);
        },
        attr(name, value) {
            if (value === undefined) {
                return this._attrs[name];
            }

            this._attrs[name] = value;
            return this;
        },
        html(value) {
            if (value === undefined) {
                return this._html;
            }

            this._html = value;
            return this;
        },
        text(value) {
            if (value === undefined) {
                return this._text;
            }

            this._text = value;
            return this;
        },
        on(eventName, selector, handler) {
            this._events.push({ eventName, selector, handler });
            return this;
        },
        find(selector) {
            return this._children[selector] ?? createFakeNode({ length: 0 });
        },
        append(child) {
            this._appended = child;
            return this;
        },
        remove() {
            this._removed = true;
            return this;
        },
    };
}

describe('TrackerPanel helpers', () => {
    it('formats SceneState values for form rendering', () => {
        const state = SceneState.createDefault(
            'chat-7',
            'Alice',
            '<lora:alice:1>',
            'long blonde hair, blue eyes',
        ).update({
            pose: 'standing',
            emotion: 'happy',
            location: { name: 'classroom', daytime: 'night', weather: 'rainy' },
            action: { name: 'talking', interaction: true },
            outfit: ['school uniform', 'skirt'],
        });

        expect(formatTrackerState(state)).toEqual({
            hasState: true,
            chatId: 'chat-7',
            characterName: 'Alice',
            characterLora: '<lora:alice:1>',
            appearance: 'long blonde hair, blue eyes',
            pose: 'standing',
            emotion: 'happy',
            locationName: 'classroom',
            daytime: 'night',
            weather: 'rainy',
            actionName: 'talking',
            actionInteraction: true,
            outfitText: 'school uniform, skirt',
        });
    });

    it('parses tracker form values into a StateManager-friendly change object', () => {
        expect(parseTrackerFormValues({
            pose: ' Standing ',
            emotion: ' Happy ',
            locationName: ' Classroom ',
            daytime: 'Night',
            weather: 'Rainy',
            actionName: ' Talking ',
            actionInteraction: true,
            outfitText: 'hoodie, boots,  scarf ',
        })).toEqual({
            pose: 'standing',
            emotion: 'happy',
            location: {
                name: 'classroom',
                daytime: 'night',
                weather: 'rainy',
            },
            action: {
                name: 'talking',
                interaction: true,
            },
            outfit: ['hoodie', 'boots', 'scarf'],
        });
    });

    it('normalizes empty text values and falls back invalid selects', () => {
        expect(parseTrackerFormValues({
            pose: null,
            emotion: '   ',
            locationName: undefined,
            daytime: 'not-a-real-daytime',
            weather: '',
            actionName: null,
            actionInteraction: false,
            outfitText: '',
        })).toEqual({
            pose: null,
            emotion: null,
            location: {
                name: null,
                daytime: 'day',
                weather: 'clear',
            },
            action: {
                name: null,
                interaction: false,
            },
            outfit: [],
        });
    });

    it('renders an empty-state message when no chat is active', () => {
        expect(buildTrackerMarkup(formatTrackerState(null))).toContain('Open a chat');
    });
});

describe('TrackerPanel', () => {
    const originalFormData = global.FormData;

    afterEach(() => {
        global.FormData = originalFormData;
    });

    it('mounts, renders, and toggles visibility', async () => {
        let subscriber = null;
        const stateManager = {
            subscribe: jest.fn(listener => {
                subscriber = listener;
                return jest.fn();
            }),
            getState: jest.fn(() => null),
        };

        const bodyNode = createFakeNode();
        const existingPanel = createFakeNode({ length: 0 });
        const statusNode = createFakeNode();
        const contentNode = createFakeNode();
        const panelNode = createFakeNode();
        panelNode._children['.everlook__tracker-status'] = statusNode;
        panelNode._children['.everlook__tracker-content'] = contentNode;

        const jquery = jest.fn(target => {
            if (target === '#everlook_tracker_panel') return existingPanel;
            if (target === 'body') return bodyNode;
            if (typeof target === 'string' && target.includes('everlook_tracker_panel')) return panelNode;
            return createFakeNode({ length: 0 });
        });

        const panel = new TrackerPanel();
        await panel.setup({
            stateManager,
            renderTemplateFn: async () => '<section id="everlook_tracker_panel"><div class="everlook__tracker-status"></div><div class="everlook__tracker-content"></div></section>',
            jquery,
        });

        expect(bodyNode._appended).toBe(panelNode);
        expect(statusNode._text).toBe('Waiting for an active chat');
        expect(contentNode._html).toContain('Open a chat');

        const nextState = SceneState.createDefault('chat-12', 'Alice', null, 'silver hair').update({
            pose: 'standing',
            outfit: ['hoodie'],
        });
        subscriber(nextState);

        expect(statusNode._text).toBe('Chat: chat-12');
        expect(contentNode._html).toContain('Alice');
        expect(contentNode._html).toContain('hoodie');

        expect(panel.toggle()).toBe(true);
        expect(panel.isVisible()).toBe(true);
        expect(panel.toggle()).toBe(false);
        expect(panel.isVisible()).toBe(false);
    });

    it('validates setup dependencies and mount target presence', async () => {
        const panel = new TrackerPanel();

        await expect(panel.setup({
            stateManager: {},
            renderTemplateFn: async () => '<section id="everlook_tracker_panel"></section>',
            jquery: () => createFakeNode(),
        })).rejects.toThrow('stateManager');

        await expect(panel.setup({
            stateManager: { subscribe: jest.fn(), getState: jest.fn() },
            renderTemplateFn: null,
            jquery: () => createFakeNode(),
        })).rejects.toThrow('renderTemplateFn');

        await expect(panel.setup({
            stateManager: { subscribe: jest.fn(), getState: jest.fn() },
            renderTemplateFn: async () => '<section id="everlook_tracker_panel"></section>',
            jquery: null,
        })).rejects.toThrow('jQuery-compatible');

        await expect(panel.setup({
            stateManager: { subscribe: jest.fn(() => jest.fn()), getState: jest.fn(() => null) },
            renderTemplateFn: async () => '<section id="everlook_tracker_panel"></section>',
            jquery: target => {
                if (target === '#everlook_tracker_panel') return createFakeNode({ length: 0 });
                return createFakeNode({ length: 0 });
            },
        })).rejects.toThrow('mount target');
    });

    it('returns safe defaults when rendering or toggling before setup', () => {
        const panel = new TrackerPanel();

        expect(panel.show()).toBe(false);
        expect(panel.hide()).toBe(false);
        expect(panel.isVisible()).toBe(false);
        expect(() => panel.render(null)).not.toThrow();
    });

    it('resets state through StateManager and reports success', () => {
        const panel = new TrackerPanel();
        panel._stateManager = {
            resetState: jest.fn(() => ({})),
        };
        panel._notifier = {
            success: jest.fn(),
            warning: jest.fn(),
            error: jest.fn(),
        };
        panel._logger = {
            info: jest.fn(),
            error: jest.fn(),
        };

        panel._handleReset();

        expect(panel._stateManager.resetState).toHaveBeenCalledTimes(1);
        expect(panel._notifier.success).toHaveBeenCalledWith('Scene state reset.');
        expect(panel._notifier.warning).not.toHaveBeenCalled();
    });

    it('warns when reset is requested without an available baseline', () => {
        const panel = new TrackerPanel();
        panel._stateManager = {
            resetState: jest.fn(() => null),
        };
        panel._notifier = {
            success: jest.fn(),
            warning: jest.fn(),
            error: jest.fn(),
        };
        panel._logger = {
            info: jest.fn(),
            error: jest.fn(),
        };

        panel._handleReset();

        expect(panel._notifier.warning).toHaveBeenCalledWith('No scene state is available to reset yet.');
        expect(panel._notifier.success).not.toHaveBeenCalled();
    });

    it('reports a reset failure through the notifier', () => {
        const panel = new TrackerPanel();
        panel._stateManager = {
            resetState: jest.fn(() => {
                throw new Error('boom');
            }),
        };
        panel._notifier = {
            warning: jest.fn(),
            error: jest.fn(),
        };
        panel._logger = {
            info: jest.fn(),
            error: jest.fn(),
        };

        panel._handleReset();

        expect(panel._logger.error).toHaveBeenCalled();
        expect(panel._notifier.error).toHaveBeenCalledWith('Failed to reset scene state.');
    });

    it('parses submitted form data and routes edits through StateManager', () => {
        global.FormData = class MockFormData {
            constructor(form) {
                this.form = form;
            }

            get(name) {
                return this.form[name] ?? null;
            }
        };

        const panel = new TrackerPanel();
        panel._stateManager = {
            updateState: jest.fn(),
        };
        panel._notifier = {
            success: jest.fn(),
            error: jest.fn(),
        };
        panel._logger = {
            info: jest.fn(),
            error: jest.fn(),
        };

        const event = {
            preventDefault: jest.fn(),
            currentTarget: {
                pose: 'Standing',
                emotion: 'Happy',
                locationName: 'Classroom',
                daytime: 'Night',
                weather: 'Rainy',
                actionName: 'Talking',
                actionInteraction: 'on',
                outfitText: 'hoodie, boots',
            },
        };

        panel._handleSubmit(event);

        expect(event.preventDefault).toHaveBeenCalledTimes(1);
        expect(panel._stateManager.updateState).toHaveBeenCalledWith({
            pose: 'standing',
            emotion: 'happy',
            location: {
                name: 'classroom',
                daytime: 'night',
                weather: 'rainy',
            },
            action: {
                name: 'talking',
                interaction: true,
            },
            outfit: ['hoodie', 'boots'],
        });
        expect(panel._notifier.success).toHaveBeenCalledWith('Scene state updated.');
    });

    it('reports submit failures through the notifier', () => {
        global.FormData = class MockFormData {
            constructor(form) {
                this.form = form;
            }

            get(name) {
                return this.form[name] ?? null;
            }
        };

        const panel = new TrackerPanel();
        panel._stateManager = {
            updateState: jest.fn(() => {
                throw new Error('bad update');
            }),
        };
        panel._notifier = {
            success: jest.fn(),
            error: jest.fn(),
        };
        panel._logger = {
            info: jest.fn(),
            error: jest.fn(),
        };

        panel._handleSubmit({
            preventDefault: jest.fn(),
            currentTarget: {
                pose: 'Standing',
                emotion: 'Happy',
                locationName: 'Classroom',
                daytime: 'Night',
                weather: 'Rainy',
                actionName: 'Talking',
                actionInteraction: 'on',
                outfitText: 'hoodie, boots',
            },
        });

        expect(panel._logger.error).toHaveBeenCalled();
        expect(panel._notifier.error).toHaveBeenCalledWith('Failed to update scene state.');
    });
});
