export const getCleanPathname = (): string =>
    location.pathname.replace(/^[/]|[/]$/g, "");

export const getRepoPath = (): string =>
    getCleanPathname()
        .split("/")
        .slice(2)
        .join("/");
