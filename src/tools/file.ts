import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';

/**
 * load data from a json file
 * @param jsonFilePath path to the the json file
 * @returns data load
 */
export function loadData<DataType>(jsonFilePath: string): DataType | undefined {
    const fileContent = readFileSync(jsonFilePath, 'utf-8');
    if(fileContent.length!=0) {
        return JSON.parse(fileContent) as DataType;
    }
    else {
        return undefined;
    }
}

/**
 * test if a data file exist
 * @param pathFile path to the file to test
 * @returns indicate if the file exist
 */
export function existFile(pathFile: string): boolean {
    return existsSync(pathFile);
}

/**
 * check if a directory exist and create it, if is not exist
 * @param dirPath path to the directory
 */
export function checkDirectory(dirPath: string): boolean {
    if (!existsSync(dirPath)) {
        mkdirSync(dirPath);
        return false;
    }
    return true;
}

/**
 * indicate if the file is a json extension
 * @param pathFile path to the file to test
 * @returns indicate if the file is a json extension
 */
export function isJsonExtension(pathFile: string): boolean {
    return (pathFile != undefined && pathFile.length != undefined) &&
        pathFile.match(/\.json$/g) != null;
}

/**
 * indicate if the file is a specific extension
 * @param pathFile path to the file to test
 * @param extension extension to test
 * @returns indicate if the file is a specific extension
 */
export function checkExtension(pathFile: string, extension: string): boolean {
    return (pathFile != undefined && pathFile.length != undefined) && 
        pathFile.match("\\.(" + extension + ")$") != null;
}

/**
 * indicate if the file is a specific extension
 * @param pathFile path to the file to test
 * @param extensionList list of extension to test
 * @returns indicate if the file is a specific extension
 */
export function checkExtensionList(pathFile: string, extensionList: string[]): boolean {
    return (pathFile != undefined && pathFile.length != undefined) && 
        pathFile.match("\\.(" + extensionList.reduce((strResult, str) => strResult + '|' + str, '') + ")$") != null;
}

/**
 * Save data to a file. Create if not exist. Truncate if exist.
 * @param jsonFilePath json path file to save data
 * @param data data to save
 */
export function saveData<DataType>(jsonFilePath: string, data: DataType) {
    writeFileSync(jsonFilePath, JSON.stringify(data), { encoding: 'utf-8', flag: 'w' });
}