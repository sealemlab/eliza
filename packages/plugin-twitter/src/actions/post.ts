import {
    Action,
    IAgentRuntime,
    Memory,
    State,
    composeContext,
    elizaLogger,
    ModelClass,
    generateObject,
    truncateToCompleteSentence,
} from "@elizaos/core";
import { Scraper } from "agent-twitter-client";
import { tweetTemplate } from "../templates";
import { isTweetContent, TweetSchema } from "../types";

export const DEFAULT_MAX_TWEET_LENGTH = 280;

async function composeTweet(
    runtime: IAgentRuntime,
    _message: Memory,
    state?: State
): Promise<string> {
    try {
        console.log("[plugin-twitter] ▶ composeTweet - entering function");

        // Add length constraint to the context
        const context = composeContext({
            state,
            template: {
                ...tweetTemplate,
                // Add length constraint to system message
                system: `${tweetTemplate.system}\nCRITICAL: Your response MUST be under 280 characters. Aim for 250 characters to be safe.`,
                // Add reminder in the user message
                user: `${tweetTemplate.user}\nRemember: Keep your response under 280 characters, preferably around 250.`
            },
        });

        const tweetContentObject = await generateObject({
            runtime,
            context,
            modelClass: ModelClass.SMALL,
            schema: TweetSchema,
            stop: ["\n"],
            // Add max_tokens parameter to limit output length
            max_tokens: 200, // Setting lower than 280 to be safe
        });

        if (!isTweetContent(tweetContentObject.object)) {
            elizaLogger.error(
                "Invalid tweet content:",
                tweetContentObject.object
            );
            return;
        }

        let trimmedContent = tweetContentObject.object.text.trim();

        // Double check length and truncate if necessary
        const maxTweetLength = runtime.getSetting("MAX_TWEET_LENGTH") || DEFAULT_MAX_TWEET_LENGTH;
        const targetLength = Math.min(maxTweetLength, 250); // 使用更保守的长度限制

        if (trimmedContent.length > targetLength) {
            trimmedContent = truncateToCompleteSentence(
                trimmedContent,
                targetLength
            );
        }

        console.log("[plugin-twitter] ▶ composeTweet - final tweet content:", trimmedContent);
        return trimmedContent;
    } catch (error) {
        elizaLogger.error("Error composing tweet:", error);
        throw error;
    }
}

async function sendTweet(twitterClient: Scraper, content: string) {
    const result = await twitterClient.sendTweet(content);

    const body = await result.json();
    elizaLogger.log("Tweet response:", body);

    // Check for Twitter API errors
    if (body.errors) {
        const error = body.errors[0];
        elizaLogger.error(
            `Twitter API error (${error.code}): ${error.message}`
        );
        return false;
    }

    // Check for successful tweet creation
    if (!body?.data?.create_tweet?.tweet_results?.result) {
        elizaLogger.error("Failed to post tweet: No tweet result in response");
        return false;
    }

    return true;
}

