import cheerio from "cheerio";
import path from "path";

export const isAbsolute = (p: string) => p && /^(?:[a-z]+:)?\/\//i.test(p);
const noPrefix = (p: string) => isAbsolute(p) || p.startsWith("/");

interface ResourceDefinition {
    selector?: string;
    tasks: Array<Promise<void>>;
    cleanup?: boolean;
    callback?(v: CheerioElement): Promise<void>;
}

const insertInto = (
    $: CheerioStatic,
    selector: string,
    tagName: string,
    content: string = "",
    attributes: AnyObject = {},
) => {
    const elem = document.createElement(tagName);
    for (const [name, value] of Object.entries(attributes)) {
        elem.setAttribute(name, value);
    }
    elem.innerHTML = content;
    $(selector).append(elem.outerHTML);
};

export const inline = async ({
    base,
    html,
    folder = "",
    load = async () => "",
}: {
    base: string;
    html: string;
    folder: string;
    load?(url: string): Promise<string>;
}) => {
    const $ = cheerio.load(html);
    const retrieve = async (target: string) => {
        const noPre = noPrefix(target);
        return load(noPre ? target : path.normalize(`${folder}/${target}`));
    };

    const resources: {
        css: ResourceDefinition;
        img: ResourceDefinition;
        js: ResourceDefinition;
    } = {
        css: {
            callback: async (v: CheerioElement) => {
                if (!v.attribs.href) return;
                const content = await retrieve(v.attribs.href);
                insertInto($, "head", "style", content, { type: "text/css" });
            },
            cleanup: true,
            selector: `link[rel="stylesheet"]`,
            tasks: [],
        },
        img: {
            callback: async (v: CheerioElement) => {
                const target = v.attribs.src;
                if (!target) return;
                const newSrc = noPrefix(target) ? target : `${base}/${target}`;
                $(v).attr("src", newSrc);
            },
            selector: `img`,
            tasks: [],
        },
        /*
         * This just removes the javascript tags without replacements
         */
        js: {
            callback: async (v: CheerioElement) => {
                // if (!v.attribs.src) return;
                // const content = await retrieve(v.attribs.src);
                // insertInto($, "body", "script", content, {
                //     type: "application/javascript",
                // });
            },
            cleanup: true,
            selector: `script[src*=".js"]`,
            tasks: [],
        },
    };

    for (const [, r] of Object.entries(resources)) {
        if (!r.selector) continue;
        const c = $(r.selector);
        c.each((_, v) => r.tasks.push(r.callback(v)));
        await Promise.all(r.tasks).then(() => r.cleanup && c.remove());
    }

    return $.html();
};

export const include = (
    html: string,
    selector: string,
    tagName: string,
    content: string = "",
    attributes: AnyObject = {},
) => {
    const $ = cheerio.load(html);
    insertInto($, selector, tagName, content, attributes);
    return $.html();
};
