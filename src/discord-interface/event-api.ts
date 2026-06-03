import { EventAPI } from "../bot-system/interface-api/interface-api-type";
import Discord from "discord.js"
import { DiscordInterface } from "./discord-interface-api";
import { Recycler } from "../tools/collection/recycler";
import { User } from "../bot-system/user/user";
import { ConvertArgumentType } from "./util/discord-convert-type";
import { VoiceChannel } from "../bot-system/communication/voice/voice-channel";
import { UserVoiceUpdateControl } from "../bot-system/communication/voice/user-voice-control";
import { MessageRecycled } from "../bot-system/communication/message";
import { InteractionArgumentType, InteractionRecycled, InteractionType } from "../bot-system/communication/interaction";
import { Channel, ChannelCore } from "../bot-system/communication/channel";
import { ModalChoiceData } from "../bot-system/communication/message-component/modal";
import { MsgComponentType } from "../bot-system/communication/message-component/message-component-type";

/** @internal */
export class EventDiscord implements EventAPI {
    private discordApi: DiscordInterface
    msgRecycler: Recycler<MessageRecycled>
    interactRecycler: Recycler<InteractionRecycled>

    private _msgCreationFct: (msg: MessageRecycled) => void
    private _interactCreationFct: (interaction: InteractionRecycled) => void

    constructor(discordApi: DiscordInterface) {
        this.discordApi = discordApi;
    }

    /*** Method to Initiate Events ***/

    // Initiate the message creation event, and convert message discord in message bs
    initMessageCreationEvent(messageRecycler: Recycler<MessageRecycled>, msgCreationFct: (msg: MessageRecycled) => void) {
        this.msgRecycler = messageRecycler;
        this._msgCreationFct = msgCreationFct;

        this.discordApi.bot.on(Discord.Events.MessageCreate, (messageApi) => {
            let msg = this.msgRecycler.getRecycledMessage(messageApi);
            msg._author = this.discordApi.chat.users.get(messageApi.author.id); // replace the user from Api by the BotSystem User
            msg._channel = this.discordApi.chat.channels.get((messageApi.channel as Discord.TextChannel).name); // replace the channel from Api by the BotSystem Channel
            msg._date = messageApi.createdTimestamp;

            this._msgCreationFct(msg);
        });
    }

    // Initiate the boot event
    initBootEvent(bootFct: () => void) {
        this.discordApi.bot.once(Discord.Events.ClientReady, () => {
            this.discordApi.guild = this.discordApi.bot.guilds.cache.find(guild => guild.id == this.discordApi.discordConf.guildId);

            bootFct();
        });
    }

    // Initiate the user add Event
    initUserAddEvent(userAddFct: (user: User) => void) {
        this.discordApi.bot.on(Discord.Events.GuildMemberAdd, (memberApi) => {
            let newUser = new User(memberApi.user.id,
                memberApi.user.bot,
                memberApi.user.username,
                memberApi.user.toString(),
                memberApi.roles,
                {
                    addRole: this.discordApi.chat.addRole,
                    removeRole: this.discordApi.chat.removeRole
                },
                memberApi.voice,
                {
                    isDeaf: this.discordApi.chat.isDeaf,
                    isMute: this.discordApi.chat.isMute,
                    setDeaf: this.discordApi.chat.setDeaf,
                    setMute: this.discordApi.chat.setMute,
                    disconnect: this.discordApi.chat.disconnet,
                    moveVoiceChannel: this.discordApi.chat.moveVoiceChannel as any
                },
                memberApi.voice.channel != undefined ? this.discordApi.chat.voiceChannels.get(memberApi.voice.channel?.name) : undefined);
            this.discordApi.chat.users.set(newUser);
            userAddFct(newUser);
        });
    }

    // Initiate the new channel created Event
    initChannelCreateEvent(channelCreateFct: (channel: ChannelCore) => void) {
        this.discordApi.bot.on(Discord.Events.ChannelCreate, (channelApi) => {
            if (channelApi.type == Discord.ChannelType.GuildText) {
                let channel = new ChannelCore(channelApi, channelApi.name, channelApi.toString());
                this.discordApi.chat.channels.set(channel);
                channelCreateFct(channel);
            }
            else if (channelApi.type == Discord.ChannelType.GuildVoice) {
                this.discordApi.chat.voiceChannels.set(
                    new VoiceChannel(channelApi, channelApi.name, channelApi.toString(), this.discordApi.chat.getVoiceChannelUsers.bind(this.discordApi.chat))
                );
            }
        });
    }

