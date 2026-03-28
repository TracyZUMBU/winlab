/** @type {import('jest').Config} */
module.exports = {
  projects: [
    {
      displayName: "unit",
      preset: "ts-jest",
      testEnvironment: "node",
      roots: ["<rootDir>/src"],
      testMatch: ["**/*.test.ts", "**/*.test.tsx"],
      moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
      moduleNameMapper: {
        "^@/(.*)$": "<rootDir>/$1",
        "^@/src/(.*)$": "<rootDir>/src/$1",
        "^@/app/(.*)$": "<rootDir>/app/$1",
      },
      transform: {
        "^.+\\.(ts|tsx)$": "ts-jest",
      },
      maxWorkers: 1,
    },
    {
      displayName: "integration",
      preset: "ts-jest",
      testEnvironment: "node",
      roots: ["<rootDir>/tests"],
      testMatch: ["**/*.integration.test.ts"],
      moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
      moduleNameMapper: {
        "^@/(.*)$": "<rootDir>/$1",
        "^@/src/(.*)$": "<rootDir>/src/$1",
        "^@/app/(.*)$": "<rootDir>/app/$1",
      },
      transform: {
        "^.+\\.(ts|tsx)$": "ts-jest",
      },
      setupFilesAfterEnv: ["<rootDir>/tests/setupEnv.ts"],
      maxWorkers: 1,
      testTimeout: 30000,
    },
  ],
};
