import onDomReady from "dom-loaded";

import { log } from "utils/log";

export const onAjaxedPagesRaw = async (callback: () => void): Promise<void> => {
    await onDomReady;
    document.addEventListener("pjax:end", callback);
    return callback();
};

export const featureSet = new Set<Feature>();
export const initAll = () =>
    featureSet.forEach(async ({ id, include, init, load }) => {
        if (include()) {
            try {
                await load(init);
                log("🐙", id);
            } catch (error) {
                log("☠️", id);
                log.error(error);
            }
        }
    });
