// check-todo.ts
// Script to check for the string "TODO:" in project files and count occurrences
var _a, _b;
import fs from "node:fs";
import path from "node:path";
const exts = [".js", ".ts", ".astro", ".css", ".tsx"];
const mainFilename = (_b = (_a = require.main) === null || _a === void 0 ? void 0 : _a.filename) !== null && _b !== void 0 ? _b : __filename;
const __dirname = path.dirname(mainFilename);
const rootDir = path.resolve(__dirname, "src");
const publicDir = path.resolve(__dirname, "public");
function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach((file) => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat === null || stat === void 0 ? void 0 : stat.isDirectory()) {
            results = results.concat(walk(filePath));
        }
        else if (exts.includes(path.extname(file))) {
            results.push(filePath);
        }
    });
    return results;
}
function checkTodos(files) {
    let totalCount = 0;
    files.forEach((file) => {
        const content = fs.readFileSync(file, "utf8");
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
