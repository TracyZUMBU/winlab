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

const appConfigPath = path.join(__dirname, "..", "app.config.js");
const pkgPath = path.join(__dirname, "..", "package.json");

function escapeRegex(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function countOccurrences(source, re) {
  const flags = re.flags.includes("g") ? re.flags : `${re.flags}g`;
  const g = new RegExp(re.source, flags);
  return (source.match(g) || []).length;
}

/** @returns {{ ok: true, next: string } | { ok: false, label: string }} */
function replaceOnce(source, regex, replacement, label) {
  const count = countOccurrences(source, regex);
  if (count === 0) {
    return { ok: false, label };
  }
  if (count > 1) {
    console.error(
      `${label}: plusieurs occurrences (${count}) — arrêt pour éviter un remplacement ambigu.`,
    );
    process.exit(1);
  }
  const next = source.replace(regex, replacement);
  if (next === source) {
    return { ok: false, label };
  }
  return { ok: true, next };
}

delete require.cache[require.resolve(appConfigPath)];
const app = require(appConfigPath);
const expo = app.expo;
if (!expo) {
  console.error("app.config.js: clé expo manquante");
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

if (!expo.android) {
  expo.android = {};
}
if (!expo.ios) {
  expo.ios = {};
}

const oldVersion = raw;
let appConfigSource = fs.readFileSync(appConfigPath, "utf8");

const verMatch = appConfigSource.match(/\bversion\s*:\s*(['"])([^'"]*)\1/);
if (!verMatch) {
  console.error(
    "app.config.js: impossible de trouver une ligne `version` (guillemets / espaces non reconnus).",
  );
  process.exit(1);
}
const fileVersion = verMatch[2];
if (fileVersion !== oldVersion) {
  console.error(
    `app.config.js: incohérence — version dans le fichier ("${fileVersion}") ≠ expo.version ("${oldVersion}").`,
  );
  process.exit(1);
}

const codeFromExpo =
  typeof expo.android.versionCode === "number" && Number.isFinite(expo.android.versionCode)
    ? expo.android.versionCode
    : null;
const codeMatch = appConfigSource.match(/\bversionCode\s*:\s*(\d+)/);
const codeFromFile = codeMatch ? parseInt(codeMatch[1], 10) : null;
if (codeFromExpo != null && codeFromFile != null && codeFromExpo !== codeFromFile) {
  console.error(
    `app.config.js: android.versionCode incohérent — config (${codeFromExpo}) ≠ fichier (${codeFromFile}).`,
  );
  process.exit(1);
}
const prevCodeEffective = codeFromExpo ?? codeFromFile;
if (prevCodeEffective == null || !Number.isFinite(prevCodeEffective)) {
  console.error(
    "app.config.js: android.versionCode introuvable (ni dans la config expo.android, ni dans le fichier).",
  );
  process.exit(1);
}
const nextCode = prevCodeEffective + 1;

function parseBuildNumber(value) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  const n = parseInt(String(value ?? "").trim(), 10);
  return Number.isFinite(n) ? n : null;
}

const buildMatch = appConfigSource.match(
  /\bbuildNumber\s*:\s*(?:"([^"]*)"|'([^']*)'|(\d+))/,
);
const buildFromFileRaw =
  buildMatch != null ? (buildMatch[1] ?? buildMatch[2] ?? buildMatch[3]) : null;
const buildFromFileNum = parseBuildNumber(buildFromFileRaw);
const buildFromExpoNum = parseBuildNumber(expo.ios.buildNumber);
if (buildFromExpoNum != null && buildFromFileNum != null && buildFromExpoNum !== buildFromFileNum) {
  console.error(
    `app.config.js: ios.buildNumber incohérent — config (${buildFromExpoNum}) ≠ fichier (${buildFromFileNum}).`,
  );
  process.exit(1);
}
const baseIos = buildFromExpoNum ?? buildFromFileNum;
if (baseIos == null || !Number.isFinite(baseIos)) {
  console.error(
    "app.config.js: ios.buildNumber introuvable (ni dans la config expo.ios, ni dans le fichier).",
  );
  process.exit(1);
}
const nextIos = baseIos + 1;

const versionRe = new RegExp(
  `(\\bversion\\s*:\\s*)(['"])${escapeRegex(oldVersion)}\\2`,
);
let r = replaceOnce(appConfigSource, versionRe, `$1$2${newV}$2`, "expo.version");
if (!r.ok) {
  console.error(
    "app.config.js: remplacement expo.version impossible (motif attendu introuvable ou inchangé).",
  );
  process.exit(1);
}
appConfigSource = r.next;

r = replaceOnce(
  appConfigSource,
  /\bversionCode\s*:\s*\d+/,
  `versionCode: ${nextCode}`,
  "android.versionCode",
);
if (!r.ok) {
  console.error(
    "app.config.js: remplacement android.versionCode impossible (motif attendu introuvable ou inchangé).",
  );
  process.exit(1);
}
appConfigSource = r.next;

r = replaceOnce(
  appConfigSource,
  /\bbuildNumber\s*:\s*(?:"[^"]*"|'[^']*'|\d+)/,
  `buildNumber: "${String(nextIos)}"`,
  "ios.buildNumber",
);
if (!r.ok) {
  console.error(
    "app.config.js: remplacement ios.buildNumber impossible (motif attendu introuvable ou inchangé).",
  );
  process.exit(1);
}
appConfigSource = r.next;

fs.writeFileSync(appConfigPath, appConfigSource);

const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
pkg.version = newV;
fs.writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`);

console.log(
  `OK — version ${newV} (expo + package.json), android.versionCode → ${nextCode}, ios.buildNumber → "${nextIos}"`,
);
