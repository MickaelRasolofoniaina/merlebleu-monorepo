---
name: learn-branch
description: Use this skill when the user asks to learn from the current branch, or to get a learning guide about the new concepts and libraries introduced in a branch (e.g. "learn-branch", "explique-moi les nouveautés de cette branche", "what's new in this branch to learn"). Scans the code added or modified in the branch, lists new libraries and concepts, and writes a Markdown learning guide in docs/learning/.
---

Generate a learning guide (in French) about the new concepts and libraries introduced by the current branch, and write it to `docs/learning/<branch-slug>.md`.

This skill takes one optional argument: the branch to analyze. If none is given, use the current branch (`git branch --show-current`).

## Steps

1. **Resolve the branch** from the arguments, or `git branch --show-current`.
   - If the branch is `develop` or `main`, stop and report that there is nothing to learn from a base branch.
2. **Sync refs**: `git fetch origin develop`.
3. **Collect the changes**:
   - Committed changes: `git diff --name-only origin/develop...HEAD` (three-dot diff against the merge-base).
   - Uncommitted changes: `git status --porcelain` (include untracked `??` files and folders).
   - Ignore lockfiles (`package-lock.json`), generated files, binary assets, and anything under `.claude/` unless the user asks for it.
4. **Detect new libraries**:
   - Diff each `package.json` (root, `packages/merlebleu-api`, `packages/merlebleu-app`, `packages/merlebleu-shared`) against `origin/develop` and list dependencies and devDependencies that were added, with their versions.
   - For each new library, grep the changed files for its imports to find where it is used.
5. **Detect new concepts**: read the added or modified files and identify patterns that are not yet used on `origin/develop`. Confirm novelty with `git grep <pattern> origin/develop -- <path>`. Examples: Angular signals, `resource`, `computed`, new guards or interceptors, new control flow syntax; NestJS guards, interceptors, gateways or SSE, TypeORM query builder, Zod DTOs; TypeScript generics, mapped or conditional types, discriminated unions; RxJS operators; SQL aggregations; design patterns.
   - A concept is new when it is absent from `origin/develop`, not merely new to the author.
   - Skip trivial items and anything already present on `origin/develop`.
6. **For each item** (library or concept), prepare a section containing:
   - **Où** : the `file:line` locations in the branch.
   - **Code** : a minimal excerpt copied from the real files, with short comments added in French.
   - **Fonctionnement** : a step-by-step explanation, the mental model, and the lifecycle when relevant.
   - **Documentation officielle** : a link to the official documentation. Verify the link with WebSearch or WebFetch before writing it. Never invent a URL.
   - **Pourquoi ce choix** : why this approach was chosen here, the alternatives that were not chosen, and the trade-offs. Stay consistent with `docs/angular.md`, `docs/nestjs.md`, and `docs/shared.md` when they apply.
   - **Défi** : 2 to 4 exercises (comprehension, small code change, "what happens if…"), followed by the answers inside a collapsed `<details>` block.
7. **Write the file** `docs/learning/<branch-slug>.md`, where `<branch-slug>` is the branch name with `/` replaced by `-`. Create `docs/learning/` if it is missing. Structure:
   - Title, and a summary (branch, date, commits ahead of `develop`).
   - Table of contents.
   - List of new libraries.
   - List of new concepts.
   - One section per item, as described in step 6.
   - A final synthesis challenge that combines several items.
   - If the file already exists, regenerate it in full so it reflects the current state of the branch.
8. **Report** to the user: the path of the generated file, and the list of detected libraries and concepts. If nothing new was detected, say so and do not create a file.

## Rules

- The learning content is written in French. Code, identifiers, file names, and commit messages stay in English, following the repo naming convention.
- Code excerpts come from the real files in the branch. Never invent code.
- Links point only to official documentation, and each one must have been verified.
- Do not commit, push, or modify any source file. The only write allowed is the learning Markdown file.
- Do not list trivial items or concepts already used on `origin/develop`.
- Keep the guide focused: prefer a few well-explained items over an exhaustive list.
