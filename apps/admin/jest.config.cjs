/** @type {import('jest').Config} */
module.exports = {
  projects: [
    {
      displayName: "integration",
      preset: "ts-jest",
      testEnvironment: "node",
      roots: ["<rootDir>/tests"],
      testMatch: ["**/*.integration.test.ts"],
      moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
      transform: {
        "^.+\\.(ts|tsx)$": "ts-jest",
      },
      setupFiles: ["<rootDir>/tests/setupEnv.ts"],
      maxWorkers: 1,
    },
  ],
};
