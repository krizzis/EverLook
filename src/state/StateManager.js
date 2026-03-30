import { SceneState } from './SceneState.js';
import { appearanceExtractor } from '../analyzer/AppearanceExtractor.js';
import { initSceneExtractor } from '../analyzer/InitSceneExtractor.js';
import { parseCharacterDescription } from './cardMetadata.js';
import {
    getFirstCharacterMessage,
    getScenarioText,
    isDefaultLocation,
    needsInitialSceneExtraction,
} from '../runtime/chatHelpers.js';

/**
 * StateManager manages the Singleton instance of the active SceneState.
 * It handles multi-chat persistence by pushing and pulling from extension_settings
 * using SillyTavern's event hooks.
 * 
 * @see design.md §3.7 — Multi-Chat State Persistence
 */
class StateManager {
    /** @type {SceneState|null} */
    #currentState = null;

    /** @type {SceneState|null} */
    #baselineState = null;

    /** @type {string|null} */
    #chatId = null;

    /** @type {Object|null} */
    #extensionSettings = null;

    /** @type {Function|null} */
    #getContext = null;

    /** @type {Set<Function>} */
    #subscribers = new Set();

    /**
     * Injects SillyTavern dependencies so we avoid fragile relative file paths
     * pointing back to the ST root directory.
     * 
     * @param {Object} extensionSettings Global ST extension settings
     * @param {Function} getContext ST context resolver
     */
    setup(extensionSettings, getContextFn, options = {}) {
        this.#extensionSettings = extensionSettings;
        this.#getContext = getContextFn;
        appearanceExtractor.setup(options.appearanceProviderFn);
        initSceneExtractor.setup(options.initSceneProviderFn);
    }

    /**
     * @returns {SceneState|null} The canonical, immutable scene state for the active chat.
     */
    getState() {
        return this.#currentState;
    }

    /**
     * Subscribe to state changes so UI/runtime modules can react without polling.
     *
     * @param {Function} listener
     * @returns {Function} Unsubscribe callback
     */
    subscribe(listener) {
        if (typeof listener !== 'function') {
            throw new TypeError('[EverLook] StateManager.subscribe requires a listener function.');
        }

        this.#subscribers.add(listener);
        return () => this.#subscribers.delete(listener);
    }

    /**
     * Initializes the SceneState for the given chat ID.
     * Restores from settings if it exists, otherwise creates a new default state 
     * seeded with character card data.
     * 
     * @param {string} chatId 
     * @param {string} characterId 
     */
    async initChat(chatId, characterId) {
        if (!chatId) {
            console.warn('[EverLook] StateManager.initChat called without a chatId.');
            this.#currentState = null;
            this.#baselineState = null;
            this.#chatId = null;
            this.#notifySubscribers();
            return;
        }

        this.#chatId = chatId;
        let nextState = null;
        let shouldPersist = false;
        
        // Ensure the chatStates dictionary exists
        if (this.#extensionSettings && !this.#extensionSettings.EverLook) {
            this.#extensionSettings.EverLook = { chatStates: {} };
        }
        if (this.#extensionSettings && !this.#extensionSettings.EverLook.chatStates) {
            this.#extensionSettings.EverLook.chatStates = {};
        }

        const savedData = this.#extensionSettings ? this.#extensionSettings.EverLook.chatStates[chatId] : null;

        if (savedData) {
            try {
                nextState = SceneState.fromJSON(savedData);
                console.info(`[EverLook] SceneState revived for chat: ${chatId}`);
            } catch (err) {
                console.error(`[EverLook] Failed to parse saved SceneState for chat: ${chatId}, falling back to default.`, err);
                nextState = await this.#createFreshState(chatId, characterId);
                shouldPersist = true;
            }
        } else {
            nextState = await this.#createFreshState(chatId, characterId);
            shouldPersist = true;
        }

        this.#currentState = nextState;
        this.#baselineState = SceneState.fromJSON(nextState.toJSON());

        if (shouldPersist) {
            this.#saveState();
        }

        this.#notifySubscribers();
    }

    /**
     * Helper to scrape SillyTavern character data and instantiate a default state.
     * @private
     */
    async #createFreshState(chatId, characterId) {
        let name = 'Unknown Character';
        let lora = null;
        let rawDescription = '';
        let context = null;
        let charData = null;
        
        try {
            context = typeof this.#getContext === 'function' ? this.#getContext() : null;
            if (context && context.characters && context.characters[characterId]) {
                charData = context.characters[characterId];
                name = charData.name || charData.data?.name || name;
                rawDescription = charData.description || charData.data?.description || '';
            } else {
                console.warn(`[EverLook] Could not find character data for ID: ${characterId}`);
            }
        } catch (err) {
            console.error('[EverLook] Failed to extract character data from ST context.', err);
        }

