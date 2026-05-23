#!/usr/bin/env node

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { runGatsbyChecks } from "./gatsby-check.js";

enum FrameworkPrefix {
	Gatsby = "gatsby",
	Astro = "astro",
}

const packageJsonPath = resolve(process.cwd(), "package.json");
const prefixes: string[] = Object.values(FrameworkPrefix);

type PackageJson = {
	dependencies?: Record<string, string>;
	devDependencies?: Record<string, string>;
	scripts?: Record<string, string>;
};

function matchesPrefix(dependencyName: string, prefix: string): boolean {
	if (dependencyName.startsWith(prefix)) {
		return true;
	}

	if (dependencyName.startsWith("@")) {
		const withoutScope = dependencyName.slice(1);
		return withoutScope.startsWith(prefix);
	}

	return false;
}

function detectFramework(packageJson: PackageJson): FrameworkPrefix | null {
	const dependencies = packageJson.dependencies ?? {};
	const devDependencies = packageJson.devDependencies ?? {};
	const dependencyNames = [
		...Object.keys(dependencies),
		...Object.keys(devDependencies),
	];

	for (const prefix of prefixes) {
		if (
			dependencyNames.some((dependencyName) =>
				matchesPrefix(dependencyName, prefix),
			)
		) {
			return prefix as FrameworkPrefix;
		}
	}

	return null;
}

if (!existsSync(packageJsonPath)) {
	console.log("No package.json found.");
	process.exit(0);
}

let packageJson: PackageJson;

try {
	packageJson = JSON.parse(
		readFileSync(packageJsonPath, "utf8"),
	) as PackageJson;
} catch (error) {
	console.error(`Unable to parse package.json: ${String(error)}`);
	process.exit(1);
}

const detectedFramework = detectFramework(packageJson);

if (detectedFramework === null) {
	console.log(
		"No targeted framework dependency prefixes found in package.json.",
	);
	process.exit(0);
}

if (detectedFramework === FrameworkPrefix.Gatsby) {
	const gatsbyChecks = runGatsbyChecks(packageJson);
	const hasFailingCheck = gatsbyChecks.some((check) => !check.passed);

	gatsbyChecks.forEach((check) => {
		if (check.passed) {
			console.log(`Gatsby check passed: ${check.name}`);
		} else {
			console.error(`Gatsby check failed: ${check.name}. ${check.message}`);
		}
	});

	if (hasFailingCheck) {
		process.exit(1);
	}

	console.log("All Gatsby-specific package checks passed.");
	process.exit(0);
}

console.error(
	`Found dependency matching blocked prefixes (${prefixes.join(", ")}): ${detectedFramework}`,
);
process.exit(1);
