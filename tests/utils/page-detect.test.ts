import * as mockProps from "jest-mock-props";
mockProps.extend(jest);

import * as pageDetect from "utils/page-detect";

const basePath = "/iamogbz/gh-pro-view";
const location = { pathname: basePath } as Location;
const windowLocationSpy = jest.spyOnProp(location, "pathname");
jest.spyOn(window as AnyObject, "location", "get").mockImplementation(
    () => location,
);
afterEach(jest.clearAllMocks);
afterAll(jest.restoreAllMocks);

describe("isPR", () => {
    it.each([
        ["/", false],
        ["/compare/test", false],
        ["/pull/15", true],
        ["/pull/15/commits", true],
        ["/pull/15/files", true],
    ])("detects that '%s' is '%s'", (path, result) => {
        windowLocationSpy.mockValue(`${basePath}${path}`);
        expect(pageDetect.isPR()).toBe(result);
    });

    describe("files", () => {
        it.each([
            ["/", false],
            ["/compare/test", false],
            ["/pull/15", false],
            ["/pull/15/commits", false],
            ["/pull/15/files", true],
        ])("detects that '%s' is '%s'", (path, result) => {
            windowLocationSpy.mockValue(`${basePath}${path}`);
            expect(pageDetect.isPRFiles()).toBe(result);
        });
    });

    describe("commits", () => {
        it.each([
            ["/", false],
            ["/compare/test", false],
            ["/test/commit/123456789abcdef", false],
            ["/pull/15/commits", false],
            ["/pull/15/commits/z3edswas", false],
            ["/pull/15/commits/123456789abcdef", true],
        ])("detects that '%s' is '%s'", (path, result) => {
            windowLocationSpy.mockValue(`${basePath}${path}`);
            expect(pageDetect.isPRCommit()).toBe(result);
        });
    });
});

describe("single commit", () => {
    it.each([
        ["/", false],
        ["/compare/test", false],
        ["/test/commit/123456789abcdef", false],
        ["/pull/15/commits/123456789abcdef", false],
        ["/commit/z3edswas", false],
        ["/commit/123456789abcdef", true],
        ["/commit/12345f", true],
    ])("detects that '%s' is '%s'", (path, result) => {
        windowLocationSpy.mockValue(`${basePath}${path}`);
        expect(pageDetect.isSingleCommit()).toBe(result);
    });

    describe("with pr", () => {
        it.each([
            ["/", false],
            ["/compare/test", false],
            ["/test/commit/123456789abcdef", false],
            ["/pull/15/commits", false],
            ["/pull/15/commits/z3edswas", false],
            ["/commit/z3edswas", false],
            ["/pull/15/commits/123456789abcdef", true],
            ["/commit/123456789abcdef", true],
            ["/commit/12345f", true],
        ])("detects that '%s' is '%s'", (path, result) => {
            windowLocationSpy.mockValue(`${basePath}${path}`);
            expect(pageDetect.isCommit()).toBe(result);
        });
    });
});
