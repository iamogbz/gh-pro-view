import { renderHtml } from "blueprint-markdown-renderer";

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
        return renderHtml(fileContent)
    }
}

new ExtendFilePreviewAPIB().setup();
