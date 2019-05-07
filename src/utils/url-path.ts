export const regexPR = "^pull/\\d+";
export const regexCommit = "commits?/[0-9a-f]{5,40}";

export const getCleanPathname = (): string =>
    location.pathname.replace(/^[/]|[/]$/g, "");

export const getUserRepo = (): string =>
    getCleanPathname()
        .split("/")
        .slice(0, 2)
        .join("/");

export const getRepoPath = (): string =>
    getCleanPathname()
        .split("/")
        .slice(2)
        .join("/");

export const getCommitSha = (): string => {
    const match = getRepoPath().match(regexCommit);
    if (!match) return null;
    return match[0].split("/")[1];
};
