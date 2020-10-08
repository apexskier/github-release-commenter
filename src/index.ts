import * as core from "@actions/core";
import * as github from "@actions/github";
import type * as Webhooks from "@octokit/webhooks";

(async function main() {
  try {
    // Get the JSON webhook payload for the event that triggered the workflow
    const payload = github.context
      .payload as Webhooks.EventPayloads.WebhookPayloadRelease;
    const payloadStr = JSON.stringify(payload, undefined, 2);
    console.log(`The event payload: ${payloadStr}`);

    const githubToken = core.getInput("GITHUB_TOKEN");
    const octokit = github.getOctokit(githubToken);
    const { data: releases } = await octokit.repos.listReleases({
      ...github.context.repo,
      per_page: 2,
    });

    console.log(JSON.stringify(releases[1], undefined, 2));
  } catch (error) {
    core.setFailed(error.message);
  }
})();
