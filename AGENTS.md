# Agent instructions

## npm verification and private dependencies

Follow the [shared TJSR policy][tjsr-npm-policy]. These essentials apply even when
the shared document cannot be fetched and qualify any install/test recipes below.

- Run safe local checks with existing access. If private dependencies need
  unavailable credentials, skip installation and dependent checks. After a
  401/403 authentication failure, stop retrying `npm ci` or `npm install` until
  access changes. Record an environment blocker, not a code failure.
- Do not ask for, copy, print, or provision tokens. An agent already running
  in authenticated Actions may use its configured job credentials.
  For now, assume local Codex on `tjsr-3700x` and GitHub-launched Codex agents
  lack private-package access unless explicitly configured otherwise; a GitHub
  launch alone does not establish Actions job authentication.
- Never stub private packages, invent dependency contents, use `--force` or
  `--legacy-peer-deps` to bypass resolution, disable checks, or fake success.
- Before pushing, inspect push/PR workflows and called actions for unintended
  package/image publishing, releases, or deployments. If unsafe, retain a local
  commit/patch and report the required gating change.
- When safe, commit and push authorized changes to a task/PR branch and open or
  update a draft PR. Verify through configured GitHub Actions using existing
  package grants; ordinary branches do not require Copilot delegation.
- Monitor the exact latest pushed SHA to a terminal result, inspect failed logs,
  and fix recoverable issues within scope. Report passed, failed, and unrun local
  and CI checks separately with head SHA and PR/run links. Missing workflows,
  package grants, job permissions, approvals, or Dependabot/fork secret access
  remain blockers; an older green run is insufficient.
- For new verification work, use Node 24 primarily, Node 22 where supported,
  and latest npm compatible with the declared engine floor. Check the actual
  supported matrix; this does not authorize CI/runtime/dependency changes.
- No direct-main push, approval/merge/auto-merge, release, deployment, settings
  change, or token provisioning is implied. Prior release authorization is not
  standing permission. If separately authorized to merge a repaired multi-commit
  Dependabot PR, prefer squash; a single-commit PR may use rebase.

[tjsr-npm-policy]: https://github.com/tjsr/tjsr/blob/251fd1d0606a6ce7e0c994190bbe8f318028fb9e/agent-policies/npm-ci-verification.md

## Dependency version authority and releases

- `package.json` and `package-lock.json` are the only authority for dependency
  versions. Do not encode a desired, exact, or minimum library version in a
  GitHub Actions workflow, test, or agent recipe.
- CI may verify that an installed package satisfies the range declared by its
  owning manifest, including a dependency's peer range, but it must read that
  range from the manifest instead of repeating a version literal.
- Keep public dependencies on an actively supported range in `package.json`.
  If an upgrade needs a dependent library to support a newer peer (such as
  Express), fix and publish that owning library first, verify its published
  contents and declared range, then update this consumer to the published
  version and regenerate its real lockfile. Never force an incompatible tree.
- Agents may automate authorized dependency-update PRs and, when an authorized
  release request explicitly includes publishing, use the configured version and
  publish workflow. This does not grant standing authority to publish or release.

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
- The lockfile uses `@tjsr/simple-env-utils` 0.1.11, which provides ESM and CommonJS declarations. Keep native `import` and `require` type resolution; do not force the `import` condition into the CommonJS build.
- Never copy credentials from GitHub CLI output or expose secrets from workflow logs.
