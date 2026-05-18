import { VoiceConnection, AudioPlayer, AudioPlayerStatus, joinVoiceChannel, createAudioPlayer, 
    createAudioResource, AudioPlayerState, VoiceConnectionState,
    VoiceConnectionStatus} from '@discordjs/voice'
import Discord from "discord.js"

import { createReadStream } from 'fs'
import { PlayAudioOption, VoiceChannel } from "../bot-system/communication/voice/voice-type";
import { BotVoiceControlAPI } from "../bot-system/interface-api/interface-api-type";
import { DiscordInterface } from "./discord-interface-api";
import { LogLevel } from '../bot-system/component/component-type';


// https://discordjs.guide/voice/audio-player

interface NewStateEvent<StatusType,StateType> {
    previousStatus?: StatusType
    wakeupStatus: StatusType
    callback: (newState: StateType) => void
}
type NewConnectionStateEvent = NewStateEvent<VoiceConnectionStatus,VoiceConnectionState>
type NewPlayerStateEvent = NewStateEvent<AudioPlayerStatus,AudioPlayerState>


export class BotVoiceControlDiscord implements BotVoiceControlAPI {
    private discordApi: DiscordInterface
    private currentConnection: VoiceConnection
    private audioPlayer: AudioPlayer

    private newStateConnectionEvent: Array<NewConnectionStateEvent>
    private newStatePlayerEvent: Array<NewPlayerStateEvent>

    constructor(discordApi: DiscordInterface) {
        this.discordApi = discordApi;
        this.initAudioPlayer();

        this.newStateConnectionEvent = [];
        this.newStatePlayerEvent = [];
    }

    private initAudioPlayer() {
        this.audioPlayer = createAudioPlayer();

        // init audio player event
        this.audioPlayer.on('stateChange', (oldState, newState) => {
            this.discordApi.log(LogLevel.Debug, `AudioPlayer new state ${oldState.status} -> ${newState.status}`);
            
            for (let i = 0; i < this.newStatePlayerEvent.length; i++) {
                if(((this.newStatePlayerEvent[i].previousStatus != undefined && this.newStatePlayerEvent[i].previousStatus === oldState.status) || 
                    this.newStatePlayerEvent[i].previousStatus == undefined) &&
                    this.newStatePlayerEvent[i].wakeupStatus === newState.status )
                {
                    this.newStatePlayerEvent[i].callback(newState);
                    this.newStatePlayerEvent.splice(i,1);
                    i += -1;
                }
            }
        });

        this.audioPlayer.on('error', console.error);
    }

    /**
     * Connect the bot to a voice channel
     */
    botVoiceConnection(channel: VoiceChannel) {
        this.currentConnection = joinVoiceChannel({
            channelId: ((channel as any).voiceChannelApi as Discord.VoiceChannel).id,
            guildId: this.discordApi.guild.id,
            adapterCreator: this.discordApi.guild.voiceAdapterCreator
        });

        this.currentConnection.on('stateChange', (oldState, newState) => {
            this.discordApi.log(LogLevel.Debug, `Connection new state ${oldState.status} -> ${newState.status}`);
            
            for (let i = 0; i < this.newStateConnectionEvent.length; i++) {
                if(((this.newStateConnectionEvent[i].previousStatus != undefined && this.newStateConnectionEvent[i].previousStatus === oldState.status) || 
                    this.newStateConnectionEvent[i].previousStatus == undefined) &&
                    this.newStateConnectionEvent[i].wakeupStatus === newState.status )
                {
                    this.newStateConnectionEvent[i].callback(newState);
                    this.newStateConnectionEvent.splice(i,1);
                    i += -1;
                }
            }
        });
        
        this.currentConnection.on('error', console.error);
    }


    /**
     * Disconnect the bot to its voice connection
     */
    botVoiceDisconnection() {
        this.currentConnection?.destroy();
        this.currentConnection = undefined;
    }


    /**
     * Try to play a audio file, if the bot is connected
     * @param audioFileName audio file name
     * @param volume volume in percent
     * @return promise resolve when the audio is finish to play
     */
    playAudio(audioFileName: string, option?: PlayAudioOption): Promise<PlayAudioOption> {
        if(this.currentConnection == undefined) {
            this.discordApi.log(LogLevel.Error, 'Bot no connected to a voice channel');
            return new Promise<PlayAudioOption>( resolveFct => resolveFct(option));
        }

        let resource = createAudioResource( createReadStream(audioFileName), {inlineVolume: true} );
        if(option != undefined && option?.volume != undefined) {
            resource.volume.setVolume( option?.volume/100 );
        }

        this.audioPlayer.play(resource);
        this.currentConnection.subscribe(this.audioPlayer);
        
        return new Promise<PlayAudioOption>( resolveFct =>
            this.newStatePlayerEvent.push( {
                wakeupStatus: AudioPlayerStatus.Idle,
                callback: () => resolveFct(option)
            })
        );
    }
}