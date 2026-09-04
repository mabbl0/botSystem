
/*** Conf Component ***/

export interface ComponentConf {
    /** log level */
    logLevel?: LogLevel
    /** path to the component save file, from the save directory */
    savePathFile?: string
    /** version of the component save file */
    saveFileVersion?: number
}

/** @internal */
export const enum ComponentType {
    BotSystem,
    Component,
    Extension
}

export const enum LogLevel {
    None,
    Error,
    Warning,
    Info,
    Verbose,
    Debug
}

export type LogLevelStr = 'Unknown' | 'None' | 'Error' | 'Warning' | 'Verbose' | 'Info' | 'Debug';
