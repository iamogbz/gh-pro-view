import select from "select-dom";

export const selectOrThrow = (selectors: any, ...args: any[]) => {
    const result = select(selectors, ...args);
    if (!result) {
        throw new Error(`Not found: ${selectors}, ${args}`);
    }
    return result;
};
