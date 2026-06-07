#!/usr/bin/env node
import pc from "picocolors";

// index.ts
// Main script to run all stay-gold checks in sequence

import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync, readFileSync } from "node:fs";

const filePath = path.dirname(fileURLToPath(import.meta.url));

const log = {
	info: (message: string): void => console.log(pc.cyan(message)),
	success: (message: string): void => console.log(pc.green(message)),
	warn: (message: string): void => console.warn(pc.yellow(message)),
	error: (message: string): void => console.error(pc.red(message)),
	headline: (message: string): void => console.log(pc.bold(pc.blue(message))),
	muted: (message: string): void => console.log(pc.dim(message)),
};

type CheckDefinition = {
	name: string;
	script: string;
	failsBuild?: boolean;
	requiresPath?: string;
	skip?: boolean;
};

type CheckOverride = {
	skip?: boolean;
	failsBuild?: boolean;
	requiresPath?: string | null;
};

type StayGoldConfig = {
	checks?: Record<string, CheckOverride>;
};

const baseChecks: CheckDefinition[] = [
	{
		name: "Bang Check",
		script: path.join(filePath, "/bang.js"),
		failsBuild: true,
	},
	{
		name: "TODO Check",
		script: path.join(filePath, "/todos.js"),
		failsBuild: false,
	},
	{
		name: "CSS Variables Check",
		script: path.join(filePath, "/css-vars.js"),
		requiresPath: "src/styles/variables.css",
		failsBuild: false,
	},
	{
		name: "CSS Named Colors Check",
		script: path.join(filePath, "/css-named-colors.js"),
		requiresPath: "src/styles",
	},
	{
		name: "CSS Variable Usage Check",
		script: path.join(filePath, "/css-variable-usage.js"),
		requiresPath: "src/styles/variables.css",
	},
	{
		name: "CSS Imports Check",
		script: path.join(filePath, "/css-imports.js"),
		requiresPath: "src/styles",
	},
	{
		name: "CSS Section Index Check",
		script: path.join(filePath, "/css-section-index.js"),
		requiresPath: "src/styles",
	},
	{
		name: "GraphQL Query Names Check",
		script: path.join(filePath, "/graphql-query-names.js"),
		failsBuild: true,
	},
	{
		name: "Package Framework Dependencies Check",
		script: path.join(filePath, "/package-json-framework-deps.js"),
		requiresPath: "package.json",
	},
];

function loadUserConfig(): StayGoldConfig {
	const configPath = path.join(process.cwd(), "stay-gold.json");

	if (!existsSync(configPath)) {
		return {};
	}

	try {
		const parsed = JSON.parse(readFileSync(configPath, "utf-8")) as unknown;
		if (
			typeof parsed !== "object" ||
			parsed === null ||
			("checks" in parsed &&
				(typeof (parsed as { checks?: unknown }).checks !== "object" ||
					(parsed as { checks?: unknown }).checks === null))
		) {
			log.warn(
				"stay-gold.json is invalid; expected an object with an optional checks map. Using defaults.",
			);
			return {};
		}

		log.muted("Using preferences from stay-gold.json");
		return parsed as StayGoldConfig;
	} catch (error) {
		log.warn(
			`Failed to parse stay-gold.json (${String(error)}). Using default checks.`,
		);
		return {};
	}
}

function resolveChecks(): CheckDefinition[] {
	const userConfig = loadUserConfig();

	return baseChecks.map((check) => {
		const override = userConfig.checks?.[check.name];
		if (!override) {
			return check;
		}

		const mergedCheck: CheckDefinition = { ...check };

		if (typeof override.skip === "boolean") {
			mergedCheck.skip = override.skip;
		}

		if (typeof override.failsBuild === "boolean") {
			mergedCheck.failsBuild = override.failsBuild;
		}

		if (typeof override.requiresPath === "string") {
			mergedCheck.requiresPath = override.requiresPath;
		}

		if (override.requiresPath === null) {
			delete mergedCheck.requiresPath;
		}

		return mergedCheck;
	});
}

async function runCheck(script: string, name: string): Promise<boolean> {
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

async function runAllChecks(): Promise<void> {
	log.headline("Running all Stay Gold checks...\n");
	const checks = resolveChecks();

	let blockingCheckFailed = false;

	for (const check of checks) {
		if (check.skip) {
			log.muted(`⏭️ ${check.name} skipped (disabled in stay-gold.json)`);
			continue;
		}

		if (
			check.requiresPath &&
			!existsSync(path.join(process.cwd(), check.requiresPath))
		) {
			log.muted(`⏭️ ${check.name} skipped (missing ${check.requiresPath})`);
			continue;
		}

		const passed = await runCheck(check.script, check.name);
		if (passed) {
			log.success(`✅ ${check.name} passed`);
		} else {
			if (check.failsBuild) {
				blockingCheckFailed = true;
				log.error(`❌ ${check.name} failed (build will fail)`);
			} else {
				log.warn(`⚠️ ${check.name} failed (non-blocking)`);
			}
		}
	}

	log.muted(`\n${"=".repeat(50)}`);

	if (!blockingCheckFailed) {
		log.success("🎉 All blocking checks passed! Your code stays gold! ✨");
		process.exit(0);
	} else {
		log.error(
			"💥 One or more blocking checks failed. Please fix the issues above.",
		);
		process.exit(1);
	}
}

runAllChecks().catch((error) => {
	log.error(`Error running checks: ${String(error)}`);
	process.exit(1);
});
