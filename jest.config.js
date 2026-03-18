module.exports = {
    preset: "ts-jest",
    testEnvironment: "node",
    roots: ["<rootDir>/tests"],
    testMatch: ["**/*.test.ts"],
    moduleFileExtensions: ["ts", "js", "json"],
    collectCoverageFrom: ["src/**/*.ts", "!src/server.ts"],
    coverageDirectory: "coverage",
    globals: {
        "ts-jest": {
            tsconfig: {
                strict: false,
            },
        },
    },
};