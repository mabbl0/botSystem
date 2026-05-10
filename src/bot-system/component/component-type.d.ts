
/*** Conf Component ***/

export interface ComponentConf {
    logLevel?: LogLevel
    savePathFile?: string
    saveFileVersion?: number
}

export const enum ComponentType {
    BotSystem,
    Component,
    Extension
}

export const enum LogLevel {
    Error = 1,
    Warning,
    Info,
    Debug
}
