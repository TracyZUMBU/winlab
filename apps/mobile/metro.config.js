const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(workspaceRoot, "node_modules"),
  path.resolve(projectRoot, "node_modules"),
];
config.resolver.extraNodeModules = {
  react: path.resolve(workspaceRoot, "node_modules/react"),
  "react-dom": path.resolve(workspaceRoot, "node_modules/react-dom"),
};

// Expo adds watcher `additionalExts` for `.env` / `.local` so env files participate in
// file watching. That can surface Jest-only files such as `.env.test.local` as Metro
// modules; Babel then tries to parse key=value lines as JS and fails. Never bundle them.
config.resolver.blockList = [
  /\.env\.test\.local$/,
  /\.env\.test$/,
].concat(config.resolver.blockList ?? []);

module.exports = config;