        const parsed = parseCharacterDescription(rawDescription);
        let appearanceDesc = parsed.appearance || '';
        lora = parsed.lora || null;
        const outfit = parsed.outfit || [];

        if (!parsed.hasAppearanceMarker && parsed.rawDescription) {
            const extractedAppearance = await appearanceExtractor.extract(parsed.rawDescription);
            if (extractedAppearance) {
                appearanceDesc = extractedAppearance;
                console.info('[EverLook] Appearance initialized from LLM fallback.');
            } else {
                console.warn('[EverLook] No [APPEARANCE] marker found and LLM fallback did not produce appearance tags.');
            }
        }

        if (!parsed.hasLoraMarker && parsed.rawDescription) {
            console.info('[EverLook] No [LORA] marker found; character lora will be omitted.');
        }

        // TODO(T-012): Add a silent Tech-LLM init pass that derives starting pose,
        // emotion, and location from the active scenario plus the character's
        // first message before the first turn-pair analysis runs.
        let newState = SceneState.create({
            chatId,
            characterName: name,
            characterLora: lora,
            appearance: { description: appearanceDesc },
            pose: null,
            emotion: null,
            location: { name: null, daytime: 'day', weather: 'clear' },
            action: { name: null, interaction: false },
            outfit,
        });

        if (needsInitialSceneExtraction(newState)) {
            newState = await this.#seedInitialSceneState(newState, context, charData);
        }

        console.info(`[EverLook] SceneState created for chat: ${chatId}`);
        return newState;
    }

    async #seedInitialSceneState(baseState, context, charData) {
        const scenario = getScenarioText(context, charData);
        const firstMessage = getFirstCharacterMessage(context, charData);

        if (!scenario && !firstMessage) {
            return baseState;
        }

        try {
            const extracted = await initSceneExtractor.extract({
                scenario,
                firstMessage,
                currentState: baseState.toJSON(),
            });

            if (!extracted) {
                return baseState;
            }

            const seededChanges = {};

            if (baseState.pose == null && typeof extracted.pose === 'string' && extracted.pose) {
                seededChanges.pose = extracted.pose;
            }

            if (baseState.emotion == null && typeof extracted.emotion === 'string' && extracted.emotion) {
                seededChanges.emotion = extracted.emotion;
            }

            if (isDefaultLocation(baseState.location) && extracted.location && typeof extracted.location === 'object') {
                seededChanges.location = {
                    name: extracted.location.name ?? null,
                    daytime: extracted.location.daytime ?? baseState.location.daytime,
                    weather: extracted.location.weather ?? baseState.location.weather,
                };
            }

            if (Object.keys(seededChanges).length === 0) {
                return baseState;
            }

            console.info('[EverLook] Initial pose/emotion/location seeded from silent init extraction.');
            return baseState.update(seededChanges);
        } catch (error) {
            console.warn('[EverLook] Initial scene extraction failed. Safe defaults preserved.', error);
            return baseState;
        }
    }

    /**
     * Request an atomic update to the active state using partial changes.
     * Replaces the internal state tree and triggers an ST save.
     * 
     * @param {Object} changes 
     * @returns {SceneState|null} The new state, or null if uninitialized.
     */
    updateState(changes) {
        if (!this.#currentState) {
            console.warn('[EverLook] Cannot update state: no active chat initialized.');
            return null;
        }

        this.#currentState = this.#currentState.update(changes);
        this.#saveState();
        this.#notifySubscribers();

        return this.#currentState;
    }

    /**
     * Restore the current chat state to the last loaded baseline for this session.
     *
     * @returns {SceneState|null}
     */
    resetState() {
        if (!this.#baselineState) {
            console.warn('[EverLook] Cannot reset state: no baseline is available.');
            return null;
        }

        this.#currentState = SceneState.fromJSON(this.#baselineState.toJSON());
        this.#saveState();
        this.#notifySubscribers();
        return this.#currentState;
    }

    /**
     * Pushes the active state JSON into the ST settings object and debounces 
     * a disk save to prevent stuttering.
     * @private
     */
    #saveState() {
        if (!this.#chatId || !this.#currentState) return;

        try {
            if (this.#extensionSettings && this.#extensionSettings.EverLook) {
                this.#extensionSettings.EverLook.chatStates[this.#chatId] = this.#currentState.toJSON();
            }
            const context = typeof this.#getContext === 'function' ? this.#getContext() : null;
            if (context && typeof context.saveSettingsDebounced === 'function') {
                context.saveSettingsDebounced();
            }
        } catch (error) {
            console.error('[EverLook] Failed to save state to extension_settings:', error);
        }
    }

    /** Notify subscribers after the canonical state changes. */
    #notifySubscribers() {
        for (const listener of this.#subscribers) {
            try {
                listener(this.#currentState);
            } catch (error) {
                console.error('[EverLook] State subscriber failed:', error);
            }
        }
    }
}

// Export singleton instance
export const stateManager = new StateManager();
