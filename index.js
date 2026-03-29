/**
 * EverLook — Scene Tracker Extension for SillyTavern
 *
 * Entry point: extension lifecycle, event registration, settings management.
 * All business logic is delegated to modules under src/.
 *
 * @see design.md §3.2 — Entry Layer responsibilities
 */

import {
    extension_settings,
    renderExtensionTemplateAsync,
    getContext,
} from '../../../extensions.js';
import { PromptBuilder } from './src/prompt/PromptBuilder.js';
import { stateManager } from './src/state/StateManager.js';
import {
    eventSource,
    event_types,
    saveSettingsDebounced,
} from '../../../../script.js';

// ── Constants ────────────────────────────────────────────────────────────────

const EXTENSION_NAME = 'EverLook';

/**
 * Folder path used by renderExtensionTemplateAsync.
 * Calculated dynamically so that cloning via ST's git importer (which names the folder
 * after the github repo) does not break template rendering.
 */
const _url = new URL(import.meta.url);
const _folderName = _url.pathname.split('/').at(-2);
const EXTENSION_FOLDER_PATH = `third-party/${_folderName}`;

/**
 * Default settings applied on first load or when keys are missing.
 * Kept flat and minimal — complex per-chat state lives in chatStates.
 */
const defaultSettings = {
    enabled: true,
    debug: false,
    confidenceThreshold: 0.5,
    autoBackground: true,
    chatStates: {},
};

// ── Settings helpers ─────────────────────────────────────────────────────────

/**
 * Ensure extension_settings[EXTENSION_NAME] exists and merge defaults
 * for any missing keys. Preserves existing user values.
 *
 * Pattern matches ST built-in extensions (e.g. vectors/index.js):
 *   if (!extension_settings.vectors) { extension_settings.vectors = settings; }
 *   Object.assign(settings, extension_settings.vectors);
 */
function initSettings() {
    if (!extension_settings[EXTENSION_NAME]) {
        extension_settings[EXTENSION_NAME] = {};
    }

    // Fill in any missing default keys without overwriting user values
    for (const [key, value] of Object.entries(defaultSettings)) {
        if (extension_settings[EXTENSION_NAME][key] === undefined) {
            extension_settings[EXTENSION_NAME][key] = value;
        }
    }
}

/** Persist settings via SillyTavern's debounced save. */
function saveSettings() {
    saveSettingsDebounced();
}

/** Convenience getter for current settings object. */
function getSettings() {
    return extension_settings[EXTENSION_NAME];
}

/**
 * Expose a tiny manual verification surface in the browser console.
 * This keeps prompt debugging available before the full image hook lands.
 */
function registerDebugHelpers() {
    globalThis.everlookDebug = {
        getState() {
            return stateManager.getState();
        },
        buildPrompt(sceneState = stateManager.getState()) {
            const prompt = PromptBuilder.build(sceneState);
            console.info(`[${EXTENSION_NAME}] Debug prompt:`, prompt);
            return prompt;
        },
    };

    console.info(`[${EXTENSION_NAME}] Debug helpers available at window.everlookDebug`);
}

// ── Settings UI ──────────────────────────────────────────────────────────────

/**
 * Bind DOM controls to settings values:
 *   - Read current values → set control states
 *   - Attach change handlers → persist on toggle/slide
 */
