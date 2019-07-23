import { PositionProperty } from "csstype";
import React from "dom-chef";
import { featureSet, onAjaxedPagesRaw } from "features";
import select from "select-dom";

import * as api from "utils/api";
import { getFileType } from "utils/file-type";
import { isAbsolute } from "utils/htmliner";
import { log } from "utils/log";
import { observeEl } from "utils/mutation-observer";
import { isCommit, isPRFiles, isSingleFile } from "utils/page-detect";
import { selectOrThrow } from "utils/select-or-throw";
import { getCommitSha, getRepoPath, getUserRepo } from "utils/url-path";

export abstract class ExtendFilePreview {
    protected abstract id: string;
    protected abstract featureClass: string;
    protected abstract fileTypes: Set<string>;

    private toggleActionRender: string;
    private toggleActionSource: string;
    private frameStyle: object;

    public constructor() {
        this.toggleActionSource = "source";
        this.toggleActionRender = "render";
        this.frameStyle = {
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
    }

    public setup() {
        featureSet.add({
            id: this.id,
            include: () => isCommit() || isPRFiles() || isSingleFile(),
            init: this.initFeature.bind(this),
            load: onAjaxedPagesRaw,
        });
    }

    protected abstract async prepareHTML(
        fileContent: string,
        filePath: string,
    ): Promise<string>;

    protected pathToBlob(filePath: string) {
        return `https://raw.githubusercontent.com/${getUserRepo()}/${filePath}`;
    }

    protected async getFileContent(filePath: string): Promise<string> {
        try {
            const response = await this.safeFetch(
                isAbsolute(filePath) ? filePath : this.pathToBlob(filePath),
            );
            return response.text();
        } catch (e) {
            log.info(e);
        }
        if (isAbsolute(filePath)) return null;
        const [ref, ...rest] = filePath.split("/");
        try {
            const response = await api.v3(
                `${this.pathToApi(rest.join("/"))}?ref=${ref}`,
            );
            return atob(response.content);
        } catch (e) {
            log.error(e);
        }
        return null;
    }

    private isSupportedFile(filePath: string) {
        return this.fileTypes.has(getFileType(filePath));
    }

    private pathToApi(filePath: string) {
        return `repos/${getUserRepo()}/contents/${filePath}`;
    }

    private async safeFetch(input: RequestInfo, init?: RequestInit) {
        const r = await fetch(input, init);
        if (r.status !== 200) {
            throw new Error(`${r.status} - ${r.statusText}`);
        }
        return r;
    }

    private asNode(element: JSX.Element): Node {
        return (element as unknown) as Node;
    }

    private selectButton(element: HTMLElement) {
        const selectedButton = select(
            `.BtnGroup.${this.featureClass} .BtnGroup-item.selected`,
        );
        if (selectedButton) selectedButton.classList.remove("selected");
        element.classList.add("selected");
        element.blur();
    }

    private showSource(frameElem: HTMLElement) {
        return (event: any) => {
            const button = event.currentTarget as HTMLButtonElement;
            if (button.disabled || !frameElem) return;
            frameElem.style.display = "none";
            const frameParent = frameElem.parentElement;
            frameParent.style.removeProperty("overflow");
            frameParent.style.removeProperty("height");
            frameParent.style.removeProperty("max-height");
            return this.selectButton(button);
        };
    }

    private showRendered(frameElem: HTMLElement) {
        return (event: any) => {
            const button = event.currentTarget as HTMLButtonElement;
            if (button.disabled || !frameElem) return;
            frameElem.style.display = "block";
            const frameParent = frameElem.parentElement;
            frameParent.style.overflow = "hidden";
            const height = `${(frameElem as AnyObject).contentWindow.document
                .body.scrollHeight + 32}px`;
            frameParent.style.height = height;
            frameParent.style.maxHeight = height;
            return this.selectButton(button);
        };
    }

    private updateToggle(
        button: HTMLButtonElement,
        frameElem: HTMLElement,
    ): void {
        button.disabled = frameElem === null;
        if (button.dataset.toggleAction === this.toggleActionRender) {
            button.onclick = this.showRendered(frameElem);
        }
        if (button.dataset.toggleAction === this.toggleActionSource) {
            button.onclick = this.showSource(frameElem);
        }
        button.setAttribute(
            "aria-label",
            button.disabled
                ? button.dataset.labelDisabled
                : button.dataset.labelEnabled,
        );
    }

    private viewerButtonToggleGroup({
        frameElem,
        isFileList,
    }: {
        frameElem?: HTMLElement;
        isFileList: boolean;
    }) {
        const disabled = frameElem ? false : true;
        const disabledTooltip = "HTML render toggle disabled";
        const sourceButton = (
            <button
                className={`btn btn-sm BtnGroup-item tooltipped tooltipped-${
                    isFileList ? "w" : "n"
                } source ${isFileList ? "js-source" : ""} ${
                    isFileList ? "" : "selected"
                }`}
                disabled={disabled}
                aria-current="true"
                onClick={this.showSource(frameElem)}
                data-disable-with=""
                data-label-disabled={disabledTooltip}
                data-label-enabled={`Display the source ${
                    isFileList ? "diff" : "blob"
                }`}
                data-toggle-action={this.toggleActionSource}
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
                onClick={this.showRendered(frameElem)}
                data-disable-with=""
                data-label-disabled={disabledTooltip}
                data-label-enabled={`Display the ${
                    isFileList ? "rich diff" : "rendered blob"
                }`}
                data-toggle-action={this.toggleActionRender}
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
        this.updateToggle(
            this.asNode(sourceButton) as HTMLButtonElement,
            frameElem,
        );
        this.updateToggle(
            this.asNode(renderButton) as HTMLButtonElement,
            frameElem,
        );
        return (
            <span className={`BtnGroup ${this.featureClass}`}>
                {sourceButton}
                {renderButton}
            </span>
        );
    }

    private frameElement(props: { src: string; srcDoc: string }) {
        return (
            <iframe
                style={this.frameStyle}
                className={this.featureClass}
                {...props}
            />
        );
    }

    private addButtonsToFileHeaderActions(
        actionsElem: HTMLElement,
        frameElem: HTMLElement,
    ): void {
        const target = `.BtnGroup.${this.featureClass}`;
        if (select.exists(target, actionsElem)) {
            select(target, actionsElem).childNodes.forEach(
                (elem: HTMLInputElement) => {
                    this.updateToggle(elem, frameElem);
                },
            );
            return;
        }
        actionsElem.insertBefore(
            this.asNode(
                this.viewerButtonToggleGroup({
                    frameElem,
                    isFileList: isPRFiles() || isCommit(),
                }),
            ),
            actionsElem.firstChild,
        );
    }

    private async addFrameToFileBody(
        bodyElem: HTMLElement,
        filePath: string,
        canDefer: boolean,
    ): Promise<HTMLElement> {
        if (canDefer && !select.exists(".js-blob-wrapper", bodyElem)) {
            return null;
        }
        if (select.exists(`iframe.${this.featureClass}`, bodyElem)) {
            return select(`iframe.${this.featureClass}`, bodyElem);
        }
        const frameHtml = await this.getFileContent(filePath).then(html =>
            this.prepareHTML(html, filePath),
        );
        const frameElem = this.frameElement({
            src: `https://htmlpreview.github.io/?${this.pathToBlob(filePath)}`,
            srcDoc: frameHtml,
        });
        bodyElem.style.position = "relative";
        return bodyElem.appendChild(this.asNode(frameElem)) as HTMLElement;
    }

    private extendHtmlFileDetailsElements(commitSha: string) {
        return async () =>
            Promise.all(
                select.all(".file.Details").map(async elem => {
                    const fileHeaderElem: HTMLElement = selectOrThrow(
                        ".file-header",
                        elem,
                    );
                    if (!fileHeaderElem.dataset.path) return;
                    const filePath = `${commitSha}/${
                        fileHeaderElem.dataset.path
                    }`;
                    if (!this.isSupportedFile(filePath)) return;
                    return this.addFrameToFileBody(
                        selectOrThrow(".js-file-content", elem),
                        filePath,
                        true,
                    )
                        .then(frameElem =>
                            this.addButtonsToFileHeaderActions(
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
    }

    private initCommit(): void {
        observeEl(
            "#files",
            this.extendHtmlFileDetailsElements(getCommitSha()),
            {
                childList: true,
                subtree: true,
            },
        );
    }

    private initPRFiles(): void {
        const commitSha = (select(
            ".js-reviews-container #head_sha",
        ) as HTMLInputElement).value;
        observeEl("#files", this.extendHtmlFileDetailsElements(commitSha), {
            childList: true,
            subtree: true,
        });
    }

    private async initSingleFile(): Promise<void> {
        const fileHeaderElem: HTMLElement = selectOrThrow(
            ".Box.mt-3>.Box-header.py-2",
        );
        const filePath = getRepoPath().replace("blob/", "");
        if (!this.isSupportedFile(filePath)) return;
        const frameElem = await this.addFrameToFileBody(
            selectOrThrow(".Box.mt-3>.Box-body.blob-wrapper"),
            filePath,
            false,
        );
        this.addButtonsToFileHeaderActions(
            selectOrThrow(".d-flex", fileHeaderElem),
            frameElem,
        );
    }

    private async initFeature(): Promise<boolean> {
        const enabled = [
            isPRFiles() && this.initPRFiles(),
            isSingleFile() && (await this.initSingleFile()),
            isCommit() && this.initCommit(),
        ];
        return enabled.some(Boolean);
    }
}
