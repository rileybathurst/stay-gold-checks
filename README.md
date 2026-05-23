# Stay Gold

Stay Gold is a set of automated checks and balances for code quality, focusing on JavaScript/TypeScript and CSS projects. It helps maintain code standards by scanning for forbidden patterns, TODOs, CSS variable usage, and named CSS colors.

## Preferences

You can customize how checks run in your project by creating a `stay-gold.json` file in your project root.

Example:

```json
{
  "checks": {
    "TODO Check": {
      "skip": true,
      "failsBuild": false
    },
    "CSS Variables Check": {
      "requiresPath": "src/styles/theme-vars.css"
    }
  }
}
```

Supported options per check name:

- `skip`: `true` to skip a check.
- `failsBuild`: `true` to make a failing check block the build.
- `requiresPath`: override the file/folder path that must exist before the check runs.
- `requiresPath: null`: remove the path requirement entirely for that check.
