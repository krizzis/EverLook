import { buildTurnPair, hasMeaningfulLocation, normalizeMessageText } from './chatHelpers.js';

function serializeState(state) {
    if (!state) {
        return null;
    }

    return typeof state.toJSON === 'function' ? state.toJSON() : state;
}

export class SceneRuntimeController {
    #getContextFn;
    #stateManager;
    #analyzer;
    #backgroundSwitcher;
    #getSettings;
    #logger;
    #providerFn = null;
    #pendingUserMessage = null;

    constructor({
        getContextFn,
        stateManager,
        analyzer,
        backgroundSwitcher,
        getSettings,
        logger = console,
    } = {}) {
        if (typeof getContextFn !== 'function') {
            throw new TypeError('SceneRuntimeController requires getContextFn.');
        }
        if (!stateManager || typeof stateManager.getState !== 'function' || typeof stateManager.updateState !== 'function') {
            throw new TypeError('SceneRuntimeController requires a StateManager-compatible dependency.');
        }
        if (!analyzer || typeof analyzer.setup !== 'function' || typeof analyzer.analyze !== 'function') {
            throw new TypeError('SceneRuntimeController requires an analyzer dependency.');
        }
        if (!backgroundSwitcher || typeof backgroundSwitcher.switch !== 'function') {
            throw new TypeError('SceneRuntimeController requires a BackgroundSwitcher dependency.');
        }
        if (typeof getSettings !== 'function') {
            throw new TypeError('SceneRuntimeController requires getSettings.');
        }

        this.#getContextFn = getContextFn;
        this.#stateManager = stateManager;
        this.#analyzer = analyzer;
        this.#backgroundSwitcher = backgroundSwitcher;
        this.#getSettings = getSettings;
        this.#logger = logger;
    }

    setup({ providerFn } = {}) {
        if (typeof providerFn !== 'function') {
            throw new TypeError('SceneRuntimeController.setup requires providerFn.');
        }

        this.#providerFn = providerFn;
    }

    captureUserMessage(messageIndex) {
        const context = this.#getContextFn();
        const message = context?.chat?.[messageIndex];
        const text = normalizeMessageText(message?.mes);

        if (!context?.chatId || !message || message.is_user !== true || message.is_system === true || !text) {
            return null;
        }

        this.#pendingUserMessage = {
            chatId: context.chatId,
            messageIndex,
            text,
        };

        return this.#pendingUserMessage;
    }

    async handleCharacterMessage(messageIndex, source = '') {
        if (source === 'first_message') {
            return null;
        }

        const context = this.#getContextFn();
        const state = this.#stateManager.getState();
        const settings = this.#getSettings() || {};

        if (!context?.chatId || !state || typeof this.#providerFn !== 'function') {
            return null;
        }

        const turnPair = buildTurnPair(context.chat, messageIndex, this.#pendingUserMessage, context.chatId);
        this.#pendingUserMessage = null;

        if (!turnPair) {
            this.#logger.warn?.('[EverLook] Runtime analysis skipped: no user/character turn pair could be resolved.');
            return null;
        }

        this.#analyzer.setup(this.#providerFn, settings.confidenceThreshold ?? 0.5);
        const changes = await this.#analyzer.analyze(turnPair, serializeState(state));

        if (!changes || Object.keys(changes).length === 0) {
            return {};
        }

        const updatedState = this.#stateManager.updateState(changes);

        if (settings.autoBackground && Object.prototype.hasOwnProperty.call(changes, 'location')) {
            await this.syncBackground(updatedState?.location);
        }

        return {
            turnPair,
            changes,
            updatedState,
        };
    }

    async syncBackgroundForCurrentState() {
        const settings = this.#getSettings() || {};
        const state = this.#stateManager.getState();

        if (!settings.autoBackground || !state) {
            return null;
        }

        return this.syncBackground(state.location);
    }

    async syncBackground(location) {
        if (!hasMeaningfulLocation(location)) {
            return null;
        }

        try {
            return await this.#backgroundSwitcher.switch(location);
        } catch (error) {
            this.#logger.warn?.('[EverLook] Background sync failed during runtime scene analysis.', error);
            return null;
        }
    }
}
