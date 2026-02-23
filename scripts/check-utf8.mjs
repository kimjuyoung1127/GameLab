#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const decoder = new TextDecoder("utf-8", { fatal: true });

const includeExt = new Set([
  ".md",
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".json",
  ".css",
  ".py",
  ".yml",
  ".yaml",
  ".sh",
  ".ps1",
]);

const ignoreDirs = new Set([
  ".git",
  "node_modules",
  ".next",
  "dist",
  "build",
  "coverage",
  ".venv",
  "venv",
  "__pycache__",
]);

const badFiles = [];

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith(".") && entry.name !== ".github" && entry.name !== ".vscode") {
      if (entry.name !== ".editorconfig" && entry.name !== ".gitattributes") {
        if (entry.isDirectory()) continue;
      }
    }

    const full = path.join(dir, entry.name);
    const rel = path.relative(root, full);

    if (entry.isDirectory()) {
      if (ignoreDirs.has(entry.name)) continue;
      walk(full);
      continue;
    }

    const ext = path.extname(entry.name).toLowerCase();
    if (!includeExt.has(ext)) continue;

    try {
      const bytes = fs.readFileSync(full);
      const text = decoder.decode(bytes);
      if (text.includes("\uFFFD")) {
        badFiles.push(`${rel} (contains replacement character)`); 
      }
    } catch {
      badFiles.push(`${rel} (invalid UTF-8)`);
    }
  }
}

walk(root);

if (badFiles.length > 0) {
  console.error("UTF-8 check failed:");
  for (const file of badFiles) {
    console.error(`- ${file}`);
  }
  process.exit(1);
}

console.log("UTF-8 check passed.");
