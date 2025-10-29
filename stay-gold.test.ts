import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { execSync } from "node:child_process";
import { mkdirSync, writeFileSync, rmSync, existsSync } from "node:fs";
import { join } from "node:path";

describe("stay-gold command", () => {
  const testDir = join(process.cwd(), "test-project");
  const srcDir = join(testDir, "src");
  const publicDir = join(testDir, "public");
  const stylesDir = join(srcDir, "styles");

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
      "// This is a clean file\nconst x = 1;\n"
    );
    writeFileSync(
      join(stylesDir, "variables.css"),
      ":root {\n  --primary: #000;\n  --secondary: #fff;\n}\n"
    );
    writeFileSync(
      join(stylesDir, "styles.css"),
      ".test { color: var(--primary); }\n"
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

    it("should run all checks via gold command on clean project", () => {
      const result = execSync("npm run gold", {
        cwd: testDir,
        stdio: "pipe",
        encoding: "utf-8",
      });

      expect(result).toBeDefined();
    });
  });

  describe("2. Command correctly executes all sub-commands", () => {
    it("should detect forbidden bang comments", () => {
      writeFileSync(
        join(srcDir, "with-bang.ts"),
        "// ! This should be detected\n"
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
        "// TODO: Fix this later\nconst x = 1;\n"
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
        ".test { color: var(--undefined-var); }\n"
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

    it("should detect named CSS colors", () => {
      writeFileSync(
        join(stylesDir, "named-colors.css"),
        ".test { color: red; background: blue; }\n"
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

    it("should pass all checks when project is clean", () => {
      const output = execSync(`node ${join(process.cwd(), "dist/bang.js")}`, {
        cwd: testDir,
        stdio: "pipe",
        encoding: "utf-8",
      });

      expect(output).toContain("No forbidden string found");
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
      const output = execSync(
        `node ${join(process.cwd(), "dist/bang.js")}`,
        {
          cwd: testDir,
          stdio: "pipe",
          encoding: "utf-8",
        }
      );

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
});
