/** @type {import('jest').Config} */
export default {
    testMatch: ['**/tests/**/*.test.js'],
    collectCoverageFrom: [
        'src/state/**/*.js',
    ],
    coverageThreshold: {
        global: {
            statements: 80,
            branches: 80,
            functions: 80,
            lines: 80,
        },
    },
    moduleNameMapper: {
        '^../../../../extensions.js$': '<rootDir>/tests/__mocks__/extensions.js'
    },
    // No transform needed — we use native ES modules
    transform: {},
};
