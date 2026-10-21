#!/usr/bin/env node
/**
 * Initialize database on a fresh server:
 *   1) migrate schema
 *   2) import data/catalog-dump.json if present, else seed from data/*.json
 *
 *   npm run db:init
 *   TARGET_DATABASE_URL=... npm run db:init
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { loadEnv } from "./_pg.mjs";

loadEnv();

const dumpPath = path.join(process.cwd(), "data", "catalog-dump.json");
const dbUrl = process.env.TARGET_DATABASE_URL || process.env.DATABASE_URL;

if (!dbUrl) {
  console.error("DATABASE_URL (or TARGET_DATABASE_URL) is not set");
  process.exit(1);
}

function runNpm(script) {
  const res = spawnSync("npm", ["run", script], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      DATABASE_URL: dbUrl,
      TARGET_DATABASE_URL: dbUrl,
    },
    stdio: "inherit",
    shell: process.platform === "win32",
  });
  if (res.status !== 0) process.exit(res.status || 1);
}

console.log("→ migrate");
runNpm("migrate");

if (fs.existsSync(dumpPath)) {
  console.log(`→ db:import (${dumpPath})`);
  runNpm("db:import");
} else {
  console.log("→ db:seed (no data/catalog-dump.json — using data/*.json)");
  runNpm("db:seed");
}

console.log("DB init complete.");
