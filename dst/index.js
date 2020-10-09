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
var closesMatcher = /aria-label="This commit closes issue #(\d+)\."/g;
function matchAll(re, s) {
    var m;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                m = re.exec(s);
                if (!m) return [3 /*break*/, 2];
                return [4 /*yield*/, m];
            case 1:
                _a.sent();
                _a.label = 2;
            case 2:
                if (m) return [3 /*break*/, 0];
                _a.label = 3;
            case 3: return [2 /*return*/];
        }
    });
}
(function main() {
    return __awaiter(this, void 0, void 0, function () {
        var payload_1, githubToken, octokit_1, releases, _a, currentRelease, priorRelease, commits, linkedIssuesPrs_2, commentRequests, linkedIssuesPrs_1, linkedIssuesPrs_1_1, issueNumber, error_1;
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
                    _a = __read(releases, 2), currentRelease = _a[0], priorRelease = _a[1];
                    return [4 /*yield*/, octokit_1.repos.compareCommits(__assign(__assign({}, github.context.repo), { base: priorRelease.tag_name, head: currentRelease.tag_name }))];
                case 2:
                    commits = (_c.sent()).data.commits;
                    core.info(priorRelease.tag_name + "..." + currentRelease.tag_name);
                    linkedIssuesPrs_2 = new Set();
                    return [4 /*yield*/, Promise.all(commits.map(function (commit) {
                            return (function () { return __awaiter(_this, void 0, void 0, function () {
                                var query, response, html, match, _a, num;
                                return __generator(this, function (_b) {
                                    switch (_b.label) {
                                        case 0:
                                            query = "\n            {\n              resource(url: \"" + payload_1.repository.html_url + "/commit/" + commit.sha + "\") {\n                ... on Commit {\n                  messageHeadlineHTML\n                  messageBodyHTML\n                  associatedPullRequests(first: 10) {\n                    edges {\n                      node {\n                        title\n                        number\n                        timelineItems(itemTypes: [CONNECTED_EVENT, DISCONNECTED_EVENT], first: 100) {\n                          nodes {\n                            ... on ConnectedEvent {\n                              id\n                              subject {\n                                ... on Issue {\n                                  number\n                                }\n                              }\n                            }\n                            ... on DisconnectedEvent {\n                              id\n                              subject {\n                                ... on Issue {\n                                  number\n                                }\n                              }\n                            }\n                          }\n                        }\n                      }\n                    }\n                  }\n                }\n              }\n            }\n          ";
                                            core.info(query);
                                            return [4 /*yield*/, octokit_1.graphql(query)];
                                        case 1:
                                            response = _b.sent();
                                            core.info(JSON.stringify({ response: response }, null, 2));
                                            if (!response.data.resource) {
                                                return [2 /*return*/];
                                            }
                                            html = response.data.resource.messageHeadlineHTML +
                                                " " +
                                                response.data.resource.messageBodyHTML;
                                            for (match in matchAll(closesMatcher, html)) {
                                                _a = __read(match, 2), num = _a[1];
                                                linkedIssuesPrs_2.add(num);
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
                            commentRequests.push(octokit_1.issues.createComment(__assign(__assign({}, github.context.repo), { issue_number: parseInt(issueNumber), body: "Released in [" + currentRelease.name + "](" + currentRelease.html_url + ")" })));
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
