"use strict";
// check-todo.ts
// Script to check for the string "TODO:" in project files and count occurrences
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const exts = [".js", ".ts", ".astro", ".css", ".tsx"];
const rootDir = node_path_1.default.resolve(new URL(".", import.meta.url).pathname, "src");
const publicDir = node_path_1.default.resolve(new URL(".", import.meta.url).pathname, "public");
function walk(dir) {
    let results = [];
    const list = node_fs_1.default.readdirSync(dir);
    list.forEach((file) => {
        const filePath = node_path_1.default.join(dir, file);
        const stat = node_fs_1.default.statSync(filePath);
        if (stat === null || stat === void 0 ? void 0 : stat.isDirectory()) {
            results = results.concat(walk(filePath));
        }
        else if (exts.includes(node_path_1.default.extname(file))) {
            results.push(filePath);
        }
    });
    return results;
}
function checkTodos(files) {
    let totalCount = 0;
    files.forEach((file) => {
        const content = node_fs_1.default.readFileSync(file, "utf8");
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
}
else {
    console.log("No TODOs found.");
}
