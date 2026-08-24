#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const GUILDHALL_ROOT = path.resolve(__dirname, "..");
const GUILDS_DIR = path.join(GUILDHALL_ROOT, "guilds");
const MANIFEST_PATH = path.join(GUILDS_DIR, "manifest.json");

function loadManifest() {
  const raw = fs.readFileSync(MANIFEST_PATH, "utf-8");
  return JSON.parse(raw);
}

function parseArgs(argv) {
  const [command, ...rest] = argv;
  const positional = [];
  const flags = {};
  for (const arg of rest) {
    if (arg.startsWith("--")) {
      const [key, value] = arg.slice(2).split("=");
      flags[key] = value === undefined ? true : value;
    } else {
      positional.push(arg);
    }
  }
  return { command, positional, flags };
}

function selectGuilds(manifest, questType) {
  return manifest.guilds.filter((g) => g.appliesTo.includes(questType));
}

function cmdInit({ positional, flags }) {
  const targetDir = path.resolve(positional[0] || ".");
  const questType = flags.type || "web-app";

  const manifest = loadManifest();
  const validTypes = new Set(
    manifest.guilds.flatMap((g) => g.appliesTo)
  );
  if (!validTypes.has(questType)) {
    console.error(
      `Unknown quest type "${questType}". Known types: ${[...validTypes].join(", ")}`
    );
    process.exit(1);
  }

  const selected = selectGuilds(manifest, questType);
  const outGuildsDir = path.join(targetDir, "guilds");
  fs.mkdirSync(outGuildsDir, { recursive: true });

  for (const guild of selected) {
    const src = path.join(GUILDS_DIR, guild.file);
    const dest = path.join(outGuildsDir, guild.file);
    fs.copyFileSync(src, dest);
  }

  // Record which guildhall version this Quest was initialized with,
  // so `update` can diff against it later.
  const lockPath = path.join(outGuildsDir, ".guildhall-lock.json");
  fs.writeFileSync(
    lockPath,
    JSON.stringify(
      { guildhallVersion: manifest.version, questType, installedGuilds: selected.map((g) => g.id) },
      null,
      2
    )
  );

  // Scaffold the proposal log if it doesn't exist yet.
  const proposalsPath = path.join(targetDir, "guild-proposals.md");
  if (!fs.existsSync(proposalsPath)) {
    fs.writeFileSync(
      proposalsPath,
      "# Guild proposals\n\n" +
        "Log improvement proposals discovered while building this Quest.\n" +
        "See the master spec, section 6, for the entry format and review flow.\n"
    );
  }

  console.log(`Initialized ${selected.length} guild(s) for quest type "${questType}" in ${outGuildsDir}`);
  selected.forEach((g) => console.log(`  - ${g.id} (${g.type})`));
}

function cmdUpdate({ positional }) {
  const targetDir = path.resolve(positional[0] || ".");
  const outGuildsDir = path.join(targetDir, "guilds");
  const lockPath = path.join(outGuildsDir, ".guildhall-lock.json");

  if (!fs.existsSync(lockPath)) {
    console.error(`No .guildhall-lock.json found in ${outGuildsDir}. Run "init" first.`);
    process.exit(1);
  }

  const lock = JSON.parse(fs.readFileSync(lockPath, "utf-8"));
  const manifest = loadManifest();

  if (lock.guildhallVersion === manifest.version) {
    console.log(`Already up to date (guildhall v${manifest.version}).`);
    return;
  }

  const selected = manifest.guilds.filter((g) => lock.installedGuilds.includes(g.id));
  for (const guild of selected) {
    const src = path.join(GUILDS_DIR, guild.file);
    const dest = path.join(outGuildsDir, guild.file);
    fs.copyFileSync(src, dest);
  }

  lock.guildhallVersion = manifest.version;
  fs.writeFileSync(lockPath, JSON.stringify(lock, null, 2));

  console.log(
    `Updated ${selected.length} guild(s) from v${lock.guildhallVersion} to v${manifest.version}.`
  );
}

function cmdReviewProposals({ positional }) {
  // Scans one or more Quest directories (positional args) for guild-proposals.md
  // and prints a consolidated view. Promotion into a guild file is manual —
  // this command only surfaces proposals, it never writes to /guilds.
  const targets = positional.length > 0 ? positional : ["."];
  let found = 0;

  for (const dir of targets) {
    const proposalsPath = path.join(path.resolve(dir), "guild-proposals.md");
    if (!fs.existsSync(proposalsPath)) continue;
    const content = fs.readFileSync(proposalsPath, "utf-8");
    const entries = content.split(/^## /m).slice(1);
    if (entries.length === 0) continue;

    console.log(`\n=== ${dir} (${entries.length} proposal(s)) ===`);
    entries.forEach((entry) => console.log(`## ${entry.trim()}\n`));
    found += entries.length;
  }

  if (found === 0) {
    console.log("No proposals found.");
  }
}

function main() {
  const { command, positional, flags } = parseArgs(process.argv.slice(2));

  switch (command) {
    case "init":
      cmdInit({ positional, flags });
      break;
    case "update":
      cmdUpdate({ positional, flags });
      break;
    case "review-proposals":
      cmdReviewProposals({ positional, flags });
      break;
    default:
      console.log(
        [
          "guildhall — usage:",
          "  guildhall init [target-dir] [--type=web-app|api|cli|script]",
          "  guildhall update [target-dir]",
          "  guildhall review-proposals [quest-dir...]",
        ].join("\n")
      );
      process.exit(command ? 1 : 0);
  }
}

main();
