/** @type {import('jest').Config} */
export default {
    testMatch: ['**/tests/**/*.test.js'],
    collectCoverageFrom: [
        'src/state/**/*.js',
        'src/analyzer/**/*.js',
        'src/prompt/**/*.js',
        'src/background/**/*.js',
        'src/ui/**/*.js',
    ],
    coverageThreshold: {
        global: {
            statements: 80,
            branches: 80,
            functions: 80,
            lines: 80,
        },
    },
    // No transform needed — we use native ES modules
    transform: {},
};
