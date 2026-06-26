
/*** Conf Component ***/

export interface ComponentConf {
    logLevel?: LogLevel
    savePathFile?: string
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

export type LogLevelStr = 'Unknow' | 'None' | 'Error' | 'Warning' | 'Verbose' | 'Info' | 'Debug';
