// check-for-bang.js
// Script to check for the string "// !" in project files and exit with error if found

import fs from "node:fs";
import path from "node:path";

const exts = [".js", ".ts", ".astro", ".css", ".tsx"];
// Use CommonJS __dirname directly
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

function checkFiles(files: string[]): boolean {
  let found: boolean = false;
  files.forEach((file: string) => {
    const content: string = fs.readFileSync(file, "utf8");
    if (
      content.includes("// !") ||
      content.includes("<!-- !") ||
      content.includes("{/* !")
    ) {
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
} else {
  console.log("No forbidden string found.");
}
