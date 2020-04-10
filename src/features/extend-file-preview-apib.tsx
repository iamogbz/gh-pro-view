import { request } from "utils/send-to-bg";
import { ExtendFilePreview } from "./extend-file-preview";

class ExtendFilePreviewAPIB extends ExtendFilePreview {
    protected id: string;
    protected featureClass: string;
    protected fileTypes: Set<string>;

    constructor() {
        super();
        this.id = "extend-file-preview-apib";
        this.fileTypes = new Set(["apib"]);
        this.featureClass = "ghprv-extend-file-preview-apib";
    }

    protected async prepareHTML(fileContent: string) {
        const host = "https://d31myey2oeipxs.cloudfront.net/v1";
        const apib = Buffer.from(fileContent).toString("base64");
        const renderedHtml = (
            await request(host, {
                headers: { "X-Blueprint": apib }
            })
        ).text;
        return renderedHtml
            .replace(/<a/g, `<a target="_blank"`)
            .replace(/href="#/g, `style="cursor:default" no-href="#`)
            .replace(".collapse-button{", ".collapse-button{display:none;")
            .replace(".collapse-content{max-height:0;", ".collapse-content{");
    }
}

new ExtendFilePreviewAPIB().setup();
