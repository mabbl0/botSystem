import { Unit } from "../../component/unit";
import { User } from "../../user/user";
import { Interaction, InteractionArgument, stringToArgType } from "../interaction";
import { Message } from "../message";
import { ContextMenuOption, SlashCmdOption, TxtCmdOption } from "./command-type";

type TxtCmdFct = (msg: Message, arg: string) => void;
type AddTxtCmdPrototype = (txtCmdName: string, ownerName: string, description: string, fct: TxtCmdFct, option?: TxtCmdOption) => void;
type AddSlashCmdPrototype = (slashCmdName: string, ownerName: string, description: string, fct: (interaction: Interaction) => void, args?: Array<InteractionArgument>, option?: SlashCmdOption) => void;
type AddMsgCmPrototype = (msgContextMenuName: string, ownerName: string, description: string, fct: (interaction: Interaction, message: Message) => void, option?: ContextMenuOption) => void;
type AddUserCmPrototype = (userContextMenuName: string, ownerName: string, description: string, fct: (interaction: Interaction, user: User) => void, option?: ContextMenuOption) => void;


/** Interface to add text command, slash command, or context menu command */
export class CommandInterface {
    #unit: Unit
    #mthAddTxtCmd: AddTxtCmdPrototype
    #mthAddSlashCmd: AddSlashCmdPrototype
    #mthAddmsgContextMenu: AddMsgCmPrototype
    #mthAdduserContextMenu: AddUserCmPrototype

    /**
     * constructor to init command interface
     * @param unit the unit component
     * @internal
     */
    constructor(unit: Unit) {
        this.#unit = unit;

        this.initInterface();
    }

    /**
     * initiate the interface (in case if it can not be init in the constructor)
     * @internal
     */
    initInterface() {
        this.#mthAddTxtCmd = this.#unit.mthInterface.getMethod<AddTxtCmdPrototype>("CommandManager", "addTxtCmd");
        this.#mthAddSlashCmd = this.#unit.mthInterface.getMethod<AddSlashCmdPrototype>("CommandManager", "addSlashCmd");
        this.#mthAddmsgContextMenu = this.#unit.mthInterface.getMethod<AddMsgCmPrototype>("CommandManager", "addMsgContextMenu");
        this.#mthAdduserContextMenu = this.#unit.mthInterface.getMethod<AddUserCmPrototype>("CommandManager", "addUserContextMenu");
    }

    /**
     * Add a text command
     * @param txtCmdName name of the text command to add
     * @param description description of the command
     * @param fct pointer function to execute
     * @param option option for the text command
     */
    addTxtCmd(txtCmdName: string, description: string, fct: TxtCmdFct, option?: TxtCmdOption) {
        if (this.#mthAddTxtCmd) {
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
        if (this.#mthAddSlashCmd) {
            this.#mthAddSlashCmd(slashCmdName,
                this.#unit.name,
                description,
                fct,
                (args != undefined) ? args : [],
                (option != undefined) ? option : {});
        }
    }

    /**
     * Add a message context menu
     * @param msgConextMenuName name of the message context menu to add
     * @param description description of the command
     * @param fct pointer function to execute
     * @param option option for the message context menu
     */
    addMsgContextMenu(msgConextMenuName: string, description: string, fct: (interaction: Interaction, message: Message) => void, option?: ContextMenuOption) {
        if (this.#mthAddmsgContextMenu) {
            this.#mthAddmsgContextMenu(msgConextMenuName,
                this.#unit.name,
                description,
                fct,
                (option != undefined) ? option : {});
        }
    }

    /**
     * Add a user context menu
     * @param userConextMenuName name of the user context menu to add
     * @param description description of the command
     * @param fct pointer function to execute
     * @param option option for the user context menu
     */
    addUserContextMenu(userConextMenuName: string, description: string, fct: (interaction: Interaction, user: User) => void, option?: ContextMenuOption) {
        if (this.#mthAddmsgContextMenu) {
            this.#mthAdduserContextMenu(userConextMenuName,
                this.#unit.name,
                description,
                fct,
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
