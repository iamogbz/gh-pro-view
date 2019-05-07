import { getRepoPath, regexCommit, regexPR } from "./url-path";

export const isPR = (): boolean => new RegExp(regexPR).test(getRepoPath()!);

export const isPRFiles = (): boolean =>
    new RegExp(`${regexPR}/files`).test(getRepoPath()!);

export const isPRCommit = (): boolean =>
    new RegExp(`${regexPR}/${regexCommit}`).test(getRepoPath()!);

export const isSingleCommit = (): boolean =>
    new RegExp(`^${regexCommit}`).test(getRepoPath()!);

export const isSingleFile = (): boolean => /^blob\//.test(getRepoPath()!);

export const isCommit = (): boolean => isSingleCommit() || isPRCommit();
