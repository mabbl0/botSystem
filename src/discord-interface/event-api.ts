import { EventAPI } from "../bot-system/interface-api/interface-api-type";
import Discord from "discord.js"
import { DiscordInterface } from "./discord-interface-api";
import { Recycler } from "../tools/collection/recycler";
import { User } from "../bot-system/user/user-type";
import { ConvertArgumentType, adaptMessageComponent } from "./util/discord-convert-type";
import { VoiceChannel } from "../bot-system/communication/voice/voice-type";
import { UserVoiceUpdateable } from "../bot-system/communication/voice/user-voice";
import { MessageApi, MessageCore, MessageRecycled } from "../bot-system/communication/message";
import { InteractionArgumentType, InteractionRecycled, InteractionType } from "../bot-system/communication/interaction";
import { MsgToSend } from "../bot-system/communication/comm-type";
import { ChannelCore } from "../bot-system/communication/channel";
import { MsgComponentAdapterApi, MsgComponentDisplayType } from "../bot-system/communication/message-component/message-component-type";
import { MsgComponentAdapter } from "./util/message-component-adapter";


export class EventDiscord implements EventAPI {
    private discordApi: DiscordInterface
    msgRecycler: Recycler<MessageRecycled>
    interactRecycler: Recycler<InteractionRecycled>

    private _interactCreationFct: (interaction: InteractionRecycled) => void

    constructor(discordApi: DiscordInterface) {
        this.discordApi = discordApi;
    }

    /**
     * Method call before every botSystem message sent
     * @param msg want to be sent
     * @returns indicate if the message sould be sent
     */
    controlBeforeSent(msg: MsgToSend): boolean {
        // check if the message too long, needed to be truncate
        if (msg.content?.length > 2000) {
            msg.content = msg.content.slice(0, 2000);
        }

        // adapt message option
        (msg as any).flags = 0;
        if (msg.option?.ephemeral) {
            (msg as any).flags += Discord.MessageFlags.Ephemeral;
        }

        // adapt message Component
        if (msg.components != undefined) {
            adaptMessageComponent(msg);
        }

        return true;
    }

    /*** Method to Initiate Events ***/

    // Initiate the message creation event, and convert message discord in message bs
    initMessageCreationEvent(messageRecycler: Recycler<MessageRecycled>, msgCreationFct: (msg: MessageRecycled) => void) {
        this.msgRecycler = messageRecycler;

        this.discordApi.bot.on(Discord.Events.MessageCreate, (messageApi) => {
            let msg = this.msgRecycler.getRecycledMessage(messageApi);
            msg._author = this.discordApi.chat.users.get(messageApi.author.id); // replace the user from Api by the BotSystem User
            msg._channel = this.discordApi.chat.channels.get((messageApi.channel as Discord.TextChannel).name); // replace the channel from Api by the BotSystem Channel
            msg._date = messageApi.createdTimestamp;

            msgCreationFct(msg);
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
            let newUser = new User(memberApi.user,
                memberApi.roles as any,
                memberApi.voice as any,
                memberApi.voice.channel != undefined ? this.discordApi.chat.voiceChannels.get(memberApi.voice.channel?.name) : undefined);
            this.discordApi.chat.users.set(newUser);
            userAddFct(newUser);
        });
    }

    // Initiate the new channel created Event
    initChannelCreateEvent(channelCreateFct: (channel: ChannelCore) => void) {
        this.discordApi.bot.on(Discord.Events.ChannelCreate, (channelApi) => {
            if (channelApi.type == Discord.ChannelType.GuildText) {
                let channel = new ChannelCore(channelApi as any);
                this.discordApi.chat.channels.set(channel);
                channelCreateFct(channel);
            }
            else if (channelApi.type == Discord.ChannelType.GuildVoice) {
                (channelApi as any).usersApi = function () { return this.members };
                this.discordApi.chat.voiceChannels.set(new VoiceChannel(channelApi as any, this.discordApi.chat.usersApiToUsers.bind(this.discordApi.chat)));
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
            (user.voice as UserVoiceUpdateable).update(newState as any, newChannel);

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
            interact.interactApi.deferAns = function () { (this as any).deferReply() };

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
        interact.interactApi.deferAns = function () { (this as any).deferUpdate() };
        interact.name = interactionApi.customId;
        interact.interactApi.edit = function (msg) { return (this as any).update(msg) };
        if (interactionApi.componentType == Discord.ComponentType.StringSelect) {
            interact.choice = (interactionApi as Discord.StringSelectMenuInteraction).values;
        }
        else if (interactionApi.componentType == Discord.ComponentType.MentionableSelect) {
            interact.choice = this.getMentionableChoice(interactionApi as Discord.MentionableSelectMenuInteraction);
        }
        this._interactCreationFct(interact);
    }

    /**
     * Get the user chosen form mentionable select interaction
     * @param interactionApi the interaction sent with the users choice
     * @returns the user chosen in a array
     */
    private getMentionableChoice(interactionApi: Discord.MentionableSelectMenuInteraction): User[] {
        let usersChosen: User[] = [];
        // add the user chosen
        interactionApi.users.forEach(userApiChosen => {
            let userChosen = this.discordApi.chat.users.get(userApiChosen.id);
            if (userChosen != undefined && !usersChosen.includes(userChosen)) {
                usersChosen.push(userChosen);
            }
        });
        // add the user chosen from a role
        interactionApi.roles.forEach(roleApiChosen => {
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


    /*** Adapt Method ***/
    adaptMessageContent(msg: MessageCore, msgApi: MessageApi): void {
        // msgApi can be a Discord.Message or Discord.InteractionResponse
        msg.msgApi = msgApi;    // for now
        if ((msgApi as any).interaction != undefined) {
            let interactionRep = (msgApi as any) as Discord.InteractionResponse;
            msg._author = this.discordApi.chat.users.get(interactionRep.client.user.id);
            msg._channel = this.discordApi.chat.channels.get(interactionRep.interaction.channel.name);
            msg._date = interactionRep.createdTimestamp;
            interactionRep.fetch().then((msgDiscord) => {
                // Warning: the msgDiscord ephemeral can not be editing or reply
                // message ephemeral does not existing for discord
                if ((msgDiscord.flags.bitfield & Discord.MessageFlags.Ephemeral) == 0) {
                    // not ephemeral
                    msg.msgApi = msgDiscord as any;
                }
            });
        }
        else {
            msg._author = this.discordApi.chat.users.get(msgApi.author.id);
            msg._channel = this.discordApi.chat.channels.get(msgApi.channel.name);
            msg._date = (msgApi as Discord.Message).createdTimestamp;
        }
    }

    getMessageComponentAdapterConstructor(): new () => MsgComponentAdapterApi {
        return MsgComponentAdapter;
    }








    postMsg(messageApi: MessageApi, msg: MsgToSend) {
        if (msg.components?.displayType == MsgComponentDisplayType.Modal) {
            console.log('a modal !!!');
            
            this.discordApi.bot.rest.post(Discord.Routes.interactionCallback((messageApi as Discord.Message).id, (messageApi as Discord.Message).client.token), {
                body: {
                    type: Discord.InteractionResponseType.Modal,
                    data: {
                        customId: "customid",
                        title: "modal title",
                        components: [
                            {type: 10, content: "coucou"}
                        ]
                    }/*isJSONEncodable(modal) ? modal.toJSON() : this.client.options.jsonTransformer(modal),*/
                },
                auth: false,
                query: Discord.makeURLSearchParams({ with_response: false }),
            });
        }



    }














}































