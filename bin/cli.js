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
  // internal "not applicable" check. The three Quest-phase skills
  // (quest-embark, quest-forge, quest-ship — replacing the retired
  // quest-flow, AI/Agents Guild's "Orchestration model") are copied
  // unconditionally, whole directories at a time, via copyDirRecursive
  // below: they're the orchestrators themselves, not a per-type Guild
  // consumer, so every Quest type needs all three, and nothing here
  // hardcodes their names — this loop and copyDirRecursive just copy
  // whatever directories currently exist under templates/claude/skills/.
  // The agent manifest is copied in full (not filtered) so a skill can
  // read appliesTo at runtime, e.g. to decide whether to invoke
  // quartermaster at all.
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

  // Scaffold the process-gaps log if it doesn't exist yet — same
  // distribution pattern as guild-proposals.md above (written once at
  // init, never overwritten by update once a Quest has its own entries).
  // Distinct from guild-proposals.md: this file is for a real finding an
  // agent judged out of its scope to act on or propose as a Guild rule
  // right now, not a candidate rule itself — see guilds/ai-agents.md,
  // "Logging a `process-gaps.md` entry."
  const processGapsPath = path.join(targetDir, "process-gaps.md");
  if (!fs.existsSync(processGapsPath)) {
    fs.writeFileSync(
      processGapsPath,
      "# Process gaps\n\n" +
        "Log a real finding an agent concluded was not its scope to act on\n" +
        "or escalate as a guild-proposals.md entry right now. See\n" +
        "guilds/ai-agents.md, \"Logging a `process-gaps.md` entry,\" for when\n" +
        "to use this file instead of (or alongside) guild-proposals.md.\n\n" +
        "No severity tag (e.g. incident vs. note) yet — left open until the\n" +
        "mechanism has seen real use.\n\n" +
        "Entry format:\n\n" +
        "    ## Entry: <short title>\n" +
        "    - **Logged by**: <agent, step>\n" +
        "    - **What was observed**: <the finding>\n" +
        "    - **Why it wasn't escalated as a Guild proposal**: <the agent's\n" +
        "      reasoning for not logging this as a rule proposal>\n" +
        "    - **Suggested next step**: <what the agent recommends, if it has\n" +
        "      an opinion — fix now, spin off a maintenance Quest, escalate as\n" +
        "      a formal incident, etc.>\n" +
        "    - **Status**: logged, not yet reviewed.\n"
    );
  }

  // Scaffold the feature backlog and the Feature Brief directory —
  // same distribution pattern as guild-proposals.md and process-gaps.md
  // above (written once at init, never overwritten by update once a
  // Quest has its own content): docs/feature-backlog.md and
  // docs/features/ become living Quest documents the moment
  // /quest-embark's Herald (Vision Mode) and /quest-forge's Herald
  // (Feature Brief Mode) start writing to them — see the Product/
  // Ideation Guild, "Feature backlog format" and "Feature Brief format".
  const docsDir = path.join(targetDir, "docs");
  const featuresDir = path.join(docsDir, "features");
  fs.mkdirSync(featuresDir, { recursive: true });

  const featureBacklogPath = path.join(docsDir, "feature-backlog.md");
  if (!fs.existsSync(featureBacklogPath)) {
    fs.writeFileSync(
      featureBacklogPath,
      "# Feature backlog\n\n" +
        "Candidate features for this Quest, in loose one-to-two-sentence\n" +
        "form — not full specifications. Written by Herald in Vision Mode\n" +
        "during `/quest-embark`, and added to by Herald in Feature Brief\n" +
        "Mode whenever `/quest-forge <feature>` forges a feature that\n" +
        "wasn't already listed here. See the Product/Ideation Guild,\n" +
        "\"Feature backlog format,\" for the full rule this file follows.\n\n" +
        "Each entry: one to two sentences, tagged with a status.\n\n" +
        "- **Status values**: `planned` (not yet forged) | `in-progress`\n" +
        "  (a `/quest-forge` invocation is under way) | `done`\n" +
        "  (implemented, tested, and reviewed).\n\n" +
        "## Entries\n\n" +
        "(none yet — populated by `/quest-embark`)\n"
    );
  }

  const featuresReadmePath = path.join(featuresDir, "README.md");
  if (!fs.existsSync(featuresReadmePath)) {
    fs.writeFileSync(
      featuresReadmePath,
      "# Feature Briefs\n\n" +
        "One file per forged feature, `<slug>.md`, written the first time\n" +
        "that feature's `/quest-forge <feature>` invocation runs — never\n" +
        "before. See the Product/Ideation Guild, \"Feature Brief format,\"\n" +
        "for the required sections (Title, Context, Scope, Out of scope,\n" +
        "Acceptance criteria, Edge cases, Open questions / assumptions),\n" +
        "and `docs/feature-backlog.md` for the loose, pre-detail list of\n" +
        "candidate features this directory expands on one at a time.\n\n" +
        "This directory has no Feature Briefs yet — nothing here until the\n" +
        "first `/quest-forge` invocation.\n"
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

function scanEntryFile(targets, filename) {
  // Shared scan for both guild-proposals.md and process-gaps.md: each
  // Quest directory's file, split into "## "-delimited entries.
  const results = [];
  let total = 0;
  for (const dir of targets) {
    const filePath = path.join(path.resolve(dir), filename);
    if (!fs.existsSync(filePath)) continue;
    const content = fs.readFileSync(filePath, "utf-8");
    const entries = content.split(/^## /m).slice(1);
    if (entries.length === 0) continue;
    results.push({ dir, entries });
    total += entries.length;
  }
  return { results, total };
}

function cmdReviewProposals({ positional }) {
  // Scans one or more Quest directories (positional args) for
  // guild-proposals.md and process-gaps.md, printing each in its own,
  // clearly labeled section. The two are reviewed separately on purpose:
  // a guild-proposals.md entry is a candidate Guild rule with an
  // accept/reject/defer decision (master spec, section 6); a
  // process-gaps.md entry is a real finding an agent judged out of its
  // scope to act on or propose right now — there's no rule to accept or
  // reject, only a decision on whether/how to follow up (see
  // guilds/ai-agents.md, "Logging a `process-gaps.md` entry"). Neither
  // this command nor `init`/`update` ever writes to /guilds — promotion
  // into a guild file stays manual either way.
  const targets = positional.length > 0 ? positional : ["."];

  console.log("=== Guild proposals ===");
  const proposals = scanEntryFile(targets, "guild-proposals.md");
  for (const { dir, entries } of proposals.results) {
    console.log(`\n${dir} (${entries.length} proposal(s)):`);
    entries.forEach((entry) => console.log(`## ${entry.trim()}\n`));
  }
  if (proposals.total === 0) {
    console.log("No guild proposals found.");
  }

  console.log("\n=== Process gaps ===");
  const gaps = scanEntryFile(targets, "process-gaps.md");
  for (const { dir, entries } of gaps.results) {
    console.log(`\n${dir} (${entries.length} process gap(s)):`);
    entries.forEach((entry) => console.log(`## ${entry.trim()}\n`));
  }
  if (gaps.total === 0) {
    console.log("No process gaps found.");
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
          "    templates (.claude/agents/, .claude/skills/ — quest-embark,",
          "    quest-forge, quest-ship — .claude/quest-manifest.json), and",
          "    scaffolds guild-proposals.md, process-gaps.md,",
          "    docs/feature-backlog.md, and docs/features/",
          "  guildhall update [target-dir]",
          "  guildhall review-proposals [quest-dir...]",
          "    prints guild-proposals.md and process-gaps.md from each Quest,",
          "    in separate sections",
        ].join("\n")
      );
      process.exit(command ? 1 : 0);
  }
}

main();
