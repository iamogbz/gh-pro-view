import * as mockProps from "jest-mock-props";
mockProps.extend(jest);

import { getUserRepo } from "utils/url-path";

describe("getUserRepo", () => {
    const userRepo = "iamogbz/gh-pro-view";
    const basePath = `/${userRepo}`;
    const location = { pathname: basePath } as Location;
    const windowLocationSpy = jest.spyOnProp(location, "pathname");
    jest.spyOn(window as AnyObject, "location", "get").mockImplementation(
        () => location,
    );

    afterAll(jest.restoreAllMocks);

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
