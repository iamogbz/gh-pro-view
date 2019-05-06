import * as path from "path";

export const getFileType = (
    fileName: string,
    numfileTypes: number = 1,
): string => {
    const delimiter = ".";
    const basename = path.basename(fileName);
    const [, ...fileTypes] = basename.split(delimiter);
    if (fileTypes.length === 0) return null;
    if (!numfileTypes) {
        return fileTypes.join(delimiter);
    }
    return fileTypes
        .slice(Math.max(fileTypes.length - numfileTypes, 0))
        .join(delimiter);
};
