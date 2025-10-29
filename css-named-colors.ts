#!/usr/bin/env node

// check-css-named-colors.ts
// Script to check for usage of named CSS colors in styles folder


import { readFileSync, readdirSync } from "node:fs";
import { resolve, join, extname } from "node:path";
import { namedColors } from "./named-colors.js";

const stylesDir = resolve(process.cwd(), "src/styles");
const exts = [".css"];

function walkCssFiles(dir: string): string[] {
  return readdirSync(dir)
    .filter((f: string) => exts.includes(extname(f)))
    .map((f: string) => join(dir, f));
}

function checkNamedColors(files: string[]): number {
  let totalCount: number = 0;
  files.forEach((file: string) => {
    const content: string = readFileSync(file, "utf8");
    namedColors.forEach((color: string) => {
      const regex = new RegExp(`\\b${color}\\b`, "gi");
      const matches = content.match(regex);
      if (matches && matches.length > 0) {
        console.log(`Found ${matches.length} named color(s) '${color}' in: ${file}`);
        totalCount += matches.length;
      }
    });
  });
  return totalCount;
}

const cssFiles = walkCssFiles(stylesDir);
const namedColorCount = checkNamedColors(cssFiles);

if (namedColorCount > 0) {
  console.error(`Total named CSS colors found: ${namedColorCount}`);
  process.exit(1);
} else {
  console.log("No named CSS colors found.");
}
