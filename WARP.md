# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

Stay Gold is a code quality tool that runs automated checks for JavaScript/TypeScript and CSS projects. It's designed to be used as a dev dependency in other projects, providing CLI tools to scan for:
- Forbidden patterns (bang comments like `// !`)
- TODO comments
- CSS variable usage validation
- Named CSS color usage

## Build and Development Commands

### Build
```bash
npm run build
```
Compiles TypeScript files to JavaScript in the `dist/` directory.

### Run Individual Checks
```bash
npm run find              # Check for forbidden patterns (bang comments)
npm run todos             # Find TODO comments
npm run variables         # Validate CSS variable usage
npm run named-colors      # Find named CSS colors
```

### Run All Checks
```bash
npm run gold
```
Runs all four checks in sequence and reports overall status.

## Architecture

### Core Concept
Each checker is a standalone TypeScript module that:
1. Walks through `src/` and `public/` directories
2. Filters files by extension (`.js`, `.ts`, `.astro`, `.css`, `.tsx`)
3. Performs content validation
4. Exits with code 1 if violations are found, 0 if clean

### Module Structure
- **bang.ts**: Searches for forbidden comment patterns (`// !`, `<!-- !`, `{/* !`)
- **todos.ts**: Counts and reports TODO comments
- **css-vars.ts**: Validates that all CSS variables used are defined in `variables.css`
- **css-named-colors.ts**: Detects usage of named CSS colors (uses `named-colors.ts` list)
- **index.ts**: Re-exports all modules for programmatic usage
- **named-colors.ts**: Contains comprehensive list of CSS named colors (150 colors)

### Expected Directory Structure in Target Projects
All checkers assume the consuming project has:
- `src/` directory for source code
- `public/` directory for public assets
- `src/styles/` directory for CSS files (css-vars and css-named-colors only)
- `src/styles/variables.css` file defining CSS variables (css-vars only)

### Binary Distribution
Each checker is exposed as a CLI command via npm bin:
- `stay-gold-find`
- `stay-gold-todos`
- `stay-gold-css-vars`
- `stay-gold-css-named-colors`

## Key Implementation Details

### File Walking Pattern
All checkers use a recursive `walk()` function that:
- Skips directories by recursing into them
- Collects files matching specific extensions
- Returns flat array of absolute file paths

### CSS Variable Validation Logic
The css-vars checker:
1. Parses `variables.css` to extract all defined variables (pattern: `--varname:`)
2. Scans other CSS files for variable usage (pattern: `var(--varname)`)
3. Reports any variables that are used but not defined

### Named Color Detection
Uses word boundary regex (`\b${color}\b`) to avoid false positives in variable names or hex codes.

## TypeScript Configuration

- **Target**: ES2019
- **Module**: NodeNext (ESM with CommonJS interop)
- **Strict mode**: Enabled
- Generates declaration files (`.d.ts`) for type support
