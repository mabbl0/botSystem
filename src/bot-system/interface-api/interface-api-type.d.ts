import { User } from "../user/user";
import { MapName, MapNameId } from "../../tools/collection/map";
import { Recycler } from "../../tools/collection/recycler";
import { SlashCmd } from "../communication/command/command-type";
import { CommReturn, CommunicationAction, MsgToSend } from "../communication/comm-type";
import { PlayAudioOption, VoiceChannel } from "../communication/voice/voice-channel";
import { MessageRecycled } from "../communication/message";
import { InteractionRecycled } from "../communication/interaction";
import { Channel, ChannelCore } from "../communication/channel";
import { MsgComponentAdapterApi } from "../communication/message-component/message-component-type";
import { Role } from "../user/role";


/*** Interface for the interface Api Class ***/

export interface InterfaceAPI {
    /** @internal */
    event: EventAPI
    /** @internal */
    adaptComm: AdaptCommAPI
    /** @internal */
    chat: ChatAPI
    /** @internal */
    command: CommandAPI
    /** @internal */
    mentioned: MentionedAPI
    /** @internal */
    voiceControl: BotVoiceControlAPI

    /** @internal */
    log: (logLevel: number, txt: string) => void

    get name(): string
    /** @internal */
    startBot(): void
}

/** @internal */
export interface EventAPI {
    /*** Method to Initiate Events ***/
    /** @internal */
    initBootEvent( bootFct: () => void ): void
    /** @internal */
    initMessageCreationEvent( messageRecycler: Recycler<MessageRecycled>, msgCreationFct: (message: MessageRecycled) => void ): void
    /** @internal */
    initInteractionCreationEvent( interactRecycler: Recycler<InteractionRecycled>, interactCreationFct: (interaction: InteractionRecycled) => void): void
    /** @internal */
    initUserAddEvent(userAddFct: (user: User) => void): void
    /** @internal */
    initChannelCreateEvent(channelCreateFct: (channel: Channel) => void): void
    /** @internal */
    initVoiceUpdateEvent(userVoiceConnexionFct: (user: User) => void): void
}

/** @internal */
export interface AdaptCommAPI {
    commActionApi<PromiseReplyType>(action: CommunicationAction, msgToSend: MsgToSend, apiObject: any, withReturn: boolean): CommReturn<PromiseReplyType>
    getMessageComponentAdapterConstructor(): new () => MsgComponentAdapterApi
}

/** @internal */
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

/** @internal */
export interface CommandAPI {
    /*** Method for Command ***/
    initCmdMap(slashCmds: MapName<SlashCmd>): void
    updateBotCommands(): void
}

// Return user/Role/Channel mentioned in a string
/** @internal */
export interface MentionedAPI {
    getMentionedUser(userList: MapNameId<User>, str: string): User[];
    getMentionedRole(roleList: MapNameId<Role>, str: string): Role[];
    getMentionedChannel(channelList: MapName<ChannelCore>, str: string): ChannelCore[];
}


/** @internal */
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