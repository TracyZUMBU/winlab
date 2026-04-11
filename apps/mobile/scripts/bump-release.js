#!/usr/bin/env node

/**
 * Incrémente expo.version, android.versionCode, ios.buildNumber, et aligne package.json.
 * runtimeVersion reste géré par la policy "appVersion" (dérivée de expo.version).
 */

const fs = require("fs");
const path = require("path");

const level = process.argv[2];
if (!["patch", "minor", "major"].includes(level)) {
  console.error(
    "Usage: node scripts/bump-release.js <patch|minor|major>\n" +
      "Exemple: npm run bump:release -- patch",
  );
  process.exit(1);
}

const appPath = path.join(__dirname, "..", "app.json");
const pkgPath = path.join(__dirname, "..", "package.json");

const app = JSON.parse(fs.readFileSync(appPath, "utf8"));
const expo = app.expo;
if (!expo) {
  console.error("app.json: clé expo manquante");
  process.exit(1);
}

const raw = String(expo.version || "0.0.0");
const parts = raw.split(".").map((p) => parseInt(String(p).replace(/\D.*$/, ""), 10));
const maj = Number.isFinite(parts[0]) ? parts[0] : 0;
const min = Number.isFinite(parts[1]) ? parts[1] : 0;
const pat = Number.isFinite(parts[2]) ? parts[2] : 0;

let newV;
if (level === "major") {
  newV = `${maj + 1}.0.0`;
} else if (level === "minor") {
  newV = `${maj}.${min + 1}.0`;
} else {
  newV = `${maj}.${min}.${pat + 1}`;
}

expo.version = newV;

if (!expo.android) {
  expo.android = {};
}
const prevCode = expo.android.versionCode;
const nextCode = (typeof prevCode === "number" && Number.isFinite(prevCode) ? prevCode : 0) + 1;
expo.android.versionCode = nextCode;

if (!expo.ios) {
  expo.ios = {};
}
const prevIos = expo.ios.buildNumber;
const prevIosNum =
  typeof prevIos === "number" && Number.isFinite(prevIos)
    ? prevIos
    : parseInt(String(prevIos ?? "").trim(), 10);
const baseIos = Number.isFinite(prevIosNum) ? prevIosNum : 0;
const nextIos = baseIos + 1;
expo.ios.buildNumber = String(nextIos);

fs.writeFileSync(appPath, `${JSON.stringify(app, null, 2)}\n`);

const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
pkg.version = newV;
fs.writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`);

console.log(
  `OK — version ${newV} (expo + package.json), android.versionCode → ${nextCode}, ios.buildNumber → "${nextIos}"`,
);
