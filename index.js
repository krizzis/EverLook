/**
 * EverLook - Scene Tracker Extension for SillyTavern
 *
 * Entry point: extension lifecycle, event registration, settings management.
 * All business logic is delegated to modules under src/.
 *
 * @see design.md Section 3.2 - Entry Layer responsibilities
 */

import {
    extension_settings,
    renderExtensionTemplateAsync,
    getContext,
} from '../../../extensions.js';
import { PromptBuilder } from './src/prompt/PromptBuilder.js';
import { stateManager } from './src/state/StateManager.js';
import { trackerPanel } from './src/ui/TrackerPanel.js';
import {
    eventSource,
    event_types,
    getRequestHeaders,
    saveSettingsDebounced,
} from '../../../../script.js';
import { background_settings } from '../../../backgrounds.js';
import { SlashCommand } from '../../../../slash-commands/SlashCommand.js';
import { SlashCommandParser } from '../../../../slash-commands/SlashCommandParser.js';
import { backgroundSwitcher } from './src/background/BackgroundSwitcher.js';

const EXTENSION_NAME = 'EverLook';

/**
 * Folder path used by renderExtensionTemplateAsync.
 * Calculated dynamically so that cloning via ST's git importer
 * does not break template rendering.
 */
const url = new URL(import.meta.url);
const folderName = url.pathname.split('/').at(-2);
const EXTENSION_FOLDER_PATH = `third-party/${folderName}`;

const defaultSettings = {
    enabled: true,
    debug: false,
    confidenceThreshold: 0.5,
    autoBackground: true,
    chatStates: {},
};

function initSettings() {
    if (!extension_settings[EXTENSION_NAME]) {
        extension_settings[EXTENSION_NAME] = {};
    }

    for (const [key, value] of Object.entries(defaultSettings)) {
        if (extension_settings[EXTENSION_NAME][key] === undefined) {
            extension_settings[EXTENSION_NAME][key] = value;
        }
    }
}

function saveSettings() {
    saveSettingsDebounced();
}

function getSettings() {
    return extension_settings[EXTENSION_NAME];
}

function notify(kind, message) {
    globalThis.toastr?.[kind]?.(message, EXTENSION_NAME);
}

