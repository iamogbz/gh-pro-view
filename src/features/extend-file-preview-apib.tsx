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
        const host = "https://d18szazccv2vl6.cloudfront.net";
        const apib = Buffer.from(fileContent).toString("base64");
        return (await request(host, {
            headers: { "X-Blueprint": apib },
        })).text;
    }
}

new ExtendFilePreviewAPIB().setup();
