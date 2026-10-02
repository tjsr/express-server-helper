---
name: github-build-investigation
description: 'Use when investigating failed GitHub Actions builds, CI logs, pushed commits, or dependency/type-resolution failures in express-server-helper or its @tjsr dependencies. Covers gh CLI access, workflow logs, commit diffs, package versions, and build verification.'
---

# GitHub Build Investigation

## Procedure

1. Confirm the repository, branch, and commit locally with `git status --short --branch`, `git log -5 --oneline --decorate`, and `git remote get-url origin`.
2. Check GitHub CLI authentication with `gh auth status`. Never print, request, or copy credentials. If authentication is missing, ask the user to authenticate using their own GitHub CLI session.
3. List recent runs for the affected branch:

   ```sh
   gh run list --repo tjsr/express-server-helper --branch <branch> --limit 10
   ```

4. Inspect the failing run and job logs:

   ```sh
   gh run view <run-id> --repo tjsr/express-server-helper --log-failed
   ```

5. Match the run's head SHA to local changes using `git show <sha>` and `git diff <base>...<sha>`. Identify the first failing command and diagnostic before changing code.
6. For dependency failures, compare the package manifest, lockfile-resolved version (`npm ls <package> --depth=0`), published version (`npm view <package> version`), package `exports`/`types`, and files actually included by `npm pack --dry-run`. Do not treat a workspace checkout or local `dist` output as proof that the same version is published.
7. Fix the owning package, build/test and inspect its packed files, then confirm the consumer's semver range includes the fix. Refresh the consumer lockfile only after the fixed version is published and available to CI. Preserve private registry configuration and existing CI cache/setup steps.
8. Re-run the failing command locally, then the relevant project test/build scripts. Use `npm pack --dry-run` for non-release packaging checks; `npm publish --dry-run` can still reject an already-published version. If only a private credential or remote service blocks verification, report the exact blocker without exposing secrets.

## Safety

- Do not publish packages, push commits, rerun or cancel remote workflows, or change GitHub secrets without explicit authorization.
- Keep workflow output private when it contains sensitive values; rely on GitHub-masked logs and never reproduce tokens in notes or responses.
