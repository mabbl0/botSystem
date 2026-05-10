import { User, UserApi } from "../../user/user-type";

export interface PlayAudioOption {
    stayInChannel?: boolean
    volume?: number
}

export interface VoiceChannelApi {
    name: string
    usersApi(): Array<UserApi>
    toString(): string
}

// Voice channel
export class VoiceChannel {
    readonly voiceChannelApi: VoiceChannelApi
    private usersApiToUsers: (usersApiList: Array<UserApi>)=>Array<User>

    constructor(voiceChannelApi: VoiceChannelApi, usersApiToUsers: (usersApiList: Array<UserApi>)=>Array<User>){
        this.voiceChannelApi = voiceChannelApi;
        this.usersApiToUsers = usersApiToUsers;
    }

    get name() : string {
        return this.voiceChannelApi.name;
    }

    /**
     * Return the user list connected to the voice channel
     */
    users(): Array<User> {
        return this.usersApiToUsers( this.voiceChannelApi.usersApi() );
    }
    
    /**
     * Return the voice channel mention
     */
    toString(): string{
        return this.voiceChannelApi.toString();
    }
}
