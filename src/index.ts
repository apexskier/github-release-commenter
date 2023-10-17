import * as core from "@actions/core";
import * as github from "@actions/github";
import type * as Webhooks from "@octokit/webhooks-types";

const closesMatcher =
  /aria-label="This (?:commit|pull request) closes issue #(\d+)\."/g;

const releaseLinkTemplateRegex = /{release_link}/g;
const releaseNameTemplateRegex = /{release_name}/g;
const releaseTagTemplateRegex = /{release_tag}/g;
const authorTemplateRegex = /{author}/g;
const titleTemplateRegex = /{title}/g;

(async function main() {
  try {
    const payload = github.context
      .payload as Webhooks.EventPayloadMap["release"];

    const githubToken = core.getInput("GITHUB_TOKEN");
    const octokit = github.getOctokit(githubToken);

    const commentTemplate = core.getInput("comment-template");
    const labelTemplate = core.getInput("label-template") || null;
    const skipLabelTemplate = core.getInput("skip-label") || null;
    
    const skipLinkedEvents = core.getInput("skip-linked") || null;
    const shouldSkipLinkedEvents = skipLinkedEvents === "true";

    // watch out, this is returning deleted releases for some reason
    const { data: releases } = await octokit.rest.repos.listReleases({
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
    } = await octokit.rest.repos.compareCommits({
      ...github.context.repo,
      base: priorRelease.tag_name,
      head: currentRelease.tag_name,
    });

    core.info(`${priorRelease.tag_name}...${currentRelease.tag_name}`);

    if (!currentRelease.name) {
      core.info("current release has no name, will fall back to the tag name");
    }
    const releaseLabel = currentRelease.name || currentRelease.tag_name;

    const comment = commentTemplate
      .trim()
      .replace(
        releaseLinkTemplateRegex,
        `[${releaseLabel}](${currentRelease.html_url})`
      )
      .replace(releaseNameTemplateRegex, releaseLabel)
      .replace(releaseTagTemplateRegex, currentRelease.tag_name);
    const parseLabels = (rawInput: string | null) =>
      rawInput
        ?.replace(releaseNameTemplateRegex, releaseLabel)
        ?.replace(releaseTagTemplateRegex, currentRelease.tag_name)
        ?.split(",")
        ?.map((l) => l.trim())
        .filter((l) => l);
    const labels = parseLabels(labelTemplate);
    const skipLabels = parseLabels(skipLabelTemplate);

    interface PR {
      title: string;
      author: string;
    }

    let linkedIssuesPrs: { [number: number]: PR } = {};

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
                        title
                        author {
                          login
                        }
                        bodyHTML
                        number
                        labels(first: 10) {
                          pageInfo {
                            hasNextPage
                          }
                          nodes {
                            name
                          }
                        }
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
                                  title
                                  author {
                                    login
                                  }
                                }
                              }
                            }
                            ... on DisconnectedEvent {
                              __typename
                              isCrossRepository
                              subject {
                                ... on Issue {
                                  number
                                  title
                                  author {
                                    login
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
            }
          `;
          const response: {
            resource: null | {
              messageHeadlineHTML: string;
              messageBodyHTML: string;
              associatedPullRequests: {
                pageInfo: { hasNextPage: boolean };
                edges: ReadonlyArray<{
                  node: {
                    title: string;
                    author: {
                      login: string;
                    }
                    bodyHTML: string;
                    number: number;
                    labels: {
                      pageInfo: { hasNextPage: boolean };
                      nodes: ReadonlyArray<{
                        name: string;
                      }>;
                    };
                    timelineItems: {
                      pageInfo: { hasNextPage: boolean };
                      nodes: ReadonlyArray<{
                        __typename: "ConnectedEvent" | "DisconnectedEvent";
                        isCrossRepository: boolean;
                        subject: {
                          title: string;
                          author: {
                            login: string;
                          }
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

          if (!shouldSkipLinkedEvents) {
            for (const match of html.matchAll(closesMatcher)) {
              const [, num] = match;
              const pr: PR = {
                title: "N/A",
                author: "N/A",
              };
              linkedIssuesPrs[parseInt(num)] = pr;
            }
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
            if (associatedPR.node.labels.pageInfo.hasNextPage) {
              core.warning(`Too many labels for #${associatedPR.node.number}`);
            }
            // a skip labels is present on this PR
            if (
              skipLabels?.some((l) =>
                associatedPR.node.labels.nodes.some(({ name }) => name === l)
              )
            ) {
              continue;
            }
            const pr: PR = {
              title: associatedPR.node.title,
              author: associatedPR.node.author.login,
            };

            linkedIssuesPrs[associatedPR.node.number] = pr;

            if (!shouldSkipLinkedEvents) {
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
                  const event: PR = {
                    title: link.subject.title,
                    author: link.subject.author.login,
                  };
                  linkedIssuesPrs[link.subject.number] = event;
                }
                seen.add(link.subject.number);
              }
            }

          }
        })()
      )
    );

    const requests: Array<Promise<unknown>> = [];
    for (const issuePrNumber in linkedIssuesPrs) {
      const issuePr = linkedIssuesPrs[issuePrNumber];
      const baseRequest = {
        ...github.context.repo,
        issue_number: issuePrNumber,
      };
      if (comment) {
        // replace author and title variables
        const finalComment = comment
          .replace(authorTemplateRegex, issuePr.author)
          .replace(titleTemplateRegex, issuePr.title);

        const request = {
          ...baseRequest,
          body: finalComment,
        };
        core.info(JSON.stringify(request, null, 2));
        requests.push(octokit.rest.issues.createComment(request));
      }
      if (labels) {
        const request = {
          ...baseRequest,
          labels,
        };
        core.info(JSON.stringify(request, null, 2));
        requests.push(octokit.rest.issues.addLabels(request));
      }
    }
    await Promise.all(requests);
  } catch (error) {
    core.error(error);
    core.setFailed(error.message);
  }
})();
