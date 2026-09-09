# AUTONOMY STATUS — CURRENT

Updated: 2026-09-09 UTC.
State: GATE_G_RECOVERY / NOT_READY_FOR_FINAL_DEVICE_TEST.

## Known-good base
- PR #90 branch: `codex/work-on-existing-pr-and-follow-instructions`.
- PR #90 SHA `2ac5522965db8bab8372632cbdd76f935f5ebd25` is known green: focused Chromium 60/60, focused WebKit 60/60, full Chromium 185/185, full WebKit 185/185.

## Current recovery PR
- PR #91 branch: `codex-tgmou0`.
- PR #91 is based on PR #90.
- Original PR #91 head before instruction-file updates: `25b6030320e193399f80527f95e87c00bc9e5bbe`.
- At that point GitHub contained only `package-lock.json`; the rest of the previously prepared Gate G local changes were not published.
- A later Codex workspace did not contain those local Gate G changes and could not fetch `codex-tgmou0` because its environment returned `CONNECT tunnel failed, response 403`.

## Gate G target
Recover the previously prepared Gate G without redesigning it:
- permanent Playwright GitHub Actions workflow;
- autonomous soak test;
- the related helper changes;
- the related status/checkpoint updates;
- the lockfile already present in PR #91.

## Safety / acceptance
- Work only in existing PR #91 / branch `codex-tgmou0`.
- Do not create another PR or branch and do not merge.
- Do not claim missing local changes still exist; reconstruct only from the earlier Gate G work/task context and repository evidence.
- After publication, verify the complete changed-file list and exact head SHA.
- Permanent CI must exercise focused, full, and soak coverage required by Gate G.
- `READY_FOR_FINAL_DEVICE_TEST` is forbidden until: CI is green, the final diff has an independent review, and an immutable link to the exact tested SHA is prepared.
- Only then may Mikayil perform the single final iPhone test.

## Exact next step
Read `CODEX_NEXT_TASK.md` and execute it. If GitHub/network access again prevents safe recovery or push to `codex-tgmou0`, stop and report the blocker; do not create replacement branches/PRs.
