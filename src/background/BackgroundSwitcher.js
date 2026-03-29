/**
 * BackgroundSwitcher - Background search and set logic.
 *
 * Watches for location attribute changes and performs cascading
 * search in the background folder: name+daytime+weather -> name+daytime -> name.
 *
 * @see design.md §3.5 - Background Search Strategy
 * @see design.md §3.2 - Background Layer
 * @implements T-006
 */
export class BackgroundSwitcher {
    /** @type {Function|null} */
    #listBackgroundsFn = null;

    /** @type {Function|null} */
    #applyBackgroundFn = null;

    /** @type {Console} */
    #logger = console;

    /**
     * Inject runtime-specific ST hooks so matching logic remains pure and testable.
     *
     * @param {Object} options
     * @param {Function} options.listBackgroundsFn Returns an array of background filenames
     * @param {Function} options.applyBackgroundFn Applies a matched background filename in ST
     * @param {Console} [options.logger]
     */
    setup({ listBackgroundsFn, applyBackgroundFn, logger = console } = {}) {
        if (typeof listBackgroundsFn !== 'function') {
            throw new TypeError('BackgroundSwitcher requires listBackgroundsFn to be a function.');
        }

        if (typeof applyBackgroundFn !== 'function') {
            throw new TypeError('BackgroundSwitcher requires applyBackgroundFn to be a function.');
        }

        this.#listBackgroundsFn = listBackgroundsFn;
        this.#applyBackgroundFn = applyBackgroundFn;
        this.#logger = logger;
    }

    /**
     * Resolves and applies the first matching background for the given location.
     *
     * @param {{name?: string|null, daytime?: string|null, weather?: string|null}} location
     * @returns {Promise<string|null>} The matched background filename, or null when none matched
     */
    async switch(location) {
        const normalizedLocation = BackgroundSwitcher.normalizeLocation(location);

        if (!normalizedLocation.name) {
            this.#logger.warn('[EverLook] BackgroundSwitcher skipped: location name is empty.');
            return null;
        }

        if (typeof this.#listBackgroundsFn !== 'function' || typeof this.#applyBackgroundFn !== 'function') {
            throw new Error('BackgroundSwitcher has not been configured. Call setup() first.');
        }

        const backgrounds = await this.#listBackgroundsFn();
        const match = this.findMatch(normalizedLocation, backgrounds);

        if (!match) {
            this.#logger.warn(`[EverLook] No matching background found for location "${normalizedLocation.name}".`);
            return null;
        }

        await this.#applyBackgroundFn(match);
        this.#logger.info(`[EverLook] Background switched to "${match}".`);
        return match;
    }

    /**
     * Finds the first matching filename using the cascading rules from design.md §3.5.
     *
     * @param {{name: string, daytime: string|null, weather: string|null}} location
     * @param {string[]} backgrounds
     * @returns {string|null}
     */
    findMatch(location, backgrounds) {
        if (!Array.isArray(backgrounds) || backgrounds.length === 0) {
            return null;
        }

        const searchGroups = BackgroundSwitcher.buildSearchGroups(location);

        for (const terms of searchGroups) {
            const match = backgrounds.find(background => BackgroundSwitcher.matchesTerms(background, terms));
            if (match) {
                return match;
            }
        }

        return null;
    }

    /**
     * @param {{name?: string|null, daytime?: string|null, weather?: string|null}} location
     * @returns {{name: string, daytime: string|null, weather: string|null}}
     */
    static normalizeLocation(location = {}) {
        return {
            name: BackgroundSwitcher.normalizeText(location.name),
            daytime: BackgroundSwitcher.normalizeText(location.daytime) || null,
            weather: BackgroundSwitcher.normalizeText(location.weather) || null,
        };
    }

    /**
     * @param {{name: string, daytime: string|null, weather: string|null}} location
     * @returns {string[][]}
     */
    static buildSearchGroups(location) {
        const groups = [];

        if (location.name && location.daytime && location.weather) {
            groups.push([location.name, location.daytime, location.weather]);
        }

        if (location.name && location.daytime) {
            groups.push([location.name, location.daytime]);
        }

        if (location.name) {
            groups.push([location.name]);
        }

        return groups;
    }

    /**
     * @param {string} filename
     * @param {string[]} terms
     * @returns {boolean}
     */
    static matchesTerms(filename, terms) {
        const normalizedFilename = BackgroundSwitcher.normalizeText(filename);
        return Boolean(normalizedFilename) && terms.every(term => normalizedFilename.includes(term));
    }

    /**
     * @param {string|null|undefined} value
     * @returns {string}
     */
    static normalizeText(value) {
        return String(value ?? '')
            .trim()
            .toLowerCase();
    }
}

export const backgroundSwitcher = new BackgroundSwitcher();
