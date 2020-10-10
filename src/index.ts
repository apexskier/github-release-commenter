import * as core from "@actions/core";
import * as github from "@actions/github";
import type * as Webhooks from "@octokit/webhooks";

const closesMatcher = /aria-label="This (?:commit|pull request) closes issue #(\d+)\."/g;

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

    if (releases.length < 2) {
      if (!releases.length) {
        core.error("no releases found");
        return;
      }

      core.info("first release");
      return;
    }

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
                    pageInfo {
                      hasNextPage
                    }
                    edges {
                      node {
                        bodyHTML
                        number
                        timelineItems(itemTypes: [CONNECTED_EVENT, DISCONNECTED_EVENT], first: 100) {
                          pageInfo {
                            hasNextPage
                          }
                          nodes {
                            ... on ConnectedEvent {
                              __typename
                              isCrossRepository
                              subject {
                                ... on Issue {
                                  number
                                }
                              }
                            }
                            ... on DisconnectedEvent {
                              __typename
                              isCrossRepository
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
                pageInfo: { hasNextPage: boolean };
                edges: Array<{
                  node: {
                    bodyHTML: string;
                    number: number;
                    timelineItems: {
                      pageInfo: { hasNextPage: boolean };
                      nodes: Array<{
                        __typename: "ConnectedEvent" | "DisconnectedEvent";
                        isCrossRepository: boolean;
                        subject: {
                          number: number;
                        };
                      }>;
                    };
                  };
                }>;
              };
            };
          } = await octokit.graphql(query);

          if (!response.resource) {
            return;
          }

          core.info(JSON.stringify(response.resource, null, 2));

          const html = [
            response.resource.messageHeadlineHTML,
            response.resource.messageBodyHTML,
            ...response.resource.associatedPullRequests.edges.map(
              (pr) => pr.node.bodyHTML
            ),
          ].join(" ");
          for (const match of html.matchAll(closesMatcher)) {
            const [, num] = match;
            linkedIssuesPrs.add(num);
          }

          if (response.resource.associatedPullRequests.pageInfo.hasNextPage) {
            core.warning(`Too many PRs associated with ${commit.sha}`);
          }

          const seen = new Set<number>();
          const associatedPRs = response.resource.associatedPullRequests.edges;
          for (const associatedPR of associatedPRs) {
            if (associatedPR.node.timelineItems.pageInfo.hasNextPage) {
              core.warning(`Too many links for #${associatedPR.node.number}`);
            }
            // these are sorted by creation date in ascending order. The latest event for a given issue/PR is all we need
            // ignore links that aren't part of this repo
            const links = associatedPR.node.timelineItems.nodes
              .filter((node) => !node.isCrossRepository)
              .reverse();
            for (const link of links) {
              if (seen.has(link.subject.number)) {
                continue;
              }
              if (link.__typename == "ConnectedEvent") {
                linkedIssuesPrs.add(`${link.subject.number}`);
              }
              seen.add(link.subject.number);
            }
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
        body: `Included in release [${releaseLabel}](${currentRelease.html_url})`,
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
