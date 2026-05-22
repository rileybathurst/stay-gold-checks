#!/usr/bin/env node

// graphql-query-names.ts
// Script to check that every GraphQL query name ending with "Query" is unique across all project files

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { walk } from "./walk.js";

const exts = [".js", ".ts", ".astro", ".tsx", ".graphql", ".gql"];
const rootDir = resolve(process.cwd(), "src");

function checkQueryNames(files: string[]): boolean {
  const seen = new Map<string, string>(); // name -> first file it appeared in
  let found = false;

  files.forEach((file: string) => {
    const content: string = readFileSync(file, "utf8");
    const matches = content.matchAll(/query\s+(\w+Query)\s*[({]/g);
    for (const match of matches) {
      const name = match[1];
      if (seen.has(name)) {
        console.error(
          `Duplicate query name "${name}" found in: ${file} (first seen in: ${seen.get(name)})`
        );
        found = true;
      } else {
        seen.set(name, file);
      }
    }
  });

  return found;
}

const srcFiles = walk(rootDir, exts);

if (checkQueryNames(srcFiles)) {
  process.exit(1);
} else {
  console.log("All GraphQL query names are unique.");
}
