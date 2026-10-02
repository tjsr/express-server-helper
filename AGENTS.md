# Agent Instructions

## TypeScript Style

- Format TypeScript and TSX with the repository's Prettier config. Use two spaces and spaces, never tabs.
- Use explicit relative extensions: `.ts` for TypeScript modules and `.tsx` for TSX modules.
- Keep imports in the order enforced by `@tjsr/eslint-config`'s `import/order` rule; do not use a separate alphabetic import sorter.
- Format and apply ESLint fixes on save. Run the repository's lint check after changing imports or formatting rules.

## GitHub CI Investigation

- For failed GitHub Actions runs, verify GitHub CLI access with `gh auth status` without printing or requesting tokens. List branch runs with `gh run list --repo tjsr/express-server-helper --branch <branch>` and inspect failures with `gh run view <run-id> --repo tjsr/express-server-helper --log-failed`.
- Correlate the run's head SHA with `git log`, `git show <sha>`, and `git diff <base>...<sha>` before attributing a failure.
- For dependency/type-resolution failures, compare `npm ls <package> --depth=0`, the lockfile's resolved version, and `npm view <package> version`; inspect the dependency's `exports`/`types` fields and packed files. Do not assume the workspace checkout matches the published package.
- Fix the owning package first, validate its package contents, and only reference a new version after it is available to CI. Refresh `package-lock.json` with the repository's supported npm version.
- Use `npm pack --dry-run` to validate packaging on non-release branches. `npm publish --dry-run` can still fail when the current package version has already been published.
- The `@tjsr/simple-env-utils` range already admits `0.1.11`; after that fixed release appears in GitHub Packages, refresh `package-lock.json` with `npm update @tjsr/simple-env-utils` and verify with `npm ci`.
- Never copy credentials from GitHub CLI output or expose secrets from workflow logs.
