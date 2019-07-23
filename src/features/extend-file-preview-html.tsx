import path from "path";

import { inline } from "utils/htmliner";
import { ExtendFilePreview } from "./extend-file-preview";

class ExtendFilePreviewHTML extends ExtendFilePreview {
    protected id: string;
    protected featureClass: string;
    protected fileTypes: Set<string>;

    constructor() {
        super();
        this.id = "extend-file-preview-html";
        this.fileTypes = new Set(["html", "xhtml"]);
        this.featureClass = "ghprv-extend-file-preview-html";
    }

    protected async prepareHTML(fileContent: string, filePath: string) {
        return inline({
            base: path.dirname(this.pathToBlob(filePath)),
            folder: path.dirname(filePath),
            html: fileContent.replace(/<a/g, `<a target="_blank"`),
            load: this.getFileContent,
        });
    }
}

new ExtendFilePreviewHTML().setup();
