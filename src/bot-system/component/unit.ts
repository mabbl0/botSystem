import { ComponentType, LogLevel } from './component-type'
import { LogInterface } from './log-interface'
import { MethodInterface } from '../method/method-interface'
import { Prop } from '../property/property-type'
import { PropInterface } from '../property/property-interface'
import { MthAddPrototype, MthGetPrototype, MthInitPrototype } from '../method/method-type'

// Temporary Static Fct pointer for mthInterface use

export abstract class Unit {
    readonly name: string
    readonly description: string
    private _ptrType: {value: ComponentType}
    propLogLevel: Prop<LogLevel>
    private propLogOnBotChannel: Prop<boolean>

    mthInterface: MethodInterface
    private logInterface: LogInterface
    propInterface: PropInterface

    /**
     * Create the component with default conf
     * @param name Component name
     */
    constructor(name: string, description: string){
        this._ptrType = {value: ComponentType.BotSystem};
        // init default prop
        this.propLogLevel = new Prop<LogLevel>("logLevel", LogLevel.Info);
        this.propLogOnBotChannel = new Prop<boolean>("logOnBotChannel", false);

        // initiate interface tool
        this.mthInterface = new MethodInterface(name, this._ptrType, Unit._tmpAddMth, Unit._tmpGetMth, Unit._tmpInitMth);
        this.logInterface = new LogInterface(name);
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

    private initUnitProps(){
        this.propInterface.addProp(this.propLogLevel);
        this.propInterface.addProp(this.propLogOnBotChannel);
    }

    // update the unit (in case if it can not be init in the constructor)
    updateUnit(){
        this.mthInterface.initInterface(Unit._tmpAddMth, Unit._tmpGetMth, Unit._tmpInitMth);
        this.propInterface.initInterface();
        this.initUnitProps();
    }
    

    /*** Getter / Setter Methods ***/

    get type(): ComponentType {
        return this._ptrType.value;
    }
    set type(t: ComponentType){
        if(this._ptrType.value == ComponentType.BotSystem && t != ComponentType.BotSystem){
            this._ptrType.value = t;
        }
    }

    toString(): string {
        return `**${this.name}**: ${this.description}`;
    }

    /*** Log Methods ***/

    // log with log level: 1 error ; 2 info ; 3 debug
    log(logLevel: number, txt: string){
        this.logInterface.log( this.propLogLevel.value, logLevel, this.propLogOnBotChannel.value, txt);
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

    // initiate the botChannel for the logInterface
    initLogInBotChannel(sentFct: (msg: string)=>void){
        this.logInterface.mthSendMsgToBotChannel = sentFct;
    }


    /*** Tempory Static add and get methods*/
    private static _tmpAddMth: MthAddPrototype
    private static _tmpGetMth: MthGetPrototype
    private static _tmpInitMth: MthInitPrototype

    static initUnit(addMth: MthAddPrototype, getMth: MthGetPrototype, initMth: MthInitPrototype){
        if(Unit._tmpAddMth==undefined && Unit._tmpGetMth==undefined && Unit._tmpInitMth==undefined){ // only once
            Unit._tmpAddMth = addMth;
            Unit._tmpGetMth = getMth;
            Unit._tmpInitMth = initMth;
        }
    }
    static resetTmp(){
        Unit._tmpAddMth = undefined;
        Unit._tmpGetMth = undefined;
        Unit._tmpInitMth = undefined;
    }
}