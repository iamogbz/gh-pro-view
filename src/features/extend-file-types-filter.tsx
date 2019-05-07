import React from "dom-chef";
import { featureSet, onAjaxedPagesRaw } from "features";
import debounce from "lodash/debounce";
import select from "select-dom";
import * as api from "utils/api";
import { getFileType } from "utils/file-type";
import { observeEl } from "utils/mutation-observer";
import { isPRFiles } from "utils/page-detect";
import { selectOrThrow } from "utils/select-or-throw";
import { getCleanPathname } from "utils/url-path";

// --> Types and Interfaces
interface PRFile {
    fileName: string;
    isDeleted: boolean;
}

interface PRFileTypes {
    [fileType: string]: {
        count: number;
        deleted: number;
    };
}

interface State {
    prFiles: PRFile[];
    prFileTypes: PRFileTypes;
    selectedFileTypes: Set<string>;
    shouldExtendFileType: boolean;
}
// <-- Types and Interfaces

// --> State & Transitions
const state: State = {
    prFileTypes: {},
    prFiles: [],
    selectedFileTypes: new Set(),
    shouldExtendFileType: true,
};

const setState = (
    diff: Partial<State>,
    callback: (updated: boolean) => any,
): void => {
    const newState: State = { ...state, ...diff };
    if (JSON.stringify(state) === JSON.stringify(newState)) {
        callback(false);
        return;
    }

    Object.assign(state, newState);
    callback(true);
};
// <-- State & Transitions

// --> Helpers and Utils
const sortObject = (unsorted: AnyObject): AnyObject => {
    const sorted: AnyObject = {};
    const compareFn = (a: any, b: any) => (a > b ? 1 : 0 - Number(a < b));
    for (const key of Object.keys(unsorted).sort(compareFn)) {
        sorted[key] = unsorted[key];
    }

    return sorted;
};

const getPRFiles = async (): Promise<PRFile[]> => {
    const pullUrl = getCleanPathname().replace("/pull/", "/pulls/");
    const apiUrl = `repos/${pullUrl}?per_page=1000`;
    const result = await api.v3(apiUrl); // Uses v3 as v4 does not contain deleted status information
    console.log(result);
    return result.map(
        ({ status, filename }: { status: string; filename: string }) => ({
            fileName: filename,
            isDeleted: status === "removed",
        }),
    );
};

const getExtendedFileType = (
    fileName: string,
    shouldExtend: boolean = state.shouldExtendFileType,
): string => {
    const fileType = getFileType(fileName, shouldExtend ? 0 : 1);
    return fileType ? `.${fileType}` : "No extension";
};

const groupPRFileTypes = (prFiles: PRFile[]): PRFileTypes => {
    const grouped: Record<string, { count: number; deleted: number }> = {};
    for (const { fileName, isDeleted } of prFiles) {
        const fileType = getExtendedFileType(fileName);
        if (!(fileType in grouped)) {
            grouped[fileType] = { count: 0, deleted: 0 };
        }

        grouped[fileType].count += 1;
        if (isDeleted) {
            grouped[fileType].deleted += 1;
        }
    }

    return sortObject(grouped);
};
// <-- Helpers and Utils

// --> DOM Element Classes and Selectors
const fileFilterSelectAllClass = "js-file-filter-select-all-container";
const fileFilterDeselectAllClass = "ghprv-deselect-all-file-types";
const fileFilterExtendToggleId = "ghprv-extend-file-types-toggle";

const getFileFilterElement = (): HTMLElement =>
    selectOrThrow(".js-file-filter");

const getFilterListElement = (): HTMLElement =>
    selectOrThrow(".select-menu-list .p-2", getFileFilterElement());

const getFilterToggleTypeElement = (fileType: string): HTMLInputElement =>
    selectOrThrow(
        `.js-diff-file-type-option[value="${fileType}"]`,
        getFilterListElement(),
    );
// <-- DOM Element Classes and Selectors

// --> JSX Element Constructors
const asNode = (element: JSX.Element): Node => (element as unknown) as Node;

const extendFileTypesToggle = ({ onChange }: { onChange(): void }) => (
    <label>
        <span>Use full extension </span>
        <input
            type="checkbox"
            id={fileFilterExtendToggleId}
            checked={state.shouldExtendFileType}
            onChange={onChange}
        />
    </label>
);

const fileTypeToggle = ({
    deletedCount,
    fileType,
    onChange,
    totalCount,
}: {
    deletedCount: number;
    fileType: string;
    totalCount: number;
    onChange(): void;
}) => {
    const nonDeletedCount = totalCount - deletedCount;
    const markup = (count: number): string => `(${count})`;
    return asNode(
        <div className="d-flex">
            <label className="pl-1 mb-1">
                <input
                    className="js-diff-file-type-option"
                    type="checkbox"
                    checked={true}
                    onChange={onChange}
                    value={fileType}
                    data-deleted-files-count={deletedCount}
                    data-non-deleted-files-count={nonDeletedCount}
                />
                {` ${fileType}`}
                <span
                    className="text-normal js-file-type-count"
                    data-all-file-count-markup={markup(totalCount)}
                    data-deleted-file-count-markup={markup(deletedCount)}
                    data-non-deleted-file-count-markup={markup(nonDeletedCount)}
                >
                    {markup(totalCount)}
                </span>
            </label>
        </div>,
    );
};

