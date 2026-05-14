#!/usr/bin/env node
import pc from "picocolors";
// index.ts
// Main script to run all stay-gold checks in sequence
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync } from "node:fs";
const filePath = path.dirname(fileURLToPath(import.meta.url));
const log = {
    info: (message) => console.log(pc.cyan(message)),
    success: (message) => console.log(pc.green(message)),
    warn: (message) => console.warn(pc.yellow(message)),
    error: (message) => console.error(pc.red(message)),
    headline: (message) => console.log(pc.bold(pc.blue(message))),
    muted: (message) => console.log(pc.dim(message)),
};
const variablesCssPath = path.join(process.cwd(), "src/styles/variables.css");
const hasVariablesCss = existsSync(variablesCssPath);
const checks = [
    { name: "Bang Check", script: path.join(filePath, "/bang.js") },
    { name: "TODO Check", script: path.join(filePath, "/todos.js") },
    {
        name: "CSS Variables Check",
        script: path.join(filePath, "/css-vars.js"),
        requiresVariablesCss: true,
    },
    {
        name: "CSS Named Colors Check",
        script: path.join(filePath, "/css-named-colors.js"),
    },
];
async function runCheck(script, name) {
    return new Promise((resolve) => {
        const sectionTitle = `${pc.bold(name)} ${pc.dim(`(${path.basename(script)})`)}`;
        log.headline(`\n--- Running ${sectionTitle} ---`);
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
    log.headline("Running all Stay Gold checks...\n");
    let bangPassed = true;
    for (const check of checks) {
        if (check.requiresVariablesCss && !hasVariablesCss) {
            log.warn(`⚠️ ${check.name} skipped (missing src/styles/variables.css)`);
            continue;
        }
        const passed = await runCheck(check.script, check.name);
        if (passed) {
            log.success(`✅ ${check.name} passed`);
        }
        else {
            if (check.name === "Bang Check") {
                bangPassed = false;
                log.error(`❌ ${check.name} failed (build will fail)`);
            }
            else {
                log.warn(`⚠️ ${check.name} failed (non-blocking)`);
            }
        }
    }
    log.muted(`\n${"=".repeat(50)}`);
    if (bangPassed) {
        log.success("🎉 All blocking checks passed! Your code stays gold! ✨");
        process.exit(0);
    }
    else {
        log.error("💥 Bang Check failed. Please fix the issues above.");
        process.exit(1);
    }
}
runAllChecks().catch((error) => {
    log.error(`Error running checks: ${String(error)}`);
    process.exit(1);
});
