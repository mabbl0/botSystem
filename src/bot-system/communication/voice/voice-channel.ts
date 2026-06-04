import { User } from "../../user/user";

export interface PlayAudioOption {
    stayInChannel?: boolean
    volume?: number
}

// Voice channel
export class VoiceChannel {
    #voiceChannelApi: any

    readonly name: string
    #mentionName: string
    #getVoiceChannelUsers: (voiceChannelApi: any) => Array<User>

    /** @internal */
    constructor(voiceChannelApi: any, name: string, mentionName: string, getVoiceChannelUsers: (voiceChannelApi: any) => Array<User>){
        this.#voiceChannelApi = voiceChannelApi;
        this.name = name;
        this.#mentionName = mentionName;
        this.#getVoiceChannelUsers = getVoiceChannelUsers;
    }

    /**
     * Return the user list connected to the voice channel
     */
    users(): Array<User> {
        return this.#getVoiceChannelUsers( this.#voiceChannelApi );
    }
    
    /**
     * Return the voice channel mention
     */
    toString(): string{
        return this.#mentionName;
    }
}
