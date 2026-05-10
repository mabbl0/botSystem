import Discord from "discord.js"; 

// Discord Configuration
export interface DiscordInterfaceConf {
    name: string
    botToken: string
    clientId: string
    guildId: string
}

/*** Discord Command json description ***/

interface DiscordCmdChoice {
    name: string
    value: any
}

interface DiscordCmdOption {
    name: string
    description: string
    type: Discord.ApplicationCommandOptionType

    required?: boolean
    choices?: Array<DiscordCmdChoice>
    options?: Array<DiscordCmdOption>
}

interface DiscordCmd {
    name: string
    description: string
    type: Discord.ApplicationCommandType

    options?: Array<DiscordCmdOption>
}