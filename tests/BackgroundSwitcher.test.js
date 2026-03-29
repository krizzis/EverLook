import { jest } from '@jest/globals';
import { BackgroundSwitcher, backgroundSwitcher } from '../src/background/BackgroundSwitcher.js';

/**
 * BackgroundSwitcher unit tests
 * @implements T-006
 */
describe('BackgroundSwitcher', () => {
    let listBackgroundsFn;
    let applyBackgroundFn;

    beforeEach(() => {
        listBackgroundsFn = jest.fn();
        applyBackgroundFn = jest.fn();

        backgroundSwitcher.setup({
            listBackgroundsFn,
            applyBackgroundFn,
            logger: {
                info: jest.fn(),
                warn: jest.fn(),
                error: jest.fn(),
                debug: jest.fn(),
            },
        });
    });

    it('requires a listBackgroundsFn during setup', () => {
        const switcher = new BackgroundSwitcher();
        expect(() => switcher.setup({
            applyBackgroundFn,
        })).toThrow(TypeError);
    });

    it('requires an applyBackgroundFn during setup', () => {
        const switcher = new BackgroundSwitcher();
        expect(() => switcher.setup({
            listBackgroundsFn,
        })).toThrow(TypeError);
    });

    it('throws if switch is called before setup', async () => {
        const switcher = new BackgroundSwitcher();
        await expect(switcher.switch({
            name: 'forest',
            daytime: 'night',
            weather: 'rainy',
        })).rejects.toThrow('Call setup() first.');
    });

    it('finds an exact match using name, daytime, and weather first', async () => {
        listBackgroundsFn.mockResolvedValue([
            'forest_day_clear.png',
            'forest_night_rainy.png',
            'forest.png',
        ]);

        const match = await backgroundSwitcher.switch({
            name: 'forest',
            daytime: 'night',
            weather: 'rainy',
        });

        expect(match).toBe('forest_night_rainy.png');
        expect(applyBackgroundFn).toHaveBeenCalledWith('forest_night_rainy.png');
    });

    it('falls back to name and daytime when weather-specific match is absent', async () => {
        listBackgroundsFn.mockResolvedValue([
            'forest_day_clear.png',
            'forest_night.png',
            'forest.png',
        ]);

        const match = await backgroundSwitcher.switch({
            name: 'forest',
            daytime: 'night',
            weather: 'rainy',
        });

        expect(match).toBe('forest_night.png');
        expect(applyBackgroundFn).toHaveBeenCalledWith('forest_night.png');
    });

    it('falls back to location name only when more specific matches are absent', async () => {
        listBackgroundsFn.mockResolvedValue([
            'castle_evening.png',
            'forest.png',
        ]);

        const match = await backgroundSwitcher.switch({
            name: 'forest',
            daytime: 'night',
            weather: 'rainy',
        });

        expect(match).toBe('forest.png');
        expect(applyBackgroundFn).toHaveBeenCalledWith('forest.png');
    });

    it('matches backgrounds case-insensitively via substring checks', async () => {
        listBackgroundsFn.mockResolvedValue([
            'Moody-FOREST_NIGHT_RAINY_Final.WEBP',
        ]);

        const match = await backgroundSwitcher.switch({
            name: 'FoReSt',
            daytime: 'NIGHT',
            weather: 'Rainy',
        });

        expect(match).toBe('Moody-FOREST_NIGHT_RAINY_Final.WEBP');
        expect(applyBackgroundFn).toHaveBeenCalledWith('Moody-FOREST_NIGHT_RAINY_Final.WEBP');
    });

    it('uses the first matching result when multiple candidates match', async () => {
        listBackgroundsFn.mockResolvedValue([
            'forest_night_rainy_v1.png',
            'forest_night_rainy_v2.png',
            'forest.png',
        ]);

        const match = await backgroundSwitcher.switch({
            name: 'forest',
            daytime: 'night',
            weather: 'rainy',
        });

        expect(match).toBe('forest_night_rainy_v1.png');
        expect(applyBackgroundFn).toHaveBeenCalledTimes(1);
    });

    it('warns and skips when no background matches', async () => {
        listBackgroundsFn.mockResolvedValue([]);

        const match = await backgroundSwitcher.switch({
            name: 'forest',
            daytime: 'night',
            weather: 'rainy',
        });

        expect(match).toBeNull();
        expect(applyBackgroundFn).not.toHaveBeenCalled();
    });

    it('returns null after exhausting all fallback groups without a match', async () => {
        listBackgroundsFn.mockResolvedValue([
            'city_day_clear.png',
            'beach_sunset.png',
        ]);

        const match = await backgroundSwitcher.switch({
            name: 'forest',
            daytime: 'night',
            weather: 'rainy',
        });

        expect(match).toBeNull();
        expect(applyBackgroundFn).not.toHaveBeenCalled();
    });

    it('warns and skips when location name is empty', async () => {
        const match = await backgroundSwitcher.switch({
            name: '   ',
            daytime: 'night',
            weather: 'rainy',
        });

        expect(match).toBeNull();
        expect(listBackgroundsFn).not.toHaveBeenCalled();
        expect(applyBackgroundFn).not.toHaveBeenCalled();
    });
});
