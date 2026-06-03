import { BotSystemState } from "../../bot-system-type";
import { Unit } from "../../component/unit";
import { PropAccess } from "../../property/property-type";
import { Interaction, InteractionArgument, stringToArgType } from "../interaction";
import { Message } from "../message";
import { SlashCmdOption, TxtCmdOption } from "./command-type";

type TxtCmdFct = (msg: Message, arg: string) => void;
type AddTxtCmdPrototype = (txtCmdName: string, ownerName: string, description: string, fct: TxtCmdFct, option?: TxtCmdOption) => void;
type AddSlashCmdPrototype = (slashCmdName: string, ownerName: string, description: string, fct: (interaction: Interaction) => void, args?: Array<InteractionArgument>, option?: SlashCmdOption) => void;


/*** interface Class to help componenent to add txtCmd and slashCmd ***/
export class CommandInterface {
    #unit: Unit
    #propBsState: PropAccess<BotSystemState>
    #mthAddTxtCmd: AddTxtCmdPrototype
    #mthAddSlashCmd: AddSlashCmdPrototype

    /**
     * constructor to init command interface
     * @param unit the unit component
     * @internal
     */
    constructor(unit: Unit) {
        this.#unit = unit;
        this.#propBsState = this.#unit.propInterface.getProp("BotSystem", "botSystemState");

        this.initInterface();
    }

    /**
     * initiate the interface (in case if it can not be init in the constructor)
     * @internal
     */
    initInterface(){
        this.#mthAddTxtCmd = this.#unit.mthInterface.getMethod<AddTxtCmdPrototype>("CommandManager", "addTxtCmd");
        this.#mthAddSlashCmd = this.#unit.mthInterface.getMethod<AddSlashCmdPrototype>("CommandManager", "addSlashCmd");
    }

    /**
     * Add a text command
     * @param txtCmdName name of the text command to add
     * @param description description of the command
     * @param fct pointer function to execute
     * @param option option for the text command
     */
    addTxtCmd(txtCmdName: string, description: string, fct: TxtCmdFct, option?: TxtCmdOption) {
        if(this.#mthAddTxtCmd){
            this.#mthAddTxtCmd(txtCmdName,
                this.#unit.name,
                description,
                fct,
                (option != undefined) ? option : {});
        }
    }

    /**
     * Add a slash command
     * @param slashCmdName name of the slash command to add
     * @param description description of the command
     * @param args arguments description of the command
     * @param fct pointer function to execute
     * @param option option for the slash command
     */
    addSlashCmd(slashCmdName: string, description: string, fct: (interaction: Interaction) => void, args?: Array<InteractionArgument>, option?: SlashCmdOption) {
        if(this.#propBsState.value != BotSystemState.Start && this.#propBsState.value != BotSystemState.Initialization ){
            this.#unit.logError('slash command has to be add in Initialization (component constructor)');
            return;
        }
        if(this.#mthAddSlashCmd){
            this.#mthAddSlashCmd(slashCmdName,
                this.#unit.name,
                description,
                fct,
                (args != undefined) ? args : [],
                (option != undefined) ? option : {});
        }
    }

    /**
     * get the arguments structure without description to be use with addSlashCmd
     * Warning: Only works with boolean, number, string type
     * need default example because interface do not exist in js runtime
     * @param defaultArgs default value of the arguments interface
     * @returns arguments structure to be use with addSlashCmd
     */
    getArgsStruct<ArgsInterface extends { [key: string]: any }>(defaultArgs: ArgsInterface): Array<InteractionArgument> {
        let argsStruct = Array<InteractionArgument>();
        const keys = Object.keys(defaultArgs) as (keyof ArgsInterface)[];
        keys.forEach(kStr => {
            argsStruct.push({
                name: kStr as string,
                description: "_",
                type: stringToArgType(typeof defaultArgs[kStr])
            });
        });
        return argsStruct;
    }
}
