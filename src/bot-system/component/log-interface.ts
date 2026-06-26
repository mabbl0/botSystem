import { nowDateStr } from "../../tools/date"
import { LogLevel, LogLevelStr } from "./component-type";

/** Interface to log with different log level
 * 
 */
export class LogInterface {
    #mthSendMsgToBotChannel: (msg: string) => void
    #componentName: string

    constructor(componentName: string){
        this.#componentName = componentName;
    }

    /** @internal */
    set mthSendMsgToBotChannel(mth: (msg: string) => void){
        if(this.#mthSendMsgToBotChannel == undefined){ // only once
            this.#mthSendMsgToBotChannel = mth;
        }
    }
    
    /**
     * log a text on the console if the log level premit it, and send the bot channel if asked
     * @param componentLogLevel the actual component log level
     * @param txtLogLevel the text log level
     * @param onBotChannel indicate if the message shall be sent to the bot channel
     * @param txt the text to log
     */
    log(componentLogLevel: number, txtLogLevel: number, onBotChannel: boolean, message: any, ...optionalParams: any[]){
        if(txtLogLevel <= componentLogLevel){
            let logStr = this.getLogStr(txtLogLevel, message, optionalParams);
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
    
    /**
     * send the log in the bot channel if asked
     * @param onBotChannel indicate if the message shall be sent to the bot channel
     * @param txt the text to log
     * @internal
     */
    private logChannel(onBotChannel: boolean, txt: string){
        if(onBotChannel && this.#mthSendMsgToBotChannel != undefined){
            this.#mthSendMsgToBotChannel('`' + txt + '`');
        }
    }

    /**
     * get the string log level
     * @param logLevel the log level
     * @returns the log level string
     * @internal
     */
    private getLogLevelStr(logLevel: LogLevel): LogLevelStr{
        switch (logLevel) {
            case LogLevel.None:
                return 'None';
            case LogLevel.Error:
                return 'Error';
            case LogLevel.Warning:
                return 'Warning';
            case LogLevel.Info:
                return 'Info';
            case LogLevel.Verbose:
                return 'Verbose';
            case LogLevel.Debug:
                return 'Debug';
            default:
                return 'Unknow';
        }
    }

    /**
     * get the log with extra information
     * @param logLevel the log level
     * @param txt the text to print
     * @returns the string ready to print
     * @internal
     */
    private getLogStr(logLevel: LogLevel, message: any, ...optionalParams: any[]): string{
        if(optionalParams.length>1) {
            return `[${nowDateStr()}][${this.getLogLevelStr(logLevel)}][${this.#componentName}] ${message}\n${optionalParams}`;
        }
        else {
            return `[${nowDateStr()}][${this.getLogLevelStr(logLevel)}][${this.#componentName}] ${message}`;
        }
    }
}