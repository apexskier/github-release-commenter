# Contributing

## Release process

Create a new tag, following semver and prefixed with `v`. On push, workflows will create associated tags and releases. After the release is created, edit it through GitHub and make sure "Publish this Action to the GitHub Marketplace" is checked.

## Credential creation

`DEPENDABOT_GITHUB_TOKEN`:

* Actions: Access: Read and write
* Contents: Access: Read and write
* Metadata: Access: Read-only

## Notes

I use `.split(search).join(replace)` instead of `.replace(search, replace)` to avoid unintentional behavior to to `.replace`'s [replacement string semantics](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/replace#specifying_a_string_as_the_replacement).
