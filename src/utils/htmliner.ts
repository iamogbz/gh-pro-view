import cheerio from "cheerio";
import path from "path";

export const isAbsolute = (p: string) => p && /^(?:[a-z]+:)?\/\//i.test(p);

interface ResourceDefinition {
    selector?: string;
    tasks: Array<Promise<string>>;
    insert?(content: string): void;
    queue?(value: CheerioElement, ongoing: Array<Promise<string>>): void;
}

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
            insert: content => {
                const node = document.createElement("style");
                node.setAttribute("type", "text/css");
                node.innerHTML = content;
                $("head").append(node.outerHTML);
            },
            queue: (v, q) => v.attribs.href && q.push(resolve(v.attribs.href)),
            selector: `link[rel="stylesheet"]`,
            tasks: [],
        },
        img: { tasks: [] },
        js: {
            insert: content => {
                const node = document.createElement("script");
                node.setAttribute("type", "application/javascript");
                node.innerHTML = content;
                $("body").append(node.outerHTML);
            },
            queue: (v, q) => v.attribs.href && q.push(resolve(v.attribs.href)),
            selector: `script[src*=".js"]`,
            tasks: [],
        },
    };

    for (const [, r] of Object.entries(resources)) {
        if (!r.selector) continue;
        $(r.selector)
            .each((_, v) => r.queue(v, r.tasks))
            .remove();
        await Promise.all(r.tasks.map(t => t.then(r.insert)));
    }

    return $.html();
};
