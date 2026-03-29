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

function trimSectionAtParagraphBreak(value) {
    if (typeof value !== 'string') {
        return '';
    }

    const trimmed = value.trim();
    if (!trimmed) {
        return '';
    }

    const firstParagraph = trimmed.split(/\r?\n\s*\r?\n/, 1)[0];
    return firstParagraph.trim();
}

function findMarkers(description) {
    const markerPattern = /^\s*\[(APPEARANCE|LORA)\]\s*$/gim;
    const matches = [];
    let match;

    while ((match = markerPattern.exec(description)) !== null) {
        matches.push({
            key: match[1].toUpperCase(),
            start: match.index,
            contentStart: markerPattern.lastIndex,
        });
    }

    return matches;
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

    const matches = findMarkers(description);
    const sections = new Map();

    for (let i = 0; i < matches.length; i++) {
        const current = matches[i];
        const next = matches[i + 1];
        const body = description.slice(current.contentStart, next ? next.start : description.length);
        const boundedBody = next ? body : trimSectionAtParagraphBreak(body);

        if (MARKERS.includes(current.key) && !sections.has(current.key)) {
            sections.set(current.key, normalizeSectionBody(boundedBody));
        }
    }

    return {
        appearance: sections.get('APPEARANCE') ?? null,
        lora: sections.get('LORA') ?? null,
        rawDescription: description.trim(),
        hasAppearanceMarker: sections.has('APPEARANCE'),
        hasLoraMarker: sections.has('LORA'),
    };
}
