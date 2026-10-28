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

Releases are cut and shipped by the `Release` workflow (Actions tab, run by
hand). Each run creates an immutable annotated `vX.Y.Z` tag, publishes a
GitHub Release from it with generated notes, and builds and deploys that exact tag to production.
Production never deploys from a moving branch.

For a new minor or major release:

1. Check that the head of `main` has passed CI and staging validation.
2. Run `Release` from `main` with `minor` (or `major`). It creates
   `release/X.Y` from `main`, tags `vX.Y.0`, publishes the release, and
   deploys it.

Keep `release/X.Y` only while that release line is supported. Do not merge
features into a release branch.

## Patch flow

Reproduce and fix production bugs on `main` first:

1. Merge the fix into `main` through the normal pull-request flow.
2. Create a backport branch from the supported `release/X.Y` branch.
3. Cherry-pick the squash commit from `main`.
4. Open a pull request from the backport branch into `release/X.Y`.
5. After approval and required checks, squash-merge the backport.
6. Run `Release` from `release/X.Y` with `patch`. It tags the next patch
   version, such as `v1.4.1`, publishes the release with notes since the
   previous `vX.Y.*`, and deploys it.

`CD Prod` redeploys an existing release tag by hand; it refuses anything that
is not a published `vX.Y.Z` release.

Never move or reuse a published tag.

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
