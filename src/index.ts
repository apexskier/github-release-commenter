import * as core from "@actions/core";
import * as github from "@actions/github";
import type * as Webhooks from "@octokit/webhooks";

const closesMatcher = /aria-label="This commit closes issue #(\d+)\."/g;

(async function main() {
  try {
    const payload = github.context
      .payload as Webhooks.EventPayloads.WebhookPayloadRelease;

    const githubToken = core.getInput("GITHUB_TOKEN");
    const octokit = github.getOctokit(githubToken);

    // watch out, this is returning deleted releases for some reason
    const { data: releases } = await octokit.repos.listReleases({
      ...github.context.repo,
      per_page: 2,
    });

    const [currentRelease, priorRelease] = releases;

    const {
      data: { commits },
    } = await octokit.repos.compareCommits({
      ...github.context.repo,
      base: priorRelease.tag_name,
      head: currentRelease.tag_name,
    });

    core.info(`${priorRelease.tag_name}...${currentRelease.tag_name}`);

    const linkedIssuesPrs = new Set<string>();

    await Promise.all(
      commits.map((commit) =>
        (async () => {
          const query = `
            {
              resource(url: "${payload.repository.html_url}/commit/${commit.sha}") {
                ... on Commit {
                  messageHeadlineHTML
                  messageBodyHTML
                  associatedPullRequests(first: 10) {
                    edges {
                      node {
                        title
                        number
                        timelineItems(itemTypes: [CONNECTED_EVENT, DISCONNECTED_EVENT], first: 100) {
                          nodes {
                            ... on ConnectedEvent {
                              id
                              subject {
                                ... on Issue {
                                  number
                                }
                              }
                            }
                            ... on DisconnectedEvent {
                              id
                              subject {
                                ... on Issue {
                                  number
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          `;
          const response: {
            resource: null | {
              messageHeadlineHTML: string;
              messageBodyHTML: string;
              associatedPullRequests: {
                edges: Array<{
                  node: {
                    title: string;
                    number: number;
                    timelineItems: {
                      nodes: Array<unknown>;
                    };
                  };
                }>;
              };
            };
          } = await octokit.graphql(query);
          
          if (!response.resource) {
            return;
          }
          
          console.info(JSON.stringify(response.resource, null, 2));
          
          const html =
            response.resource.messageHeadlineHTML +
            " " +
            response.resource.messageBodyHTML;
          for (const match of html.matchAll(closesMatcher)) {
            const [, num] = match;
            linkedIssuesPrs.add(num);
          }
        })()
      )
    );

    const commentRequests: Array<Promise<unknown>> = [];
    for (const issueNumber of linkedIssuesPrs) {
      const releaseLabel = currentRelease.name || currentRelease.tag_name;
      const request = {
        ...github.context.repo,
        issue_number: parseInt(issueNumber),
        body: `Released in [${releaseLabel}](${currentRelease.html_url})`,
      };
      core.info(JSON.stringify(request, null, 2));
      commentRequests.push(octokit.issues.createComment(request));
    }
    await Promise.all(commentRequests);
  } catch (error) {
    core.error(error);
    core.setFailed(error.message);
  }
})();
