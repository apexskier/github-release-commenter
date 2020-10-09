# Github Release Commenter action

This Github action automatically comments on PRs and Issues when a fix is released for them.

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
	  - uses: apexskier/github-release-commenter@latest
		with:
		  GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```
