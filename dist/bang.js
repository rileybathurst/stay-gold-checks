#!/usr/bin/env node
// check-for-bang.js
// Script to check for the string "// !" in project files and exit with error if found
import { readdirSync, statSync, readFileSync } from "node:fs";
import { resolve, join, extname, dirname } from "node:path";
import { fileURLToPath } from "node:url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const exts = [".js", ".ts", ".astro", ".css", ".tsx"];
const rootDir = resolve(process.cwd(), "src");
const publicDir = resolve(process.cwd(), "public");
function walk(dir) {
    let results = [];
    const list = readdirSync(dir);
    list.forEach((file) => {
        const filePath = join(dir, file);
        const stat = statSync(filePath);
        if (stat === null || stat === void 0 ? void 0 : stat.isDirectory()) {
            results = results.concat(walk(filePath));
        }
        else if (exts.includes(extname(file))) {
            results.push(filePath);
        }
    });
    return results;
}
function checkFiles(files) {
    let found = false;
    files.forEach((file) => {
        const content = readFileSync(file, "utf8");
        if (content.includes("// !") ||
            content.includes("<!-- !") ||
            content.includes("{/* !")) {
            console.error(`Forbidden string found in: ${file}`);
            found = true;
        }
    });
    return found;
}
const srcFiles = walk(rootDir);
const publicFiles = walk(publicDir);
const allFiles = srcFiles.concat(publicFiles);
if (checkFiles(allFiles)) {
    process.exit(1);
}
else {
    console.log("No forbidden string found.");
}
