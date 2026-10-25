---
name: create-pr
description: Use this skill when the user asks to create, open, or submit a pull request (PR) to merge a branch into develop — e.g. "crée une PR", "ouvre une PR vers develop", "create a PR for this branch". Builds a French title and a change list from git history grouped by area (INTERFACE WEB, API) and, when `.claude/` config changed, by Claude configuration type (SKILLS, COMMANDS, AGENTS, SETTINGS, ...), then runs `gh pr create`.
---

Create a GitHub pull request targeting `develop` for a given branch, with a standardized French title and body.

This skill takes one optional argument: the name of the branch to merge into `develop`. If no branch is given in the free-form arguments passed to this skill, use the current branch (`git branch --show-current`).

## Steps

1. **Resolve the source branch** from the arguments passed to this skill, or `git branch --show-current` if none were given.
2. **Guard rails** (check before any network/push action):
   - If the resolved branch is `develop`, stop — nothing to merge into itself.
   - If the resolved branch is `main`, ask for explicit confirmation before continuing.
3. **Check the working tree**: run `git status --porcelain`. If there are uncommitted changes, warn that only commits will be included in the PR and ask for confirmation before proceeding.
4. **Sync refs**: `git fetch origin develop <branch>`.
5. **Ensure the branch is pushed**: compare the local branch tip to `origin/<branch>`. Push it (`git push -u origin <branch>` for a first push, `git push` otherwise) if needed — no extra confirmation beyond the `main` check in step 2.
6. **Compute the commit range**: `git log --oneline origin/develop..<branch>`. If empty, stop and report that there are no commits ahead of `develop`.
7. **Compute the file-level diff**: `git diff --stat origin/develop...<branch>` and `git diff --name-only origin/develop...<branch>` (three-dot diff, against the merge-base with `develop`, so changes landed on `develop` after the branch diverged are not included).
8. **Classify every changed file**:
   - `packages/merlebleu-app/**` → INTERFACE WEB
   - `packages/merlebleu-api/**` → API
   - `packages/merlebleu-shared/**` → API by default (shared DTOs/types are almost always driven by an API contract), unless the diff clearly shows a UI-only concern
   - `.claude/skills/**` → SKILLS
   - `.claude/commands/**` → COMMANDS
   - `.claude/agents/**` → AGENTS
   - `.claude/settings*.json` → SETTINGS
   - any other path under `.claude/**` not covered above → CLAUDE
   - Files outside these groups (docs, CI, lockfiles, root config) → omit from the list
9. **Build the exhaustive change list**, grouped by area: don't just copy commit subjects verbatim (they're terse, English, conventional-commit style like `feature(order): ...` / `fix(order): ...`). Group commits by the real deliverable they represent and write each line in French, house style: "Ajout de…", "Gestion de…", "Correction de…", "Mise à jour de…". Collapse multiple incremental commits for the same feature into one line rather than listing every intermediate commit. Each `.claude/**` group (SKILLS, COMMANDS, AGENTS, SETTINGS, CLAUDE) is listed separately from INTERFACE WEB/API — never fold a Claude config change into the app/API lists just because it shipped in the same commit.
10. **Decide the title**:
    - If the commit range contains at least one `feature(...)` commit, write a short French summary of the feature, no prefix (e.g. "Gestion des rôles").
    - If the commit range contains only `fix(...)`/`chore(...)`/etc. commits (no `feature(...)`), the title must start with "Correction" (e.g. "Correction de la commande en doublon").
    - Style: short (roughly 4-8 words), first word capitalized, no trailing period, no branch name or ticket noise.
11. **Print the drafted title and body to the console before creating anything.**
12. **Create the PR** via the Bash tool, using a heredoc for the multi-line body:
    ```bash
    gh pr create --base develop --head <branch> --title "<title>" --body "$(cat <<'EOF'
    INTERFACE WEB
    1. ...
    API
    1. ...
    SKILLS
    1. ...
    COMMANDS
    1. ...
    EOF
    )"
    ```
    Omit any section with no entries. Keep INTERFACE WEB and API first (in that order, when present), followed by the `.claude/**` groups (SKILLS, COMMANDS, AGENTS, SETTINGS, CLAUDE) in whatever order they appear with changes.
13. **Report the PR URL** printed by `gh pr create`.
14. If `gh pr create` fails because a PR already exists for that branch, surface the error and suggest `gh pr view <branch>` instead of retrying.

## Rules

- Always target `develop` as the base — never `main`. A `develop → main` release flow is a separate, out-of-scope workflow.
- If the source branch is `main`, ask for explicit confirmation before doing anything.
- Never force-push to bring the branch up to date.
- Never skip hooks (`--no-verify`) when pushing.
- Never open an empty PR — if there are no commits ahead of `develop`, stop and report.
- If uncommitted local changes exist, warn and confirm before proceeding.
- Always print the drafted title/body before calling `gh pr create`.
- Title and body are written in French.
- If a PR already exists for the branch, report its URL instead of attempting to create a duplicate.

## Prerequisite

Requires the `gh` CLI installed and authenticated. If `gh pr create` fails unexpectedly, suggest running `gh auth status`.
