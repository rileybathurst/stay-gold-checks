#!/usr/bin/env node

// check-css-vars.ts
// Script to check for usage of undefined CSS variables in styles folder


import { readFileSync, readdirSync } from "node:fs";
import { resolve, join, basename } from "node:path";

const stylesDir = resolve(process.cwd(), "src/styles");
const variablesFile = join(stylesDir, "variables.css");

function getDefinedVars(file: string): Set<string> {
  const content: string = readFileSync(file, "utf8");
  const varRegex: RegExp = /--([\w-]+):/g;
  const vars: Set<string> = new Set();
  let match: RegExpExecArray | null = varRegex.exec(content);
  while (match !== null) {
    vars.add(match[1]);
    match = varRegex.exec(content);
  }
  return vars;
}

function getUsedVars(file: string): Set<string> {
  const content: string = readFileSync(file, "utf8");
  const useRegex: RegExp = /var\(--([\w-]+)\)/g;
  const used: Set<string> = new Set();
  let match: RegExpExecArray | null = useRegex.exec(content);
  while (match !== null) {
    used.add(match[1]);
    match = useRegex.exec(content);
  }
  return used;
}

function walkCssFiles(dir: string): string[] {
  return readdirSync(dir)
    .filter((f: string) => f.endsWith(".css") && f !== "variables.css")
    .map((f: string) => join(dir, f));
}

const definedVars = getDefinedVars(variablesFile);
const cssFiles = walkCssFiles(stylesDir);
let hasError: boolean = false;

cssFiles.forEach((file) => {
  const usedVars = getUsedVars(file);
  usedVars.forEach((v) => {
    if (!definedVars.has(v)) {
      console.error(
        `Undefined CSS variable --${v} used in ${basename(file)}`,
      );
      hasError = true;
    }
  });
});

if (hasError) {
  process.exit(1);
} else {
  console.log("All CSS variables used are defined.");
}
