/**
 * InitSceneExtractor - silent initialization pass for starting scene fields.
 *
 * Derives starting pose, emotion, and location from scenario text plus the
 * character's opening message without emitting visible chat content.
 */

export const INIT_SCENE_SYSTEM_PROMPT = `You extract an initial visual scene state for a roleplay chat.
Return only minified JSON in this exact schema:
{"pose":"value-or-null","emotion":"value-or-null","location":{"name":"value-or-null","daytime":"value-or-null","weather":"value-or-null"}}

Rules:
1. Infer only what is visually or situationally reliable from the provided scenario and opening character message.
2. Use lowercase concise tags for pose and emotion.
3. Keep location.name short and lowercase.
4. Emotion must describe a visible expression or immediate affect, not a personality trait or relationship label.
5. Use simple location.daytime and location.weather labels only. Do not combine them into phrases like "cool evening" or "warm glow".
6. Use null for any field that cannot be inferred reliably.
7. Do not invent outfit, action, or appearance details.
8. Return JSON only, with no markdown fences or prose.`;

export function buildInitScenePrompt({ scenario = '', firstMessage = '', currentState = null } = {}) {
    const scenarioText = typeof scenario === 'string' ? scenario.trim() : '';
    const firstMessageText = typeof firstMessage === 'string' ? firstMessage.trim() : '';
    const stateText = currentState && typeof currentState === 'object'
        ? JSON.stringify(currentState, null, 2)
        : null;

    return [
        stateText ? `CURRENT STATE:\n${stateText}` : null,
        `SCENARIO:\n${scenarioText || '(none provided)'}`,
        `FIRST CHARACTER MESSAGE:\n${firstMessageText || '(none provided)'}`,
        'Infer the best initial pose, emotion, and location. Return strictly JSON.',
    ].filter(Boolean).join('\n\n');
}

export class InitSceneExtractor {
    constructor() {
        this.providerFn = null;
    }

    setup(providerFn) {
        this.providerFn = typeof providerFn === 'function' ? providerFn : null;
    }

    async extract({ scenario = '', firstMessage = '', currentState = null } = {}) {
        const hasScenario = typeof scenario === 'string' && scenario.trim().length > 0;
        const hasFirstMessage = typeof firstMessage === 'string' && firstMessage.trim().length > 0;

        if (!hasScenario && !hasFirstMessage) {
            return null;
        }

        if (!this.providerFn) {
            return null;
        }

        let rawResponse;
        try {
            rawResponse = await this.providerFn(
                INIT_SCENE_SYSTEM_PROMPT,
                buildInitScenePrompt({ scenario, firstMessage, currentState }),
            );
        } catch (error) {
            console.error('[EverLook] Initial scene extraction failed at provider layer:', error);
            return null;
        }

        const jsonString = this.#extractJson(rawResponse);
        if (!jsonString) {
            console.error('[EverLook] Initial scene extractor returned empty or non-JSON text.');
            return null;
        }

        try {
            const parsed = JSON.parse(jsonString);
            return this.#normalizeResult(parsed);
        } catch (error) {
            console.error('[EverLook] Initial scene extractor returned malformed JSON:', error);
            return null;
        }
    }

    #normalizeResult(parsed) {
        if (!parsed || typeof parsed !== 'object') {
            return null;
        }

        const result = {};

        if (typeof parsed.pose === 'string') {
            const pose = parsed.pose.trim().toLowerCase();
            if (pose) {
                result.pose = pose;
            }
        }

        if (typeof parsed.emotion === 'string') {
            const emotion = parsed.emotion.trim().toLowerCase();
            if (emotion) {
                result.emotion = emotion;
            }
        }

        if (parsed.location && typeof parsed.location === 'object') {
            const location = {
                name: typeof parsed.location.name === 'string'
                    ? parsed.location.name.trim().toLowerCase()
                    : null,
                daytime: typeof parsed.location.daytime === 'string'
                    ? parsed.location.daytime.trim().toLowerCase()
                    : null,
                weather: typeof parsed.location.weather === 'string'
                    ? parsed.location.weather.trim().toLowerCase()
                    : null,
            };

            if (location.name || location.daytime || location.weather) {
                result.location = location;
            }
        }

        return Object.keys(result).length > 0 ? result : null;
    }

    #extractJson(rawText) {
        if (!rawText) return null;

        const match = rawText.match(/```json\s*(\{[\s\S]*?\})\s*```/i);
        if (match) return match[1];

        const matchAny = rawText.match(/```\s*(\{[\s\S]*?\})\s*```/);
        if (matchAny) return matchAny[1];

        const openBrace = rawText.indexOf('{');
        const closeBrace = rawText.lastIndexOf('}');
        if (openBrace !== -1 && closeBrace !== -1 && closeBrace > openBrace) {
            return rawText.slice(openBrace, closeBrace + 1);
        }

        return null;
    }
}

export const initSceneExtractor = new InitSceneExtractor();
