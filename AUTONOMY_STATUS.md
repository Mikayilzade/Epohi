# AUTONOMY STATUS — CURRENT

Updated: 2026-09-23 UTC.
State: PR_103_LOCAL_PC_FIRST / MOBILE_DEFERRED_NON_BLOCKING / DOC_POLICY_UPDATE_PENDING / NO_MERGE.

## Current scope
- Active work is existing PR #103 / branch `codex-qgq4u5`.
- Local development is now the primary workflow on the user's PC.
- Do not create another PR/branch for continuation work. Do not merge or close PR #103 without explicit user approval.
- `AGENTS.md` startup handshake remains mandatory: verify the exact PR/branch before edits.

## Project direction change — PC-first
The user explicitly chose:
- desktop PC as the primary development target;
- desktop Chrome/Chromium as the main browser target for ordinary development and manual playtesting;
- mobile support deferred and non-blocking for ordinary gameplay development;
- existing mobile code/tests preserved, not deleted;
- mobile-only failures should not stop PC feature work unless they expose a shared/runtime regression;
- performance should be measured before a large graphics/assets redesign;
- GitHub remains history/PR/CI/backup while day-to-day development and manual testing happen locally.

## Current PR #103 CI context
Latest authoritative focused run:
- Run #262 / `35634045850`
- Focused Chromium: green
- Focused WebKit: red in two `webkit-mobile` camera tests
- Full/soak jobs were skipped by classifier for that run

Those WebKit-mobile failures are retained as known test/platform issues. Under the new PC-first policy they are not automatically blockers for ordinary PC development. If future evidence shows the same root cause affects desktop Chromium/runtime, reclassify accordingly.

## Exact next action
Follow `CODEX_NEXT_TASK.md`: documentation/policy update only for the PC-first/mobile-deferred decision. Do not change gameplay code or continue WebKit-mobile stabilization in that task.

---

## Historical checkpoint
Previous PR #102 / CI v2 checkpoints are preserved in git history. Consult them only when a concrete investigation requires it.
