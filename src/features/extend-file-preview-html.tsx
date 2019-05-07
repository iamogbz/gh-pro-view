import { PositionProperty } from "csstype";
import React from "dom-chef";
import { featureSet, onAjaxedPagesRaw } from "features";
import select from "select-dom";
import * as api from "utils/api";
import { getFileType } from "utils/file-type";
import { log } from "utils/log";
import { observeEl } from "utils/mutation-observer";
import { isPRFiles, isSingleFile } from "utils/page-detect";
import { selectOrThrow } from "utils/select-or-throw";
import { getRepoPath, getUserRepo } from "utils/url-path";

const featureClass = "ghprv-extend-file-preview-html";
const htmlTypes: Set<string> = new Set(["html", "xhtml"]);

const pathToBlob = (path: string) =>
    `https://raw.githubusercontent.com/${getUserRepo()}/${path}`;
const pathToApi = (path: string) => `repos/${getUserRepo()}/contents/${path}`;
const safeFetch = (input: RequestInfo, init?: RequestInit) =>
    fetch(input, init).then(r => {
        if (r.status !== 200) throw new Error(`${r.status} - ${r.statusText}`);
        return r;
    });

const getFileContent = async (path: string) => {
    try {
        return await safeFetch(pathToBlob(path)).then(r => r.text());
    } catch (e) {
        // log.error(e);
        const [ref, ...rest] = path.split("/");
        const { content } = await api.v3(
            `${pathToApi(rest.join("/"))}?ref=${ref}`,
        );
        return atob(content);
    }
};

const asNode = (element: JSX.Element): Node => (element as unknown) as Node;

const selectButton = (element: HTMLElement) => {
    select(
        `.BtnGroup.${featureClass} .BtnGroup-item.selected`,
    ).classList.remove("selected");
    element.classList.add("selected");
    element.blur();
};

const showSource = (frameElem: HTMLElement) => (event: React.MouseEvent) => {
    frameElem.style.display = "none";
    const frameParent = frameElem.parentElement;
    log(frameParent);
    frameParent.style.overflowX = "auto";
    frameParent.style.height = "auto";
    return selectButton(event.currentTarget as HTMLElement);
};
const showRendered = (frameElem: HTMLElement) => (event: React.MouseEvent) => {
    frameElem.style.display = "block";
    const frameParent = frameElem.parentElement;
    log((frameElem as AnyObject).contentWindow.document.body.scrollHeight);
    frameParent.style.overflowX = "hidden";
    frameParent.style.height = `${(frameElem as AnyObject).contentWindow
        .document.body.scrollHeight + 20}px`;
    return selectButton(event.currentTarget as HTMLElement);
};

const viewerButtonToggleGroup = ({
    frameElem,
    isPR,
}: {
    frameElem?: HTMLElement;
    isPR: boolean;
}) => {
    const disabled = frameElem ? false : true;
    const disabledTooltip = "HTML render toggle disabled";
    return (
        <span className={`BtnGroup ${featureClass} ${isPR ? "mt-n1" : ""}`}>
            <button
                className={`btn btn-sm BtnGroup-item tooltipped tooltipped-${
                    isPR ? "w" : "n"
                } source ${isPR ? "js-source" : ""} ${isPR ? "" : "selected"}`}
                disabled={disabled}
                aria-current="true"
                aria-label={
                    disabled
                        ? disabledTooltip
                        : `Display the source ${isPR ? "diff" : "blob"}`
                }
                onClick={disabled ? null : showSource(frameElem)}
                data-disable-with=""
            >
                <svg
                    className="octicon octicon-code"
                    viewBox="0 0 14 16"
                    version="1.1"
                    width="14"
                    height="16"
                    aria-hidden="true"
                >
                    <path
                        fill-rule="evenodd"
                        d="M9.5 3L8 4.5 11.5 8 8 11.5 9.5 13 14 8 9.5 3zm-5 0L0 8l4.5 5L6 11.5 2.5 8 6 4.5 4.5 3z"
                    />
                </svg>
            </button>
            <button
                className={`btn btn-sm BtnGroup-item tooltipped tooltipped-${
                    isPR ? "w" : "n"
                } rendered ${isPR ? "js-rendered" : ""}`}
                disabled={disabled}
                aria-label={
                    disabled
                        ? disabledTooltip
                        : `Display the ${isPR ? "rich diff" : "rendered blob"}`
                }
                onClick={disabled ? null : showRendered(frameElem)}
                data-disable-with=""
            >
                <svg
                    className="octicon octicon-file"
                    viewBox="0 0 12 16"
                    version="1.1"
                    width="12"
                    height="16"
                    aria-hidden="true"
                >
                    <path
                        fill-rule="evenodd"
                        d={`M6 5H2V4h4v1zM2 8h7V7H2v1zm0 2h7V9H2v1zm0 2h7v-1H2v1zm10-7.5V14c0 .55-.45
                    1-1 1H1c-.55 0-1-.45-1-1V2c0-.55.45-1 1-1h7.5L12 4.5zM11 5L8 2H1v12h10V5z`}
                    />
                </svg>
            </button>
        </span>
    );
};

