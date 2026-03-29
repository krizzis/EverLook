import { SceneState } from './SceneState.js';
import { appearanceExtractor } from '../analyzer/AppearanceExtractor.js';
import { parseCharacterDescription } from './cardMetadata.js';

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

    /** @type {string|null} */
    #chatId = null;

    /** @type {Object|null} */
    #extensionSettings = null;

    /** @type {Function|null} */
    #getContext = null;

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
    }

    /**
     * @returns {SceneState|null} The canonical, immutable scene state for the active chat.
     */
    getState() {
        return this.#currentState;
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
            this.#chatId = null;
            return;
        }

        this.#chatId = chatId;
        
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
                this.#currentState = SceneState.fromJSON(savedData);
                console.info(`[EverLook] SceneState revived for chat: ${chatId}`);
            } catch (err) {
                console.error(`[EverLook] Failed to parse saved SceneState for chat: ${chatId}, falling back to default.`, err);
                this.#currentState = await this.#createFreshState(chatId, characterId);
            }
        } else {
            this.#currentState = await this.#createFreshState(chatId, characterId);
        }
    }

    /**
     * Helper to scrape SillyTavern character data and instantiate a default state.
     * @private
     */
    async #createFreshState(chatId, characterId) {
        let name = 'Unknown Character';
        let lora = null;
        let rawDescription = '';
        
        try {
            const context = typeof this.#getContext === 'function' ? this.#getContext() : null;
            if (context && context.characters && context.characters[characterId]) {
                const charData = context.characters[characterId];
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
        const newState = SceneState.create({
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
        console.info(`[EverLook] SceneState created for chat: ${chatId}`);
        
        this.#currentState = newState;
        this.#saveState(); // Persist immediately upon creation

        return newState;
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
}

// Export singleton instance
export const stateManager = new StateManager();
