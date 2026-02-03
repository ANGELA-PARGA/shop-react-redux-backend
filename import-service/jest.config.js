export default {
    testEnvironment: 'node',  
    transform: {},
    
    moduleFileExtensions: ['js', 'json'],  
    testMatch: [
        '**/__tests__/**/*.test.js',
        '**/?(*.)+(spec|test).js'
    ],
    
    collectCoverageFrom: [
        'src/functions/**/*.js',
        '!src/**/*.test.js',
        '!src/data/**'
    ],
    
    coverageThreshold: {
        './src/functions/**/*.js': {
        branches: 100,
        functions: 100,
        lines: 100,
        statements: 100
        }
    },

    verbose: true,
    clearMocks: true,
    restoreMocks: true
};
