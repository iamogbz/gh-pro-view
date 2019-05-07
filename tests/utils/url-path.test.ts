import * as mockProps from "jest-mock-props";
mockProps.extend(jest);

import { getCommitSha, getUserRepo } from "utils/url-path";

const userRepo = "iamogbz/gh-pro-view";
const basePath = `/${userRepo}`;
const location = { pathname: basePath } as Location;
const windowLocationSpy = jest.spyOnProp(location, "pathname");
jest.spyOn(window as AnyObject, "location", "get").mockImplementation(
    () => location,
);

afterAll(jest.restoreAllMocks);

describe("getUserRepo", () => {
    it.each([
        ["/"],
        ["/compare/test"],
        ["/pull/15"],
        ["/pull/15/files"],
        ["/pull/15/commits"],
    ])(`get user repo in case ${basePath}/'%s'`, path => {
        windowLocationSpy.mockValueOnce(`${basePath}${path}`);
        expect(getUserRepo()).toBe(userRepo);
    });
});

describe("getCommitSha", () => {
    const commitSha = "123456abc";
    it.each([
        [`/commit/${commitSha}`, commitSha],
        [`/commit/${commitSha}#someothervalue`, commitSha],
        [`/commit/${commitSha}/some/other/path`, commitSha],
        [`pull/15/commits/${commitSha}`, commitSha],
        [`pull/15/commits/${commitSha}#someothervalue`, commitSha],
        [`pull/15/commits/${commitSha}/some/other/path`, commitSha],
        ["/", null],
        ["/compare/test", null],
        ["/pull/15", null],
        ["/pull/15/files", null],
        ["/pull/15/commits", null],
    ])(`get correct sha in case ${basePath}/'%s'`, (path, expected) => {
        windowLocationSpy.mockValueOnce(`${basePath}${path}`);
        expect(getCommitSha()).toBe(expected);
    });
});
