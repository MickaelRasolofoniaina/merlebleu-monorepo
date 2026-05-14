Generate a conventional commit message for all current changes, then commit and push to the current branch.

## Steps

1. Run `git status` to list changed and untracked files.
2. Run `git diff HEAD` to inspect the full diff.
3. Run `git log --oneline -20` to review recent commit messages and match their style.
4. Based on the diff, generate a commit message following the project's conventional commit format:
   - **Type**: `feat`, `fix`, `refactor`, `chore`, `docs`, `test`, `style`, `perf`
   - **Scope** (optional): affected feature in parentheses, e.g. `(inventory)`, `(auth)`, `(order)`
   - **Description**: short imperative sentence, lowercase, no trailing period
   - Separate multiple concerns with a semicolon on the same line
5. **Print the generated commit message to the console** before doing anything else.
6. Stage all changes with `git add -A`.
7. Commit using the generated message.
8. Push to the current branch. If the remote branch does not exist yet, use `--set-upstream origin <branch>`.

## Commit message format

```
<type>(<scope>): <short description>
```

Examples from this project:

- `feat(inventory): streamline item form initialization and reset logic; normalize search input`
- `feat(auth): simplify getSession method and remove access token verification`
- `feat: split claude instruction md files`

## Rules

- Never amend an existing commit — always create a new one.
- Never skip hooks with `--no-verify`.
- If the current branch is `main`, ask for explicit confirmation before pushing.
