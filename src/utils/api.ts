import memoize from "lodash/memoize";
import { JsonObject } from "type-fest";
import OptionsSync from "webext-options-sync";

export interface APIOptions {
    accept404: boolean;
}

export class APIError extends Error {
    constructor(...messages: string[]) {
        super(messages.join("\n"));
    }
}

export const escapeKey = (value: string): string =>
    "_" + value.replace(/[./-]/g, "_");

const settings = new OptionsSync().getAll();

const api3 =
    location.hostname === "github.com"
        ? "https://api.github.com/"
        : `${location.origin}/api/v3/`;

const getError = async (apiResponse: JsonObject): Promise<APIError> => {
    const { personalToken } = await settings;

    if (
        typeof apiResponse.message === "string" &&
        apiResponse.message.includes("API rate limit exceeded")
    ) {
        return new APIError(
            "Rate limit exceeded.",
            personalToken
                ? "It may be time for a walk!"
                : "Set your token in the options or take a walk!",
            " 🍃 🌞",
        );
    }

    if (apiResponse.message === "Bad credentials") {
        return new APIError(
            "The token seems to be incorrect or expired. Update it in the options.",
        );
    }

    return new APIError(
        "Unable to fetch.",
        personalToken
            ? "Ensure that your token has access to this repo."
            : "Maybe adding a token in the options will fix this issue.",
        JSON.stringify(apiResponse, null, "\t"),
    );
};

export const v3 = memoize(
    async (
        query: string,
        options: APIOptions = { accept404: false },
    ): Promise<AnyObject> => {
        const { personalToken } = await settings;

        const response = await fetch(api3 + query, {
            headers: {
                "Accept": "application/vnd.github.v3+json",
                "User-Agent": "GitHub PRoView",
                ...(personalToken
                    ? { Authorization: `token ${personalToken}` }
                    : {}),
            },
        });
        const textContent = await response.text();

        // The response might just be a 200 or 404, it's the REST equivalent of `boolean`
        const apiResponse: JsonObject =
            textContent.length > 0
                ? JSON.parse(textContent)
                : { status: response.status };

        if (
            response.ok ||
            (options.accept404 === true && response.status === 404)
        ) {
            return apiResponse;
        }

        throw getError(apiResponse);
    },
);
