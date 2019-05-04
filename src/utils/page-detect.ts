import { getRepoPath } from "./url-path";

const regexPR = "^pull/\\d+";

export const isPR = (): boolean => new RegExp(regexPR).test(getRepoPath()!);

export const isPRFiles = (): boolean =>
    new RegExp(`${regexPR}/files`).test(getRepoPath()!);