function bindSettingsUi() {
    const s = getSettings();

    // Enabled
    $('#everlook_enabled').prop('checked', s.enabled);
    $('#everlook_enabled').on('change', function () {
        s.enabled = Boolean($(this).prop('checked'));
        console.info(`[${EXTENSION_NAME}] Extension ${s.enabled ? 'enabled' : 'disabled'}`);
        saveSettings();
    });

    // Debug
    $('#everlook_debug').prop('checked', s.debug);
    $('#everlook_debug').on('change', function () {
        s.debug = Boolean($(this).prop('checked'));
        console.info(`[${EXTENSION_NAME}] Debug logging ${s.debug ? 'enabled' : 'disabled'}`);
        saveSettings();
    });

    // Confidence threshold
    $('#everlook_confidence_threshold').val(s.confidenceThreshold);
    $('#everlook_confidence_threshold_value').text(s.confidenceThreshold.toFixed(2));
    $('#everlook_confidence_threshold').on('input', function () {
        s.confidenceThreshold = parseFloat($(this).val());
        $('#everlook_confidence_threshold_value').text(s.confidenceThreshold.toFixed(2));
        saveSettings();
    });

    // Auto background
    $('#everlook_auto_background').prop('checked', s.autoBackground);
    $('#everlook_auto_background').on('change', function () {
        s.autoBackground = Boolean($(this).prop('checked'));
        console.info(`[${EXTENSION_NAME}] Auto-background ${s.autoBackground ? 'enabled' : 'disabled'}`);
        saveSettings();
    });
}

/**
 * Render settings HTML template into the ST extension settings area,
 * then bind controls.
 */
async function renderSettings() {
    const html = await renderExtensionTemplateAsync(EXTENSION_FOLDER_PATH, 'settings');
    $('#extensions_settings2').append(html);
    bindSettingsUi();
}

// ── Event Handlers ───────────────────────────────────────────────────────────

/** Called when SillyTavern is fully ready. */
function onAppReady() {
    console.info(`[${EXTENSION_NAME}] App ready — extension loaded`);

    const s = getSettings();
    if (s.debug) {
        console.debug(`[${EXTENSION_NAME}] Settings:`, JSON.stringify(s, null, 2));
    }
}

/**
 * Called when the active chat changes (switch character, switch chat, new chat).
 * Will be wired to StateManager.onChatChanged in T-003.
 */
function onChatChanged() {
    const s = getSettings();
    if (!s.enabled) return;

    const context = getContext();
    console.info(`[${EXTENSION_NAME}] Chat changed → chatId=${context?.chatId ?? 'none'}`);

    if (context && context.chatId) {
        stateManager.initChat(context.chatId, context.characterId);
    }
}

/**
 * Called after the character (RP-LLM) has fully responded.
 * Will be wired to TurnPairAnalyzer.analyze in T-004.
 */
function onMessageReceived(messageIndex) {
    const s = getSettings();
    if (!s.enabled) return;

    console.info(`[${EXTENSION_NAME}] Message received — index=${messageIndex}`);

    // TODO(T-004): TurnPairAnalyzer.analyze(turnPair, currentState)
}

/**
 * Called when user sends a message (before RP-LLM generates).
 * Will be wired to context injection in T-009.
 */
function onMessageSent(messageIndex) {
    const s = getSettings();
    if (!s.enabled) return;

    if (s.debug) {
        console.debug(`[${EXTENSION_NAME}] Message sent — index=${messageIndex}`);
    }

    // TODO(T-009): Inject current scene state into chat context
}

// ── Startup ──────────────────────────────────────────────────────────────────

/**
 * Extension initialization.
 *
 * Uses jQuery(async () => {...}) matching the standard ST extension pattern.
 * Settings are accessed directly via the global extension_settings object
 * (populated by ST core before extensions activate). We do NOT call
 * loadExtensionSettings() — that's a global bootstrap function, not
 * a per-extension API.
 */
jQuery(async () => {
    try {
        // 1. Initialize settings (merge defaults for missing keys)
        initSettings();

        // 2. Inject ST global handlers into the StateManager
        stateManager.setup(extension_settings, getContext);

        // 3. Render settings UI
        await renderSettings();

        // 4. Register debug helpers for manual verification
        registerDebugHelpers();

        // 5. Register event handlers
        eventSource.on(event_types.APP_READY, onAppReady);
        eventSource.on(event_types.CHAT_CHANGED, onChatChanged);
        eventSource.on(event_types.MESSAGE_RECEIVED, onMessageReceived);
        eventSource.on(event_types.MESSAGE_SENT, onMessageSent);

        console.info(`[${EXTENSION_NAME}] Extension initialized`);
    } catch (error) {
        console.error(`[${EXTENSION_NAME}] Failed to initialize:`, error);
    }
});
