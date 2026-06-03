import { UserVoiceControl, UserVoiceControlApiFunction, UserVoiceUpdateControl } from "../communication/voice/user-voice-control";
import { VoiceChannel } from "../communication/voice/voice-channel";
import { Attribute } from "../property/attribute";
import { UserRoleControl, UserRoleControlApiFunction } from "./role";

export class User {
    readonly id: string
    readonly bot: boolean
    readonly name: string
    #mentionName: string
    #admin: boolean // fill by UserManager
    roles: UserRoleControl
    voice: UserVoiceControl

    attr: Attribute
    
    /** @internal */
    constructor(id: string, 
        bot: boolean,
        name: string,
        mentionName: string,
        userRoleManagerApi: any,
        userRoleControlApiFunction: UserRoleControlApiFunction,
        userVoiceApi: any,
        userVoiceControlFunction: UserVoiceControlApiFunction,
        actualVoiceChannel: VoiceChannel)
    {
        this.id = id;
        this.bot = bot;
        this.name = name;
        this.#mentionName = mentionName;
        this.roles = new UserRoleControl(this, userRoleManagerApi, userRoleControlApiFunction);
        this.voice = new UserVoiceUpdateControl(userVoiceApi, actualVoiceChannel, userVoiceControlFunction);
        this.attr = new Attribute();
    }
    
    get admin(){
        return this.#admin;
    }
    set admin(newValue: boolean){
        if(this.#admin==undefined){ // admin set onces
            this.#admin = newValue;
        }
        else{
            console.error("Try to set new admin value for " + this.name);
        }
    }

    toString(): string{
        return this.#mentionName;
    }
}
