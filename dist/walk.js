import { readdirSync, statSync } from "node:fs";
import { extname, join } from "node:path";
function walk(dir, exts) {
    let results = [];
    const list = readdirSync(dir);
    list.forEach((file) => {
        const filePath = join(dir, file);
        const stat = statSync(filePath);
        if (stat === null || stat === void 0 ? void 0 : stat.isDirectory()) {
            results = results.concat(walk(filePath, exts));
        }
        else if (exts.includes(extname(file))) {
            results.push(filePath);
        }
    });
    return results;
}
export { walk };
