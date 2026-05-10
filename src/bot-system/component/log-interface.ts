import { nowDateStr } from "../../tools/date"
import { LogLevel } from "./component-type";

// Interface to log with different log level
export class LogInterface {
    private _mthSendMsgToBotChannel: (msg: string) => void
    private componentName: string

    constructor(componentName: string){
        this.componentName = componentName;
    }

    set mthSendMsgToBotChannel(mth: (msg: string) => void){
        if(this._mthSendMsgToBotChannel == undefined){ // only once
            this._mthSendMsgToBotChannel = mth;
        }
    }

    // log a text on the console if the log level premit it, and send the bot channel if asked
    log(componentLogLevel: number, txtLogLevel: number, onBotChannel: boolean, txt: string){
        if(txtLogLevel <= componentLogLevel){
            let logStr = this.getLogStr(txtLogLevel, txt);
            if(txtLogLevel <= LogLevel.Error){
                console.error( logStr );
            }
            else if(txtLogLevel == LogLevel.Warning){
                console.warn( logStr );
            }
            else{
                console.log( logStr );
            }
            this.logChannel(onBotChannel, logStr);
        }
    }

    // send the log in the bot channel if asked
    private logChannel(onBotChannel: boolean, txt: string){
        if(onBotChannel && this._mthSendMsgToBotChannel != undefined){
            this._mthSendMsgToBotChannel('`' + txt + '`');
        }
    }

    // get the string log level
    private getLogLevelStr(logLevel: number): string{
        switch (logLevel) {
            case LogLevel.Error:
                return 'Error';
            case LogLevel.Warning:
                return 'Warning';
            case LogLevel.Info:
                return 'Info';
            case LogLevel.Debug:
                return 'Debug';
            default:
                return 'Unknow';
        }
    }

    // get the log with extra information
    private getLogStr(logLevel: number, txt: string): string{
        return `[${nowDateStr()}][${this.componentName}][${this.getLogLevelStr(logLevel)}] ${txt}`;
    }
}