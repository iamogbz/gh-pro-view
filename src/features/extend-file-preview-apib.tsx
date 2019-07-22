import { renderHtml } from "blueprint-markdown-renderer";
import { PositionProperty } from "csstype";
import React from "dom-chef";
import { featureSet, onAjaxedPagesRaw } from "features";
import select from "select-dom";

import * as api from "utils/api";
import { getFileType } from "utils/file-type";
import { log } from "utils/log";
import { observeEl } from "utils/mutation-observer";
import { isCommit, isPRFiles, isSingleFile } from "utils/page-detect";
import { selectOrThrow } from "utils/select-or-throw";
import { getCommitSha, getRepoPath, getUserRepo } from "utils/url-path";

const featureClass = "ghprv-extend-file-preview-apib";
const apibTypes: Set<string> = new Set(["apib"]);
const toggleActionSource = "source";
const toggleActionRender = "render";

const isApib = (filePath: string) => apibTypes.has(getFileType(filePath));

const pathToBlob = (filePath: string) =>
    `https://raw.githubusercontent.com/${getUserRepo()}/${filePath}`;
const pathToApi = (filePath: string) =>
    `repos/${getUserRepo()}/contents/${filePath}`;
const safeFetch = (input: RequestInfo, init?: RequestInit) =>
    fetch(input, init).then(r => {
        if (r.status !== 200) throw new Error(`${r.status} - ${r.statusText}`);
        return r;
    });

const getFileContent = async (filePath: string): Promise<string> =>
    safeFetch(pathToBlob(filePath))
        .then(r => r.text())
        .catch(async e => {
            log.info(e);
            const [ref, ...rest] = filePath.split("/");
            const r = await api.v3(`${pathToApi(rest.join("/"))}?ref=${ref}`);
            return atob(r.content);
        })
        .catch(e => {
            log.error(e);
            return null;
        });

const prepareAPIB = async (apibContent: string): Promise<string> =>
    renderHtml(apibContent);

const asNode = (element: JSX.Element): Node => (element as unknown) as Node;

const selectButton = (element: HTMLElement) => {
    const selectedButton = select(
        `.BtnGroup.${featureClass} .BtnGroup-item.selected`,
    );
    if (selectedButton) selectedButton.classList.remove("selected");
    element.classList.add("selected");
    element.blur();
};

const showSource = (frameElem: HTMLElement) => (event: any) => {
    const button = event.currentTarget as HTMLButtonElement;
    if (button.disabled || !frameElem) return;
    frameElem.style.display = "none";
    const frameParent = frameElem.parentElement;
    frameParent.style.removeProperty("overflow");
    frameParent.style.removeProperty("height");
    frameParent.style.removeProperty("max-height");
    return selectButton(button);
};
const showRendered = (frameElem: HTMLElement) => (event: any) => {
    const button = event.currentTarget as HTMLButtonElement;
    if (button.disabled || !frameElem) return;
    frameElem.style.display = "block";
    const frameParent = frameElem.parentElement;
    frameParent.style.overflow = "hidden";
    const height = `${(frameElem as AnyObject).contentWindow.document.body
        .scrollHeight + 32}px`;
    frameParent.style.height = height;
    frameParent.style.maxHeight = height;
    return selectButton(button);
};

const updateToggle = (
    button: HTMLButtonElement,
    frameElem: HTMLElement,
): void => {
    button.disabled = frameElem === null;
    if (button.dataset.toggleAction === toggleActionRender) {
        button.onclick = showRendered(frameElem);
    }
    if (button.dataset.toggleAction === toggleActionSource) {
        button.onclick = showSource(frameElem);
    }
    button.setAttribute(
        "aria-label",
        button.disabled
            ? button.dataset.labelDisabled
            : button.dataset.labelEnabled,
    );
};

