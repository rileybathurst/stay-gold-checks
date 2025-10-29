#!/usr/bin/env node
// check-css-vars.ts
// Script to check for usage of undefined CSS variables in styles folder
import { readFileSync, readdirSync } from "node:fs";
import { resolve, join, basename } from "node:path";
const stylesDir = resolve(process.cwd(), "src/styles");
const variablesFile = join(stylesDir, "variables.css");
function getDefinedVars(file) {
    const content = readFileSync(file, "utf8");
    const varRegex = /--([\w-]+):/g;
    const vars = new Set();
    let match = varRegex.exec(content);
    while (match !== null) {
        vars.add(match[1]);
        match = varRegex.exec(content);
    }
    return vars;
}
function getUsedVars(file) {
    const content = readFileSync(file, "utf8");
    const useRegex = /var\(--([\w-]+)\)/g;
    const used = new Set();
    let match = useRegex.exec(content);
    while (match !== null) {
        used.add(match[1]);
        match = useRegex.exec(content);
    }
    return used;
}
function walkCssFiles(dir) {
    return readdirSync(dir)
        .filter((f) => f.endsWith(".css") && f !== "variables.css")
        .map((f) => join(dir, f));
}
const definedVars = getDefinedVars(variablesFile);
const cssFiles = walkCssFiles(stylesDir);
let hasError = false;
cssFiles.forEach((file) => {
    const usedVars = getUsedVars(file);
    usedVars.forEach((v) => {
        if (!definedVars.has(v)) {
            console.error(`Undefined CSS variable --${v} used in ${basename(file)}`);
            hasError = true;
        }
    });
});
if (hasError) {
    process.exit(1);
}
else {
    console.log("All CSS variables used are defined.");
}
