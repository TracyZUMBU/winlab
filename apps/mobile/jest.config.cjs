/** @type {import('jest').Config} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/src", "<rootDir>/tests"],
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
};
