import { existFile, isJsonExtension, loadData, saveData } from "../../tools/file";
import { PropInterface } from "../property/property-interface";
import { LogLevel } from "./component-type";


interface ComponentSave {
    componentName: string
    lastDateSave: number  // date in ms since 1970
    saveFileVersion: number
}

export class SaveInterface {
    private componentName: string
    private canBeSave: boolean
    private pathFile: string
    private _lastDateSave: number
    private saveFileVersion: number

    private log: (logLevel: number, txt: string) => void

    constructor(logFct: (logLevel: number, txt: string) => void, componentName: string, propInterface: PropInterface, pathFile: string, saveFileVersion: number) {
        this.log = logFct;
        this.componentName = componentName;
        this.canBeSave = isJsonExtension(pathFile) && saveFileVersion>0;
        if(this.canBeSave) {
            this.pathFile = propInterface.getProp<string>("BotSystem", "saveDirPath")?.value + pathFile;
            this.saveFileVersion = saveFileVersion;
            this._lastDateSave = 0;
        }
    }

    get lastDateSave(): number {
        return this._lastDateSave;
    }

    get fileName(): string {
        return this.pathFile;
    }

    /**
     * Check and Load data from json file
     * @param defaultData default data in case of error
     * @returns the data loaded
     */
    load<DataType>(defaultData: DataType): DataType {
        if (!this.canBeSave) {
            this.log(LogLevel.Error, `Component ${this.componentName} is not authorized to load. Check component configuration file.`);
            return defaultData;
        }

        if (!existFile(this.pathFile)) {
            this.log(LogLevel.Error, `Component ${this.componentName} try to load an not existing file: ${this.pathFile}`);
            return defaultData;
        }

        let dataLoaded = loadData<ComponentSave & { data: DataType }>(this.pathFile);
        if (dataLoaded.componentName !== this.componentName) {
            this.log(LogLevel.Error, `Component ${this.componentName} try to load a file to an other component: ${dataLoaded.componentName} - ${this.pathFile}`);
            return defaultData;
        }
        // TODO: decrypt in encrypt option case 

        if (dataLoaded.saveFileVersion != this.saveFileVersion) {
            this.log(LogLevel.Warning, `Component ${this.componentName} load its file with wrong version. Expected: '${this.saveFileVersion}' - File: '${dataLoaded.saveFileVersion}'`);
            // complete the loaded data with the expected data
            const keysExpected = Object.keys(defaultData) as (keyof DataType)[];
            keysExpected.forEach(kExpectedStr => {
                if (dataLoaded.data[kExpectedStr] == undefined) {
                    dataLoaded.data[kExpectedStr] = defaultData[kExpectedStr];
                }
            });
        }

        this._lastDateSave = dataLoaded.lastDateSave;

        this.log(LogLevel.Info, `Component ${this.componentName} load file ${this.pathFile}`);
        return dataLoaded.data;
    }


    /**
     * Save data in json file
     * @param data data to save
     */
    save<DataType>(data: DataType): void {
        if (!this.canBeSave) {
            this.log(LogLevel.Error, `Component ${this.componentName} is not authorized to save. Check component configuration file.`);
            return;
        }

        this._lastDateSave = Date.now();
        let dataToSave: ComponentSave & { data: DataType } = {
            componentName: this.componentName,
            lastDateSave: this._lastDateSave,
            saveFileVersion: this.saveFileVersion,
            data: data
        }
        // TODO: encrypt option
        saveData(this.pathFile, dataToSave);
        this.log(LogLevel.Info, `Component ${this.componentName} save file ${this.pathFile}`);
    }
}
