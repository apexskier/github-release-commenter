import type * as githubModule from "@actions/github";

jest.mock("@actions/core", () => ({
  getInput: jest.fn((key) => {
    if (key == "GITHUB_TOKEN") {
      return "GITHUB_TOKEN_VALUE";
    }
    if (key == "comment-template") {
      return "Included in release {release_link}";
    }
    fail(`Unexpected input key ${key}`);
  }),
  info: jest.fn(),
  warning: console.warn.bind(console),
  error: console.error.bind(console),
}));

jest.mock("@actions/github");

type Mocked<T> = {
  -readonly [P in keyof T]: T[P] extends Function
    ? jest.Mock<T[P]>
    : jest.Mocked<Partial<T[P]>>;
};

test("main test", async () => {
  const mockOctokit = {
    repos: {
      listReleases: jest.fn(() =>
        Promise.resolve({
          data: [
            {
              tag_name: "current_tag_name",
              html_url: "http://current_release",
            },
            {
              tag_name: "prior_tag_name",
              html_url: "http://prior_release",
            },
          ],
        })
      ),
      compareCommits: jest.fn(() =>
        Promise.resolve({
          data: { commits: [{ sha: "SHA1" }, { sha: "SHA2" }] },
        })
      ),
    },
    graphql: jest.fn(() =>
      Promise.resolve({
        resource: {
          messageHeadlineHTML:
            '<span class="issue-keyword tooltipped tooltipped-se" aria-label="This commit closes issue #3.">Closes</span> <a class="issue-link js-issue-link" data-error-text="Failed to load title" data-id="718013420" data-permission-text="Title is private" data-url="https://github.com/apexskier/github-release-commenter/issues/1" data-hovercard-type="issue" data-hovercard-url="/apexskier/github-release-commenter/issues/1/hovercard" href="https://github.com/apexskier/github-release-commenter/issues/1">#1</a>',
          messageBodyHTML:
            '<span class="issue-keyword tooltipped tooltipped-se" aria-label="This commit closes issue #123.">Closes</span> <p><span class="issue-keyword tooltipped tooltipped-se" aria-label="This pull request closes issue #7.">Closes</span>',
          associatedPullRequests: {
            pageInfo: { hasNextPage: false },
            edges: [
              {
                node: {
                  bodyHTML:
                    '<span class="issue-keyword tooltipped tooltipped-se" aria-label="This commit closes issue #4.">Closes</span> <span class="issue-keyword tooltipped tooltipped-se" aria-label="This commit closes issue #5.">Closes</span>',
                  number: 9,
                  timelineItems: {
                    pageInfo: { hasNextPage: false },
                    nodes: [
                      {
                        isCrossRepository: true,
                        __typename: "ConnectedEvent",
                        subject: { number: 1 },
                      },
                      {
                        isCrossRepository: false,
                        __typename: "ConnectedEvent",
                        subject: { number: 2 },
                      },
                      {
                        isCrossRepository: false,
                        __typename: "DisconnectedEvent",
                        subject: { number: 2 },
                      },
                      {
                        isCrossRepository: false,
                        __typename: "ConnectedEvent",
                        subject: { number: 2 },
                      },
                    ],
                  },
                },
              },
            ],
          },
        },
      })
    ),
    issues: {
      createComment: jest.fn(() => Promise.resolve()),
    },
  };
  const github = require("@actions/github") as jest.Mocked<
    Mocked<typeof githubModule>
  >;
  (github.context as any) = {
    payload: {
      repo: {
        owner: "owner",
        repo: "repo",
      },
      repository: { html_url: "http://repository" },
    },
  };
  github.getOctokit.mockImplementationOnce(((token: string) => {
    expect(token).toBe("GITHUB_TOKEN_VALUE");
    return mockOctokit;
  }) as any);

  require("./index");

  await new Promise((resolve) => setImmediate(() => resolve()));

  expect(mockOctokit).toMatchSnapshot();
});
