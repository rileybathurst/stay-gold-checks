#!/usr/bin/env node

import {
	existsSync,
	readFileSync,
	readdirSync,
	statSync,
	writeFileSync,
} from "node:fs";
import { extname, join, relative, resolve } from "node:path";

const ignoredDirectories = new Set([
	".git",
	"dist",
	"node_modules",
	"coverage",
]);

function walkCssFiles(targetPath: string): string[] {
	if (!existsSync(targetPath)) {
		return [];
	}

	const stats = statSync(targetPath);
	if (stats.isFile()) {
		return extname(targetPath) === ".css" ? [targetPath] : [];
	}

	let results: string[] = [];
	for (const entry of readdirSync(targetPath)) {
		if (ignoredDirectories.has(entry)) {
			continue;
		}

		const filePath = join(targetPath, entry);
		const entryStats = statSync(filePath);

		if (entryStats.isDirectory()) {
			results = results.concat(walkCssFiles(filePath));
			continue;
		}

		if (extname(entry) === ".css") {
			results.push(filePath);
		}
	}

	return results;
}

function normalizeTitle(title: string): string {
	return title.replace(/^#\s*/, "").trim().toLowerCase();
}

function isDividerLine(line: string): boolean {
	return /^[-*\s]+$/.test(line);
}

function extractTitleFromComment(comment: string): string | null {
	const lines = comment
		.replace(/^\/\*+/, "")
		.replace(/\*+\/$/, "")
		.split(/\r?\n/)
		.map((line) => line.replace(/^\s*\*\s?/, "").trim())
		.filter(Boolean);

	if (lines.length === 0) {
		return null;
	}

	if (lines.length === 1) {
		const singleLineTitle = lines[0].match(/^#\s*(.+)$/);
		return singleLineTitle ? normalizeTitle(singleLineTitle[1]) : null;
	}

	const titleLine = lines.find((line) => /^#\s*/.test(line));
	if (!titleLine) {
		return null;
	}

	const dividerLines = lines.filter((line) => line !== titleLine);
	if (!dividerLines.every(isDividerLine)) {
		return null;
	}

	return normalizeTitle(titleLine);
}

function extractSectionTitles(content: string): string[] {
	const titles: string[] = [];
	const comments = content.match(/\/\*[\s\S]*?\*\//g) ?? [];

	for (const comment of comments) {
		const title = extractTitleFromComment(comment);
		if (title) {
			titles.push(title);
		}
	}

	return [...new Set(titles)];
}

function buildIndexBlock(titles: string[]): string {
	if (titles.length === 0) {
		return "";
	}

	return `/* Index\n${titles.map((title) => `- ${title}`).join("\n")}\n*/\n\n`;
}

function removeExistingIndexBlock(content: string): string {
	return content.replace(/^\s*\/\*\s*Index\s*\n[\s\S]*?\*\/\s*/, "");
}

function addIndexToContent(content: string, titles: string[]): string {
	const withoutExistingIndex = removeExistingIndexBlock(content).replace(
		/^\uFEFF/,
		"",
	);
	return `${buildIndexBlock(titles)}${withoutExistingIndex}`;
}

function processCssFile(filePath: string): boolean {
	const content = readFileSync(filePath, "utf8");
	const titles = extractSectionTitles(content);

	if (titles.length === 0) {
		return false;
	}

	const updatedContent = addIndexToContent(content, titles);
	if (updatedContent !== content) {
		writeFileSync(filePath, updatedContent);
	}

	console.log(`Indexed ${relative(process.cwd(), filePath)}`);
	return true;
}

const targets = process.argv.slice(2).filter((arg) => !arg.startsWith("--"));
const searchRoots =
	targets.length > 0
		? targets.map((target) => resolve(process.cwd(), target))
		: [process.cwd()];

const cssFiles = searchRoots.flatMap((root) => walkCssFiles(root));

if (cssFiles.length === 0) {
	console.log("No CSS files with indexable section comments were found.");
	process.exit(0);
}

let updatedCount = 0;
for (const filePath of cssFiles) {
	if (processCssFile(filePath)) {
		updatedCount++;
	}
}

if (updatedCount === 0) {
	console.log("No section titles were found.");
}
