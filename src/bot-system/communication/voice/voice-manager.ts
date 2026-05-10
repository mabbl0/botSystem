import { MapName } from "../../../tools/collection/map";
import { checkExtensionList, existFile } from "../../../tools/file";
import { UnitComponent } from "../../component/unit-component";
import { BotVoiceControlAPI } from "../../interface-api/interface-api-type";
import { PlayAudioOption, VoiceChannel } from "./voice-type";

export class VoiceManager extends UnitComponent {
    private voiceChannels: MapName<VoiceChannel>
    private voiceControlApi: BotVoiceControlAPI

    private dataDirPath: string
    private currentVoiceChannel: VoiceChannel

    private stayInChannel: boolean

    constructor(dataDirPath: string) {
        super('VoiceManager', "Manage Voice Channel and Bot audio play");
        this.dataDirPath = dataDirPath;
        this.stayInChannel = false;

        /** Declare Methods **/
        this.mthInterface.addMethod('getVoiceChannel', this.getVoiceChannel.bind(this));
        this.mthInterface.addMethod('playAudioFile', this.playAudioFile.bind(this));
        this.mthInterface.addMethod('vocalConnection', this.vocalConnection.bind(this));
        this.mthInterface.addMethod('vocalDisconnection', this.vocalDisconnection.bind(this));

    }

    set botVoiceControlApi(voiceControlApi: BotVoiceControlAPI) {
        if(this.voiceControlApi == undefined) { // only once
            this.voiceControlApi = voiceControlApi;
        }
    }


    initVoiceChannels(voiceChannels: MapName<VoiceChannel>) {
        if (this.voiceChannels == undefined) {
            this.voiceChannels = voiceChannels;
            this.logInfo(`${voiceChannels.size} Voice Channels initiate`);
        }
    }

    /** Methods **/

    // get a voice channel by its name
    getVoiceChannel(channelName: string): VoiceChannel {
        return this.voiceChannels?.get(channelName);
    }

    // play an audio file in a voice channel
    playAudioFile(audioFileName: string, voiceChannel: VoiceChannel, option?: PlayAudioOption) {
        if(!checkExtensionList(audioFileName, ['mp3', 'opus'])) {
            this.logError(`File ${audioFileName} has not great extension. Need mp3 or opus extension`);
            return;
        }
        let pathFile = this.dataDirPath + audioFileName;
        if(!existFile(pathFile)) {
            this.logError(`File ${pathFile} not found to play audio`);
            return;
        }

        this.vocalConnection(voiceChannel, option);
        this.voiceControlApi?.playAudio(pathFile, option).then( () => {
            if(!this.stayInChannel) {
                this.voiceControlApi?.botVoiceDisconnection();
                this.currentVoiceChannel = undefined;
            }
        });
        this.logInfo(`Play '${pathFile}' audio to the ${voiceChannel.name} voice channel`);
    }

    // connection to a voice channel
    vocalConnection(voiceChannel: VoiceChannel, option?: PlayAudioOption) {
        if(this.currentVoiceChannel != voiceChannel) {
            this.voiceControlApi?.botVoiceConnection(voiceChannel);
            this.currentVoiceChannel = voiceChannel;
            this.stayInChannel = option?.stayInChannel ? true : false;
        }
        else if(option!=undefined && option?.stayInChannel!=undefined &&
            this.stayInChannel != option?.stayInChannel)
        {
            this.stayInChannel = option?.stayInChannel;
        }
    }

    // disconnection to a voice channel
    vocalDisconnection(voiceChannel: VoiceChannel) {
        if(this.currentVoiceChannel == voiceChannel) {
            this.voiceControlApi?.botVoiceDisconnection();
            this.currentVoiceChannel = undefined;
            this.stayInChannel = false;
        }
    }
}