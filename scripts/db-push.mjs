#!/usr/bin/env node
/**
 * Copy catalog from local DB → server DB in one step (no intermediate file).
 *
 *   TARGET_DATABASE_URL=postgresql://... npm run db:push
 *
 * Optional:
 *   SOURCE_DATABASE_URL=...   (defaults to DATABASE_URL from .env.local)
 *   npm run db:push -- --with-settings
 *   npm run db:push -- --dry-run
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { argFlag, loadEnv } from "./_pg.mjs";

loadEnv();

const sourceUrl = process.env.SOURCE_DATABASE_URL || process.env.DATABASE_URL;
const targetUrl = process.env.TARGET_DATABASE_URL;

if (!sourceUrl) {
  console.error("DATABASE_URL (source) is not set");
  process.exit(1);
}
if (!targetUrl) {
  console.error(
    "TARGET_DATABASE_URL is not set.\n" +
      "Example:\n" +
      "  TARGET_DATABASE_URL='postgresql://user:pass@host:5432/logic_clothes?sslmode=require' npm run db:push"
  );
  process.exit(1);
}
if (sourceUrl === targetUrl) {
  console.error("SOURCE and TARGET database URLs are identical — aborting.");
  process.exit(1);
}

const withSettings = argFlag("--with-settings");
const dryRun = argFlag("--dry-run");
const tmp = path.join(
  os.tmpdir(),
  `logic-clothes-catalog-${Date.now()}.json`
);

function run(script, env) {
  const args = [script];
  if (withSettings) args.push("--with-settings");
  if (dryRun && script.endsWith("db-import.mjs")) args.push("--dry-run");
  if (script.endsWith("db-export.mjs")) {
    args.push("--out", tmp);
  } else {
    args.push("--file", tmp);
  }
  const res = spawnSync(process.execPath, args, {
    cwd: process.cwd(),
    env: { ...process.env, ...env },
    stdio: "inherit",
  });
  if (res.status !== 0) {
    process.exit(res.status || 1);
  }
}

try {
  console.log("1/2 Export from source…");
  run(path.join("scripts", "db-export.mjs"), {
    DATABASE_URL: sourceUrl,
    SOURCE_DATABASE_URL: sourceUrl,
  });

  console.log("2/2 Import into target…");
  run(path.join("scripts", "db-import.mjs"), {
    DATABASE_URL: targetUrl,
    TARGET_DATABASE_URL: targetUrl,
  });

  console.log("Done. Catalog pushed to target database.");
} finally {
  try {
    fs.unlinkSync(tmp);
  } catch {
    /* ignore */
  }
}
