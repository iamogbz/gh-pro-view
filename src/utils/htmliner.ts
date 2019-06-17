import { parse } from "node-html-parser";

export const inline = async ({
    html,
    base = "",
    load = async () => "",
}: {
    html: string;
    base: string;
    load?(url: string): Promise<string>;
}) => {
    const root = parse(html, {
        pre: true,
        script: true,
        style: true,
    }) as AnyObject;
    const head = root.querySelector("head");
    const body = root.querySelector("body");
    const resolve = async (target: string) =>
        load(target.startsWith("/") ? target : `${base}/${target}`);
    // inline css
    await Promise.all(
        root.querySelectorAll("link").map(async (link: AnyObject) => {
            if (link.attributes.href && link.attributes.rel === "stylesheet") {
                const node = document.createElement("style");
                node.setAttribute("type", "text/css");
                node.innerHTML = await resolve(link.attributes.href);
                head.appendChild(node.outerHTML);
            }
        }),
    );
    // inline javascript
    await Promise.all(
        root.querySelectorAll("script").map(async (script: AnyObject) => {
            if (
                script.attributes.src &&
                script.attributes.src.includes(".js")
            ) {
                const node = document.createElement("script");
                node.setAttribute("type", "application/javascript");
                node.innerHTML = await resolve(script.attributes.src);
                body.appendChild(node.outerHTML);
            }
        }),
    );
    return root.toString();
};
