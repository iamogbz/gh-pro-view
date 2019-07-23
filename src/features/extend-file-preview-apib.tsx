import { renderHtml } from "blueprint-markdown-renderer";

import { include } from "utils/htmliner";
import { ExtendFilePreview } from "./extend-file-preview";

const css = `
html {
    margin: 0;
    padding: 0;
    border: none;
    font-family: "Source Sans Pro", Roboto, Arial, san-serif;
}
body {
    margin: 0;
    padding: 0 16px;
    border: none;
}
h1 {
    color: #0366d6
}
h2 {
    color: #0246a6
}
h3 {
    color: #012686
}
h4 {
    color: #001666
}
a {
    color: #0366d6
}
pre, code {
    background-color: #eee;
    border-radius: 8px;
}
pre {
    padding: 8px;
}
code {
    padding: 2px 6px;
}
pre > code {
    background-color: initial;
    border-radius: initial;
    padding: initial;
}
`;

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
        return include(renderHtml(fileContent), "head", "style", css, {
            rel: "stylesheet",
        });
    }
}

new ExtendFilePreviewAPIB().setup();
