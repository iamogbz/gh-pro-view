import cheerio from "cheerio";
import path from "path";

export const isAbsolute = (p: string) => p && /^(?:[a-z]+:)?\/\//i.test(p);

interface ResourceDefinition {
    selector?: string;
    tasks: Array<Promise<string>>;
    insert?(content: string): void;
    queue?(value: CheerioElement, ongoing: Array<Promise<string>>): void;
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
    html,
    base = "",
    load = async () => "",
}: {
    html: string;
    base: string;
    load?(url: string): Promise<string>;
}) => {
    const $ = cheerio.load(html);
    const resolve = async (target: string) => {
        const noPrefix = isAbsolute(target) || target.startsWith("/");
        return load(noPrefix ? target : path.normalize(`${base}/${target}`));
    };
    const resources: {
        css: ResourceDefinition;
        img: ResourceDefinition;
        js: ResourceDefinition;
    } = {
        css: {
            insert: content =>
                insertInto($, "head", "style", content, { type: "text/css" }),
            queue: (v, q) => v.attribs.href && q.push(resolve(v.attribs.href)),
            selector: `link[rel="stylesheet"]`,
            tasks: [],
        },
        img: { tasks: [] },
        /*
         * This just removes the javascript tags without replacements
         */
        js: {
            // insert: content =>
            //     insertInto($, "body", "script", content, {
            //         type: "application/javascript",
            //     }),
            // queue: (v, q) => v.attribs.src && q.push(resolve(v.attribs.src)),
            selector: `script[src*=".js"]`,
            tasks: [],
        },
    };

    for (const [, r] of Object.entries(resources)) {
        if (!r.selector) continue;
        $(r.selector)
            .each((_, v) => r.queue && r.queue(v, r.tasks))
            .remove();
        await Promise.all(r.tasks.map(t => r.insert && t.then(r.insert)));
    }

    return $.html();
};
