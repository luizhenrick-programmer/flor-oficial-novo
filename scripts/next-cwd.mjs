import { spawnSync } from "node:child_process";
import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

// On Windows, running Next.js from a path whose casing differs from the folder
// on disk (e.g. C:\Flor-Oficial vs C:\flor-oficial) makes Node and Turbopack
// resolve modules under both casings and load duplicate React instances.
const rawCwd = process.cwd();
const realCwd = fs.realpathSync.native(rawCwd);
const hasCaseMismatch =
  realCwd !== rawCwd && realCwd.toLowerCase() === rawCwd.toLowerCase();
const cwd = hasCaseMismatch ? realCwd : rawCwd;

const env = { ...process.env };
if (hasCaseMismatch) {
  for (const key of ["INIT_CWD", "npm_config_local_prefix", "npm_package_json", "PATH", "Path"]) {
    if (typeof env[key] === "string") {
      env[key] = env[key].replaceAll(rawCwd, cwd);
    }
  }
}

// Resolve `next` relative to the canonical cwd so Node's __dirname matches disk casing.
const require = createRequire(path.join(cwd, "package.json"));
const nextBin = require.resolve("next/dist/bin/next");

const result = spawnSync(process.execPath, [nextBin, ...process.argv.slice(2)], {
  cwd,
  env,
  stdio: "inherit",
});

if (result.error) {
  throw result.error;
}
process.exit(result.status ?? 1);
