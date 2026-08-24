#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const GUILDHALL_ROOT = path.resolve(__dirname, "..");
const GUILDS_DIR = path.join(GUILDHALL_ROOT, "guilds");
const MANIFEST_PATH = path.join(GUILDS_DIR, "manifest.json");
const TEMPLATES_DIR = path.join(GUILDHALL_ROOT, "templates");
const AGENTS_DIR = path.join(TEMPLATES_DIR, "claude", "agents");
const SKILLS_DIR = path.join(TEMPLATES_DIR, "claude", "skills");
const AGENT_MANIFEST_PATH = path.join(TEMPLATES_DIR, "manifest.json");

function loadManifest() {
  const raw = fs.readFileSync(MANIFEST_PATH, "utf-8");
  return JSON.parse(raw);
}

function loadAgentManifest() {
  const raw = fs.readFileSync(AGENT_MANIFEST_PATH, "utf-8");
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

function selectAgents(agentManifest, questType) {
  return agentManifest.agents.filter((a) => a.appliesTo.includes(questType));
}

function copyDirRecursive(srcDir, destDir) {
  fs.mkdirSync(destDir, { recursive: true });
  for (const entry of fs.readdirSync(srcDir, { withFileTypes: true })) {
    const src = path.join(srcDir, entry.name);
    const dest = path.join(destDir, entry.name);
    if (entry.isDirectory()) {
      copyDirRecursive(src, dest);
    } else {
      fs.copyFileSync(src, dest);
    }
  }
}

function listSkillDirs() {
  return fs
    .readdirSync(SKILLS_DIR, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name);
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

  // Agent-orchestration templates (spec section 5/11): subagents are
  // filtered by appliesTo the same way guilds are — quartermaster is the
  // one currently narrowed to web-app/api, so a cli/script Quest simply
  // never receives quartermaster.md rather than relying only on its own
  // internal "not applicable" check. The quest-flow skill is copied
  // unconditionally: it's the orchestrator itself, not a per-type Guild
  // consumer, so every Quest type needs it. The agent manifest is copied
  // in full (not filtered) so the skill can read appliesTo at runtime,
  // e.g. to decide whether to invoke quartermaster at all.
  const agentManifest = loadAgentManifest();
  const selectedAgents = selectAgents(agentManifest, questType);
  const outClaudeDir = path.join(targetDir, ".claude");
  const outAgentsDir = path.join(outClaudeDir, "agents");
  fs.mkdirSync(outAgentsDir, { recursive: true });

  for (const agent of selectedAgents) {
    const src = path.join(AGENTS_DIR, agent.file);
    const dest = path.join(outAgentsDir, agent.file);
    fs.copyFileSync(src, dest);
  }

  const outSkillsDir = path.join(outClaudeDir, "skills");
  copyDirRecursive(SKILLS_DIR, outSkillsDir);
  const installedSkills = listSkillDirs();

  fs.copyFileSync(AGENT_MANIFEST_PATH, path.join(outClaudeDir, "quest-manifest.json"));

  // Single lock file for the whole guildhall installation (guilds +
  // agent-orchestration templates), at the Quest root rather than nested
  // under guilds/ — it now tracks more than just guild content, so
  // nesting it under guilds/ would misstate its own scope. guildhallVersion
  // and agentTemplatesVersion are tracked as separate fields, not one: the
  // two manifests (guilds/manifest.json, templates/manifest.json) version
  // independently, and coupling them would force an agent-template refresh
  // every time a guild's content changes, or vice versa, for no reason.
  const lockPath = path.join(targetDir, ".guildhall-lock.json");
  fs.writeFileSync(
    lockPath,
    JSON.stringify(
      {
        guildhallVersion: manifest.version,
        agentTemplatesVersion: agentManifest.version,
        questType,
        installedGuilds: selected.map((g) => g.id),
        installedAgents: selectedAgents.map((a) => a.id),
        installedSkills,
      },
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
  console.log(`Installed ${selectedAgents.length} agent(s) in ${outAgentsDir}`);
  selectedAgents.forEach((a) => console.log(`  - ${a.id} (step ${a.step})`));
  console.log(`Installed ${installedSkills.length} skill(s) in ${outSkillsDir}`);
  installedSkills.forEach((s) => console.log(`  - ${s}`));
  console.log(`Wrote agent manifest to ${path.join(outClaudeDir, "quest-manifest.json")}`);
}

function cmdUpdate({ positional }) {
  const targetDir = path.resolve(positional[0] || ".");
  const outGuildsDir = path.join(targetDir, "guilds");
  const lockPath = path.join(targetDir, ".guildhall-lock.json");

  if (!fs.existsSync(lockPath)) {
    console.error(`No .guildhall-lock.json found in ${targetDir}. Run "init" first.`);
    process.exit(1);
  }

  const lock = JSON.parse(fs.readFileSync(lockPath, "utf-8"));
  const manifest = loadManifest();
  const agentManifest = loadAgentManifest();

  const guildsOutdated = lock.guildhallVersion !== manifest.version;
  const agentsOutdated = lock.agentTemplatesVersion !== agentManifest.version;

  if (!guildsOutdated && !agentsOutdated) {
    console.log(
      `Already up to date (guilds v${manifest.version}, agent templates v${agentManifest.version}).`
    );
    return;
  }

  if (guildsOutdated) {
    const selected = manifest.guilds.filter((g) => lock.installedGuilds.includes(g.id));
    for (const guild of selected) {
      const src = path.join(GUILDS_DIR, guild.file);
      const dest = path.join(outGuildsDir, guild.file);
      fs.copyFileSync(src, dest);
    }
    console.log(`Updated ${selected.length} guild(s) from v${lock.guildhallVersion} to v${manifest.version}.`);
    lock.installedGuilds = selected.map((g) => g.id);
    lock.guildhallVersion = manifest.version;
  }

  if (agentsOutdated) {
    const outClaudeDir = path.join(targetDir, ".claude");
    const outAgentsDir = path.join(outClaudeDir, "agents");
    const selectedAgents = agentManifest.agents.filter((a) => lock.installedAgents.includes(a.id));
    fs.mkdirSync(outAgentsDir, { recursive: true });
    for (const agent of selectedAgents) {
      const src = path.join(AGENTS_DIR, agent.file);
      const dest = path.join(outAgentsDir, agent.file);
      fs.copyFileSync(src, dest);
    }

    const outSkillsDir = path.join(outClaudeDir, "skills");
    copyDirRecursive(SKILLS_DIR, outSkillsDir);
    const installedSkills = listSkillDirs();

    fs.copyFileSync(AGENT_MANIFEST_PATH, path.join(outClaudeDir, "quest-manifest.json"));

    console.log(
      `Updated ${selectedAgents.length} agent(s) and ${installedSkills.length} skill(s) from v${lock.agentTemplatesVersion} to v${agentManifest.version}.`
    );
    lock.installedAgents = selectedAgents.map((a) => a.id);
    lock.installedSkills = installedSkills;
    lock.agentTemplatesVersion = agentManifest.version;
  }

  fs.writeFileSync(lockPath, JSON.stringify(lock, null, 2));
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
          "    installs Guild docs (guilds/) and the agent-orchestration",
          "    templates (.claude/agents/, .claude/skills/, .claude/quest-manifest.json)",
          "  guildhall update [target-dir]",
          "  guildhall review-proposals [quest-dir...]",
        ].join("\n")
      );
      process.exit(command ? 1 : 0);
  }
}

main();
