import { DEFAULT_DAYTIME, DEFAULT_WEATHER } from '../state/constants.js';

export function normalizeMessageText(value) {
    if (typeof value !== 'string') {
        return null;
    }

    const normalized = value.trim();
    return normalized.length > 0 ? normalized : null;
}

export function buildTechLlmQuietPrompt(systemPrompt, userPrompt) {
    return [
        normalizeMessageText(systemPrompt) ? `SYSTEM:\n${systemPrompt.trim()}` : null,
        normalizeMessageText(userPrompt) ? `USER:\n${userPrompt.trim()}` : null,
    ].filter(Boolean).join('\n\n');
}

export function getScenarioText(context, characterData = null) {
    return normalizeMessageText(
        context?.chatMetadata?.scenario
        ?? characterData?.scenario
        ?? characterData?.data?.scenario
        ?? '',
    );
}

export function getFirstCharacterMessage(context, characterData = null) {
    const chat = Array.isArray(context?.chat) ? context.chat : [];
    const existingMessage = chat.find(message =>
        message
        && message.is_user === false
        && message.is_system === false
        && normalizeMessageText(message.mes),
    );

    if (existingMessage) {
        return normalizeMessageText(existingMessage.mes);
    }

    return normalizeMessageText(
        characterData?.first_mes
        ?? characterData?.first_message
        ?? characterData?.data?.first_mes
        ?? characterData?.data?.first_message
        ?? '',
    );
}

export function findLatestUserMessage(chat, beforeIndex) {
    if (!Array.isArray(chat) || chat.length === 0) {
        return null;
    }

    const upperBound = Number.isInteger(beforeIndex)
        ? Math.min(beforeIndex - 1, chat.length - 1)
        : chat.length - 1;

    for (let index = upperBound; index >= 0; index--) {
        const message = chat[index];
        const text = normalizeMessageText(message?.mes);

        if (message?.is_user === true && message?.is_system !== true && text) {
            return { index, text };
        }
    }

    return null;
}

export function buildTurnPair(chat, messageIndex, pendingUserMessage = null, chatId = null) {
    if (!Array.isArray(chat) || !Number.isInteger(messageIndex)) {
        return null;
    }

    const characterMessage = chat[messageIndex];
    const characterResponse = normalizeMessageText(characterMessage?.mes);

    if (!characterMessage || characterMessage.is_user === true || characterMessage.is_system === true || !characterResponse) {
        return null;
    }

    let userMessage = null;
    if (pendingUserMessage && (!chatId || pendingUserMessage.chatId === chatId)) {
        const pendingText = normalizeMessageText(pendingUserMessage.text);
        const pendingChatMessage = Number.isInteger(pendingUserMessage.messageIndex)
            ? chat[pendingUserMessage.messageIndex]
            : null;

        if (pendingText && pendingChatMessage?.is_user === true) {
            userMessage = pendingText;
        }
    }

    if (!userMessage) {
        userMessage = findLatestUserMessage(chat, messageIndex)?.text ?? null;
    }

    if (!userMessage) {
        return null;
    }

    return { userMessage, characterResponse };
}

export function isDefaultLocation(location = {}) {
    return !normalizeMessageText(location?.name)
        && (normalizeMessageText(location?.daytime) ?? DEFAULT_DAYTIME) === DEFAULT_DAYTIME
        && (normalizeMessageText(location?.weather) ?? DEFAULT_WEATHER) === DEFAULT_WEATHER;
}

export function needsInitialSceneExtraction(state) {
    if (!state) {
        return false;
    }

    return state.pose == null || state.emotion == null || isDefaultLocation(state.location);
}

export function hasMeaningfulLocation(location = {}) {
    return Boolean(normalizeMessageText(location?.name));
}
