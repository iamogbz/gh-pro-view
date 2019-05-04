export const observeEl = (
    el: Node | string,
    listener: MutationCallback,
    options: MutationObserverInit = { childList: true },
): MutationObserver | void => {
    const element = typeof el === "string" ? document.querySelector(el) : el;
    if (!element) {
        return;
    }

    // Run on updates
    const observer = new MutationObserver(listener);
    observer.observe(element, options);

    // Run the first time
    listener.call(observer, [], observer);

    return observer;
};
