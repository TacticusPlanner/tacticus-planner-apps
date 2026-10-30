# Releasing Tacticus Planner Apps

This repository uses trunk-based development with just-in-time release
branches. `main` is the integration branch and must remain releasable.

## Development flow

1. Create a short-lived topic branch from `main`.
2. Open a pull request into `main`.
3. Enable squash auto-merge when the pull request is ready.
4. Obtain the required approval and pass all required checks.
5. GitHub squash-merges the pull request and deletes the topic branch after
   every ruleset requirement is satisfied.

Auto-merge does not bypass reviews or checks. New commits dismiss stale
approvals and must pass the required checks again.

Incomplete functionality merged into `main` must be disabled with a feature
flag. A push to `main` deploys the current web application to staging.

## Release flow

Production only ships published, immutable `vX.Y.Z` tags. Three workflows are
involved:

| Workflow   | Trigger                         | What it does                                                                           |
| ---------- | ------------------------------- | -------------------------------------------------------------------------------------- |
| `CD Stage` | every push to `main`            | builds the web app and deploys it to staging                                           |
| `Release`  | by hand (Actions tab)           | cuts or patches a release, tags it, publishes the GitHub Release, then calls `CD Prod` |
| `CD Prod`  | called by `Release`, or by hand | deploys an existing published release tag to production                                |

### One-time setup

- **Approval:** Settings → Environments → `production` → add required
  reviewers. Every production deploy then waits for one of them.
- **Deployment branches:** limit `production` to `main` and `release/**`.
- **Rulesets:** the Release workflow pushes with the built-in `GITHUB_TOKEN`,
  which GitHub does not accept as a ruleset bypass actor. So the `v*` tag
  ruleset blocks only updates and deletions, not creation, which keeps
  published tags immutable. The `release/*` branch ruleset must not require
  linear history: a new release branch contains `main`'s older merge commits,
  so the push would be rejected.
- **Secrets:** `AZURE_STATIC_WEB_APPS_API_TOKEN_PROD` in the `production` environment.

### What a Release run does

1. **Tag:** computes the version, pushes `release/X.Y` (minor/major only) and
   an annotated `vX.Y.Z` tag in one atomic push, then publishes a GitHub
   Release with notes generated since the previous tag.
2. **Check:** confirms the tag is a published, non-draft release and that the required values in `apps/web/.env.production` are not empty.
3. **Build:** builds the web app in production mode from `refs/tags/vX.Y.Z`.
4. **Approve:** the deploy job waits for a `production` reviewer.
5. **Deploy:** uploads the build to the production Static Web App.

The tag and the GitHub Release exist before approval. Rejecting leaves the
release published but not live; ship it later with `CD Prod` (see below).

### Versions

| Bump    | Run from      | Result                                                       |
| ------- | ------------- | ------------------------------------------------------------ |
| `major` | `main`        | `v(X+1).0.0` and branch `release/(X+1).0`                    |
| `minor` | `main`        | `vX.(Y+1).0` and branch `release/X.(Y+1)`                    |
| `patch` | `release/X.Y` | next `vX.Y.Z` on that branch, no new branch                  |
| `patch` | `main`        | next `vX.Y.Z` on the newest line, from `main`, no new branch |

With no tags yet, versions count from `1.0.0`, because this rewrite ships as V2
of Tacticus Planner: `major` gives `v2.0.0` and `minor` gives `v1.1.0`. Use
`major` for the first production launch.

## Example: cutting a release

The latest release is `v1.3.2` and `main` has new, staging-verified work.

1. Actions → **Release** → **Run workflow**.
2. _Use workflow from:_ `main`; _bump:_ `minor`; leave _commit_ empty.
3. The run creates `release/1.4` from the head of `main`, tags `v1.4.0`, and
   publishes the release with notes since `v1.3.2`.
4. Open the run, click **Review deployments**, tick `production`, then
   **Approve and deploy**.
5. `v1.4.0` is live.

**Shipping an older commit.** If the head of `main` is not ready but
`9f8e7d6` is, run the same thing with _commit_ `9f8e7d6`. The commit must be on
`main`, come after the last `vX.Y.0` cut (here `v1.3.0`), and not already be
released.

## Example: patching a release

`v1.4.0` is live and has a bug.

1. Fix it on `main` first through a normal pull request, so the next release
   keeps the fix. Say the squash commit is `5a6b7c8`.
2. Backport it to the release branch:

   ```bash
   git fetch origin
   git switch -c backport/fix-login origin/release/1.4
   git cherry-pick 5a6b7c8
   git push -u origin backport/fix-login
   ```

3. Open a pull request from `backport/fix-login` into `release/1.4`, get it
   reviewed, and squash-merge it.
4. Actions → **Release** → _Use workflow from:_ `release/1.4`; _bump:_
   `patch`.
5. The run tags `v1.4.1` with notes since `v1.4.0`. Approve the deploy.

A second fix on the same line becomes `v1.4.2`. Anything merged to `main`
after `release/1.4` was cut stays out of the patch.

**Patching straight from `main`.** When everything on `main` since the last
release is safe to ship as a fix, skip the backport: Actions → **Release** →
_Use workflow from:_ `main`; _bump:_ `patch`. With `v1.4.0` as the newest tag,
this tags the head of `main` (or _commit_) as `v1.4.1`, with no new branch.
Unlike a backport, this ships everything merged since `v1.4.0`, not just the
fix. `release/1.4` does not get the commit; a later backport patch there still
counts up from the newest `v1.4.*` tag.

## Redeploying, rolling back and failed runs

- **Ship a rejected or failed deploy:** Actions → **CD Prod** → _Use workflow
  from:_ `main`; _ref:_ `v1.4.1`. It refuses anything that is not a published,
  non-draft `vX.Y.Z` release.
- **Roll back:** run **CD Prod** with the previous release tag, for example
  `v1.4.0`. Apps and API roll back independently; check the API contract the older apps version expects.
- **Release run failed after the tag was pushed:** use **Re-run all jobs** on
  that run. It finds the tag without a GitHub Release and resumes publishing
  and deploying instead of cutting a new version.
- **Failed before the tag was pushed:** nothing was created; fix the cause and
  run Release again.

## Release scripts

The version logic (bumps, patches, older commits, resuming a failed run) lives in
`scripts/release/` as plain Node modules with no dependencies:

- `plan-release.mjs`: the rules, as a pure function.
- `git-repo.mjs`: answers its questions with git and the GitHub CLI.
- `compute-version.mjs`: the entry point the Release workflow runs.

Run the tests on any OS with Node 22 or newer:

```bash
node --test "scripts/release/*.test.mjs"
```

CI runs them on Linux and Windows. The folder is kept identical in
`tacticus-planner-api`; change both together.

## Rules

- Never move, delete or reuse a published tag.
- Never merge features into a release branch; only backports of fixes already
  on `main`.
- Keep `release/X.Y` only while that release line is supported.

## Coordinated apps and API releases

Apps and API versions use Semantic Versioning independently. A production
release record must identify:

- the apps tag;
- the API tag;
- the immutable API container digest;
- the deployment timestamp.

Deploy compatible API changes before the apps release that consumes them.
Contracts must allow the previously deployed apps version to continue working
during rollout and rollback.
