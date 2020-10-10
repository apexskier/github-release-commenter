# Release Commenter

This GitHub Action automatically comments on PRs and Issues when a fix is released for them.

## How it works

Use this action in a workflow [triggered by a release](https://docs.github.com/en/free-pro-team@latest/actions/reference/events-that-trigger-workflows#release). It will scan commits between that and the prior release, find associated Issues and PRs, and comment on them to let people know a release has been made. Associated Issues and PRs can be directly [linked](https://docs.github.com/en/free-pro-team@latest/github/managing-your-work-on-github/linking-a-pull-request-to-an-issue) to the commit or manually linked from a PR associated with the commit.

## Example

```yml
on:
  release:
    types: [published]

jobs:
  release:
    steps:
      - uses: apexskier/github-release-commenter@v1
        with:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

## Known limitations

These are some known limitations of this action. I'd like to try to address them in the future.

- Non-linear releases aren't supported. For example, releasing a patch to a prior major release after a new major release has been bumped.
- Non-sequential releases aren't supported. For example, if you release multiple prereleases between two official releases, this will only create a comment for the first prerelease in which a fix is released, not the final release.
- The first release for a project will be ignored. This is intentional, as the use case is unlikely. Most projects will either have several alphas that don't need release comments, or won't use issues/PRs for the first commit.

## Versions

Workflows will automatically update the tags `v1` and `latest`, allowing you to reference one of those instead of locking to a specific release.
