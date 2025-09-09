"use strict";
// check-css-named-colors.ts
// Script to check for usage of named CSS colors in styles folder
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const named_colors_ts_1 = require("./named-colors.ts");
const stylesDir = node_path_1.default.resolve(new URL(".", import.meta.url).pathname, "src/styles");
const exts = [".css"];
// List of named CSS colors (partial, can be expanded)
function walkCssFiles(dir) {
    return node_fs_1.default.readdirSync(dir)
        .filter((f) => exts.includes(node_path_1.default.extname(f)))
        .map((f) => node_path_1.default.join(dir, f));
}
function checkNamedColors(files) {
    let totalCount = 0;
    files.forEach((file) => {
        const content = node_fs_1.default.readFileSync(file, "utf8");
        named_colors_ts_1.namedColors.forEach((color) => {
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
}
else {
    console.log("No named CSS colors found.");
}
