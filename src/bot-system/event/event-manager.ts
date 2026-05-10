import { UnitComponent } from "../component/unit-component";
import { Event } from "./event";
import { User } from "../user/user-type"
import { MsgToSend } from "../communication/comm-type";
import { SaveInterface } from "../component/save-interface";
import { WakeupDateJson, WakeupDateController } from "./wakeup-data-controller";
import { EventConf } from "../bot-system-type";
import { WakeupDateEvent, WakeupDateOption } from "./wakeup-date-event";
import { Message } from "../communication/message";

interface EventsJson {
    wakeupDateEvents: WakeupDateJson
}

export class EventManager extends UnitComponent {
    private saveInterface: SaveInterface
    private eventArr: Array<Event<any,any>>

    // Event call when once at boot, after bot api connexion
    bootConnectedEvent: Event<[void],void>
    // Event call when a message is created, to interact with the message
    msgInteractionEvent: Event<[msg: Message], void>
    // Event call when a new user is added
    addedUserEvent: Event<[user: User], void>
    // Event call when a user connect to a voiceChannel
    userVoiceConnectionEvent: Event<[user: User], void>

    // Event call before to send (reply) to a message
    private beforeSentEvent: Event<[msg: MsgToSend], boolean>
    private _controlBeforeSentFct: (msg: MsgToSend) => boolean

    // every wake up date event, where sub are call to a specific date
    private wakeupDateController: WakeupDateController

    constructor(conf: EventConf) {
        super("EventManager", "Manage BotSystem Event");
        this.saveInterface = new SaveInterface(this.log.bind(this), this.name, this.propInterface, 'event.json', 1);
        this.eventArr = [];
        
        this.bootConnectedEvent = new Event<[void],void>("bootConnected");
        this.eventArr.push(this.bootConnectedEvent);
        this.msgInteractionEvent = new Event<[msg: Message], void>("msgInteraction");
        this.eventArr.push(this.msgInteractionEvent);
        this.addedUserEvent = new Event<[user: User], void>("addedUser");
        this.eventArr.push(this.addedUserEvent);
        this.userVoiceConnectionEvent = new Event<[user: User], void>("userVoiceConnexion");
        this.eventArr.push(this.userVoiceConnectionEvent);
        this.beforeSentEvent = new Event<[msg: MsgToSend], boolean>("BeforeSent");
        this.eventArr.push(this.beforeSentEvent);

        this.wakeupDateController = new WakeupDateController( this.log.bind(this), this.propInterface, this.save.bind(this), conf?.wakeupDate?.maxWait);
        this.load();
        this.bootConnectedEvent.addSub('wakeupDateController', this.wakeupDateController.boot.bind( this.wakeupDateController ));

        // Declare Method
        this.mthInterface.addMethod("subBootConnectedEvent", this.bootConnectedEvent.addSub.bind( this.bootConnectedEvent ));
        this.mthInterface.addMethod("subMsgInteractionEvent", this.msgInteractionEvent.addSub.bind( this.msgInteractionEvent ));
        this.mthInterface.addMethod("subAddedUserEvent",  this.addedUserEvent.addSub.bind( this.addedUserEvent ));
        this.mthInterface.addMethod("subUserVoiceConnectionEvent", this.userVoiceConnectionEvent.addSub.bind( this.userVoiceConnectionEvent ));
        this.mthInterface.addMethod("subBeforeSentEvent", this.beforeSentEvent.addSub.bind( this.beforeSentEvent ));

        this.mthInterface.addMethod("addNewWakeupDateEvent", this.addNewWakeupDateEvent.bind( this ));
        this.mthInterface.addMethod("addWakeupDateEvent", this.addWakeupDateEvent.bind( this ));
        this.mthInterface.addMethod("subToWakeupDateEvent", this.subToWakeupDateEvent.bind( this ));
        
        // Text Command
        this.cmdInterface.addTxtCmd('infoEvent', 'get the information about the envents', this.getInfoEvent.bind(this), {adminOnly: true});
        
        // update itself interface
        this.eventInterface.initInterface();
    }

    get saveFileName(): string {
        return this.saveInterface.fileName;
    }


    /** Events Call **/

    // Call before sent callback
    callBeforeSent(msg: MsgToSend): boolean {
        let shouldBeSent = this.beforeSentEvent.callWithReturn(true, (r,n) => r && n, msg);
        shouldBeSent = shouldBeSent && this._controlBeforeSentFct(msg);
        return shouldBeSent;
    }

    set controlBeforeSentFct(fct: (msg: MsgToSend) => boolean){
        if(this._controlBeforeSentFct == undefined){ // only once
            this._controlBeforeSentFct = fct;
        }
    }


    /*** WakeUp Date Event ***/

    /**
     * add a new wake up date event
     * @param eventName name of the event
     * @param ownerName name of the owner component
     * @param fct function call
     * @param option option for the event
     */
    addNewWakeupDateEvent<TArgs>(eventName: string, ownerName: string, fct: (args: TArgs) => void, option?: WakeupDateOption): void {
        this.wakeupDateController.addNewWakeupDateEvent(eventName, ownerName, fct, option);
    }

    /**
     * add a wake up date event
     * @param wudEventToAdd wake up date event to add
     */
    addWakeupDateEvent<TArgs>(wudEventToAdd: WakeupDateEvent<TArgs>): void {
        this.wakeupDateController.addWakeupDateEvent(wudEventToAdd);
    }

    /**
     * Sub to a wake up date event
     * @param eventName name of the event to sub
     * @param subName name of the name
     * @param args arguments for the sub
     * @param wakeupDate date to wake up the sub
     * @param nbCallBeforeRemove indicate the number of call before remove the sub, -1 to call forever
     * @param nextCall indicate when recall the sub if it is not remove
     */
    subToWakeupDateEvent<TArgs>(eventName: string, subName: string, args: TArgs, wakeupDate: number, nbCallBeforeRemove?: number, nextCall?: number) {
        this.wakeupDateController.subToWakeupDateEvent(eventName, subName, args, wakeupDate, nbCallBeforeRemove, nextCall);
    }


    /** Save Load **/
    load() {
        let dataLoaded = this.saveInterface.load<EventsJson>({
            wakeupDateEvents: {events: []}
        });
        this.wakeupDateController.load(dataLoaded.wakeupDateEvents);
    }
    save() {
        this.saveInterface.save<EventsJson>({
            wakeupDateEvents: this.wakeupDateController.toJson()
        });
    }

    /*** Get Information ***/

    // txt command to get the information about events
    getInfoEvent(msg: Message) {
        let strReply = '## Events Information\n';
        this.eventArr.forEach(e => {
            strReply += '- ' + e.getInfoEvent();
        });
        strReply += this.wakeupDateController.getInfoEvents();
        msg.reply(strReply);
    }
    
    // give event information about an component
    infoComponent(componentName: string): string {        
        let strReturn = '';
        let subListStr = '';
        let nbEventSub = 0;
        this.eventArr.forEach(e => {
            if(e.hasSub(componentName)) {
                nbEventSub += 1;
                subListStr += '  - ' + e.name + '\n';
            }
        });
        if(nbEventSub!=0) {
            strReturn += `- ${nbEventSub} events sub:\n`;
            strReturn += subListStr;
        }

        strReturn += this.wakeupDateController.infoComponent(componentName);
        return strReturn;
    }

}