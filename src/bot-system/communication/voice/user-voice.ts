import { VoiceChannel, VoiceChannelApi } from "./voice-type";

export interface UserVoiceApi {
    deaf: boolean
    mute: boolean

    setDeaf(deaf: boolean): void;
    setMute(mute: boolean): void;
    disconnect(): void;
    setChannel(channel: VoiceChannelApi): void;
}

// User Voice Control
export class UserVoice {
    protected userVoiceApi: UserVoiceApi
    protected _channel: VoiceChannel

    constructor(userVoiceApi: UserVoiceApi, actualVoiceChannel: VoiceChannel) {
        this.userVoiceApi = userVoiceApi;
        this._channel = actualVoiceChannel;
    }

    get channel(): VoiceChannel {
        return this._channel;
    }
    set channel(voiceChannel: VoiceChannel) {
        if(this._channel != undefined && this._channel.name != voiceChannel.name) {
            this.userVoiceApi.setChannel(voiceChannel.voiceChannelApi);
        }
    }
    get deaf(): boolean {
        return this.userVoiceApi.deaf;
    }
    set deaf(deaf: boolean) {
        this.userVoiceApi.setDeaf(deaf);
    }
    get mute(): boolean {
        return this.userVoiceApi.mute;
    }
    set mute(mute: boolean) {
        this.userVoiceApi.setMute(mute);
    }
    get connected(): boolean {
        return this._channel != undefined;
    }

    disconnet(): void {
        this.userVoiceApi.disconnect();
    }
}

export class UserVoiceUpdateable extends UserVoice {
    update(userVoiceApi: UserVoiceApi, channel: VoiceChannel) {
        this.userVoiceApi = userVoiceApi;
        this._channel = channel;
    }
}