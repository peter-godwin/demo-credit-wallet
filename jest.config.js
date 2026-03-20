module.exports = {
    preset: "ts-jest",
    testEnvironment: "node",
    roots: ["<rootDir>/tests"],
    testMatch: ["**/*.test.ts"],
    moduleFileExtensions: ["ts", "js", "json"],
    collectCoverageFrom: ["src/**/*.ts", "!src/server.ts"],
    coverageDirectory: "coverage",
    transformIgnorePatterns: [
        "node_modules/(?!(uuid)/)"
    ],
    transform: {
        "^.+\\.tsx?$": ["ts-jest", {
            tsconfig: {
                strict: false,
            },
        }],
    },
};