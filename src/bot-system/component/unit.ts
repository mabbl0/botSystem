import { ComponentType, LogLevel } from './component-type'
import { LogInterface } from './log-interface'
import { MethodInterface } from '../method/method-interface'
import { Prop } from '../property/property'
import { PropInterface } from '../property/property-interface'
import { MthAddPrototype, MthGetPrototype, MthInitPrototype } from '../method/method-type'

// Temporary Static Fct pointer for mthInterface use

export abstract class Unit {
    readonly name: string
    readonly description: string
    #ptrType: {value: ComponentType}
    propLogLevel: Prop<LogLevel>
    #propLogOnBotChannel: Prop<boolean>

    mthInterface: MethodInterface
    #logInterface: LogInterface
    propInterface: PropInterface

    /**
     * Create the component with default conf
     * @param name Component name
     */
    constructor(name: string, description: string){
        this.#ptrType = {value: ComponentType.BotSystem};
        // init default prop
        this.propLogLevel = new Prop<LogLevel>("logLevel", LogLevel.Info);
        this.#propLogOnBotChannel = new Prop<boolean>("logOnBotChannel", false);

        // initiate interface tool
        this.mthInterface = new MethodInterface(name, this.#ptrType, Unit._tmpAddMth, Unit._tmpGetMth, Unit._tmpInitMth);
        this.#logInterface = new LogInterface(name);
        this.propInterface = new PropInterface(name, this.mthInterface);

        if(name==undefined || name?.length == 0){
            this.logError(`no valid unit name`);
            name = 'unknow';
        }
        if(description==undefined || description?.length == 0){
            this.logError(`no valid unit description`);
            description = 'unknow';
        }
        this.name = name;
        this.description = description;
        

        this.initUnitProps();
        this.logDebug(`Unit ${name} created`);
    }

    /** add the properties of the unit
     * @internal
     */
    private initUnitProps(){
        this.propInterface.addProp(this.propLogLevel);
        this.propInterface.addProp(this.#propLogOnBotChannel);
    }

    /** update the unit (in case if it can not be init in the constructor)
     * @internal
     */
    updateUnit(){
        this.mthInterface.initInterface(Unit._tmpAddMth, Unit._tmpGetMth, Unit._tmpInitMth);
        this.propInterface.initInterface();
        this.initUnitProps();
    }
    

    /*** Getter / Setter Methods ***/

    /** @internal */
    get type(): ComponentType {
        return this.#ptrType.value;
    }
    /** @internal */
    set type(t: ComponentType){
        if(this.#ptrType.value == ComponentType.BotSystem && t != ComponentType.BotSystem){
            this.#ptrType.value = t;
        }
    }

    /** @internal */
    toString(): string {
        return `**${this.name}**: ${this.description}`;
    }

    /*** Log Methods ***/

    // log with log level: 1 error ; 2 info ; 3 debug
    log(logLevel: number, txt: string){
        this.#logInterface.log( this.propLogLevel.value, logLevel, this.#propLogOnBotChannel.value, txt);
    }
    // log with error log level
    logError(txt: string){
        this.log(LogLevel.Error,txt);
    }
    // log with error log level
    logWarning(txt: string){
        this.log(LogLevel.Warning,txt);
    }
    // log with info log level
    logInfo(txt: string){
        this.log(LogLevel.Info,txt);
    }
    // log with debug log level
    logDebug(txt: string){
        this.log(LogLevel.Debug,txt);
    }

    /**
     * initiate the botChannel for the #logInterface
     * @param sentFct function to send to the bot channel
     * @internal
     */
    initLogInBotChannel(sentFct: (msg: string)=>void){
        this.#logInterface.mthSendMsgToBotChannel = sentFct;
    }


    /*** Tempory Static add and get methods ****/

    /** @internal */
    private static _tmpAddMth: MthAddPrototype
    /** @internal */
    private static _tmpGetMth: MthGetPrototype
    /** @internal */
    private static _tmpInitMth: MthInitPrototype

    /** @internal */
    static initUnit(addMth: MthAddPrototype, getMth: MthGetPrototype, initMth: MthInitPrototype){
        if(Unit._tmpAddMth==undefined && Unit._tmpGetMth==undefined && Unit._tmpInitMth==undefined){ // only once
            Unit._tmpAddMth = addMth;
            Unit._tmpGetMth = getMth;
            Unit._tmpInitMth = initMth;
        }
    }
    /** @internal */
    static resetTmp(){
        Unit._tmpAddMth = undefined;
        Unit._tmpGetMth = undefined;
        Unit._tmpInitMth = undefined;
    }
}