    // Initiate the voice update event
    initVoiceUpdateEvent(userVoiceConnexionFct: (user: User) => void) {
        this.discordApi.bot.on(Discord.Events.VoiceStateUpdate, (oldState, newState) => {
            // update the voice user
            let user = this.discordApi.chat.users.get(newState.id);
            if (user == undefined) {
                return;
            }
            let newChannel = newState.channelId != null ?
                this.discordApi.chat.voiceChannels.get(newState.channel.name) : undefined;
            (user.voice as UserVoiceUpdateControl).update(newState, newChannel);

            // call user voice connexion, if there is a voiceChannel connexion
            if (newState.channelId != null && newState.channelId != oldState.channelId) {
                userVoiceConnexionFct(user);
            }
        });
    }

    // Initiate the interaction creation Event
    initInteractionCreationEvent(interactRecycler: Recycler<InteractionRecycled>, interactCreationFct: (interaction: InteractionRecycled) => void): void {
        this.interactRecycler = interactRecycler;
        this._interactCreationFct = interactCreationFct;

        this.discordApi.bot.on(Discord.Events.InteractionCreate, (interactionApi) => {
            if (interactionApi.type == Discord.InteractionType.ApplicationCommand) {
                if (interactionApi.isChatInputCommand()) {
                    this.interactionSlashCommand(interactionApi as Discord.CommandInteraction);
                }
            }
            else if (interactionApi.type == Discord.InteractionType.MessageComponent) {
                this.interactionMessageComponent(interactionApi);
            }
            else if (interactionApi.type == Discord.InteractionType.ModalSubmit) {
                this.interactionModal(interactionApi);
            }
        });
    }


    // TODO: add new Role Event & add Role to a User Event


    /*** Interaction Received ***/

    // Get a recycled interaction for BotSystem process
    getRecyclcyedInteract(interactionApi: Discord.BaseInteraction): InteractionRecycled {
        let interact = this.interactRecycler.getRecycledMessage(interactionApi);
        interact._author = this.discordApi.chat.users.get(interactionApi.user.id); // replace the user from Api by the BotSystem User
        interact._channel = this.discordApi.chat.channels.get(interactionApi.channel.name); // replace the channel from Api by the BotSystem Channel
        return interact;
    }

    // Receive a command interaction slash command
    interactionSlashCommand(interactionApi: Discord.CommandInteraction) {
        let cmdAdapt = this.discordApi.command.cmdMap.get(interactionApi.commandName);
        if (cmdAdapt) { // the command exist
            let interact = this.getRecyclcyedInteract(interactionApi);
            interact.type = InteractionType.SlashCmd;

            interact.name = cmdAdapt.bsCmd.name;
            interact.arguments = (interactionApi as any).options._hoistedOptions;
            interact.arguments?.forEach(arg => {
                arg.type = ConvertArgumentType.convertDiscord2Bs(arg.type as any);

                if (cmdAdapt.adaptedName) {
                    arg.name = cmdAdapt.bsCmd.arguments.find(a => a.name.toLowerCase() == arg.name)?.name;
                }

                if (arg.type == InteractionArgumentType.User) {
                    arg.value = this.discordApi.chat.users.get(((arg as any).user as Discord.User).id);
                }
                else if (arg.type == InteractionArgumentType.Channel) {
                    arg.value = this.discordApi.chat.channels.get(((arg as any).channel as Discord.GuildChannel).name);
                }
            });

            this._interactCreationFct(interact);
        }
    }

    // Receive a button interaction return
    interactionMessageComponent(interactionApi: Discord.MessageComponentInteraction) {
        let interact = this.getRecyclcyedInteract(interactionApi);
        interact.type = InteractionType.MessageComponentInteraction;
        interact.name = interactionApi.customId;
        if (interactionApi.componentType == Discord.ComponentType.StringSelect) {
            interact.choice = (interactionApi as Discord.StringSelectMenuInteraction).values;
        }
        else if (interactionApi.componentType == Discord.ComponentType.MentionableSelect) {
            interact.choice = this.getMentionableChoice(interactionApi as Discord.MentionableSelectMenuInteraction);
        }
        else if (interactionApi.componentType == Discord.ComponentType.ChannelSelect) {
            interact.choice = this.getChannelChoice(interactionApi as Discord.ChannelSelectMenuInteraction);
        }
        this._interactCreationFct(interact);
    }

