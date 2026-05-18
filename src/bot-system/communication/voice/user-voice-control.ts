import { VoiceChannel } from "./voice-type";

export interface UserVoiceControlApiFunction {
    isDeaf(userVoiceControlApi: any): boolean
    isMute(userVoiceControlApi: any): boolean

    setDeaf(userVoiceControlApi: any, deaf: boolean): void
    setMute(userVoiceControlApi: any, mute: boolean): void

    disconnect(userVoiceControlApi: any): void
    moveVoiceChannel(userVoiceControlApi: any, voiceChannel: VoiceChannel): void
}

// User Voice Control
export class UserVoiceControl {
    protected userVoiceControlApi: any
    protected _channel: VoiceChannel
    private userVoiceControlFunction: UserVoiceControlApiFunction

    constructor(userVoiceControlApi: any, actualVoiceChannel: VoiceChannel, userVoiceControlFunction: UserVoiceControlApiFunction) {
        this.userVoiceControlApi = userVoiceControlApi;
        this._channel = actualVoiceChannel;
        this.userVoiceControlFunction = userVoiceControlFunction;
    }

    get channel(): VoiceChannel {
        return this._channel;
    }
    set channel(voiceChannel: VoiceChannel) {
        if(this._channel != undefined && this._channel.name != voiceChannel.name) {
            this.userVoiceControlFunction.moveVoiceChannel(this.userVoiceControlApi, voiceChannel);
        }
    }
    get deaf(): boolean {
        return this.userVoiceControlFunction.isDeaf(this.userVoiceControlApi);
    }
    set deaf(deaf: boolean) {
        this.userVoiceControlFunction.setDeaf(this.userVoiceControlApi, deaf);
    }
    get mute(): boolean {
        return this.userVoiceControlFunction.isMute(this.userVoiceControlApi);
    }
    set mute(mute: boolean) {
        this.userVoiceControlFunction.setMute(this.userVoiceControlApi, mute);
    }
    get connected(): boolean {
        return this._channel != undefined;
    }

    disconnet(): void {
        this.userVoiceControlFunction.disconnect(this.userVoiceControlApi);
    }
}

export class UserVoiceUpdateControl extends UserVoiceControl {
    update(userVoiceControlApi: any, channel: VoiceChannel) {
        this.userVoiceControlApi = userVoiceControlApi;
        this._channel = channel;
    }
}