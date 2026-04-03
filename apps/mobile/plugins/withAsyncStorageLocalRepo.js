const { withProjectBuildGradle } = require("@expo/config-plugins");

/**
 * @react-native-async-storage/async-storage (v3+) ships a local Maven repo for
 * its shared-storage artifact used on Android. Some build environments don't
 * pick it up automatically, so we explicitly add it to the Android Gradle
 * repositories list.
 */
function withAsyncStorageLocalRepo(config) {
  return withProjectBuildGradle(config, (modConfig) => {
    const contents = modConfig.modResults.contents;
    const localRepoPathFragment =
      "async-storage/android/local_repo";

    const repositoryLine =
      'maven { url "${rootDir}/../node_modules/@react-native-async-storage/async-storage/android/local_repo" }';

    // We want this in `allprojects.repositories` (dependency resolution), not
    // in `buildscript.repositories` (Gradle plugin classpath).
    const allProjectsIndex = contents.indexOf("allprojects {");
    if (allProjectsIndex === -1) {
      return modConfig;
    }

    // If it's already present inside the allprojects block, do nothing.
    if (contents.indexOf(localRepoPathFragment, allProjectsIndex) !== -1) {
      return modConfig;
    }

    const mavenCentralIndex = contents.indexOf(
      "mavenCentral()",
      allProjectsIndex,
    );
    if (mavenCentralIndex === -1) {
      return modConfig;
    }

    // Determine indentation for the line containing `mavenCentral()`.
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

