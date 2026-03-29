import { AppearanceExtractor } from '../src/analyzer/AppearanceExtractor.js';

describe('AppearanceExtractor', () => {
    test('returns null when no provider is configured', async () => {
        const extractor = new AppearanceExtractor();

        await expect(extractor.extract('Tall woman with silver hair')).resolves.toBeNull();
    });

    test('extracts appearance tags from valid JSON', async () => {
        const extractor = new AppearanceExtractor();
        extractor.setup(async () => '{"appearance":["silver hair","green eyes"]}');

        await expect(extractor.extract('Character description')).resolves.toBe('silver hair, green eyes');
    });

    test('extracts appearance tags from fenced JSON', async () => {
        const extractor = new AppearanceExtractor();
        extractor.setup(async () => '```json\n{"appearance":["braided hair"]}\n```');

        await expect(extractor.extract('Character description')).resolves.toBe('braided hair');
    });

    test('returns null on malformed JSON', async () => {
        const extractor = new AppearanceExtractor();
        extractor.setup(async () => '{"appearance":');

        await expect(extractor.extract('Character description')).resolves.toBeNull();
    });

    test('returns null when provider throws', async () => {
        const extractor = new AppearanceExtractor();
        extractor.setup(async () => {
            throw new Error('provider failed');
        });

        await expect(extractor.extract('Character description')).resolves.toBeNull();
    });
});
