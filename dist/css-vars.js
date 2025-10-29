"use strict";
// check-css-vars.ts
// Script to check for usage of undefined CSS variables in styles folder
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const url_1 = require("url");
const stylesDir = path_1.default.resolve(path_1.default.dirname((0, url_1.fileURLToPath)(import.meta.url)), "src/styles");
const variablesFile = path_1.default.join(stylesDir, "variables.css");
function getDefinedVars(file) {
    const content = fs_1.default.readFileSync(file, "utf8");
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
    const content = fs_1.default.readFileSync(file, "utf8");
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
    return fs_1.default
        .readdirSync(dir)
        .filter((f) => f.endsWith(".css") && f !== "variables.css")
        .map((f) => path_1.default.join(dir, f));
}
const definedVars = getDefinedVars(variablesFile);
const cssFiles = walkCssFiles(stylesDir);
let hasError = false;
cssFiles.forEach((file) => {
    const usedVars = getUsedVars(file);
    usedVars.forEach((v) => {
        if (!definedVars.has(v)) {
            console.error(`Undefined CSS variable --${v} used in ${path_1.default.basename(file)}`);
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
