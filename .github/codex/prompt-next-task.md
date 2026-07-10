# Prompt: take next queued task

Repository: Mikayilzade/Epohi.

Work from the latest `main`.

Read:

```text
.github/codex/task-queue.md
```

Take only the first unchecked task:

```md
- [ ] ...
```

Do not take any later task.

## Branch and PR

Create one new branch.

Branch naming convention:

```text
codex/queue-<short-task-name>
```

Create one Draft Pull Request into `main`.

Do not merge automatically.

## Scope

Follow the selected task exactly.

If the selected task says docs-only, do not change runtime files.

If the selected task says refactor-only, do not change game behavior.

If the selected task says tests-only, do not change runtime behavior unless the task explicitly allows it.

If the selected task is ambiguous, stop and explain what is unclear.

## Required PR description

The Draft PR description must include:

* selected queue task title;
* motivation;
* summary of changes;
* changed files;
* checks run;
* test count if tests were listed;
* GitHub Actions result if available;
* any deviation from expected files.

## Safety rules

Do not change visible game version unless the selected task explicitly asks for it.

Do not change gameplay mechanics unless the selected task explicitly asks for it.

Do not change save format unless the selected task explicitly asks for it.

Do not change service worker cache unless runtime files are added or changed.

Do not create more than one PR.

Do not mark the queue task as completed unless the task itself asks for that.

Do not start the next task.

## Standard checks

When runtime JavaScript files are changed, run:

```bash
node --check src/config.js
node --check src/data.js
node --check src/utils.js
node --check src/storage.js
node --check src/save-utils.js
node --check src/camera-storage.js
node --check src/camera.js
node --check src/selectors.js
node --check src/app.js
node --check sw.js
npm run test:smoke -- --list
npm run test:smoke
git diff --check
```

When only Markdown/docs files are changed, run:

```bash
git diff --check
```

## Final report

After creating the Draft PR, report:

* PR number;
* branch;
* commit SHA;
* changed files;
* checks run;
* test result;
* whether GitHub Actions is green, red, pending, or not applicable.
