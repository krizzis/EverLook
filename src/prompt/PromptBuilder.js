/**
 * PromptBuilder - Deterministic Danbooru-style prompt generation.
 *
 * Pure function: converts scene state into a tag string following
 * the prescribed order: subject -> appearance -> pose -> outfit ->
 * emotion -> action -> background -> lora.
 *
 * @see design.md §3.4 - Prompt Generation Logic
 * @see design.md §3.2 - Prompt Layer
 * @implements T-005
 */

export class PromptBuilder {
    /**
     * Build a deterministic prompt from a SceneState instance or plain object.
     *
     * @param {object} sceneState
     * @returns {string}
     */
    static build(sceneState) {
        if (!sceneState || typeof sceneState !== 'object') {
            throw new Error('[EverLook] PromptBuilder.build: sceneState must be a non-null object');
        }

        const state = typeof sceneState.toJSON === 'function'
            ? sceneState.toJSON()
            : sceneState;
        const action = state.action || {};
        const location = state.location || {};

        const tags = [
            ...PromptBuilder._buildSubjectTags(action),
            ...PromptBuilder._parseAppearanceTags(state.appearance?.description),
            ...PromptBuilder._singleTag(state.pose),
            ...PromptBuilder._buildOutfitTags(state.outfit),
            ...PromptBuilder._singleTag(state.emotion),
            ...PromptBuilder._buildActionTags(action),
            ...PromptBuilder._buildBackgroundTags(location),
            ...PromptBuilder._singleTag(state.characterLora, { lowerCase: false }),
        ];

        return tags.join(', ');
    }

    static _buildSubjectTags(action) {
        return action?.interaction ? ['1girl'] : ['1girl', 'solo'];
    }

    static _parseAppearanceTags(description) {
        const normalized = PromptBuilder._normalizeTag(description);
        if (!normalized) {
            return [];
        }

        return normalized
            .split(',')
            .map(tag => PromptBuilder._normalizeTag(tag))
            .filter(Boolean);
    }

    static _buildOutfitTags(outfit) {
        if (!Array.isArray(outfit) || outfit.length === 0) {
            return ['completely nude'];
        }

        const tags = outfit
            .map(item => PromptBuilder._normalizeTag(item))
            .filter(Boolean);

        return tags.length > 0 ? tags : ['completely nude'];
    }

    static _buildActionTags(action) {
        const actionName = PromptBuilder._normalizeTag(action?.name);

        if (action?.interaction) {
            return actionName ? ['1boy', actionName] : ['1boy'];
        }

        return actionName ? [actionName] : [];
    }

    static _buildBackgroundTags(location) {
        const tags = [];
        const locationName = PromptBuilder._normalizeTag(location?.name);
        const daytime = PromptBuilder._normalizeTag(location?.daytime);
        const weather = PromptBuilder._normalizeTag(location?.weather);

        if (locationName) {
            tags.push(`${locationName} background`);
        }
        if (daytime) {
            tags.push(daytime);
        }
        if (weather) {
            tags.push(weather);
        }

        return tags;
    }

    static _singleTag(value, options = {}) {
        const tag = PromptBuilder._normalizeTag(value, options);
        return tag ? [tag] : [];
    }

    static _normalizeTag(value, options = {}) {
        if (typeof value !== 'string') {
            return null;
        }

        const collapsed = value.trim().replace(/\s+/g, ' ');
        if (!collapsed) {
            return null;
        }

        return options.lowerCase === false ? collapsed : collapsed.toLowerCase();
    }
}
