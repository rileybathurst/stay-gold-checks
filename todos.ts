#!/usr/bin/env node

// check-todo.ts
// Script to check for the string "TODO:" in project files and count occurrences


import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { walk } from "./walk.js";

const exts = [".js", ".ts", ".astro", ".css", ".tsx"];
const rootDir = resolve(process.cwd(), "src");
const publicDir = resolve(process.cwd(), "public");

function checkTodos(files: string[]): number {
  let totalCount: number = 0;
  files.forEach((file: string) => {
    const content: string = readFileSync(file, "utf8");
    const matches = content.match(/TODO:/g);
    if (matches && matches.length > 0) {
      console.log(`Found ${matches.length} TODO(s) in: ${file}`);
      totalCount += matches.length;
    }
  });
  return totalCount;
}

const srcFiles = walk(rootDir, exts);
const publicFiles = walk(publicDir, exts);
const allFiles = srcFiles.concat(publicFiles);

const todoCount = checkTodos(allFiles);

if (todoCount > 0) {
  console.warn(`Total TODOs found: ${todoCount}`);
  process.exit(1);
} else {
  console.log("No TODOs found.");
}
