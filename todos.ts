// check-todo.ts
// Script to check for the string "TODO:" in project files and count occurrences

import fs from "node:fs";
import path from "node:path";

const exts = [".js", ".ts", ".astro", ".css", ".tsx"];
const mainFilename = require.main?.filename ?? __filename;
const __dirname = path.dirname(mainFilename);
const rootDir = path.resolve(__dirname, "src");
const publicDir = path.resolve(__dirname, "public");

function walk(dir: string): string[] {
    let results: string[] = [];
    const list: string[] = fs.readdirSync(dir);
    list.forEach((file: string) => {
        const filePath: string = path.join(dir, file);
        const stat: fs.Stats = fs.statSync(filePath);
        if (stat?.isDirectory()) {
        results = results.concat(walk(filePath));
        } else if (exts.includes(path.extname(file))) {
        results.push(filePath);
        }
    });
    return results;
}

function checkTodos(files: string[]): number {
    let totalCount = 0;
    files.forEach((file: string) => {
        const content: string = fs.readFileSync(file, "utf8");
        const matches = content.match(/TODO:/g);
        if (matches && matches.length > 0) {
        console.log(`Found ${matches.length} TODO(s) in: ${file}`);
        totalCount += matches.length;
        }
    });
    return totalCount;
}

const srcFiles = walk(rootDir);
const publicFiles = walk(publicDir);
const allFiles = srcFiles.concat(publicFiles);

const todoCount = checkTodos(allFiles);

if (todoCount > 0) {
    console.warn(`Total TODOs found: ${todoCount}`);
    process.exit(1);
} else {
    console.log("No TODOs found.");
}
