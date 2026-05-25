/**
 * run-migration.mjs
 * Applies a SQL migration file to Neon via the HTTP driver.
 * Usage: node scripts/run-migration.mjs db/migrations/0006_live_services.sql
 *
 * Must be run from apps/web directory.
 * Reads DATABASE_URL_UNPOOLED from .env (or process.env).
 */
import { readFileSync } from "fs";
import { resolve } from "path";

// ── Load .env manually (no dotenv dep needed in Node 20.6+) ──────────────────
// If NODE_OPTIONS or --env-file flag is not available, parse manually.
const envPath = resolve(process.cwd(), ".env");
try {
  const raw = readFileSync(envPath, "utf8");
  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    const val = trimmed.slice(idx + 1).trim();
    if (!process.env[key]) process.env[key] = val;
  }
} catch {
  // .env not found — rely on process.env
}

const DATABASE_URL = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("❌  DATABASE_URL_UNPOOLED (or DATABASE_URL) not set.");
  process.exit(1);
}

const sqlFile = process.argv[2];
if (!sqlFile) {
  console.error("Usage: node scripts/run-migration.mjs <path-to-sql>");
  process.exit(1);
}

const sql = readFileSync(resolve(process.cwd(), sqlFile), "utf8");

// ── Run via Neon HTTP tagged-template driver (.query() for raw strings) ───────
const { neon } = await import("@neondatabase/serverless");
const db = neon(DATABASE_URL);

// Strip -- line comments, then split on semicolons.
// The migration file has no semicolons inside string literals so a plain
// split is safe here.
const stripped = sql
  .replace(/--[^\n]*/g, "")   // remove -- line comments
  .replace(/\/\*[\s\S]*?\*\//g, ""); // remove /* block comments */

const statements = stripped
  .split(";")
  .map((s) => s.trim())
  .filter(Boolean);

console.log(`🚀  Applying ${statements.length} statements from ${sqlFile}…\n`);

for (let i = 0; i < statements.length; i++) {
  const stmt = statements[i];
  const preview = stmt.replace(/\s+/g, " ").slice(0, 80);
  try {
    // Use .query() for raw strings (no $1/$2 placeholders needed)
    await db.query(stmt);
    console.log(`  ✓ [${i + 1}/${statements.length}] ${preview}`);
  } catch (err) {
    const msg = err?.message ?? String(err);
    // Tolerate "already exists" — idempotent re-runs
    if (/already exists/i.test(msg)) {
      console.log(`  ⚠  [${i + 1}/${statements.length}] already exists — skipping. (${preview})`);
    } else {
      console.error(`  ✗ [${i + 1}/${statements.length}] FAILED: ${msg}`);
      console.error(`     Statement: ${stmt.slice(0, 200)}`);
      process.exit(1);
    }
  }
}

console.log("\n✅  Migration complete.");
