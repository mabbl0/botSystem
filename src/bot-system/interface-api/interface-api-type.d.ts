import { User, Role } from "../user/user-type";
import { MapName, MapNameId } from "../../tools/collection/map";
import { Recycler } from "../../tools/collection/recycler";
import { SlashCmd } from "../communication/command/command-type";
import { MsgToSend } from "../communication/comm-type";
import { PlayAudioOption, VoiceChannel } from "../communication/voice/voice-type";
import { MessageApi, MessageCore, MessageRecycled } from "../communication/message";
import { InteractionRecycled } from "../communication/interaction";
import { Channel, ChannelCore } from "../communication/channel";
import { MsgComponentAdapterApi } from "../communication/message-component/message-component-type";


/*** Interface for the interface Api Class ***/

export interface InterfaceAPI {
    event: EventAPI
    chat: ChatAPI
    command: CommandAPI
    mentioned: MentionedAPI
    voiceControl: BotVoiceControlAPI

    log: (logLevel: number, txt: string) => void

    get name(): string
    startBot(): void
}

export interface EventAPI {
    controlBeforeSent(msg: MsgToSend): boolean;

    /*** Method to Initiate Events ***/
    initBootEvent( bootFct: () => void ): void
    initMessageCreationEvent( messageRecycler: Recycler<MessageRecycled>, msgCreationFct: (message: MessageRecycled) => void ): void
    initInteractionCreationEvent( interactRecycler: Recycler<InteractionRecycled>, interactCreationFct: (interaction: InteractionRecycled) => void): void
    initUserAddEvent(userAddFct: (user: User) => void): void
    initChannelCreateEvent(channelCreateFct: (channel: Channel) => void): void
    initVoiceUpdateEvent(userVoiceConnexionFct: (user: User) => void): void

    /*** Adapt Method ***/
    adaptMessageContent(msg: MessageCore, msgApi: MessageApi): void
    getMessageComponentAdapterConstructor(): new () => MsgComponentAdapterApi

    postMsg(messageApi: MessageApi, msg: MsgToSend): void
}

export interface ChatAPI {
    /*** Method to get chat object ***/
    // return the channel list
    getChannels(): MapName<ChannelCore>
    // return the voice channel list
    getVoiceChannels(): MapName<VoiceChannel>
    // return the user server list
    getUsers(): MapNameId<User>
    // return the user server list
    getRoles(): MapNameId<Role>
}

export interface CommandAPI {
    /*** Method for Command ***/
    initCmdMap(slashCmds: MapName<SlashCmd>): void
    updateBotCommands(): void
}

// Return user/Role/Channel mentioned in a string
export interface MentionedAPI {
    getMentionedUser(userList: MapNameId<User>, str: string): User[];
    getMentionedRole(roleList: MapNameId<Role>, str: string): Role[];
    getMentionedChannel(channelList: MapName<ChannelCore>, str: string): ChannelCore[];
}


export interface BotVoiceControlAPI {
    /**
     * Connect the bot to a voice channel
     */
    botVoiceConnection: (channel: VoiceChannel) => void
    /**
     * Disconnect the bot to its voice connection
     */
    botVoiceDisconnection: () => void
    /**
     * Try to play a audio file, if the bot is connected
     * @param audioFileName audio file name
     * @param volume volume in percent
     */
    playAudio: (audioFileName: string, option?: PlayAudioOption) => Promise<PlayAudioOption>
}