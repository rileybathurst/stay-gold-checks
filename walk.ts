import { readdirSync, statSync } from "node:fs";
import { extname, join } from "node:path";

function walk(dir: string, exts: string[]): string[] {
	let results: string[] = [];
	const list: string[] = readdirSync(dir);
	list.forEach((file: string) => {
		const filePath: string = join(dir, file);
		const stat = statSync(filePath);
		if (stat?.isDirectory()) {
			results = results.concat(walk(filePath, exts));
		} else if (exts.includes(extname(file))) {
			results.push(filePath);
		}
	});
	return results;
}

export { walk };
