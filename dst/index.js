"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var core = require("@actions/core");
var github = require("@actions/github");
try {
  // Get the JSON webhook payload for the event that triggered the workflow
  var payload = JSON.stringify(github.context.payload, undefined, 2);
  console.log("The event payload: " + payload);
} catch (error) {
  core.setFailed(error.message);
}
