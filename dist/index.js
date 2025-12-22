#!/usr/bin/env node
// index.ts
// Main script to run all stay-gold checks in sequence
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
const filePath = path.dirname(fileURLToPath(import.meta.url));
console.log(filePath);
const checks = [
    { name: "Bang Check", script: path.join(filePath, "/bang.js") },
    { name: "TODO Check", script: path.join(filePath, "/todos.js") },
    { name: "CSS Variables Check", script: path.join(filePath, "/css-vars.js") },
    { name: "CSS Named Colors Check", script: path.join(filePath, "/css-named-colors.js") },
];
async function runCheck(script, name) {
    return new Promise((resolve) => {
        console.log(`\n--- Running ${name} ---`);
        const child = spawn("node", [script], {
            stdio: "inherit",
            cwd: process.cwd(),
        });
        child.on("close", (code) => {
            // Defer result logging to the caller so we can decide
            // whether a failure is blocking (Bang Check) or a warning.
            resolve(code === 0);
        });
    });
}
async function runAllChecks() {
    console.log("🚀 Running all Stay Gold checks...\n");
    let bangPassed = true;
    for (const check of checks) {
        const passed = await runCheck(check.script, check.name);
        if (passed) {
            console.log(`✅ ${check.name} passed`);
        }
        else {
            if (check.name === "Bang Check") {
                bangPassed = false;
                console.warn(`❌ ${check.name} failed (build will fail)`);
            }
            else {
                console.warn(`⚠️ ${check.name} failed (non-blocking)`);
            }
        }
    }
    console.log(`\n${"=".repeat(50)}`);
    if (bangPassed) {
        console.log("🎉 All blocking checks passed! Your code stays gold! ✨");
        process.exit(0);
    }
    else {
        console.log("💥 Bang Check failed. Please fix the issues above.");
        process.exit(1);
    }
}
runAllChecks().catch((error) => {
    console.error("Error running checks:", error);
    process.exit(1);
});
