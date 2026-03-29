/**
 * Character card metadata helpers.
 *
 * EverLook supports explicit character description markers:
 *   [APPEARANCE]
 *   [LORA]
 *
 * Marker names are case-insensitive. Content continues until the next marker
 * or end of text.
 */

const MARKERS = Object.freeze(['APPEARANCE', 'LORA']);
const MARKER_LINE_PATTERN = /^\s*\[(APPEARANCE|LORA)\](.*)$/i;

function normalizeSectionBody(value) {
    if (typeof value !== 'string') {
        return null;
    }

    const normalized = value
        .split(/\r?\n/)
        .map(line => line.trim())
        .filter(Boolean)
        .join('\n')
        .trim();

    return normalized || null;
}

export function parseCharacterDescription(description) {
    if (typeof description !== 'string' || description.trim().length === 0) {
        return {
            appearance: null,
            lora: null,
            rawDescription: '',
            hasAppearanceMarker: false,
            hasLoraMarker: false,
        };
    }

    const sections = new Map();
    const lines = description.split(/\r?\n/);

    for (let i = 0; i < lines.length; i++) {
        const match = lines[i].match(MARKER_LINE_PATTERN);
        if (!match) {
            continue;
        }

        const key = match[1].toUpperCase();
        if (!MARKERS.includes(key) || sections.has(key)) {
            continue;
        }

        const collectedLines = [];
        const inlineContent = match[2]?.trim();
        if (inlineContent) {
            collectedLines.push(inlineContent);
        }

        let j = i + 1;
        while (j < lines.length) {
            if (MARKER_LINE_PATTERN.test(lines[j])) {
                break;
            }

            const currentLine = lines[j].trim();
            if (!currentLine) {
                break;
            }

            collectedLines.push(currentLine);
            j++;
        }

        sections.set(key, normalizeSectionBody(collectedLines.join('\n')));
        i = j - 1;
    }

    return {
        appearance: sections.get('APPEARANCE') ?? null,
        lora: sections.get('LORA') ?? null,
        rawDescription: description.trim(),
        hasAppearanceMarker: sections.has('APPEARANCE'),
        hasLoraMarker: sections.has('LORA'),
    };
}
