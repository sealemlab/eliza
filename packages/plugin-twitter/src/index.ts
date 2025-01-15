import { Plugin } from "@elizaos/core";
import { postAction } from "./actions/post";
console.log("[plugin-twitter] ▶ Loading twitterPlugin...");

export const twitterPlugin: Plugin = {
     name: "twitter",
     description: "Twitter integration plugin for posting tweets",
     actions: [postAction],
     evaluators: [],
     providers: [],
};

console.log("[plugin-twitter] ▶ twitterPlugin registered:", twitterPlugin.name);

export default twitterPlugin;