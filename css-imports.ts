#!/usr/bin/env node
import pc from "picocolors";

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { extname, join, normalize, relative, resolve } from "node:path";

function resolveStylesDir(): string | null {
	const stylesDirCandidates = [
		resolve(process.cwd(), "styles"),
		resolve(process.cwd(), "src/styles"),
	];

	for (const candidate of stylesDirCandidates) {
		if (existsSync(candidate)) {
			return candidate;
		}
	}

	return null;
}

const stylesDir = resolveStylesDir();

if (stylesDir === null) {
	console.error(
		pc.yellow("Missing styles directory at styles/ or src/styles/"),
	);
	process.exit(1);
}

const resolvedStylesDir = stylesDir;

const appCssFile = join(resolvedStylesDir, "app.css");

function walkCssFiles(dir: string): string[] {
	let results: string[] = [];
	const entries = readdirSync(dir);

	for (const entry of entries) {
		const filePath = join(dir, entry);
		const stat = statSync(filePath);

		if (stat.isDirectory()) {
			results = results.concat(walkCssFiles(filePath));
			continue;
		}

		if (extname(entry) === ".css") {
			results.push(filePath);
		}
	}

	return results;
}

function getImportedCssFiles(appCssPath: string): Set<string> {
	const content = readFileSync(appCssPath, "utf8");
	const imported = new Set<string>();

	const importRegex = /@import\s+(?:url\()?\s*['"]([^'")]+)['"]\s*\)?[^;]*;/g;

	let match = importRegex.exec(content);
	while (match !== null) {
		const importTarget = match[1];

		if (
			importTarget.startsWith("http://") ||
			importTarget.startsWith("https://")
		) {
			match = importRegex.exec(content);
			continue;
		}

		const resolvedPath = normalize(resolve(resolvedStylesDir, importTarget));
		imported.add(resolvedPath);
		match = importRegex.exec(content);
	}

	return imported;
}

if (!existsSync(appCssFile)) {
	console.error(
		pc.yellow("Missing app.css at styles/app.css or src/styles/app.css"),
	);
	process.exit(1);
}

const allCssFiles = walkCssFiles(resolvedStylesDir);
const importedFiles = getImportedCssFiles(appCssFile);

const missingImports = allCssFiles
	.filter((filePath) => normalize(filePath) !== normalize(appCssFile))
	.filter((filePath) => !importedFiles.has(normalize(filePath)));

if (missingImports.length > 0) {
	console.error(
		pc.red(
			"The following CSS file(s) are not imported by app.css in styles/ or src/styles/:",
		),
	);
	for (const filePath of missingImports) {
		console.error(pc.red(`- ${relative(resolvedStylesDir, filePath)}`));
	}
	process.exit(1);
}

console.log(
	pc.green("app.css imports every other CSS file in styles/ or src/styles/"),
);
