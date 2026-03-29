/**
 * TurnPairAnalyzer — Tech-LLM integration for turn-pair scene analysis.
 *
 * Sends silent prompts to Tech-LLM, parses structured responses,
 * and returns change sets with confidence scores.
 *
 * @see design.md §3.6 — Turn-Pair Analysis Flow
 * @see design.md §3.2 — Analyzer Layer
 * @implements T-004
 */

import { SYSTEM_PROMPT, buildUserPrompt } from './prompts.js';

export class TurnPairAnalyzer {
    constructor() {
        this.providerFn = async () => '{"changes":{}}';
        this.confidenceThreshold = 0.7;
    }

    /**
     * Initializes the analyzer.
     * @param {function} providerFn - Async function returning text from the LLM.
     * @param {number} confidenceThreshold - The float minimum confidence (0-1).
     */
    setup(providerFn, confidenceThreshold = 0.7) {
        if (typeof providerFn !== 'function') throw new TypeError('providerFn must be a function.');
        this.providerFn = providerFn;
        this.confidenceThreshold = confidenceThreshold;
    }

    /**
     * Extracts json from potential markdown wraps.
     * @param {string} rawText 
     */
    _extractJson(rawText) {
        if (!rawText) return null;
        const match = rawText.match(/```json\s*(\{[\s\S]*?\})\s*```/);
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

    /**
     * Analyzes standard turn pairs against current state.
     * @param {Object} turnPair { userMessage, characterResponse }
     * @param {Object} currentState Serialized scene state
     * @returns {Promise<Object>} The accepted parsed changes `{ pose: 'sitting', ... }`
     */
    async analyze(turnPair, currentState) {
        const userPrompt = buildUserPrompt(turnPair, currentState);
        let rawResponse;

        try {
            rawResponse = await this.providerFn(SYSTEM_PROMPT, userPrompt);
        } catch (error) {
            console.error('[EverLook] Turn-pair analysis failed at provider layer:', error);
            return {};
        }

        const jsonString = this._extractJson(rawResponse);
        if (!jsonString) {
            console.error('[EverLook] Tech-LLM returned empty or non-JSON text.');
            return {};
        }

        let parsed;
        try {
            parsed = JSON.parse(jsonString);
        } catch (error) {
            console.error('[EverLook] Tech-LLM returned malformed JSON:', error, 'Raw:', rawResponse);
            return {};
        }

        const changes = parsed?.changes || {};
        const acceptedChanges = {};

        for (const [key, payload] of Object.entries(changes)) {
            if (!payload || typeof payload !== 'object') continue;
            
            const conf = parseFloat(payload.confidence);
            if (isNaN(conf)) continue;

            if (conf >= this.confidenceThreshold) {
                // Ensure strings are mostly lowercased if simple to match tag norms, EXCEPT for object schemas.
                let val = payload.value;
                if (typeof val === 'string') val = val.toLowerCase().trim();
                
                if (key === 'location' && val && typeof val === 'object') {
                    val.name = typeof val.name === 'string' ? val.name.toLowerCase().trim() : val.name;
                    val.daytime = typeof val.daytime === 'string' ? val.daytime.toLowerCase().trim() : val.daytime;
                    val.weather = typeof val.weather === 'string' ? val.weather.toLowerCase().trim() : val.weather;
                }
                
                acceptedChanges[key] = val;
                console.info(`[EverLook] Extracted ${key} change: "${JSON.stringify(val)}" (conf: ${conf})`);
            } else {
                console.warn(`[EverLook] Skipped attribute ${key} (confidence: ${conf} < ${this.confidenceThreshold})`);
            }
        }

        return acceptedChanges;
    }
}

export const turnPairAnalyzer = new TurnPairAnalyzer();
