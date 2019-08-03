import "crx-livereload";
import { browser } from "webextension-polyfill-ts";

browser.runtime.onMessage.addListener(async message => {
    switch (message.type) {
        case "fetch":
            const r = await fetch(message.payload.info, message.payload.init);
            return {
                ...r,
                blob: null,
                json: null,
                text: await r.text(),
            };
    }
    return null;
});
