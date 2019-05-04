import { helloWorld } from "background";

describe("entry", () => {
    it("runs a test", () => {
        expect(helloWorld()).toMatchSnapshot();
    });
});