const frameStyle = {
    background: "white",
    border: "none",
    display: "none",
    height: "100%",
    left: 0,
    padding: 0,
    position: "absolute" as PositionProperty,
    top: 0,
    width: "100%",
};
const frameElement = (props: { src: string; srcDoc: string }) => (
    <iframe style={frameStyle} className={featureClass} {...props} />
);

const addButtonsToFileHeaderActions = (
    actionsElem: HTMLElement,
    frameElem: HTMLElement,
): void => {
    if (select.exists(`.BtnGroup.${featureClass}`, actionsElem)) return;
    actionsElem.insertBefore(
        asNode(viewerButtonToggleGroup({ isPR: isPRFiles(), frameElem })),
        actionsElem.firstChild,
    );
};

const addFrameToFileBody = (
    bodyElem: HTMLElement,
    frameURL: string,
    frameHTML: string,
): HTMLElement => {
    if (select.exists(`iframe.${featureClass}`, bodyElem)) {
        return select(`iframe.${featureClass}`, bodyElem);
    }
    const frameElem = frameElement({ src: frameURL, srcDoc: frameHTML });
    bodyElem.style.position = "relative";
    return bodyElem.appendChild(asNode(frameElem)) as HTMLElement;
};

const extendHtmlFileDetailsElements = async (): Promise<void> => {
    const commitSha = (select(
        ".js-reviews-container #head_sha",
    ) as HTMLInputElement).value;
    for (const elem of select.all(".file.Details")) {
        const fileHeaderElem: HTMLElement = selectOrThrow(".file-header", elem);
        if (!fileHeaderElem.dataset.path) continue;
        const filePath = `${commitSha}/${fileHeaderElem.dataset.path}`;
        const fileType = getFileType(filePath);
        if (!htmlTypes.has(fileType)) continue;
        const fileHTML = await getFileContent(filePath);
        const frameElem = addFrameToFileBody(
            selectOrThrow(".js-file-content", elem),
            pathToBlob(filePath),
            fileHTML,
        );
        addButtonsToFileHeaderActions(
            selectOrThrow(".file-actions>.mt-1", fileHeaderElem),
            frameElem,
        );
    }
};

const initPRFiles = async (): Promise<void> => {
    observeEl("#files", extendHtmlFileDetailsElements, {
        childList: true,
        subtree: true,
    });
};

const initSingleFile = async (): Promise<void> => {
    const fileHeaderElem: HTMLElement = selectOrThrow(
        ".Box.mt-3>.Box-header.py-2",
    );
    const filePath = getRepoPath().replace("blob/", "");
    const fileType = getFileType(filePath);
    if (!htmlTypes.has(fileType)) return;
    const fileHTML = await getFileContent(filePath);
    const frameElem = addFrameToFileBody(
        selectOrThrow(".Box.mt-3>.Box-body.blob-wrapper"),
        pathToBlob(filePath),
        fileHTML,
    );
    addButtonsToFileHeaderActions(
        selectOrThrow(".d-flex", fileHeaderElem),
        frameElem,
    );
};

const initFeature = async (): Promise<boolean> => {
    const enabled = [
        isPRFiles() && initPRFiles(),
        isSingleFile() && initSingleFile(),
    ];
    return enabled.some(Boolean);
};

featureSet.add({
    id: "extend-file-preview-html",
    include: () => isPRFiles() || isSingleFile(),
    init: initFeature,
    load: onAjaxedPagesRaw,
});
