/*** Bot System Conf ***/

export interface UnitPath {
    name: string,
    path: string
}

export interface ComponentPath extends UnitPath {
    extensionList: Array<UnitPath>
}

export interface ComponentsConf {
    srcDir: string,
    confPath: string,
    componentList: Array<ComponentPath>
}

export interface CommunicationConf {
    generalChannel: string,
    botChannel: string,
    noButton?: boolean
}

export interface EventConf {
    wakeupDate: {
        maxWait: number
    }
}

export interface UserConf {
    adminIdList: Array<String>
}

export interface BotSystemConf {
    name: string,
    description: string,
    modeDev: boolean, // mode dev to disable other admin interaction
    dataDirPath: string,
    event: EventConf,
    users: UserConf,
    communication: CommunicationConf,
    components: ComponentsConf,
}

/*** State ***/

export const enum BotSystemState {
    Start, // BotSystem start
    Initialization, // Initialization of custom components
    Boot, // Boot of components after Api connexion
    Runtime, // After components boot or a !connect
    Pause // after a !disconnect
}
