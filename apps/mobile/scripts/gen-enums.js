#!/usr/bin/env node

/**
 * Génère le fichier `supabase/database.enums.ts` à partir de la migration
 * `supabase/migrations/20260318085739_initial_remote_schema.sql`.
 *
 * Ce script est pensé pour être appelé depuis le dossier `apps/mobile`,
 * par exemple via le script npm `gen:types`.
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..", "..", "..");
const MIGRATION_FILE = path.join(
  ROOT,
  "supabase",
  "migrations",
  "20260318085739_initial_remote_schema.sql"
);
const OUTPUT_FILE = path.join(ROOT, "supabase", "database.enums.ts");

/**
 * Parse les blocs `CREATE TYPE "public"."xxx" AS ENUM ('a', 'b', ...)`
 * et retourne un tableau d'objets { name, values }.
 */
function parseEnums(sql) {
  const enums = [];

  const regex =
    /CREATE TYPE\s+"public"\."([^"]+)"\s+AS\s+ENUM\s*\(([\s\S]*?)\);/gi;

  let match;
  while ((match = regex.exec(sql)) !== null) {
    const name = match[1];
    const body = match[2];

    const values = body
      .split(",")
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .map((line) => {
        const m = line.match(/'([^']+)'/);
        return m ? m[1] : null;
      })
      .filter((v) => v !== null);

    if (values.length === 0) continue;

    enums.push({ name, values });
  }

  return enums;
}

function toPascalCase(value) {
  return value
    .split(/[_\s]+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
}

/**
 * Génère le contenu TypeScript pour les enums.
 */
function generateTs(enums) {
  const lines = [];

  lines.push(
    "/**",
    " * Valeurs des types ENUM PostgreSQL du schéma `public`.",
    " *",
    " * Fichier généré automatiquement à partir de la migration :",
    " * `supabase/migrations/20260318085739_initial_remote_schema.sql`",
    " *",
    " * Ne pas modifier manuellement : lancer `npm run gen:types`",
    " * depuis `apps/mobile` pour régénérer ce fichier.",
    " */",
    ""
  );

  for (const e of enums) {
    const constName = toPascalCase(e.name);

    lines.push(`/** ${e.name} */`);
    lines.push(`export const ${constName} = {`);
    e.values.forEach((v, idx) => {
      const comma = idx === e.values.length - 1 ? "" : ",";
      lines.push(`  ${v}: '${v}'${comma}`);
    });
    lines.push(
      "} as const;",
      `export type ${constName} = (typeof ${constName})[keyof typeof ${constName}];`,
      ""
    );
  }

  lines.push("/** Regroupe toutes les constantes (itération, tests, etc.) */");
  lines.push("export const DatabaseEnums = {");
  enums.forEach((e, idx) => {
    const constName = toPascalCase(e.name);
    const comma = idx === enums.length - 1 ? "" : ",";
    lines.push(`  ${constName}${comma}`);
  });
  lines.push("} as const;", "");

  return lines.join("\n");
}

function main() {
  if (!fs.existsSync(MIGRATION_FILE)) {
    console.error(`❌ Migration file not found: ${MIGRATION_FILE}`);
    process.exit(1);
  }

  const sql = fs.readFileSync(MIGRATION_FILE, "utf8");
  const enums = parseEnums(sql);

  if (enums.length === 0) {
    console.error("❌ No enums found in migration file.");
    process.exit(1);
  }

  const ts = generateTs(enums);
  fs.writeFileSync(OUTPUT_FILE, ts);

  console.log(
    `✅ Generated ${OUTPUT_FILE} from ${enums.length} enum type(s) in migration.`
  );
}

main();

