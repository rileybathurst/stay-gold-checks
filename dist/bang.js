#!/usr/bin/env node
// check-for-bang.js
// Script to check for the string "// !" in project files and exit with error if found
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { walk } from "./walk.js";
const exts = [".js", ".ts", ".astro", ".css", ".tsx"];
const rootDir = resolve(process.cwd(), "src");
// const publicDir = resolve(process.cwd(), "public");
function checkFiles(files) {
    let found = false;
    files.forEach((file) => {
        const content = readFileSync(file, "utf8");
        if (content.includes("// !") ||
            content.includes("<!-- !") ||
            content.includes("/* !")) {
            console.error(`Forbidden string found in: ${file}`);
            found = true;
        }
    });
    return found;
}
const srcFiles = walk(rootDir, exts);
// const publicFiles = walk(publicDir, exts);
// const allFiles = srcFiles.concat(publicFiles);
if (checkFiles(srcFiles)) {
    // console.error(`Total ! found: ${namedStringCount}`);
    process.exit(1);
}
else {
    console.log("No forbidden string found.");
}
