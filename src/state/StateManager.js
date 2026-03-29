import { SceneState } from './SceneState.js';
import { getContext, extension_settings } from '../../../../extensions.js';

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
    initChat(chatId, characterId) {
        if (!chatId) {
            console.warn('[EverLook] StateManager.initChat called without a chatId.');
            this.#currentState = null;
            this.#chatId = null;
            return;
        }

        this.#chatId = chatId;
        
        // Ensure the chatStates dictionary exists
        if (!extension_settings.EverLook) {
            extension_settings.EverLook = { chatStates: {} };
        }
        if (!extension_settings.EverLook.chatStates) {
            extension_settings.EverLook.chatStates = {};
        }

        const savedData = extension_settings.EverLook.chatStates[chatId];

        if (savedData) {
            try {
                this.#currentState = SceneState.fromJSON(savedData);
                console.info(`[EverLook] SceneState revived for chat: ${chatId}`);
            } catch (err) {
                console.error(`[EverLook] Failed to parse saved SceneState for chat: ${chatId}, falling back to default.`, err);
                this.#currentState = this.#createFreshState(chatId, characterId);
            }
        } else {
            this.#currentState = this.#createFreshState(chatId, characterId);
        }
    }

    /**
     * Helper to scrape SillyTavern character data and instantiate a default state.
     * @private
     */
    #createFreshState(chatId, characterId) {
        let name = 'Unknown Character';
        let appearanceDesc = '';
        let lora = null;
        
        try {
            const context = getContext();
            if (context && context.characters && context.characters[characterId]) {
                const charData = context.characters[characterId];
                name = charData.name || charData.data?.name || name;
                appearanceDesc = charData.description || charData.data?.description || '';
                lora = charData.creator_notes || charData.data?.creator_notes || null; // Fallback, ST format varies
            } else {
                console.warn(`[EverLook] Could not find character data for ID: ${characterId}`);
            }
        } catch (err) {
            console.error('[EverLook] Failed to extract character data from ST context.', err);
        }

        const newState = SceneState.createDefault(chatId, name, lora, appearanceDesc);
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
            extension_settings.EverLook.chatStates[this.#chatId] = this.#currentState.toJSON();
            const context = getContext();
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
