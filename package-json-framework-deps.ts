#!/usr/bin/env node

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

enum FrameworkPrefix {
	Gatsby = "gatsby",
	Astro = "astro",
}

const packageJsonPath = resolve(process.cwd(), "package.json");
const prefixes: string[] = Object.values(FrameworkPrefix);

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

function findMatchingDependencies(
	dependencies: Record<string, string>,
): string[] {
	return Object.keys(dependencies).filter((dependencyName) =>
		prefixes.some((prefix) => matchesPrefix(dependencyName, prefix)),
	);
}

if (!existsSync(packageJsonPath)) {
	console.log("No package.json found.");
	process.exit(0);
}

let packageJson: { dependencies?: Record<string, string> };

try {
	packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8")) as {
		dependencies?: Record<string, string>;
	};
} catch (error) {
	console.error(`Unable to parse package.json: ${String(error)}`);
	process.exit(1);
}

const dependencies = packageJson.dependencies ?? {};
const matches = findMatchingDependencies(dependencies);

if (matches.length > 0) {
	matches.forEach((dependencyName) => {
		console.error(
			`Found dependency matching blocked prefixes (${prefixes.join(", ")}): ${dependencyName}`,
		);
	});
	process.exit(1);
}

console.log("No blocked framework dependency prefixes found in package.json.");
