export type GatsbyPackageJson = {
	scripts?: Record<string, string>;
};

export type FrameworkCheckResult = {
	name: string;
	passed: boolean;
	message: string;
};

export function runGatsbyChecks(
	packageJson: GatsbyPackageJson,
): FrameworkCheckResult[] {
	const checks: FrameworkCheckResult[] = [];
	const startScript = packageJson.scripts?.start;

	if (typeof startScript !== "string") {
		checks.push({
			name: "Start script includes tsc --noEmit",
			passed: false,
			message: "scripts.start is missing from package.json.",
		});
	} else if (!startScript.includes("tsc --noEmit")) {
		checks.push({
			name: "Start script includes tsc --noEmit",
			passed: false,
			message: `scripts.start must include \"tsc --noEmit\". Found: ${startScript}`,
		});
	} else {
		checks.push({
			name: "Start script includes tsc --noEmit",
			passed: true,
			message: "scripts.start includes tsc --noEmit.",
		});
	}

	return checks;
}
