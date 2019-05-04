import * as mockProps from "jest-mock-props";
mockProps.extend(jest);

import * as pageDetect from "utils/page-detect";

describe("isPR", () => {
    const basePath = "/iamogbz/gh-pro-view";
    const location = { pathname: basePath } as Location;
    const windowLocationSpy = jest.spyOnProp(location, "pathname");
    jest.spyOn(window as AnyObject, "location", "get").mockImplementation(
        () => location,
    );

    afterAll(jest.restoreAllMocks);

    it.each([
        ["/", false],
        ["/compare/test", false],
        ["/pull/15", true],
        ["/pull/15/files", true],
        ["/pull/15/commits", true],
    ])("detects that '%s' is '%s'", (path, result) => {
        windowLocationSpy.mockValueOnce(`${basePath}${path}`);
        expect(pageDetect.isPR()).toBe(result);
    });

    describe("files", () => {
        it.each([
            ["/", false],
            ["/compare/test", false],
            ["/pull/15", false],
            ["/pull/15/files", true],
            ["/pull/15/commits", false],
        ])("detects that '%s' is '%s'", (path, result) => {
            windowLocationSpy.mockValueOnce(`${basePath}${path}`);
            expect(pageDetect.isPRFiles()).toBe(result);
        });
    });
});
