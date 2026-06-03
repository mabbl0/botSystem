import { REST, Routes } from 'discord.js'
import { SlashCmd } from "../bot-system/communication/command/command-type";
import { CommandAPI } from "../bot-system/interface-api/interface-api-type";
import { MapName } from "../tools/collection/map";
import { DiscordCmdAdapt } from "./util/discord-convert-type";
import { DiscordCmd } from "./util/discord-interface-type";
import { DiscordInterface } from './discord-interface-api';


/** @internal */
export class CommandDiscord implements CommandAPI {
    private discordApi: DiscordInterface
    // Map<discordCmd.name, DiscordCmdAdapt>
    cmdMap: MapName<DiscordCmdAdapt>

    constructor(discordApi: DiscordInterface) {
        this.discordApi = discordApi;        
    }
    
    /**** Method for Discord Command ***/

    // Initiate and adapte cmd form BotSystem to Discord
    initCmdMap(slashCmds: MapName<SlashCmd>){
        if(this.cmdMap==undefined){
            this.cmdMap = new MapName<DiscordCmdAdapt>();

            slashCmds.forEach(slashCmd => {
                this.cmdMap.set(new DiscordCmdAdapt(slashCmd));
            });
        }
    }

    // update the discord bot commands
    updateBotCommands(): void {
        // convert botSystem type to discord type
        let jsonDiscordGuildCmd: Array<DiscordCmd> = [];
        if(this.cmdMap==undefined){
            return;
        }
        this.cmdMap.forEach( (cmdAdapt) =>
            jsonDiscordGuildCmd.push(cmdAdapt.discordCmd)
        );

        const rest = new REST().setToken(this.discordApi.discordConf.botToken);
        // guild command
		rest.put(
			Routes.applicationGuildCommands(this.discordApi.discordConf.clientId, this.discordApi.discordConf.guildId),
			{ body: jsonDiscordGuildCmd },
		);
        // global command
		rest.put(
			Routes.applicationCommands( this.discordApi.discordConf.clientId),
			{ body: [] }, // no global commadns for now
		);
    }
}