async function postTweet(
    runtime: IAgentRuntime,
    content: string
): Promise<boolean> {
    try {

        console.log("[plugin-twitter] ▶ postTweet - content:", content);
        const twitterClient = runtime.clients.twitter?.client?.twitterClient;
        const scraper = twitterClient || new Scraper();

        if (!twitterClient) {
            const username = runtime.getSetting("TWITTER_USERNAME");
            const password = runtime.getSetting("TWITTER_PASSWORD");
            const email = runtime.getSetting("TWITTER_EMAIL");
            const twitter2faSecret = runtime.getSetting("TWITTER_2FA_SECRET");
            console.log("[plugin-twitter] ▶ postTweet - user:", username, " email:", email);
            if (!username || !password) {
                elizaLogger.error(
                    "Twitter credentials not configured in environment"
                );
                return false;
            }
            // Login with credentials
            await scraper.login(username, password, email, twitter2faSecret);
            if (!(await scraper.isLoggedIn())) {
                elizaLogger.error("Failed to login to Twitter");
                return false;
            }
            console.log("[plugin-twitter] ▶ postTweet - isLoggedIn:", await scraper.isLoggedIn());
        }

        // Send the tweet
        elizaLogger.log("Attempting to send tweet:", content);

        try {
            if (content.length > DEFAULT_MAX_TWEET_LENGTH) {
                console.log("[plugin-twitter] ▶ postTweet - content length > 280; sending note tweet");

                const noteTweetResult = await scraper.sendNoteTweet(content);
                if (
                    noteTweetResult.errors &&
                    noteTweetResult.errors.length > 0
                ) {
                    // Note Tweet failed due to authorization. Falling back to standard Tweet.
                    return await sendTweet(scraper, content);
                } else {
                    return true;
                }
            } else {


                return await sendTweet(scraper, content);
            }
        } catch (error) {
            throw new Error(`Note Tweet failed: ${error}`);
        }
    } catch (error) {
        // Log the full error details
        elizaLogger.error("Error posting tweet:", {
            message: error.message,
            stack: error.stack,
            name: error.name,
            cause: error.cause,
        });
        return false;
    }
}

export const postAction: Action = {
    name: "POST_TWEET",
    similes: ["TWEET", "POST", "SEND_TWEET"],
    description: "Post a tweet to Twitter",
    validate: async (
        runtime: IAgentRuntime,
        message: Memory,
        state?: State
    ) => {
        const username = runtime.getSetting("TWITTER_USERNAME");
        const password = runtime.getSetting("TWITTER_PASSWORD");
        const email = runtime.getSetting("TWITTER_EMAIL");


        console.log("[plugin-twitter] ▶ postAction.validate - TWITTER_USERNAME:", username);
        console.log("[plugin-twitter] ▶ postAction.validate - TWITTER_PASSWORD:", password ? "" : "undefined");
        console.log("[plugin-twitter] ▶ postAction.validate - TWITTER_EMAIL:", email);


        const hasCredentials = !!username && !!password && !!email;
        elizaLogger.log(`Has credentials: ${hasCredentials}`);

        return hasCredentials;
    },
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state?: State
    ): Promise<boolean> => {
        try {
            // Generate tweet content using context
            console.log("[plugin-twitter] ▶ postAction.handler - composing tweet...");
            const tweetContent = await composeTweet(runtime, message, state);

            if (!tweetContent) {
                elizaLogger.error("No content generated for tweet");
                return false;


            }

            console.log("[plugin-twitter] ▶ postAction.handler - generated content:", tweetContent);

            // Check for dry run mode - explicitly check for string "true"
            if (
                process.env.TWITTER_DRY_RUN &&
                process.env.TWITTER_DRY_RUN.toLowerCase() === "true"
            ) {
                elizaLogger.info(
                    `Dry run: would have posted tweet: ${tweetContent}`
                );
                return true;
            }

            return await postTweet(runtime, tweetContent);
        } catch (error) {
            elizaLogger.error("Error in post action:", error);
            return false;
        }
    },
    examples: [
        [
            {
                user: "{{user1}}",
                content: { text: "You should tweet that" },
            },
            {
                user: "{{agentName}}",
                content: {
                    text: "I'll share this update with my followers right away!",
                    action: "POST_TWEET",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: { text: "Post this tweet" },
            },
            {
                user: "{{agentName}}",
                content: {
                    text: "I'll post that as a tweet now.",
                    action: "POST_TWEET",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: { text: "Share that on Twitter" },
            },
            {
                user: "{{agentName}}",
                content: {
                    text: "I'll share this message on Twitter.",
                    action: "POST_TWEET",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: { text: "Post that on X" },
            },
            {
                user: "{{agentName}}",
                content: {
                    text: "I'll post this message on X right away.",
                    action: "POST_TWEET",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: { text: "You should put that on X dot com" },
            },
            {
                user: "{{agentName}}",
                content: {
                    text: "I'll put this message up on X.com now.",
                    action: "POST_TWEET",
                },
            },
        ],
    ],
};
