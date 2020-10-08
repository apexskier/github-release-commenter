# Github Release Commenter action

This Github action automatically comments on PRs and Issues when a fix is released for them.

## How it works

- When a release is created, finds the commits since the previous one
- For each commit, finds any linked PRs or issues, comments on them
- For each PR, finds any linked issues, comments on them
