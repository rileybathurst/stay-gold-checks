#!/usr/bin/env node

// index.ts
// Main script to run all stay-gold checks in sequence

import { spawn } from "node:child_process";

const checks = [
	{ name: "Bang Check", script: "./dist/bang.js" },
	{ name: "TODO Check", script: "./dist/todos.js" },
	{ name: "CSS Variables Check", script: "./dist/css-vars.js" },
	{ name: "CSS Named Colors Check", script: "./dist/css-named-colors.js" },
];

async function runCheck(script: string, name: string): Promise<boolean> {
	return new Promise((resolve) => {
		console.log(`\n--- Running ${name} ---`);
		const child = spawn("node", [script], {
			stdio: "inherit",
			cwd: process.cwd(),
		});

		child.on("close", (code) => {
			if (code === 0) {
				console.log(`✅ ${name} passed`);
				resolve(true);
			} else {
				console.log(`❌ ${name} failed`);
				resolve(false);
			}
		});
	});
}

async function runAllChecks(): Promise<void> {
	console.log("🚀 Running all Stay Gold checks...\n");

	let allPassed = true;

	for (const check of checks) {
		const passed = await runCheck(check.script, check.name);
		if (!passed) {
			allPassed = false;
		}
	}

	console.log("\n" + "=".repeat(50));

	if (allPassed) {
		console.log("🎉 All checks passed! Your code stays gold! ✨");
		process.exit(0);
	} else {
		console.log("💥 Some checks failed. Please fix the issues above.");
		process.exit(1);
	}
}

runAllChecks().catch((error) => {
	console.error("Error running checks:", error);
	process.exit(1);
});
