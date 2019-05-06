import React from "dom-chef";
import { featureSet, onAjaxedPagesRaw } from "features";
import select from "select-dom";
import { getFileType } from "utils/file-type";
import { log } from "utils/log";
import { observeEl } from "utils/mutation-observer";
import { isPRFiles, isSingleFile } from "utils/page-detect";
import { selectOrThrow } from "utils/select-or-throw";

const asNode = (element: JSX.Element): Node => (element as unknown) as Node;
const viewerButtonToggleGroup = ({ isPR }: { isPR: boolean }) => (
    <span className={`BtnGroup ${isPR ? "mt-n1" : ""}`}>
        <button
            className={`btn btn-sm BtnGroup-item tooltipped tooltipped-${
                isPR ? "w" : "n"
            } source ${isPR ? "js-source" : ""} selected`}
            aria-current="true"
            aria-label={`Display the source ${isPR ? "diff" : "blob"}`}
            type="submit"
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
            aria-label={`Display the ${isPR ? "rich diff" : "rendered blob"}`}
            type="submit"
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

const addButtonsToFileHeaderActions = (fileHeaderElem: HTMLElement): void => {
    const mountPoint: HTMLElement = selectOrThrow(
        ".file-actions .mt-1",
        fileHeaderElem,
    );
    if (select.exists(".BtnGroup.mt-n1", fileHeaderElem)) return;
    mountPoint.insertBefore(
        asNode(viewerButtonToggleGroup({ isPR: isPRFiles() })),
        mountPoint.firstChild,
    );
};

const extendHtmlFileDetailsElements = (): void => {
    for (const elem of select.all(".file.Details")) {
        const fileHeaderElem: HTMLElement = selectOrThrow(".file-header", elem);
        if (!fileHeaderElem.dataset.path) {
            return;
        }

        const fileType = getFileType(fileHeaderElem.dataset.path);
        if (fileType === "html") {
            addButtonsToFileHeaderActions(fileHeaderElem);
        }
    }
};

const initPRFiles = async (): Promise<void> => {
    observeEl("#files", extendHtmlFileDetailsElements, { childList: true });
};

const initSingleFile = async (): Promise<void> => {
    log("init single file");
};

const init = async (): Promise<boolean> => {
    const enabled = [
        isPRFiles() && initPRFiles(),
        isSingleFile() && initSingleFile(),
    ];
    return enabled.some(Boolean);
};

featureSet.add({
    id: "extend-file-preview-html",
    include: () => isPRFiles() || isSingleFile(),
    init,
    load: onAjaxedPagesRaw,
});
