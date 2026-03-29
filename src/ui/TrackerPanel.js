/**
 * TrackerPanel - Scene tracker UI rendering and edit handlers.
 *
 * Renders current scene state in human-readable form,
 * supports manual editing and reset, toggleable via slash command.
 *
 * @see design.md Section 3.2 - UI Layer
 * @implements T-007
 */

import {
    ACTIONS,
    DAYTIMES,
    EMOTIONS,
    POSES,
    WEATHER,
} from '../state/constants.js';

function escapeHtml(value) {
    return String(value ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
}

function normalizeOptionalText(value) {
    if (value === null || value === undefined) {
        return null;
    }

    const normalized = String(value).trim().toLowerCase();
    return normalized.length > 0 ? normalized : null;
}

function normalizeSelectValue(value, allowedValues, fallback) {
    const normalized = normalizeOptionalText(value);
    if (!normalized) {
        return fallback;
    }

    return allowedValues.includes(normalized) ? normalized : fallback;
}

function buildOptions(options, selectedValue) {
    return options.map(option => {
        const selected = option === selectedValue ? ' selected' : '';
        return `<option value="${escapeHtml(option)}"${selected}>${escapeHtml(option)}</option>`;
    }).join('');
}

function buildDatalist(id, options) {
    const optionMarkup = options
        .map(option => `<option value="${escapeHtml(option)}"></option>`)
        .join('');

    return `<datalist id="${escapeHtml(id)}">${optionMarkup}</datalist>`;
}

function buildReadOnlyValue(value, emptyLabel = 'Not set') {
    const text = value
        ? escapeHtml(value)
        : `<span class="everlook__muted">${escapeHtml(emptyLabel)}</span>`;
    return `<div class="everlook__readonly-value">${text}</div>`;
}

export function formatTrackerState(state) {
    return {
        hasState: Boolean(state),
        chatId: state?.chatId ?? '',
        characterName: state?.characterName ?? '',
        characterLora: state?.characterLora ?? '',
        appearance: state?.appearance?.description ?? '',
        pose: state?.pose ?? '',
        emotion: state?.emotion ?? '',
        locationName: state?.location?.name ?? '',
        daytime: state?.location?.daytime ?? DAYTIMES[0],
        weather: state?.location?.weather ?? WEATHER[0],
        actionName: state?.action?.name ?? '',
        actionInteraction: Boolean(state?.action?.interaction),
        outfitText: Array.isArray(state?.outfit) ? state.outfit.join(', ') : '',
    };
}

export function parseTrackerFormValues(formValues) {
    return {
        pose: normalizeOptionalText(formValues.pose),
        emotion: normalizeOptionalText(formValues.emotion),
        location: {
            name: normalizeOptionalText(formValues.locationName),
            daytime: normalizeSelectValue(formValues.daytime, DAYTIMES, DAYTIMES[0]),
            weather: normalizeSelectValue(formValues.weather, WEATHER, WEATHER[0]),
        },
        action: {
            name: normalizeOptionalText(formValues.actionName),
            interaction: Boolean(formValues.actionInteraction),
        },
        outfit: String(formValues.outfitText ?? '')
            .split(',')
            .map(item => item.trim())
            .filter(Boolean),
    };
}

export function buildTrackerMarkup(viewModel) {
    if (!viewModel.hasState) {
        return `
            <div class="everlook__tracker-empty">
                <p class="everlook__muted">Open a chat to inspect and edit the current EverLook scene state.</p>
            </div>
        `;
    }

    return `
        <form class="everlook__tracker-form">
            <section class="everlook__tracker-section">
                <h4 class="everlook__tracker-section-title">Character</h4>
                <div class="everlook__field-grid">
                    <label class="everlook__field">
                        <span class="everlook__field-label">Name</span>
                        ${buildReadOnlyValue(viewModel.characterName, 'Unknown')}
                    </label>
                    <label class="everlook__field">
                        <span class="everlook__field-label">Lora</span>
                        ${buildReadOnlyValue(viewModel.characterLora, 'Not set')}
                    </label>
                    <label class="everlook__field everlook__field--full">
                        <span class="everlook__field-label">Appearance</span>
                        <textarea class="text_pole everlook__textarea" rows="3" readonly>${escapeHtml(viewModel.appearance)}</textarea>
                    </label>
                </div>
            </section>

            <section class="everlook__tracker-section">
                <h4 class="everlook__tracker-section-title">Scene</h4>
                <div class="everlook__field-grid">
                    <label class="everlook__field">
                        <span class="everlook__field-label">Pose</span>
                        <input class="text_pole" type="text" name="pose" list="everlook_pose_options" value="${escapeHtml(viewModel.pose)}" placeholder="standing">
                    </label>
                    <label class="everlook__field">
                        <span class="everlook__field-label">Emotion</span>
                        <input class="text_pole" type="text" name="emotion" list="everlook_emotion_options" value="${escapeHtml(viewModel.emotion)}" placeholder="happy">
                    </label>
                    <label class="everlook__field">
                        <span class="everlook__field-label">Action</span>
                        <input class="text_pole" type="text" name="actionName" list="everlook_action_options" value="${escapeHtml(viewModel.actionName)}" placeholder="talking">
                    </label>
                    <label class="everlook__field everlook__field--checkbox">
                        <input type="checkbox" name="actionInteraction"${viewModel.actionInteraction ? ' checked' : ''}>
                        <span class="everlook__field-label">Interacting with user</span>
                    </label>
                    <label class="everlook__field everlook__field--full">
                        <span class="everlook__field-label">Outfit</span>
                        <textarea class="text_pole everlook__textarea" name="outfitText" rows="3" placeholder="school uniform, skirt">${escapeHtml(viewModel.outfitText)}</textarea>
                        <span class="everlook__field-help">Comma-separated tags.</span>
                    </label>
                </div>
            </section>

            <section class="everlook__tracker-section">
                <h4 class="everlook__tracker-section-title">Location</h4>
                <div class="everlook__field-grid">
                    <label class="everlook__field everlook__field--full">
                        <span class="everlook__field-label">Location name</span>
                        <input class="text_pole" type="text" name="locationName" value="${escapeHtml(viewModel.locationName)}" placeholder="classroom">
                    </label>
                    <label class="everlook__field">
                        <span class="everlook__field-label">Daytime</span>
                        <select class="text_pole" name="daytime">${buildOptions(DAYTIMES, viewModel.daytime)}</select>
                    </label>
                    <label class="everlook__field">
                        <span class="everlook__field-label">Weather</span>
                        <select class="text_pole" name="weather">${buildOptions(WEATHER, viewModel.weather)}</select>
                    </label>
                </div>
            </section>

            <div class="everlook__tracker-actions">
                <button type="submit" class="menu_button">Save Scene</button>
                <button type="button" class="menu_button menu_button_icon" data-everlook-action="reset">Reset Scene</button>
            </div>

            ${buildDatalist('everlook_pose_options', POSES)}
            ${buildDatalist('everlook_emotion_options', EMOTIONS)}
            ${buildDatalist('everlook_action_options', ACTIONS)}
        </form>
    `;
}

export class TrackerPanel {
    constructor() {
        this._stateManager = null;
        this._panel = null;
        this._status = null;
        this._content = null;
        this._unsubscribe = null;
        this._logger = console;
        this._notifier = {};
        this._jquery = null;
    }

    async setup({
        stateManager,
        renderTemplateFn,
        mountSelector = 'body',
        logger = console,
        notifier = {},
        jquery = globalThis.jQuery ?? globalThis.$,
    }) {
        if (!stateManager || typeof stateManager.subscribe !== 'function') {
            throw new TypeError('[EverLook] TrackerPanel.setup requires a stateManager with subscribe().');
        }

        if (typeof renderTemplateFn !== 'function') {
            throw new TypeError('[EverLook] TrackerPanel.setup requires a renderTemplateFn().');
        }

        if (typeof jquery !== 'function') {
            throw new TypeError('[EverLook] TrackerPanel.setup requires a jQuery-compatible function.');
        }

        this._stateManager = stateManager;
        this._logger = logger;
        this._notifier = notifier;
        this._jquery = jquery;

        const existingPanel = jquery('#everlook_tracker_panel');
        if (existingPanel?.length) {
            existingPanel.remove();
        }

        const mountTarget = jquery(mountSelector);
        if (!mountTarget?.length) {
            throw new Error(`[EverLook] TrackerPanel mount target "${mountSelector}" was not found.`);
        }

        const templateHtml = await renderTemplateFn();
        this._panel = jquery(templateHtml);
        mountTarget.append(this._panel);
        this._status = this._panel.find('.everlook__tracker-status');
        this._content = this._panel.find('.everlook__tracker-content');
        this._panel.attr('aria-hidden', 'true');

        this._bindEvents();

        if (typeof this._unsubscribe === 'function') {
            this._unsubscribe();
        }

        this._unsubscribe = this._stateManager.subscribe(state => this.render(state));
        this.render(this._stateManager.getState());

        return this;
    }

    render(state) {
        if (!this._panel || !this._status || !this._content) {
            return;
        }

        const viewModel = formatTrackerState(state);
        const statusText = viewModel.hasState
            ? `Chat: ${viewModel.chatId}`
            : 'Waiting for an active chat';

        this._status.text(statusText);
        this._content.html(buildTrackerMarkup(viewModel));
    }

    show() {
        if (!this._panel) {
            return false;
        }

        this._panel.addClass('active');
        this._panel.attr('aria-hidden', 'false');
        return true;
    }

    hide() {
        if (!this._panel) {
            return false;
        }

        this._panel.removeClass('active');
        this._panel.attr('aria-hidden', 'true');
        return false;
    }

    toggle(force) {
        if (force === true) {
            return this.show();
        }

        if (force === false) {
            return this.hide();
        }

        return this.isVisible() ? this.hide() : this.show();
    }

    isVisible() {
        return Boolean(this._panel?.hasClass('active'));
    }

    _bindEvents() {
        this._panel.on('click', '[data-everlook-action="close"]', () => {
            this.hide();
        });

        this._panel.on('click', '[data-everlook-action="reset"]', () => {
            this._handleReset();
        });

        this._panel.on('submit', '.everlook__tracker-form', event => {
            this._handleSubmit(event);
        });
    }

    _handleReset() {
        try {
            const nextState = this._stateManager.resetState();
            if (!nextState) {
                this._notifier.warning?.('No scene state is available to reset yet.');
                return;
            }

            this._logger.info('[EverLook] Scene tracker reset to the current chat baseline.');
            this._notifier.success?.('Scene state reset.');
        } catch (error) {
            this._logger.error('[EverLook] Failed to reset scene state from tracker panel:', error);
            this._notifier.error?.('Failed to reset scene state.');
        }
    }

    _handleSubmit(event) {
        event.preventDefault();

        try {
            const formData = new FormData(event.currentTarget);
            const changes = parseTrackerFormValues({
                pose: formData.get('pose'),
                emotion: formData.get('emotion'),
                locationName: formData.get('locationName'),
                daytime: formData.get('daytime'),
                weather: formData.get('weather'),
                actionName: formData.get('actionName'),
                actionInteraction: formData.get('actionInteraction') === 'on',
                outfitText: formData.get('outfitText'),
            });

            this._stateManager.updateState(changes);
            this._logger.info('[EverLook] Scene tracker UI applied state edits.');
            this._notifier.success?.('Scene state updated.');
        } catch (error) {
            this._logger.error('[EverLook] Failed to apply tracker panel edits:', error);
            this._notifier.error?.('Failed to update scene state.');
        }
    }
}

export const trackerPanel = new TrackerPanel();