    /**
     * Get the user chosen from mentionable select interaction
     * @param mentionChoice the interaction sent with the users choice
     * @returns the BotSystem user chosen in a array
     */
    private getMentionableChoice(mentionChoice: Discord.MentionableSelectMenuInteraction | Discord.SelectMenuModalData): User[] {
        let usersChosen: User[] = [];
        // add the user chosen
        mentionChoice.users?.forEach(userApiChosen => {
            let userChosen = this.discordApi.chat.users.get(userApiChosen.id);
            if (userChosen != undefined && !usersChosen.includes(userChosen)) {
                usersChosen.push(userChosen);
            }
        });
        // add the user chosen from a role
        mentionChoice.roles?.forEach(roleApiChosen => {
            let roleChosen = this.discordApi.chat.roles.get(roleApiChosen.id);
            if (roleChosen != undefined) {
                roleChosen.users.forEach(userChosen => {
                    if (!usersChosen.includes(userChosen)) {
                        usersChosen.push(userChosen)
                    }
                });
            }
        });
        return usersChosen;
    }

    /**
     * Get the channel chosen from the channel select interaction
     * @param channelChoice the interaction sent with the channel choice
     * @returns the botSystem channel chosen in a array 
     */
    private getChannelChoice(channelChoice: Discord.ChannelSelectMenuInteraction | Discord.SelectMenuModalData): Channel[] {
        let channelsChosen: Channel[] = [];
        channelChoice.channels?.forEach(channelApi => {
            if(channelApi.type == Discord.ChannelType.GuildText) {
                let channelChosen = this.discordApi.chat.channels.get(channelApi.name);
                if(channelChosen != undefined) {
                    channelsChosen.push(channelChosen);
                }
            }
        });
        return channelsChosen;
    }


    // receive a modal submit
    interactionModal(interactionApi: Discord.ModalSubmitInteraction) {
        let interact = this.getRecyclcyedInteract(interactionApi);
        interact.type = InteractionType.ModalSubmit;
        interact.name = interactionApi.customId;

        if (interactionApi.components.length == 1 && interactionApi.components[0].type == Discord.ComponentType.Label) {
            // it is modal from a button adaptation input text
            let modalChoiceData = this.getModalChoice(interactionApi.components[0]);
            if (modalChoiceData.type != MsgComponentType.Unknow) {
                interact.choice = modalChoiceData.choice;
            }
        }
        else {
            let modalChoices: ModalChoiceData[] = [];
            interactionApi.components.forEach(c => {
                let modalChoiceData = this.getModalChoice(c);
                if (modalChoiceData != undefined) {
                    modalChoices.push(modalChoiceData);
                }
            });
            interact.choice = modalChoices;
        }

        this._interactCreationFct(interact);
    }

    private getModalChoice(labelData: Discord.ActionRowModalData | Discord.LabelModalData): ModalChoiceData {
        if (labelData.type == Discord.ComponentType.Label) {
            switch (labelData.component.type) {
                case Discord.ComponentType.StringSelect:
                    return {
                        type: MsgComponentType.StringSelect,
                        id: labelData.component.customId,
                        choice: labelData.component.values
                    };
                case Discord.ComponentType.MentionableSelect:
                    return {
                        type: MsgComponentType.MentionableSelect,
                        id: labelData.component.customId,
                        choice: this.getMentionableChoice(labelData.component)
                    };
                case Discord.ComponentType.ChannelSelect:
                    return {
                        type: MsgComponentType.ChannelSelect,
                        id: labelData.component.customId,
                        choice: this.getChannelChoice(labelData.component)
                    };
                case Discord.ComponentType.TextInput:
                    return {
                        type: MsgComponentType.InputText,
                        id: labelData.component.customId,
                        choice: labelData.component.value
                    };
                default:
                    break;
            }
        }
        return undefined;
    }


}































