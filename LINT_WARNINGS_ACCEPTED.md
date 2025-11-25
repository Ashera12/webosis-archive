# Accepted External Tool Warnings

This file documents the remaining non-critical warnings that appear in editor/tool scans but are considered safe and intentionally accepted.

## 1. GitHub Workflow Secret Context Warnings
Files: `.github/workflows/auto-runner.yml`, `.github/workflows/apply-sql.yml`

Warning Type: "Context access might be invalid" on expressions referencing `secrets.*` or `github.*` contexts.

Reason: The static linter cannot fully resolve runtime expressions available only during actual GitHub Actions execution. The workflows use standard, supported contexts; no insecure or deprecated patterns are present.

Action: Inline comments (`# lint-ignore: context valid during workflow runtime`) were added. No further change required.

## 2. Tailwind At-Rule Unknown Warnings
File: `app/globals.css`

Warning Type: Stylelint flags `@tailwind base;`, `@tailwind components;`, `@tailwind utilities;` as unknown at-rules in certain scans.

Reason: The stylelint configuration used by the external scan does not load Tailwind's custom at-rule definitions. We added `.stylelintrc.json` and a global disable comment block to prevent noise. Build/runtime is unaffected; Tailwind processes these correctly.

Action: Accepted. No functional impact. Retained disable comments to keep editor clean.

## 3. Transient Provider / Rate-Limit Fallback Logs
Location: `app/api/ai/vision/route.ts`

Behavior: Console warnings may appear when OpenAI rate limits trigger Gemini fallback. This is expected dynamic behavior, not a code error.

Action: Accepted. Logs help operational visibility; do not suppress unless verbosity becomes an issue in production.

---
## Policy
These warnings are monitored but not treated as blockers. If CI or deployment introduces stricter gates later, revisit with provider-specific plugins or custom lint rule adjustments.

Last Reviewed: 2025-11-21
