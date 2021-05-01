import type * as githubModule from "@actions/github";
import type * as coreModule from "@actions/core";

jest.mock("@actions/core");
jest.mock("@actions/github");

type Mocked<T> = {
  -readonly [P in keyof T]: T[P] extends Function
    ? jest.Mock<T[P]>
    : jest.Mocked<Partial<T[P]>>;
};

const github = require("@actions/github") as jest.Mocked<
  Mocked<typeof githubModule>
>;
const core = require("@actions/core") as jest.Mocked<Mocked<typeof coreModule>>;

describe("tests", () => {
  let mockOctokit: any = {};
  (github.context as any) = {
    payload: {
      repo: {
        owner: "owner",
        repo: "repo",
      },
      repository: { html_url: "http://repository" },
    },
  };

  (core.warning as any) = jest.fn(console.warn.bind(console));
  (core.error as any) = jest.fn(console.error.bind(console));

  let commentTempate: string = "";
  let labelTemplate: string | null = null;
  const skipLabelTemplate: string | null = "skip,test";

  let simpleMockOctokit: any = {};

  beforeEach(() => {
    github.getOctokit.mockReset().mockImplementationOnce(((token: string) => {
      expect(token).toBe("GITHUB_TOKEN_VALUE");
      return mockOctokit;
    }) as any);

    (core.getInput as any).mockImplementation((key: string) => {
      if (key == "GITHUB_TOKEN") {
        return "GITHUB_TOKEN_VALUE";
      }
      if (key == "comment-template") {
        return commentTempate;
      }
      if (key == "label-template") {
        return labelTemplate;
      }
      if (key == "skip-label") {
        return skipLabelTemplate;
      }
      fail(`Unexpected input key ${key}`);
    });

    commentTempate = "Included in release {release_link}";
    labelTemplate = null;
    simpleMockOctokit = {
      repos: {
        listReleases: jest.fn(() =>
          Promise.resolve({
            data: [
              {
                name: "Release Name",
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
            data: { commits: [{ sha: "SHA1" }] },
          })
        ),
      },
      graphql: jest.fn(() =>
        Promise.resolve({
          resource: {
            messageHeadlineHTML: "",
            messageBodyHTML:
              '<span class="issue-keyword tooltipped tooltipped-se" aria-label="This commit closes issue #123.">Closes</span> <p><span class="issue-keyword tooltipped tooltipped-se" aria-label="This pull request closes issue #7.">Closes</span>',
            associatedPullRequests: {
              pageInfo: { hasNextPage: false },
              edges: [],
            },
          },
        })
      ),
      issues: {
        createComment: jest.fn(() => Promise.resolve()),
        addLabels: jest.fn(() => Promise.resolve()),
      },
    };
  });

  test("main test", async () => {
    mockOctokit = {
      ...simpleMockOctokit,
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
                    labels: {
                      pageInfo: { hasNextPage: false },
                      nodes: [{ name: "label1" }, { name: "label2" }],
                    },
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
                {
                  node: {
                    bodyHTML: "",
                    number: 42,
                    labels: {
                      pageInfo: { hasNextPage: false },
                      nodes: [{ name: "label1" }, { name: "skip" }],
                    },
                    timelineItems: {
                      pageInfo: { hasNextPage: false },
                      nodes: [
                        {
                          isCrossRepository: true,
                          __typename: "ConnectedEvent",
                          subject: { number: 82 },
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
        addLabels: jest.fn(() => Promise.resolve()),
      },
    };

    jest.isolateModules(() => {
      require("./index");
    });

    await new Promise<void>(setImmediate);

    expect(mockOctokit).toMatchSnapshot();
  });

  describe("feature tests", () => {
    beforeEach(() => {
      mockOctokit = simpleMockOctokit;
    });

    it("can disable comments", async () => {
      commentTempate = "";

      jest.isolateModules(() => {
        require("./index");
      });

      await new Promise<void>((resolve) => setImmediate(() => resolve()));

      expect(github.getOctokit).toBeCalled();
      expect(mockOctokit.issues.createComment).not.toBeCalled();
    });

    it("can apply labels", async () => {
      labelTemplate = ":dart: landed,release-{release_tag},{release_name}";

      jest.isolateModules(() => {
        require("./index");
      });

      await new Promise<void>((resolve) => setImmediate(() => resolve()));

      expect(github.getOctokit).toBeCalled();
      expect(mockOctokit.issues.addLabels.mock.calls).toMatchSnapshot();
    });
  });
});
