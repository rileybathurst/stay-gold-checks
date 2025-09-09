// check-css-named-colors.ts
// Script to check for usage of named CSS colors in styles folder

import fs from "node:fs";
import path from "node:path";
import { namedColors } from "./named-colors.js";

const __dirname = path.resolve();
const stylesDir = path.resolve(__dirname, "src/styles");
const exts = [".css"];

// List of named CSS colors (partial, can be expanded)


function walkCssFiles(dir: string): string[] {
    return fs.readdirSync(dir)
        .filter((f: string) => exts.includes(path.extname(f)))
        .map((f: string) => path.join(dir, f));
}

function checkNamedColors(files: string[]): number {
    let totalCount = 0;
    files.forEach((file: string) => {
        const content: string = fs.readFileSync(file, "utf8");
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
