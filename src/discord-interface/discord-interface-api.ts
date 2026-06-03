import Discord from "discord.js"

import type { AdaptCommAPI, InterfaceAPI } from '../bot-system/interface-api/interface-api-type'
import type { DiscordInterfaceConf } from './util/discord-interface-type'
import { loadData } from "../tools/file"

import { EventDiscord } from "./event-api"
import { ChatDiscord } from "./chat-api"
import { CommandDiscord } from "./command-api"
import { MentionedDiscord } from "./mentioned-api"
import { BotVoiceControlDiscord } from "./bot-voice-control-api"
import { AdaptCommDiscord } from "./adapt-comm-api"


export class DiscordInterface implements InterfaceAPI {
    /** @internal */
    discordConf: DiscordInterfaceConf
    /** @internal */
    bot: Discord.Client
    /** @internal */
    guild: Discord.Guild

    /** @internal */
    log: (logLevel: number, txt: string) => void

    /** @internal */
    event: EventDiscord
    /** @internal */
    adaptComm: AdaptCommAPI
    /** @internal */
    chat: ChatDiscord
    /** @internal */
    command: CommandDiscord
    /** @internal */
    mentioned: MentionedDiscord
    /** @internal */
    voiceControl: BotVoiceControlDiscord

    /**
     * create the discord interface api for botSystem
     * @param discordConfPath path to the discord interface api configuration file
     */
    constructor(discordConfPath: string) {
        this.discordConf = loadData<DiscordInterfaceConf>(discordConfPath);

        // default log
        this.log = (_logLevel: number, txt: string) => { console.log(txt); };
        
        this.event = new EventDiscord(this);
        this.adaptComm = new AdaptCommDiscord(this);
        this.chat = new ChatDiscord(this);
        this.command = new CommandDiscord(this);
        this.mentioned = new MentionedDiscord();
        this.voiceControl = new BotVoiceControlDiscord(this);

        this.bot = new Discord.Client({
            intents: [
                Discord.GatewayIntentBits.Guilds,
                Discord.GatewayIntentBits.GuildMembers,
                Discord.GatewayIntentBits.GuildExpressions,
                Discord.GatewayIntentBits.GuildVoiceStates,
                Discord.GatewayIntentBits.GuildPresences,
                Discord.GatewayIntentBits.GuildMessages,
                Discord.GatewayIntentBits.GuildMessageReactions,
                Discord.GatewayIntentBits.GuildMessageTyping,
                Discord.GatewayIntentBits.GuildIntegrations,
                Discord.GatewayIntentBits.MessageContent
            ]
        });
    }

    get name(): string {
        return this.discordConf.name;
    }

    
    /** Start the bot
     * @internal 
     */
    startBot() {
        this.bot.login(this.discordConf.botToken);
    }
}