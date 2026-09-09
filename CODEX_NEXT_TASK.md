# CODEX NEXT TASK

Continue existing PR #90 only; PR #89 is the base. Read the current checkpoint in `AUTONOMY_STATUS.md`.

NEXT: rerun `tests/runtime-invalidation.spec.js` + `tests/humans-outcomes.spec.js` in Chromium/WebKit for the canonical outcome-control cleanup, then let the PR #90 push workflow run the full gate. Fix real failures and run `QUALITY_GATES.md`. Do not merge, create another PR, or request phone testing before `READY_FOR_FINAL_DEVICE_TEST`.
