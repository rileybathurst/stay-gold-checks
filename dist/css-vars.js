// check-css-vars.ts
// Script to check for usage of undefined CSS variables in styles folder
import fs from "node:fs";
import path from "node:path";
// Use CommonJS __dirname directly
if (!require.main || !require.main.filename) {
    throw new Error("Cannot determine __dirname: require.main or require.main.filename is undefined.");
}
const __dirname = path.dirname(require.main.filename);
const stylesDir = path.resolve(__dirname, "src/styles");
const variablesFile = path.join(stylesDir, "variables.css");
function getDefinedVars(file) {
    const content = fs.readFileSync(file, "utf8");
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
    const content = fs.readFileSync(file, "utf8");
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
    return fs
        .readdirSync(dir)
        .filter((f) => f.endsWith(".css") && f !== "variables.css")
        .map((f) => path.join(dir, f));
}
const definedVars = getDefinedVars(variablesFile);
const cssFiles = walkCssFiles(stylesDir);
let hasError = false;
cssFiles.forEach((file) => {
    const usedVars = getUsedVars(file);
    usedVars.forEach((v) => {
        if (!definedVars.has(v)) {
            console.error(`Undefined CSS variable --${v} used in ${path.basename(file)}`);
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