async function listSystemBackgrounds() {
    const response = await fetch('/api/backgrounds/all', {
        method: 'POST',
        headers: getRequestHeaders(),
        body: JSON.stringify({}),
    });

    if (!response.ok) {
        throw new Error(`Background list request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return Array.isArray(data?.images) ? data.images : [];
}

async function applySystemBackground(backgroundName) {
    const backgroundUrl = `url("backgrounds/${encodeURIComponent(backgroundName)}")`;

    if (!globalThis.chat_metadata?.custom_background) {
        $('#bg1').css('background-image', backgroundUrl);
    }

    background_settings.name = backgroundName;
    background_settings.url = backgroundUrl;
    saveSettingsDebounced();

    return backgroundName;
}

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
        async syncBackground(location = stateManager.getState()?.location) {
            return backgroundSwitcher.switch(location);
        },
        toggleTracker(force) {
            return trackerPanel.toggle(force);
        },
    };

    console.info(`[${EXTENSION_NAME}] Debug helpers available at window.everlookDebug`);
}

function bindSettingsUi() {
    const settings = getSettings();

    $('#everlook_enabled').prop('checked', settings.enabled);
    $('#everlook_enabled').on('change', function () {
        settings.enabled = Boolean($(this).prop('checked'));
        console.info(`[${EXTENSION_NAME}] Extension ${settings.enabled ? 'enabled' : 'disabled'}`);
        saveSettings();
    });

    $('#everlook_debug').prop('checked', settings.debug);
    $('#everlook_debug').on('change', function () {
        settings.debug = Boolean($(this).prop('checked'));
        console.info(`[${EXTENSION_NAME}] Debug logging ${settings.debug ? 'enabled' : 'disabled'}`);
        saveSettings();
    });

    $('#everlook_confidence_threshold').val(settings.confidenceThreshold);
    $('#everlook_confidence_threshold_value').text(settings.confidenceThreshold.toFixed(2));
    $('#everlook_confidence_threshold').on('input', function () {
        settings.confidenceThreshold = parseFloat($(this).val());
        $('#everlook_confidence_threshold_value').text(settings.confidenceThreshold.toFixed(2));
        saveSettings();
    });

    $('#everlook_auto_background').prop('checked', settings.autoBackground);
    $('#everlook_auto_background').on('change', function () {
        settings.autoBackground = Boolean($(this).prop('checked'));
        console.info(`[${EXTENSION_NAME}] Auto-background ${settings.autoBackground ? 'enabled' : 'disabled'}`);
        saveSettings();
    });
}

async function renderSettings() {
    const html = await renderExtensionTemplateAsync(EXTENSION_FOLDER_PATH, 'settings');
    $('#extensions_settings2').append(html);
    bindSettingsUi();
}

async function renderTrackerPanel() {
    await trackerPanel.setup({
        stateManager,
        renderTemplateFn: () => renderExtensionTemplateAsync(EXTENSION_FOLDER_PATH, 'src/ui/tracker'),
        logger: console,
        notifier: {
            success: message => notify('success', message),
            warning: message => notify('warning', message),
            error: message => notify('error', message),
        },
    });
}

function registerSlashCommands() {
    SlashCommandParser.addCommandObject(SlashCommand.fromProps({
        name: 'everlook-tracker',
        aliases: ['everlook-panel'],
        callback: (_namedArgs, unnamedArg) => {
            const mode = typeof unnamedArg === 'string' ? unnamedArg.trim().toLowerCase() : '';
            let isVisible = false;

            if (mode === 'show') {
                isVisible = trackerPanel.show();
            } else if (mode === 'hide') {
                isVisible = trackerPanel.hide();
            } else if (mode === 'toggle' || mode === '') {
                isVisible = trackerPanel.toggle();
            } else {
                notify('warning', 'Use /everlook-tracker show, hide, or toggle.');
                return '';
            }

            console.info(`[${EXTENSION_NAME}] Tracker panel ${isVisible ? 'shown' : 'hidden'} via slash command.`);
            return isVisible ? 'shown' : 'hidden';
        },
        helpString: 'Toggle the EverLook scene tracker panel. Optional argument: show, hide, or toggle.',
    }));
}

function onAppReady() {
    console.info(`[${EXTENSION_NAME}] App ready - extension loaded`);

    const settings = getSettings();
    if (settings.debug) {
        console.debug(`[${EXTENSION_NAME}] Settings:`, JSON.stringify(settings, null, 2));
    }
}

async function onChatChanged() {
    const settings = getSettings();
    if (!settings.enabled) {
        return;
    }

    const context = getContext();
    console.info(`[${EXTENSION_NAME}] Chat changed -> chatId=${context?.chatId ?? 'none'}`);

    if (context?.chatId) {
        await stateManager.initChat(context.chatId, context.characterId);
    }
}

function onMessageReceived(messageIndex) {
    const settings = getSettings();
    if (!settings.enabled) {
        return;
    }

    console.info(`[${EXTENSION_NAME}] Message received - index=${messageIndex}`);

    // TODO(T-004): TurnPairAnalyzer.analyze(turnPair, currentState)
}

function onMessageSent(messageIndex) {
    const settings = getSettings();
    if (!settings.enabled) {
        return;
    }

    if (settings.debug) {
        console.debug(`[${EXTENSION_NAME}] Message sent - index=${messageIndex}`);
    }

    // TODO(T-009): Inject current scene state into chat context
}

jQuery(async () => {
    try {
        initSettings();

        stateManager.setup(extension_settings, getContext);
        backgroundSwitcher.setup({
            listBackgroundsFn: listSystemBackgrounds,
            applyBackgroundFn: applySystemBackground,
        });

        await renderSettings();
        await renderTrackerPanel();

        registerSlashCommands();
        registerDebugHelpers();

        eventSource.on(event_types.APP_READY, onAppReady);
        eventSource.on(event_types.CHAT_CHANGED, onChatChanged);
        eventSource.on(event_types.MESSAGE_RECEIVED, onMessageReceived);
        eventSource.on(event_types.MESSAGE_SENT, onMessageSent);

        if (getContext()?.chatId) {
            await onChatChanged();
        }

        console.info(`[${EXTENSION_NAME}] Extension initialized`);
    } catch (error) {
        console.error(`[${EXTENSION_NAME}] Failed to initialize:`, error);
        notify('error', 'EverLook failed to initialize.');
    }
});
