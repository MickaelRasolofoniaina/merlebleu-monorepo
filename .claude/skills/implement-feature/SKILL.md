---
name: implement-feature
description: Use this skill when the user asks to implement, build, or add a new feature/functionality in this repo (e.g. "implement notifications", "add a role management feature"), especially when multiple independent features need to progress in parallel. Creates an isolated git worktree on a feature/<name> branch cut from develop, assigns dedicated backend/frontend ports so it can run alongside other features' instances, implements the change following repo conventions, and finishes with a live E2E smoke test in a new Chrome tab.
---

Implement a new feature in its own isolated git worktree, branched from `develop`, with dedicated backend/frontend ports so it can run side by side with other features being worked on in parallel — then verify it live in a new Chrome tab.

This skill takes one argument: a short description or name of the feature to implement (e.g. "notifications", "role management"). Derive an English kebab-case slug from it.

## Steps

### 1. Derive the branch name and worktree path

- Derive a short English kebab-case slug from the feature description (e.g. "notifications" → `notification`, "gestion des rôles" → `role`).
- Branch: `feature/<slug>`. Worktree path: `../merlebleu-monorepo-<slug>` (sibling directory of the main repo).
- Announce the branch name and worktree path before creating anything.

### 2. Create the isolated worktree from develop

```bash
git fetch origin develop
git worktree add ../merlebleu-monorepo-<slug> -b feature/<slug> develop
```

- If `feature/<slug>` or the worktree path already exists, stop and ask the user how to proceed — never overwrite or reuse silently.
- From inside the new worktree: `npm install`, then `npm run build:shared`.
- Every following step runs **inside this worktree**, never in the main repo directory — this is what lets several features be implemented in parallel without one blocking the other.

### 3. Allocate dedicated ports for this feature

- Compute a deterministic offset from the slug (sum of character codes mod 50), e.g.:
  - `apiPort = 3000 + offset`
  - `appPort = 4200 + offset`
- Write `<worktree>/.env.local` with `PORT=<apiPort>` and `APP_PORT=<appPort>` so the choice survives if the session resumes later (`.env.local` is already gitignored).
- Edit `packages/merlebleu-app/src/environments/environment.ts` **inside this worktree only**: set `apiBaseUrl: 'http://localhost:<apiPort>'`.
- Immediately run `git update-index --skip-worktree packages/merlebleu-app/src/environments/environment.ts` so this local override is never staged or committed by mistake. The whole worktree is disposable at the end, so there is nothing to "un-skip".

### 4. Start backend and frontend in the background

- Backend: from the worktree, `PORT=<apiPort> npm run start:dev -w @merlebleu/api` (background process).
- Frontend: from the worktree, `npm start -w @merlebleu/ui -- --port <appPort>` (background process).
- If a log shows `EADDRINUSE`, bump the affected port by 1, update `.env.local`/`environment.ts` accordingly, and retry (up to 5 times).
- The Postgres database is shared across all worktrees/features — there is no DB-level isolation. If another feature is changing the schema at the same time, flag this to the user instead of silently risking a migration conflict.

### 5. Implement the feature

- Use TaskCreate to track implementation steps.
- Follow this repo's conventions (see CLAUDE.md): shared types/DTOs live in `@merlebleu/shared` (run `npm run generate:barrels` after adding exports), `nestjs-zod` for API validation, feature modules organized by domain (`src/features/{identity,inventory,sale}` in the API, `src/app/features/...` in the app), English-only naming everywhere.
- Run relevant lint/unit tests as you go, scoped to the worktree.

### 6. E2E smoke test in a new Chrome tab

- Load the `claude-in-chrome` tools via `ToolSearch` if not already loaded (core set + `read_console_messages`).
- Open a **new tab** with `tabs_create_mcp` pointed at `http://localhost:<appPort>` — never reuse an existing tab, and never point at another feature's port.
- Exercise the feature's golden path plus at least one edge case; check the console for errors with `read_console_messages`.
- If the API changed, also run `npm run test:e2e -w @merlebleu/api` from the worktree.
- Because each feature has its own port and tab, several features' E2E checks can run concurrently without interfering with each other.
- Report the result to the user. Leave the dev servers running and the tab open unless asked to stop them.

## Rules

- Never implement two features in the same worktree/directory.
- Always branch from `develop` — never from `main` or another feature branch.
- Never reuse or overwrite an existing worktree or `feature/*` branch without explicit confirmation.
- Never `git push` automatically.
- Always use a new Chrome tab per feature, never an existing or shared tab.
- Never let two features share the same port — if a collision is detected, reassign rather than killing the other feature's process.
- When a feature is done (merged or abandoned), offer to run `git worktree remove ../merlebleu-monorepo-<slug>` and stop its background processes — don't do it without asking.
