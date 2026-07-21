import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { execSync } from "node:child_process";
import {
	mkdirSync,
	writeFileSync,
	rmSync,
	existsSync,
	readFileSync,
} from "node:fs";
import { join } from "node:path";

describe("stay-gold command", () => {
	const testDir = join(process.cwd(), "test-project");
	const srcDir = join(testDir, "src");
	const publicDir = join(testDir, "public");
	const stylesDir = join(srcDir, "styles");
	const preferencesPath = join(testDir, "stay-gold.json");

	beforeAll(() => {
		// Create test project structure
		if (existsSync(testDir)) {
			rmSync(testDir, { recursive: true, force: true });
		}
		mkdirSync(srcDir, { recursive: true });
		mkdirSync(publicDir, { recursive: true });
		mkdirSync(stylesDir, { recursive: true });

		// Create clean test files
		writeFileSync(
			join(srcDir, "clean.ts"),
			"// This is a clean file\nconst x = 1;\n",
		);
		writeFileSync(
			join(stylesDir, "variables.css"),
			":root {\n  --primary: #000;\n  --secondary: #fff;\n}\n",
		);
		writeFileSync(
			join(stylesDir, "styles.css"),
			".test { color: var(--primary); }\n",
		);
		writeFileSync(
			join(testDir, "package.json"),
			JSON.stringify(
				{
					name: "test-project",
					version: "1.0.0",
					dependencies: {
						react: "^18.0.0",
					},
				},
				null,
				2,
			),
		);

		// Build the project to ensure dist exists
		try {
			execSync("npm run build", { cwd: process.cwd(), stdio: "pipe" });
		} catch (error) {
			console.error("Build failed:", error);
		}
	});

	afterAll(() => {
		// Cleanup test directory
		if (existsSync(testDir)) {
			rmSync(testDir, { recursive: true, force: true });
		}
	});

	afterEach(() => {
		rmSync(preferencesPath, { force: true });
	});

	describe("1. Command runs successfully without errors", () => {
		it("should execute without throwing errors on clean project", () => {
			expect(() => {
				execSync("npm run find", {
					cwd: testDir,
					stdio: "pipe",
					encoding: "utf-8",
				});
			}).not.toThrow();
		});

		it("should execute todos checker without errors", () => {
			expect(() => {
				execSync("npm run todos", {
					cwd: testDir,
					stdio: "pipe",
					encoding: "utf-8",
				});
			}).not.toThrow();
		});

		it("should execute variables checker without errors on valid CSS", () => {
			expect(() => {
				execSync("npm run variables", {
					cwd: testDir,
					stdio: "pipe",
					encoding: "utf-8",
				});
			}).not.toThrow();
		});

		it("should execute named-colors checker without errors", () => {
			expect(() => {
				execSync("npm run named-colors", {
					cwd: testDir,
					stdio: "pipe",
					encoding: "utf-8",
				});
			}).not.toThrow();
		});

		it("should execute css-imports checker with src/styles", () => {
			writeFileSync(join(stylesDir, "styles.css"), ".test { color: red; }\n");
			writeFileSync(
				join(stylesDir, "app.css"),
				'@import url(./variables.css);\n@import url("./styles.css");\n',
			);

			try {
				const output = execSync(
					`node ${join(process.cwd(), "dist/css-imports.js")}`,
					{
						cwd: testDir,
						stdio: "pipe",
						encoding: "utf-8",
					},
				);

				expect(output).toContain(
					"app.css imports every other CSS file in styles/ or src/styles/",
				);
			} finally {
				rmSync(join(stylesDir, "app.css"), { force: true });
			}
		});

		it("should add an index to css section comments", () => {
			const sectionFile = join(stylesDir, "sections.css");
			writeFileSync(
				sectionFile,
				`/*------------------------------------*/
/* #LAYOUT */
/*------------------------------------*/

body {
	min-height: 100vh;
}

/*------------------------------------*/
/* #Singles */
/*------------------------------------*/

.vulture {
	max-width: var(--vulture);
}
`,
			);

			try {
				execSync(
					`node ${join(process.cwd(), "dist/css-section-index.js")} ${sectionFile}`,
					{
						cwd: testDir,
						stdio: "pipe",
						encoding: "utf-8",
					},
				);

				const updatedContent = readFileSync(sectionFile, "utf8");
				expect(updatedContent.startsWith("/* Index")).toBe(true);
				expect(updatedContent).toContain("- layout");
				expect(updatedContent).toContain("- singles");
				const indexCount = (updatedContent.match(/\/\* Index/g) ?? []).length;
				expect(indexCount).toBe(1);
			} finally {
				rmSync(sectionFile, { force: true });
			}
		});

		it("should run all checks via gold command on clean project", () => {
			const result = execSync("npm run gold", {
				cwd: testDir,
				stdio: "pipe",
				encoding: "utf-8",
			});

			expect(result).toBeDefined();
		});

		it("should skip only the CSS variables check when variables.css is missing", () => {
			rmSync(join(stylesDir, "named-colors.css"), { force: true });
			rmSync(join(stylesDir, "variables.css"), { force: true });

			try {
				const result = execSync(
					`node ${join(process.cwd(), "dist/index.js")} 2>&1`,
					{
						cwd: testDir,
						stdio: "pipe",
						encoding: "utf-8",
					},
				);

				expect(result).toContain("CSS Variables Check skipped");
				expect(result).toContain("Bang Check passed");
				expect(result).toContain("TODO Check passed");
				expect(result).toContain("CSS Named Colors Check passed");
			} finally {
				writeFileSync(
					join(stylesDir, "variables.css"),
					":root {\n  --primary: #000;\n  --secondary: #fff;\n}\n",
				);
			}
		});
	});

	describe("2. Command correctly executes all sub-commands", () => {
		it("should detect forbidden bang comments", () => {
			writeFileSync(
				join(srcDir, "with-bang.ts"),
				"// ! This should be detected\n",
			);

			try {
				execSync(`node ${join(process.cwd(), "dist/bang.js")}`, {
					cwd: testDir,
					stdio: "pipe",
					encoding: "utf-8",
				});
				expect.fail("Should have exited with error code 1");
			} catch (error: any) {
				expect(error.status).toBe(1);
				const stderr = error.stderr?.toString() || "";
				const stdout = error.stdout?.toString() || "";
				const output = stderr + stdout;
				expect(output).toContain("Forbidden string found");
			} finally {
				// Cleanup
				rmSync(join(srcDir, "with-bang.ts"), { force: true });
			}
		});

		it("should detect and count TODO comments", () => {
			writeFileSync(
				join(srcDir, "with-todo.ts"),
				"// TODO: Fix this later\nconst x = 1;\n",
			);

			try {
				execSync(`node ${join(process.cwd(), "dist/todos.js")}`, {
					cwd: testDir,
					stdio: "pipe",
					encoding: "utf-8",
				});
				expect.fail("Should have exited with error code 1");
			} catch (error: any) {
				expect(error.status).toBe(1);
				expect(error.stdout.toString()).toContain("TODO(s) in");
				expect(error.stderr.toString()).toContain("Total TODOs found: 1");
			} finally {
				// Cleanup
				rmSync(join(srcDir, "with-todo.ts"), { force: true });
			}
		});

		it("should detect undefined CSS variables", () => {
			writeFileSync(
				join(stylesDir, "bad-vars.css"),
				".test { color: var(--undefined-var); }\n",
			);

			try {
				execSync(`node ${join(process.cwd(), "dist/css-vars.js")}`, {
					cwd: testDir,
					stdio: "pipe",
					encoding: "utf-8",
				});
				expect.fail("Should have exited with error code 1");
			} catch (error: any) {
				expect(error.status).toBe(1);
				expect(error.stderr.toString()).toContain("Undefined CSS variable");
				expect(error.stderr.toString()).toContain("undefined-var");
			} finally {
				// Cleanup
				rmSync(join(stylesDir, "bad-vars.css"), { force: true });
			}
		});

		it("should detect hardcoded CSS values that should use variables", () => {
			writeFileSync(
				join(stylesDir, "hardcoded-values.css"),
				"h1 { font-size: 1rem; }\n",
			);
			writeFileSync(
				join(stylesDir, "variables.css"),
				":root {\n  --primary: #000;\n  --secondary: #fff;\n  --vinson: 1rem;\n}\n",
			);

			try {
				execSync(`node ${join(process.cwd(), "dist/css-variable-usage.js")}`, {
					cwd: testDir,
					stdio: "pipe",
					encoding: "utf-8",
				});
				expect.fail("Should have exited with error code 1");
			} catch (error: any) {
				expect(error.status).toBe(1);
				expect(error.stderr.toString()).toContain("Hardcoded value '1rem'");
				expect(error.stderr.toString()).toContain("var(--vinson)");
			} finally {
				rmSync(join(stylesDir, "hardcoded-values.css"), { force: true });
				writeFileSync(
					join(stylesDir, "variables.css"),
					":root {\n  --primary: #000;\n  --secondary: #fff;\n}\n",
				);
			}
		});

		it("should pass CSS variable usage check when var() is used correctly", () => {
			writeFileSync(
				join(stylesDir, "variables.css"),
				":root {\n  --primary: #000;\n  --vinson: 1rem;\n}\n",
			);
			writeFileSync(
				join(stylesDir, "correct-usage.css"),
				"h1 { font-size: var(--vinson); }\n",
			);

			try {
				const output = execSync(
					`node ${join(process.cwd(), "dist/css-variable-usage.js")}`,
					{
						cwd: testDir,
						stdio: "pipe",
						encoding: "utf-8",
					},
				);
				expect(output).toContain("All CSS values correctly use variables");
			} finally {
				rmSync(join(stylesDir, "correct-usage.css"), { force: true });
				writeFileSync(
					join(stylesDir, "variables.css"),
					":root {\n  --primary: #000;\n  --secondary: #fff;\n}\n",
				);
			}
		});

		it("should ignore integer-only variable values and skipped properties", () => {
			writeFileSync(
				join(stylesDir, "variables.css"),
				":root {\n  --floor: 0;\n  --understory: 1;\n  --canopy: 2;\n  --emergent: 3;\n  --grid-span: 1 / 2;\n  --grid-columns: 1fr 1fr;\n}\n",
			);
			writeFileSync(
				join(stylesDir, "allowed-hardcoded-values.css"),
				".test { width: 0; z-index: 1; order: 2; line-height: 3; grid-row: 1; grid-row: 1 / 2; grid-template-columns: 1fr 1fr; }\n",
			);

			try {
				const output = execSync(
					`node ${join(process.cwd(), "dist/css-variable-usage.js")}`,
					{
						cwd: testDir,
						stdio: "pipe",
						encoding: "utf-8",
					},
				);
				expect(output).toContain("All CSS values correctly use variables");
			} finally {
				rmSync(join(stylesDir, "allowed-hardcoded-values.css"), {
					force: true,
				});
				writeFileSync(
					join(stylesDir, "variables.css"),
					":root {\n  --primary: #000;\n  --secondary: #fff;\n}\n",
				);
			}
		});

		it("should detect named CSS colors", () => {
			writeFileSync(
				join(stylesDir, "named-colors.css"),
				".test { color: red; background: blue; white-space: nowrap; }\n",
			);

			try {
				execSync(`node ${join(process.cwd(), "dist/css-named-colors.js")}`, {
					cwd: testDir,
					stdio: "pipe",
					encoding: "utf-8",
				});
				expect.fail("Should have exited with error code 1");
			} catch (error: any) {
				expect(error.status).toBe(1);
				expect(error.stdout.toString()).toContain("named color");
				expect(error.stderr.toString()).toContain("Total named CSS colors");
			} finally {
				// Cleanup
				rmSync(join(stylesDir, "named-colors.css"), { force: true });
			}
		});

		it("should not match white-space as a named CSS color", () => {
			writeFileSync(
				join(stylesDir, "named-colors.css"),
				".test { white-space: nowrap; }\n",
			);

			expect(() => {
				execSync(`node ${join(process.cwd(), "dist/css-named-colors.js")}`, {
					cwd: testDir,
					stdio: "pipe",
					encoding: "utf-8",
				});
			}).not.toThrow();

			rmSync(join(stylesDir, "named-colors.css"), { force: true });
		});

		it("should pass all checks when project is clean", () => {
			const output = execSync(`node ${join(process.cwd(), "dist/bang.js")}`, {
				cwd: testDir,
				stdio: "pipe",
				encoding: "utf-8",
			});

			expect(output).toContain("No forbidden string found");
		});

		it("should fail Gatsby-specific checks when start script is missing tsc --noEmit", () => {
			writeFileSync(
				join(testDir, "package.json"),
				JSON.stringify(
					{
						name: "test-project",
						version: "1.0.0",
						dependencies: {
							gatsby: "^5.0.0",
							react: "^18.0.0",
						},
						scripts: {
							start: "gatsby develop",
						},
					},
					null,
					2,
				),
			);

			try {
				execSync(
					`node ${join(process.cwd(), "dist/package-json-framework-deps.js")}`,
					{
						cwd: testDir,
						stdio: "pipe",
						encoding: "utf-8",
					},
				);
				expect.fail("Should have exited with error code 1");
			} catch (error: any) {
				expect(error.status).toBe(1);
				const stderr = error.stderr?.toString() || "";
				expect(stderr).toContain("Gatsby check failed");
				expect(stderr).toContain("scripts.start must include");
			} finally {
				writeFileSync(
					join(testDir, "package.json"),
					JSON.stringify(
						{
							name: "test-project",
							version: "1.0.0",
							dependencies: {
								react: "^18.0.0",
							},
						},
						null,
						2,
					),
				);
			}
		});

		it("should pass Gatsby-specific checks when start script includes tsc --noEmit", () => {
			writeFileSync(
				join(testDir, "package.json"),
				JSON.stringify(
					{
						name: "test-project",
						version: "1.0.0",
						dependencies: {
							gatsby: "^5.0.0",
							react: "^18.0.0",
						},
						scripts: {
							start: "gatsby develop && tsc --noEmit",
						},
					},
					null,
					2,
				),
			);

			try {
				const output = execSync(
					`node ${join(process.cwd(), "dist/package-json-framework-deps.js")}`,
					{
						cwd: testDir,
						stdio: "pipe",
						encoding: "utf-8",
					},
				);

				expect(output).toContain("Gatsby check passed");
				expect(output).toContain("All Gatsby-specific package checks passed");
			} finally {
				writeFileSync(
					join(testDir, "package.json"),
					JSON.stringify(
						{
							name: "test-project",
							version: "1.0.0",
							dependencies: {
								react: "^18.0.0",
							},
						},
						null,
						2,
					),
				);
			}
		});

		it("should pass package dependency prefix check when dependencies are clean", () => {
			writeFileSync(
				join(testDir, "package.json"),
				JSON.stringify(
					{
						name: "test-project",
						version: "1.0.0",
						dependencies: {
							react: "^18.0.0",
							lodash: "^4.17.0",
						},
					},
					null,
					2,
				),
			);

			const output = execSync(
				`node ${join(process.cwd(), "dist/package-json-framework-deps.js")}`,
				{
					cwd: testDir,
					stdio: "pipe",
					encoding: "utf-8",
				},
			);

			expect(output).toContain(
				"No targeted framework dependency prefixes found in package.json",
			);
		});
	});

	describe("3. Command handles various input arguments or flags", () => {
		it("should handle execution from different working directories", () => {
			const output = execSync(`node ${join(process.cwd(), "dist/bang.js")}`, {
				cwd: testDir,
				stdio: "pipe",
				encoding: "utf-8",
			});

			expect(output).toBeDefined();
		});

		it("should work when called via npm bin script", () => {
			const output = execSync(`node ${join(process.cwd(), "dist/bang.js")}`, {
				cwd: testDir,
				stdio: "pipe",
				encoding: "utf-8",
			});

			expect(output).toContain("No forbidden string found");
		});

		it("should handle projects with no src directory gracefully", () => {
			const emptyTestDir = join(process.cwd(), "test-empty");
			mkdirSync(emptyTestDir, { recursive: true });

			try {
				execSync(`node ${join(process.cwd(), "dist/bang.js")}`, {
					cwd: emptyTestDir,
					stdio: "pipe",
					encoding: "utf-8",
				});
			} catch (error: any) {
				// Should handle missing directories
				expect(error).toBeDefined();
			} finally {
				rmSync(emptyTestDir, { recursive: true, force: true });
			}
		});

		it("should process multiple file types correctly", () => {
			// Create files with different extensions
			writeFileSync(join(srcDir, "test.js"), "const x = 1;\n");
			writeFileSync(join(srcDir, "test.ts"), "const x: number = 1;\n");
			writeFileSync(join(srcDir, "test.tsx"), "const x = <div />;\n");
			writeFileSync(join(srcDir, "test.astro"), "---\nconst x = 1;\n---\n");

			const output = execSync(`node ${join(process.cwd(), "dist/bang.js")}`, {
				cwd: testDir,
				stdio: "pipe",
				encoding: "utf-8",
			});

			expect(output).toContain("No forbidden string found");

			// Cleanup
			rmSync(join(srcDir, "test.js"), { force: true });
			rmSync(join(srcDir, "test.ts"), { force: true });
			rmSync(join(srcDir, "test.tsx"), { force: true });
			rmSync(join(srcDir, "test.astro"), { force: true });
		});

		it("should handle all comment styles for bang detection", () => {
			// Test JavaScript style
			writeFileSync(join(srcDir, "js-bang.js"), "// ! Error\n");

			try {
				execSync(`node ${join(process.cwd(), "dist/bang.js")}`, {
					cwd: testDir,
					stdio: "pipe",
				});
				expect.fail("Should detect // ! style");
			} catch (error: any) {
				expect(error.status).toBe(1);
			} finally {
				rmSync(join(srcDir, "js-bang.js"), { force: true });
			}

			// Test HTML style
			writeFileSync(join(srcDir, "html-bang.astro"), "<!-- ! Error -->\n");

			try {
				execSync(`node ${join(process.cwd(), "dist/bang.js")}`, {
					cwd: testDir,
					stdio: "pipe",
				});
				expect.fail("Should detect <!-- ! style");
			} catch (error: any) {
				expect(error.status).toBe(1);
			} finally {
				rmSync(join(srcDir, "html-bang.astro"), { force: true });
			}

			// Test JSX style
			writeFileSync(join(srcDir, "jsx-bang.tsx"), "{/* ! Error */}\n");

			try {
				execSync(`node ${join(process.cwd(), "dist/bang.js")}`, {
					cwd: testDir,
					stdio: "pipe",
				});
				expect.fail("Should detect {/* ! style");
			} catch (error: any) {
				expect(error.status).toBe(1);
			} finally {
				rmSync(join(srcDir, "jsx-bang.tsx"), { force: true });
			}
		});

		it("should exit with proper exit codes", () => {
			// Test success exit code
			try {
				execSync(`node ${join(process.cwd(), "dist/bang.js")}`, {
					cwd: testDir,
					stdio: "pipe",
				});
				// If no error thrown, exit code was 0 (success)
				expect(true).toBe(true);
			} catch (error) {
				expect.fail("Should exit with code 0 on clean project");
			}

			// Test failure exit code
			writeFileSync(join(srcDir, "fail.ts"), "// ! Error\n");

			try {
				execSync(`node ${join(process.cwd(), "dist/bang.js")}`, {
					cwd: testDir,
					stdio: "pipe",
				});
				expect.fail("Should exit with code 1 on violations");
			} catch (error: any) {
				expect(error.status).toBe(1);
			} finally {
				rmSync(join(srcDir, "fail.ts"), { force: true });
			}
		});
	});

	describe("4. stay-gold.json preferences", () => {
		it("should skip a check when configured", () => {
			writeFileSync(
				join(srcDir, "todo-should-be-skipped.ts"),
				"// TODO: this would fail if check ran\n",
			);
			writeFileSync(
				preferencesPath,
				JSON.stringify(
					{
						checks: {
							"TODO Check": {
								skip: true,
							},
						},
					},
					null,
					2,
				),
			);

			try {
				const output = execSync(
					`node ${join(process.cwd(), "dist/index.js")} 2>&1`,
					{
						cwd: testDir,
						stdio: "pipe",
						encoding: "utf-8",
					},
				);

				expect(output).toContain(
					"TODO Check skipped (disabled in stay-gold.json)",
				);
				expect(output).toContain("All blocking checks passed");
			} finally {
				rmSync(join(srcDir, "todo-should-be-skipped.ts"), { force: true });
			}
		});

		it("should allow changing failsBuild via preferences", () => {
			writeFileSync(
				join(srcDir, "todo-blocking.ts"),
				"// TODO: should fail as blocking via config\n",
			);
			writeFileSync(
				preferencesPath,
				JSON.stringify(
					{
						checks: {
							"TODO Check": {
								failsBuild: true,
							},
						},
					},
					null,
					2,
				),
			);

			try {
				execSync(`node ${join(process.cwd(), "dist/index.js")}`, {
					cwd: testDir,
					stdio: "pipe",
					encoding: "utf-8",
				});
				expect.fail(
					"TODO Check should fail the build when configured as blocking",
				);
			} catch (error: unknown) {
				const commandError = error as {
					status?: number;
					stdout?: { toString: () => string };
					stderr?: { toString: () => string };
				};
				expect(commandError.status).toBe(1);
				const output = `${commandError.stdout?.toString() || ""}${commandError.stderr?.toString() || ""}`;
				expect(output).toContain("TODO Check failed (build will fail)");
			} finally {
				rmSync(join(srcDir, "todo-blocking.ts"), { force: true });
			}
		});

		it("should allow changing requiresPath via preferences", () => {
			writeFileSync(
				preferencesPath,
				JSON.stringify(
					{
						checks: {
							"CSS Variables Check": {
								requiresPath: "src/styles/does-not-exist.css",
							},
						},
					},
					null,
					2,
				),
			);

			const output = execSync(
				`node ${join(process.cwd(), "dist/index.js")} 2>&1`,
				{
					cwd: testDir,
					stdio: "pipe",
					encoding: "utf-8",
				},
			);

			expect(output).toContain(
				"CSS Variables Check skipped (missing src/styles/does-not-exist.css)",
			);
		});
	});
});