const selectAllToggle = ({
    count,
    onClick,
}: {
    count: number;
    onClick(): void;
}) => {
    const typeMarkup = count > 1 ? "types" : "type";
    const selectAllMarkup = `Select all ${count} file ${typeMarkup}`;
    const allSelectedMarkup = `All ${count} file ${typeMarkup} selected`;
    return asNode(
        <div className="ml-1" style={{ padding: "4px 0 0" }}>
            <label style={{ cursor: "pointer" }}>
                <input
                    type="checkbox"
                    className="js-file-filter-select-all"
                    hidden
                />
                <span
                    className={`${fileFilterSelectAllClass} no-underline text-normal text-gray`}
                    data-select-all-markup={selectAllMarkup}
                    data-all-selected-markup={allSelectedMarkup}
                    onClick={onClick}
                >
                    {allSelectedMarkup}
                </span>
            </label>
        </div>,
    );
};

const deselectAllToggle = ({
    count,
    onClick,
}: {
    count: number;
    onClick(): void;
}) => {
    const typeMarkup = count > 1 ? "types" : "type";
    const deselectAllMarkup = `Deselect all ${count} file ${typeMarkup}`;
    const allDeselectedMarkup = `All ${count} file ${typeMarkup} deselected`;
    return asNode(
        <div className="ml-1" style={{ padding: "6px 0 0" }}>
            <label style={{ cursor: "pointer" }}>
                <input type="checkbox" hidden />
                <span
                    className={`${fileFilterDeselectAllClass} no-underline text-normal text-blue`}
                    onClick={onClick}
                    data-deselect-all-markup={deselectAllMarkup}
                    data-all-deselected-markup={allDeselectedMarkup}
                >
                    {deselectAllMarkup}
                </span>
            </label>
        </div>,
    );
};
// <-- JSX Element Constructors

// --> Update DOM from State
const extendFileDetailsElements = (): void => {
    for (const elem of select.all(".file.Details")) {
        const fileHeaderElem: HTMLElement = selectOrThrow(".file-header", elem);
        if (!fileHeaderElem.dataset.path) {
            return;
        }

        const fileType = getExtendedFileType(fileHeaderElem.dataset.path);
        fileHeaderElem.dataset.fileType = fileType;
        elem.dataset.fileType = fileType;
    }
};

const updateFilterDeselectAllElement = () => {
    const { prFileTypes } = state;
    const fileTypes = Object.keys(prFileTypes);
    state.selectedFileTypes = new Set(
        fileTypes.filter(
            fileType => getFilterToggleTypeElement(fileType).checked,
        ),
    );
    const deselectElement: HTMLElement = selectOrThrow(
        `.${fileFilterDeselectAllClass}`,
        getFilterListElement(),
    );
    const isShowingSomeTypes = state.selectedFileTypes.size > 0;
    deselectElement.classList.remove(
        `text-${isShowingSomeTypes ? "gray" : "blue"}`,
    );
    deselectElement.classList.add(
        `text-${isShowingSomeTypes ? "blue" : "gray"}`,
    );
    const { deselectAllMarkup, allDeselectedMarkup } = deselectElement.dataset;
    deselectElement.innerText = isShowingSomeTypes
        ? (deselectAllMarkup as string)
        : (allDeselectedMarkup as string);
};

const onDeselectAllToggle = () => {
    if (state.selectedFileTypes.size > 0) {
        for (const fileType of state.selectedFileTypes) {
            getFilterToggleTypeElement(fileType).click();
        }
    } else {
        updateFilterDeselectAllElement();
    }
};

const extendFilterListElement = (): void => {
    const filterList = getFilterListElement();
    filterList.textContent = "";
    const { prFileTypes } = state;
    const fileTypes = Object.keys(prFileTypes);
    const onChange = debounce(updateFilterDeselectAllElement, 50);
    for (const fileType of fileTypes) {
        const props = {
            deletedCount: prFileTypes[fileType].deleted,
            fileType,
            onChange,
            totalCount: prFileTypes[fileType].count,
        };
        filterList.append(fileTypeToggle(props));
    }

    filterList.append(
        selectAllToggle({ count: fileTypes.length, onClick: onChange }),
    );
    const onClick = debounce(onDeselectAllToggle, 50);
    filterList.append(deselectAllToggle({ count: fileTypes.length, onClick }));
    updateFilterDeselectAllElement();
};

const updateFileTypesState = (): void => {
    setState(
        {
            prFileTypes: groupPRFileTypes(state.prFiles),
        },
        updated => {
            if (updated) {
                extendFileDetailsElements();
                extendFilterListElement();
            }
        },
    );
};

const onShouldExtendToggle = () => {
    const extendToggleElement: HTMLInputElement = selectOrThrow(
        `#${fileFilterExtendToggleId}`,
    );
    setState(
        {
            shouldExtendFileType: extendToggleElement
                ? extendToggleElement.checked
                : false,
        },
        updated => {
            if (updated) {
                const filterListElement = getFilterListElement();
                const numFileTypes = Object.keys(state.prFileTypes).length;
                if (state.selectedFileTypes.size !== numFileTypes) {
                    selectOrThrow(
                        `.${fileFilterSelectAllClass}`,
                        filterListElement,
                    ).click();
                }

                updateFileTypesState();
            }
        },
    );
};
// <-- Update DOM from State

// --> Initialise feature
const init = async (): Promise<void> => {
    state.prFiles = await getPRFiles();
    const selectMenuHeader = selectOrThrow(
        ".select-menu-header",
        getFileFilterElement(),
    );
    if (select.exists(`#${fileFilterExtendToggleId}`, selectMenuHeader)) return;
    selectMenuHeader.append(
        extendFileTypesToggle({ onChange: onShouldExtendToggle }),
    );
    updateFileTypesState();
    observeEl("#files", extendFileDetailsElements, { childList: true });
};

featureSet.add({
    id: "extend-file-types-filter",
    include: isPRFiles,
    init,
    load: onAjaxedPagesRaw,
});
