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
