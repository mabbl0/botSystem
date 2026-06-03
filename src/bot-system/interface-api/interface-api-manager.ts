import { InterfaceAPI } from "./interface-api-type";
import { User } from "../user/user";
import { Recycler } from "../../tools/collection/recycler";
import { UnitComponent } from "../component/unit-component";
import { MessageRecycled } from "../communication/message";
import { InteractionRecycled } from "../communication/interaction";
import { Channel } from "../communication/channel";

// TODO: add all interaction with the interface api

/** @internal */
export class InterfaceApiManager extends UnitComponent {
    private _interfaceAPI: InterfaceAPI

    msgRecycler: Recycler<MessageRecycled>
    interactRecycler: Recycler<InteractionRecycled>

    fctBootEvent: () => void
    fctMessageCreation: (message: MessageRecycled) => void
    fctAddUserEvent: (user: User) => void
    fctCreateChannelEvent: (channel: Channel) => void
    fctUserVoiceConnection: (user: User) => void
    fctInteractionCreation: (interaction: InteractionRecycled) => void

    constructor(){
        super("InterfaceApiManager", "Manage Interface Api");
    }

    /** Getter Setter ***/
    get interfaceApi(){
        return this._interfaceAPI;
    }

    // Add an interface Api
    addInterfaceAPI(interfaceAPI: InterfaceAPI){
        if(this._interfaceAPI == undefined){
            this._interfaceAPI = interfaceAPI;
            this._interfaceAPI.log = this.log.bind(this);
            this.logInfo(`New interface Api add: ${interfaceAPI.name}`);

            if(!this.fctBootEvent && !this.msgRecycler && !this.fctMessageCreation && !this.fctAddUserEvent){
                this.logError("Shall init Boot & MessageCreation & AddUser Events");
                return;
            }
            
            this._interfaceAPI.event.initBootEvent( this.fctBootEvent );
            this._interfaceAPI.event.initMessageCreationEvent( this.msgRecycler, this.fctMessageCreation );
            this._interfaceAPI.event.initUserAddEvent( this.fctAddUserEvent );
            this._interfaceAPI.event.initChannelCreateEvent( this.fctCreateChannelEvent );
            this._interfaceAPI.event.initVoiceUpdateEvent( this.fctUserVoiceConnection );
            this._interfaceAPI.event.initInteractionCreationEvent( this.interactRecycler, this.fctInteractionCreation );
        }
    }

}