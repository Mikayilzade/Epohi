# CODEX NEXT TASK

## Current state
Gate G recovery for `Mikayilzade/Epohi` is published directly in existing PR #91 / branch `codex-tgmou0` because the Codex cloud environment cannot fetch GitHub (`CONNECT tunnel failed, response 403`).

Do not start another Codex implementation attempt while that infrastructure blocker remains. Do not create another PR/branch, retarget PRs, or merge.

## Source of truth
Read the top checkpoint of `AUTONOMY_STATUS.md` and the current PR #91 head/diff. The permanent CI entry point is `.github/workflows/playwright.yml`; the old temporary branch workflow is intentionally removed.

## Next task
1. Observe the GitHub Actions run for the current PR #91 head.
2. Require all permanent Gate G jobs to be green:
   - focused Chromium + WebKit;
   - full non-soak Chromium + WebKit;
   - long Chromium autonomous soak (5 deterministic seeds × 150 turns, or legitimate outcome);
   - representative WebKit autonomous soak.
3. On a failure, inspect the exact failing job/log and distinguish product/test/CI causes before changing anything.
4. Make only the minimal evidence-based fix in existing `codex-tgmou0`, then require the affected permanent matrix to rerun green.
5. After the final green head, perform an independent complete diff review and prepare an immutable GitHub link pinned to that exact SHA.
6. Only then may the external status be set to `READY_FOR_FINAL_DEVICE_TEST`; Mikayil performs one final iPhone test.

## Safety
No merge, no replacement PR/branch, no force update, no final-device request before green CI + independent diff review + immutable exact-SHA link.
