import { User } from "../../user/user-type"
import { Interaction, InteractionArgument } from "../interaction"
import { Message } from "../message"

interface CmdBaseOption {
    adminOnly?: boolean
}
export abstract class CmdBase {
    readonly name: string
    readonly ownerName: string
    readonly description: string
    readonly option: CmdBaseOption

    constructor(name: string, ownerName: string, description: string, option: CmdBaseOption){
        this.name = name;
        this.ownerName = ownerName;
        this.description = description;
        this.option = option;
    }

    authorized(user: User): boolean{
        return this.option.adminOnly==undefined || user.admin || !this.option.adminOnly;
    }

    toString(): string {
        return `**${this.name}**: ${this.description}`;
    }
    toString4Dev(): string {
        return `**${this.ownerName}.${this.name}**: ${this.description}`;
    }

    correspondingToResearch(researchStr: string): boolean {
        return this.ownerName.toLowerCase().includes(researchStr) || this.name.toLowerCase().includes(researchStr);
    }
}

/*** Txt Command Type ***/
export interface TxtCmdOption extends CmdBaseOption {
}
export class TxtCmd extends CmdBase {
    fct: (msg: Message, arg: string) => void
    declare option: TxtCmdOption

    constructor(name: string, ownerName: string, description: string, fct: (msg: Message, arg: string) => void, option: TxtCmdOption){
        super(name, ownerName, description, option);
        this.fct = fct;
        this.option = option;
    }
}

/*** Slash Command Type ***/
export interface SlashCmdOption extends CmdBaseOption {
}
export class SlashCmd extends CmdBase {
    fct: (interaction: Interaction) => void
    declare option: SlashCmdOption
    arguments: Array<InteractionArgument>
    
    constructor(name: string, ownerName: string, description: string, fct: (interaction: Interaction) => void, arg: Array<InteractionArgument>, option: SlashCmdOption){
        super(name, ownerName, description, option);
        this.fct = fct;
        this.option = option;
        this.arguments = arg;
    }
}