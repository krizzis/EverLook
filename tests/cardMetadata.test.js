import { parseCharacterDescription } from '../src/state/cardMetadata.js';

describe('parseCharacterDescription', () => {
    test('extracts [APPEARANCE] and [LORA] sections', () => {
        const parsed = parseCharacterDescription(`
[APPEARANCE]
long blonde hair, blue eyes

[LORA]
<lora:alice:1>

[OUTFIT]
school uniform, skirt
`);

        expect(parsed.appearance).toBe('long blonde hair, blue eyes');
        expect(parsed.lora).toBe('<lora:alice:1>');
        expect(parsed.outfit).toEqual(['school uniform', 'skirt']);
        expect(parsed.hasAppearanceMarker).toBe(true);
        expect(parsed.hasLoraMarker).toBe(true);
        expect(parsed.hasOutfitMarker).toBe(true);
    });

    test('treats markers case-insensitively', () => {
        const parsed = parseCharacterDescription(`
[appearance]
silver hair

[lora]
<lora:test:0.8>
`);

        expect(parsed.appearance).toBe('silver hair');
        expect(parsed.lora).toBe('<lora:test:0.8>');
    });

    test('supports inline marker content on the same line', () => {
        const parsed = parseCharacterDescription(`
[APPEARANCE] adult, wavy long black hair, brown eyes, small breasts

[LORA] <lora:carmen_pd_v1:1>

[OUTFIT] white blouse, black skirt, stockings
`);

        expect(parsed.appearance).toBe('adult, wavy long black hair, brown eyes, small breasts');
        expect(parsed.lora).toBe('<lora:carmen_pd_v1:1>');
        expect(parsed.outfit).toEqual(['white blouse', 'black skirt', 'stockings']);
    });

    test('returns nulls when markers are absent', () => {
        const parsed = parseCharacterDescription('Plain roleplay description only.');

        expect(parsed.appearance).toBeNull();
        expect(parsed.lora).toBeNull();
        expect(parsed.outfit).toEqual([]);
        expect(parsed.hasAppearanceMarker).toBe(false);
        expect(parsed.hasLoraMarker).toBe(false);
        expect(parsed.hasOutfitMarker).toBe(false);
    });
});
