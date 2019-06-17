import cheerio from "cheerio";
import path from "path";

export const isAbsolute = (p: string) => p && /^(?:[a-z]+:)?\/\//i.test(p);

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
    const tasks: Array<Promise<void>> = [];
    // inline css
    $(`link[rel="stylesheet"]`)
        .each((_, link) => {
            if (link.attribs.href) {
                tasks.push(
                    resolve(link.attribs.href).then(content => {
                        const node = document.createElement("style");
                        node.setAttribute("type", "text/css");
                        node.innerHTML = content;
                        $("head").append(node.outerHTML);
                    }),
                );
            }
        })
        .remove();
    // inline javascript
    $(`script[src*=".js"]`)
        .each((_, script) => {
            if (script.attribs.src) {
                tasks.push(
                    resolve(script.attribs.src).then(content => {
                        const node = document.createElement("script");
                        node.setAttribute("type", "application/javascript");
                        node.innerHTML = content;
                        $("body").append(node.outerHTML);
                    }),
                );
            }
        })
        .remove();
    await Promise.all(tasks);
    return $.html();
};
