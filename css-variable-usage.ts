#!/usr/bin/env node

// css-variable-usage.ts
// Script to check for hardcoded CSS values that should use defined CSS variables

import { readFileSync, readdirSync } from "node:fs";
import { resolve, join, basename } from "node:path";

const stylesDir = resolve(process.cwd(), "src/styles");
const variablesFile = join(stylesDir, "variables.css");

function getDefinedVarValues(file: string): Map<string, string> {
	const content = readFileSync(file, "utf8");
	const varRegex = /--([\w-]+):\s*([^;]+);/g;
	const vars = new Map<string, string>();
	let match: RegExpExecArray | null = varRegex.exec(content);
	while (match !== null) {
		vars.set(match[1], match[2].trim());
		match = varRegex.exec(content);
	}
	return vars;
}

function checkHardcodedValues(
	file: string,
	varValues: Map<string, string>,
): number {
	const content = readFileSync(file, "utf8");
	let errorCount = 0;

	// Match CSS declarations after { or ; (handles both inline and multiline rules)
	const propRegex = /[{;]\s*(?!--)([a-zA-Z][\w-]*):\s*([^;{}]+);/g;

	let match: RegExpExecArray | null = propRegex.exec(content);
	while (match !== null) {
		const propValue = match[2].trim();

		if (!propValue.includes("var(")) {
			for (const [varName, varValue] of varValues) {
				if (propValue === varValue) {
					console.error(
						`Hardcoded value '${propValue}' in ${basename(file)} should use var(--${varName})`,
					);
					errorCount++;
					break;
				}
			}
		}

		match = propRegex.exec(content);
	}

	return errorCount;
}

function walkCssFiles(dir: string): string[] {
	return readdirSync(dir)
		.filter((f: string) => f.endsWith(".css") && f !== "variables.css")
		.map((f: string) => join(dir, f));
}

const varValues = getDefinedVarValues(variablesFile);
const cssFiles = walkCssFiles(stylesDir);
let totalErrors = 0;

cssFiles.forEach((file) => {
	totalErrors += checkHardcodedValues(file, varValues);
});

if (totalErrors > 0) {
	console.error(
		`Total hardcoded CSS values that should use variables: ${totalErrors}`,
	);
	process.exit(1);
} else {
	console.log("All CSS values correctly use variables where available.");
}