const viewerButtonToggleGroup = ({
    frameElem,
    isFileList,
}: {
    frameElem?: HTMLElement;
    isFileList: boolean;
}) => {
    const disabled = frameElem ? false : true;
    const disabledTooltip = "APIB render toggle disabled";
    const sourceButton = (
        <button
            className={`btn btn-sm BtnGroup-item tooltipped tooltipped-${
                isFileList ? "w" : "n"
            } source ${isFileList ? "js-source" : ""} ${
                isFileList ? "" : "selected"
            }`}
            disabled={disabled}
            aria-current="true"
            onClick={showSource(frameElem)}
            data-disable-with=""
            data-label-disabled={disabledTooltip}
            data-label-enabled={`Display the source ${
                isFileList ? "diff" : "blob"
            }`}
            data-toggle-action={toggleActionSource}
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
    );
    const renderButton = (
        <button
            className={`btn btn-sm BtnGroup-item tooltipped tooltipped-${
                isFileList ? "w" : "n"
            } rendered ${isFileList ? "js-rendered" : ""}`}
            disabled={disabled}
            onClick={showRendered(frameElem)}
            data-disable-with=""
            data-label-disabled={disabledTooltip}
            data-label-enabled={`Display the ${
                isFileList ? "rich diff" : "rendered blob"
            }`}
            data-toggle-action={toggleActionRender}
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
    );
    updateToggle(asNode(sourceButton) as HTMLButtonElement, frameElem);
    updateToggle(asNode(renderButton) as HTMLButtonElement, frameElem);
    return (
        <span className={`BtnGroup ${featureClass}`}>
            {sourceButton}
            {renderButton}
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
    const target = `.BtnGroup.${featureClass}`;
    if (select.exists(target, actionsElem)) {
        select(target, actionsElem).childNodes.forEach(
            (elem: HTMLInputElement) => {
                updateToggle(elem, frameElem);
            },
        );
        return;
    }
    actionsElem.insertBefore(
        asNode(
            viewerButtonToggleGroup({
                frameElem,
                isFileList: isPRFiles() || isCommit(),
            }),
        ),
        actionsElem.firstChild,
    );
};

const addFrameToFileBody = async (
    bodyElem: HTMLElement,
    filePath: string,
    canDefer: boolean,
): Promise<HTMLElement> => {
    if (canDefer && !select.exists(".js-blob-wrapper", bodyElem)) {
        return null;
    }
    if (select.exists(`iframe.${featureClass}`, bodyElem)) {
        return select(`iframe.${featureClass}`, bodyElem);
    }
    const frameApib = await getFileContent(filePath).then(prepareAPIB);
    const frameElem = frameElement({
        src: `https://apibpreview.github.io/?${pathToBlob(filePath)}`,
        srcDoc: frameApib,
    });
    bodyElem.style.position = "relative";
    return bodyElem.appendChild(asNode(frameElem)) as HTMLElement;
};

const extendApibFileDetailsElements = (commitSha: string) => async () =>
    Promise.all(
        select.all(".file.Details").map(async elem => {
            const fileHeaderElem: HTMLElement = selectOrThrow(
                ".file-header",
                elem,
            );
            if (!fileHeaderElem.dataset.path) return;
            const filePath = `${commitSha}/${fileHeaderElem.dataset.path}`;
            if (!isApib(filePath)) return;
            return addFrameToFileBody(
                selectOrThrow(".js-file-content", elem),
                filePath,
                true,
            )
                .then(frameElem =>
                    addButtonsToFileHeaderActions(
                        selectOrThrow(
                            ".file-actions>.flex-items-stretch",
                            fileHeaderElem,
                        ),
                        frameElem,
                    ),
                )
                .catch(e => log.error(e));
        }),
    );

const initCommit = (): void => {
    observeEl("#files", extendApibFileDetailsElements(getCommitSha()), {
        childList: true,
        subtree: true,
    });
};

const initPRFiles = (): void => {
    const commitSha = (select(
        ".js-reviews-container #head_sha",
    ) as HTMLInputElement).value;
    observeEl("#files", extendApibFileDetailsElements(commitSha), {
        childList: true,
        subtree: true,
    });
};

const initSingleFile = async (): Promise<void> => {
    const fileHeaderElem: HTMLElement = selectOrThrow(
        ".Box.mt-3>.Box-header.py-2",
    );
    const filePath = getRepoPath().replace("blob/", "");
    if (!isApib(filePath)) return;
    const frameElem = await addFrameToFileBody(
        selectOrThrow(".Box.mt-3>.Box-body.blob-wrapper"),
        filePath,
        false,
    );
    addButtonsToFileHeaderActions(
        selectOrThrow(".d-flex", fileHeaderElem),
        frameElem,
    );
};

const initFeature = async (): Promise<boolean> => {
    const enabled = [
        isPRFiles() && initPRFiles(),
        isSingleFile() && (await initSingleFile()),
        isCommit() && initCommit(),
    ];
    return enabled.some(Boolean);
};

featureSet.add({
    id: "extend-file-preview-apib",
    include: () => isCommit() || isPRFiles() || isSingleFile(),
    init: initFeature,
    load: onAjaxedPagesRaw,
});
