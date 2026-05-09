/** @type {import('jest').Config} */
const path = require("node:path");

module.exports = {
  // Permet `jest --selectProjects unit` tant qu’aucun fichier `*.unit.test.ts` n’existe sous `src/`.
  passWithNoTests: true,
  projects: [
    {
      displayName: "unit",
      preset: "ts-jest",
      testEnvironment: "node",
      roots: ["<rootDir>/src"],
      testMatch: ["**/*.unit.test.ts", "**/*.unit.test.tsx"],
      moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
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
      transform: {
        "^.+\\.(ts|tsx)$": "ts-jest",
      },
      moduleNameMapper: {
        "^marked$": path.join(
          path.dirname(require.resolve("marked/package.json")),
          "lib/marked.umd.js",
        ),
      },
      setupFiles: ["<rootDir>/tests/setupEnv.ts"],
      maxWorkers: 1,
    },
  ],
};
