/**
 * prompts.js — System/user prompt templates for Tech-LLM scene analysis.
 *
 * Contains the structured prompt templates used by TurnPairAnalyzer
 * to instruct the Tech-LLM for attribute extraction.
 *
 * @see design.md §3.6 — Turn-Pair Analysis Flow
 * @implements T-004
 */

export const SYSTEM_PROMPT = `You are a strict JSON data extractor.
Your task is to analyze a conversation turn between a user and a character, and detect if any of the scene's attributes have changed from their current state.

You must reply with ONLY a valid, minified JSON object matching this schema exactly. Do not include markdown formatting like \`\`\`json.
Schema:
{
  "changes": {
    "attributeName": {
      "value": "newValue",
      "confidence": 0.95
    }
  }
}

Rules:
1. Confidence must be a float between 0.0 and 1.0.
2. Only include attributes in "changes" if they actually changed in the turn text.
3. Allowed attributeNames: "pose", "emotion", "location", "action", "outfit".
4. If location changes, "value" MUST be an object with: "name" (string), "daytime" (string), "weather" (string).
5. If action changes, "value" MUST be an object with: "name" (string), "interaction" (boolean).
6. If outfit changes, "value" MUST be an array of strings.
7. If there are no changes, return {"changes": {}}.`;

export function buildUserPrompt(turnPair, currentState) {
    return `CURRENT STATE:
${JSON.stringify(currentState, null, 2)}

TURN HISTORY:
User Message: "${turnPair.userMessage}"
Character Response: "${turnPair.characterResponse}"

Extract changes based on the turn text above. Return strictly JSON.`;
}
