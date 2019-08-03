import { browser } from "webextension-polyfill-ts";

export const request = (info: RequestInfo, init?: RequestInit) =>
    browser.runtime.sendMessage({ type: "fetch", payload: { info, init } });
