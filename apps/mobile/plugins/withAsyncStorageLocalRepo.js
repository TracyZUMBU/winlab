const fs = require("fs");
const path = require("path");
const { withProjectBuildGradle } = require("@expo/config-plugins");

/**
 * @react-native-async-storage/async-storage (v3+) ships a local Maven repo for
 * its shared-storage artifact used on Android. Some build environments don't
 * pick it up automatically, so we explicitly add it to the Android Gradle
 * repositories list.
 *
 * In npm workspaces, the package usually lives at the repo root
 * `node_modules`, not `apps/<app>/node_modules`. Resolve the real path with
 * `require.resolve` so Gradle always points at the correct `local_repo`.
 */
function withAsyncStorageLocalRepo(config) {
  const projectRoot = path.join(__dirname, "..");

  let localRepoAbs;
  try {
    const pkg = require.resolve(
      "@react-native-async-storage/async-storage/package.json",
      { paths: [projectRoot] },
    );
    localRepoAbs = path.join(path.dirname(pkg), "android", "local_repo");
  } catch {
    return config;
  }

  /** Expo SDK 54 pins async-storage v2.x — no `local_repo` (v3+ only). */
  if (!fs.existsSync(localRepoAbs)) {
    return config;
  }

  const filePathForUri = localRepoAbs.replace(/\\/g, "/");
  const gradleUri = `file://${filePathForUri}`;
  const repositoryLine = `maven { url uri("${gradleUri}") }`;

  return withProjectBuildGradle(config, (modConfig) => {
    let contents = modConfig.modResults.contents;

    // Remove legacy line that assumed `../node_modules` from `android/` (wrong when hoisted).
    contents = contents
      .split("\n")
      .filter(
        (line) =>
          !line.includes(
            "${rootDir}/../node_modules/@react-native-async-storage/async-storage/android/local_repo",
          ),
      )
      .join("\n");

    if (contents.includes(repositoryLine)) {
      modConfig.modResults.contents = contents;
      return modConfig;
    }

    const localRepoPathFragment = "async-storage/android/local_repo";

    const allProjectsIndex = contents.indexOf("allprojects {");
    if (allProjectsIndex === -1) {
      modConfig.modResults.contents = contents;
      return modConfig;
    }

    if (contents.indexOf(localRepoPathFragment, allProjectsIndex) !== -1) {
      modConfig.modResults.contents = contents;
      return modConfig;
    }

    const mavenCentralIndex = contents.indexOf(
      "mavenCentral()",
      allProjectsIndex,
    );
    if (mavenCentralIndex === -1) {
      modConfig.modResults.contents = contents;
      return modConfig;
    }

    const lineStartIndex =
      contents.lastIndexOf("\n", mavenCentralIndex) + 1;
    const indent = contents.slice(lineStartIndex, mavenCentralIndex).match(
      /^\s*/,
    )[0];

    const lineEndIndex = contents.indexOf("\n", mavenCentralIndex);
    const insertAt = lineEndIndex === -1 ? contents.length : lineEndIndex + 1;

    modConfig.modResults.contents =
      contents.slice(0, insertAt) +
      `${indent}${repositoryLine}\n` +
      contents.slice(insertAt);

    return modConfig;
  });
}

module.exports = withAsyncStorageLocalRepo;
