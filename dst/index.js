"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __spread = (this && this.__spread) || function () {
    for (var ar = [], i = 0; i < arguments.length; i++) ar = ar.concat(__read(arguments[i]));
    return ar;
};
var __values = (this && this.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
Object.defineProperty(exports, "__esModule", { value: true });
var core = require("@actions/core");
var github = require("@actions/github");
var closesMatcher = /aria-label="This (?:commit|pull request) closes issue #(\d+)\."/g;
(function main() {
    return __awaiter(this, void 0, void 0, function () {
        var payload_1, githubToken, octokit_1, releases, _a, currentRelease, priorRelease, commits, linkedIssuesPrs_2, commentRequests, linkedIssuesPrs_1, linkedIssuesPrs_1_1, issueNumber, releaseLabel, request, error_1;
        var e_1, _b;
        var _this = this;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    _c.trys.push([0, 5, , 6]);
                    payload_1 = github.context
                        .payload;
                    githubToken = core.getInput("GITHUB_TOKEN");
                    octokit_1 = github.getOctokit(githubToken);
                    return [4 /*yield*/, octokit_1.repos.listReleases(__assign(__assign({}, github.context.repo), { per_page: 2 }))];
                case 1:
                    releases = (_c.sent()).data;
                    if (releases.length < 2) {
                        if (!releases.length) {
                            core.error("no releases found");
                            return [2 /*return*/];
                        }
                        core.info("first release");
                        return [2 /*return*/];
                    }
                    _a = __read(releases, 2), currentRelease = _a[0], priorRelease = _a[1];
                    return [4 /*yield*/, octokit_1.repos.compareCommits(__assign(__assign({}, github.context.repo), { base: priorRelease.tag_name, head: currentRelease.tag_name }))];
                case 2:
                    commits = (_c.sent()).data.commits;
                    core.info(priorRelease.tag_name + "..." + currentRelease.tag_name);
                    linkedIssuesPrs_2 = new Set();
                    return [4 /*yield*/, Promise.all(commits.map(function (commit) {
                            return (function () { return __awaiter(_this, void 0, void 0, function () {
                                var query, response, html, _a, _b, match, _c, num, seen, associatedPRs, associatedPRs_1, associatedPRs_1_1, associatedPR, links, links_1, links_1_1, link;
                                var e_2, _d, e_3, _e, e_4, _f;
                                return __generator(this, function (_g) {
                                    switch (_g.label) {
                                        case 0:
                                            query = "\n            {\n              resource(url: \"" + payload_1.repository.html_url + "/commit/" + commit.sha + "\") {\n                ... on Commit {\n                  messageHeadlineHTML\n                  messageBodyHTML\n                  associatedPullRequests(first: 10) {\n                    pageInfo {\n                      hasNextPage\n                    }\n                    edges {\n                      node {\n                        bodyHTML\n                        number\n                        timelineItems(itemTypes: [CONNECTED_EVENT, DISCONNECTED_EVENT], first: 100) {\n                          pageInfo {\n                            hasNextPage\n                          }\n                          nodes {\n                            ... on ConnectedEvent {\n                              __typename\n                              isCrossRepository\n                              subject {\n                                ... on Issue {\n                                  number\n                                }\n                              }\n                            }\n                            ... on DisconnectedEvent {\n                              __typename\n                              isCrossRepository\n                              subject {\n                                ... on Issue {\n                                  number\n                                }\n                              }\n                            }\n                          }\n                        }\n                      }\n                    }\n                  }\n                }\n              }\n            }\n          ";
                                            return [4 /*yield*/, octokit_1.graphql(query)];
                                        case 1:
                                            response = _g.sent();
                                            if (!response.resource) {
                                                return [2 /*return*/];
                                            }
                                            core.info(JSON.stringify(response.resource, null, 2));
                                            html = __spread([
                                                response.resource.messageHeadlineHTML,
                                                response.resource.messageBodyHTML
                                            ], response.resource.associatedPullRequests.edges.map(function (pr) { return pr.node.bodyHTML; })).join(" ");
                                            try {
                                                for (_a = __values(html.matchAll(closesMatcher)), _b = _a.next(); !_b.done; _b = _a.next()) {
                                                    match = _b.value;
                                                    _c = __read(match, 2), num = _c[1];
                                                    linkedIssuesPrs_2.add(num);
                                                }
                                            }
                                            catch (e_2_1) { e_2 = { error: e_2_1 }; }
                                            finally {
                                                try {
                                                    if (_b && !_b.done && (_d = _a.return)) _d.call(_a);
                                                }
                                                finally { if (e_2) throw e_2.error; }
                                            }
                                            if (response.resource.associatedPullRequests.pageInfo.hasNextPage) {
                                                core.warning("Too many PRs associated with " + commit.sha);
                                            }
                                            seen = new Set();
                                            associatedPRs = response.resource.associatedPullRequests.edges;
                                            try {
                                                for (associatedPRs_1 = __values(associatedPRs), associatedPRs_1_1 = associatedPRs_1.next(); !associatedPRs_1_1.done; associatedPRs_1_1 = associatedPRs_1.next()) {
                                                    associatedPR = associatedPRs_1_1.value;
                                                    if (associatedPR.node.timelineItems.pageInfo.hasNextPage) {
                                                        core.warning("Too many links for #" + associatedPR.node.number);
                                                    }
                                                    links = associatedPR.node.timelineItems.nodes
                                                        .filter(function (node) { return !node.isCrossRepository; })
                                                        .reverse();
                                                    try {
                                                        for (links_1 = (e_4 = void 0, __values(links)), links_1_1 = links_1.next(); !links_1_1.done; links_1_1 = links_1.next()) {
                                                            link = links_1_1.value;
                                                            if (seen.has(link.subject.number)) {
                                                                continue;
                                                            }
                                                            if (link.__typename == "ConnectedEvent") {
                                                                linkedIssuesPrs_2.add("" + link.subject.number);
                                                            }
                                                            seen.add(link.subject.number);
                                                        }
                                                    }
                                                    catch (e_4_1) { e_4 = { error: e_4_1 }; }
                                                    finally {
                                                        try {
                                                            if (links_1_1 && !links_1_1.done && (_f = links_1.return)) _f.call(links_1);
                                                        }
                                                        finally { if (e_4) throw e_4.error; }
                                                    }
                                                }
                                            }
                                            catch (e_3_1) { e_3 = { error: e_3_1 }; }
                                            finally {
                                                try {
                                                    if (associatedPRs_1_1 && !associatedPRs_1_1.done && (_e = associatedPRs_1.return)) _e.call(associatedPRs_1);
                                                }
                                                finally { if (e_3) throw e_3.error; }
                                            }
                                            return [2 /*return*/];
                                    }
                                });
                            }); })();
                        }))];
                case 3:
                    _c.sent();
                    commentRequests = [];
                    try {
                        for (linkedIssuesPrs_1 = __values(linkedIssuesPrs_2), linkedIssuesPrs_1_1 = linkedIssuesPrs_1.next(); !linkedIssuesPrs_1_1.done; linkedIssuesPrs_1_1 = linkedIssuesPrs_1.next()) {
                            issueNumber = linkedIssuesPrs_1_1.value;
                            releaseLabel = currentRelease.name || currentRelease.tag_name;
                            request = __assign(__assign({}, github.context.repo), { issue_number: parseInt(issueNumber), body: "Included in release [" + releaseLabel + "](" + currentRelease.html_url + ")" });
                            core.info(JSON.stringify(request, null, 2));
                            commentRequests.push(octokit_1.issues.createComment(request));
                        }
                    }
                    catch (e_1_1) { e_1 = { error: e_1_1 }; }
                    finally {
                        try {
                            if (linkedIssuesPrs_1_1 && !linkedIssuesPrs_1_1.done && (_b = linkedIssuesPrs_1.return)) _b.call(linkedIssuesPrs_1);
                        }
                        finally { if (e_1) throw e_1.error; }
                    }
                    return [4 /*yield*/, Promise.all(commentRequests)];
                case 4:
                    _c.sent();
                    return [3 /*break*/, 6];
                case 5:
                    error_1 = _c.sent();
                    core.error(error_1);
                    core.setFailed(error_1.message);
                    return [3 /*break*/, 6];
                case 6: return [2 /*return*/];
            }
        });
    });
})();
