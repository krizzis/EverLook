/**
 * AppearanceExtractor - silent appearance-to-Danbooru tag extraction.
 *
 * Used only as a fallback when a character card does not provide an explicit
 * [APPEARANCE] marker.
 */

const SYSTEM_PROMPT = `You extract Danbooru-style appearance tags from character descriptions.
Return only minified JSON in this exact schema:
{"appearance":["tag one","tag two"]}

Rules:
1. Only include stable physical appearance tags.
2. Exclude personality, backstory, relationships, powers, poses, emotions, actions, and locations.
3. Use lowercase Danbooru-style tags.
4. Return an empty array if no reliable appearance tags can be extracted.`;

export class AppearanceExtractor {
    constructor() {
        this.providerFn = null;
    }

    setup(providerFn) {
        this.providerFn = typeof providerFn === 'function' ? providerFn : null;
    }

    async extract(description) {
        if (typeof description !== 'string' || description.trim().length === 0) {
            return null;
        }

        if (!this.providerFn) {
            return null;
        }

        let rawResponse;
        try {
            rawResponse = await this.providerFn(
                SYSTEM_PROMPT,
                `Character description:\n${description.trim()}\n\nExtract only stable appearance tags.`,
            );
        } catch (error) {
            console.error('[EverLook] Appearance extraction failed at provider layer:', error);
            return null;
        }

        const jsonString = this.#extractJson(rawResponse);
        if (!jsonString) {
            console.error('[EverLook] Appearance extractor returned empty or non-JSON text.');
            return null;
        }

        try {
            const parsed = JSON.parse(jsonString);
            if (!Array.isArray(parsed?.appearance)) {
                return null;
            }

            const tags = parsed.appearance
                .filter(tag => typeof tag === 'string')
                .map(tag => tag.trim().toLowerCase())
                .filter(Boolean);

            return tags.length > 0 ? tags.join(', ') : null;
        } catch (error) {
            console.error('[EverLook] Appearance extractor returned malformed JSON:', error);
            return null;
        }
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

export const appearanceExtractor = new AppearanceExtractor();
