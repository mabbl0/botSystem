import Discord from "discord.js";
import { DiscordCmd, DiscordCmdOption } from "./discord-interface-type";
import { SlashCmd } from "../../bot-system/communication/command/command-type";
import { InteractionArgument, InteractionArgumentType, InteractionType } from "../../bot-system/communication/interaction";
import { MsgToSend } from "../../bot-system/communication/comm-type";
import { MsgComponentAdapter } from "./message-component-adapter";
import { MsgComponentDisplayType } from "../../bot-system/communication/message-component/message-component-type";

// Convert the Interaction Type
export class ConvertCommandInteractionType {
    static convertBs2Discord(value: InteractionType): Discord.ApplicationCommandType {
        switch (value) {
            case InteractionType.SlashCmd:
                return Discord.ApplicationCommandType.ChatInput;
            case InteractionType.ContextMenuUser:
                return Discord.ApplicationCommandType.User;
            case InteractionType.ContextMenuMessage:
                return Discord.ApplicationCommandType.Message;
            default:
                return undefined;
        }
    }
}

// Convert the Argument Type from Command Interaction description
export class ConvertArgumentType {
    static convertBs2Discord(value: InteractionArgumentType): Discord.ApplicationCommandOptionType {
        switch (value) {
            case InteractionArgumentType.String:
                return Discord.ApplicationCommandOptionType.String;
            case InteractionArgumentType.Integer:
                return Discord.ApplicationCommandOptionType.Integer;
            case InteractionArgumentType.Boolean:
                return Discord.ApplicationCommandOptionType.Boolean;
            case InteractionArgumentType.Attachment:
                return Discord.ApplicationCommandOptionType.Attachment;
            case InteractionArgumentType.User:
                return Discord.ApplicationCommandOptionType.User;
            case InteractionArgumentType.Channel:
                return Discord.ApplicationCommandOptionType.Channel;
            case InteractionArgumentType.CommandGroup:
                return Discord.ApplicationCommandOptionType.SubcommandGroup;
            default:
                return undefined;
        }
    }
    static convertDiscord2Bs(value: Discord.ApplicationCommandOptionType): InteractionArgumentType {
        switch (value) {
            case Discord.ApplicationCommandOptionType.String:
                return InteractionArgumentType.String;
            case Discord.ApplicationCommandOptionType.Integer:
                return InteractionArgumentType.Integer;
            case Discord.ApplicationCommandOptionType.Boolean:
                return InteractionArgumentType.Boolean;
            case Discord.ApplicationCommandOptionType.Attachment:
                return InteractionArgumentType.Attachment;
            case Discord.ApplicationCommandOptionType.User:
                return InteractionArgumentType.User;
            case Discord.ApplicationCommandOptionType.Channel:
                return InteractionArgumentType.Channel;
            case Discord.ApplicationCommandOptionType.SubcommandGroup:
                return InteractionArgumentType.CommandGroup;
            default:
                return undefined;
        }
    }
}

// convert Argument from Command description
export class ConvertArgument {
    static convertBs2Discord(arg: InteractionArgument): DiscordCmdOption {
        let opt: DiscordCmdOption = {
            name: arg.name,
            description: arg.description,
            type: ConvertArgumentType.convertBs2Discord(arg.type)
        }
        if (arg.required) {
            opt.required = arg.required;
        }
        if (arg.choices) {
            opt.choices = arg.choices;
        }
        if (arg.arguments && arg.type == InteractionArgumentType.CommandGroup) {
            opt.options = [];
            arg.arguments.forEach(argIn => {
                opt.options.push(ConvertArgument.convertBs2Discord(argIn));
            });
        }
        return opt;
    }
}

// convert Command
export class ConvertCommand {
    static convertBs2Discord(bsCmd: SlashCmd, bsCmdType: InteractionType): DiscordCmd {
        let cmd: DiscordCmd = {
            name: bsCmd.name,
            description: bsCmd.description,
            type: ConvertCommandInteractionType.convertBs2Discord(bsCmdType)
        }
        if (bsCmd.arguments) {
            cmd.options = [];
            bsCmd.arguments.forEach(arg => {
                cmd.options.push(ConvertArgument.convertBs2Discord(arg));
            });
        }
        return cmd;
    }
}

// Adapt BotSystem command for discord, with name and description adaptation
export class DiscordCmdAdapt {
    private _discordCmd: DiscordCmd
    readonly bsCmd: SlashCmd
    private _adaptedName: boolean

    constructor(bsCmd: SlashCmd) {
        this.bsCmd = bsCmd;
        this._discordCmd = ConvertCommand.convertBs2Discord(bsCmd, InteractionType.SlashCmd);
        this._adaptedName = false;

        this._discordCmd.name = this.adaptName(this._discordCmd.name);
        this._discordCmd.description = this.adaptDescription(this._discordCmd.description);
        this._discordCmd.options?.forEach(opt => {
            opt.name = this.adaptName(opt.name);
            opt.description = this.adaptDescription(opt.description);
        });
    }

    get name(): string {
        return this._discordCmd.name;
    }
    get discordCmd(): DiscordCmd {
        return this._discordCmd;
    }
    get adaptedName(): boolean {
        return this._adaptedName;
    }

    adaptName(name: string): string {
        let adaptedName = name.slice();
        if (adaptedName.length > 32) { // to long name
            adaptedName = adaptedName.slice(0, 32);
            this._adaptedName = true;
        }

        if (adaptedName.match(/[A-Z]/g)) { // adapt upperCase in name
            adaptedName = adaptedName.toLowerCase();
            this._adaptedName = true;
        }
        let match = adaptedName.match(/[^-_'a-z]/g);
        if (match) { // remove all other no authorized character
            match.forEach(str => {
                adaptedName = adaptedName.replaceAll(str, '');
            });
            this._adaptedName = true;
        }
        return adaptedName;
    }
    adaptDescription(str: string): string {
        if (str.length == 0) {
            return '_';
        }
        else if (str.length > 100) {
            return str.slice(0, 100);
        }
        return str;
    }
}


/**
 * finish to Adapt the message component message to discord Api 
 * @param msg the message to adapt
 */
export function adaptMessageComponent(msg: MsgToSend) {
    msg.components.prepareToSend();
    if(msg.components.displayType == MsgComponentDisplayType.Message)
    {
        (msg as any).flags += Discord.MessageFlags.IsComponentsV2;
        msg.components = (msg.components.adapter as MsgComponentAdapter).msgcAdapted as any;
        
        // no content if flags componentV2
        if (msg.content != undefined) {
            (msg.components as any).splice(0, 0, {
                type: Discord.ComponentType.TextDisplay as number,
                content: msg.content
            });
            msg.content = undefined;
        }
    }
    else if(msg.components.displayType == MsgComponentDisplayType.Modal)
    {

        

        // https://github.com/discordjs/discord.js/blob/main/packages/discord.js/src/structures/interfaces/InteractionResponses.js
        //Discord.InteractionResponses
        // (msg as any).type = Discord.InteractionResponseType.Modal //InteractionCallbackType.MODAL;
        // (msg as any).data = {
        //     custom_id: "jail_modal",
        //     title: "jail",
        //     components: (msg.components.adapter as MsgComponentAdapter).msgcAdapted
        // }
        // msg.components = undefined;
        
        // if (msg.content != undefined) {
        //     (msg as any).data.components.splice(0, 0, {
        //         type: Discord.ComponentType.TextDisplay as number,
        //         content: msg.content
        //     });
        //     msg.content = undefined;
        // }
    }

    console.log(msg);
}
