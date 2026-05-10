import { User } from "../user/user-type"
import { MethodInterface } from "../method/method-interface"
import { MsgToSend } from "../communication/comm-type"
import { WakeupDateEvent, WakeupDateOption } from "./wakeup-date-event"
import { Message } from "../communication/message"

export class EventInterface {
    private componentName: string
    private mthInterface: MethodInterface

    private mthSubBootConnectedEvent: (componentName: String, fct: () => void) => void
    private mthSubMsgInteractionEvent: (componentName: String, fct: (msg: Message) => void) => void
    private mthSubAddedUserEvent: (componentName: String, fct: (user: User) => void) => void
    private mthSubUserVoiceConnectionEvent: (componentName: String, fct: (user: User) => void) => void
    private mthSubBeforeSentEvent: (componentName: String, fct: (msg: MsgToSend) => boolean) => void

    private mthAddNewWakeupDateEvent: <TArgs>(eventName: string, ownerName: string,  fct: (args: TArgs) => void, option?: WakeupDateOption) => void
    private mthAddWakeupDateEvent: <TArgs>(wudEventToAdd: WakeupDateEvent<TArgs>) => void
    private mthSubToWakeupDateEvent: <TArgs>(eventName: string, subName: string, args: TArgs, wakeupDate: number, nbCallBeforeRemove?: number, nextCall?: number) => void

    // constructor to init event interface
    constructor(componentName: string, mthInterface: MethodInterface) {
        this.componentName = componentName;
        this.mthInterface = mthInterface;

        this.initInterface();
    }
    
    // initiate the interface (in case if it can not be init in the constructor)
    initInterface(){
        this.mthSubBootConnectedEvent = this.mthInterface.getMethod("EventManager", "subBootConnectedEvent");
        this.mthSubMsgInteractionEvent = this.mthInterface.getMethod("EventManager", "subMsgInteractionEvent");
        this.mthSubAddedUserEvent = this.mthInterface.getMethod("EventManager", "subAddedUserEvent");
        this.mthSubUserVoiceConnectionEvent = this.mthInterface.getMethod("EventManager", "subUserVoiceConnectionEvent");
        this.mthSubBeforeSentEvent = this.mthInterface.getMethod("EventManager", "subBeforeSentEvent");
        
        this.mthAddNewWakeupDateEvent = this.mthInterface.getMethod("EventManager", "addNewWakeupDateEvent");
        this.mthAddWakeupDateEvent = this.mthInterface.getMethod("EventManager", "addWakeupDateEvent");
        this.mthSubToWakeupDateEvent = this.mthInterface.getMethod("EventManager", "subToWakeupDateEvent");
    }

    // Subscribe function to boot connected event
    subBootConnectedEvent(fct: () => void) {
        this.mthSubBootConnectedEvent(this.componentName, fct);
    }

    // Subscribe function to msg interaction event
    subMsgInteractionEvent(fct: (msg: Message) => void) {
        this.mthSubMsgInteractionEvent(this.componentName, fct);
    }

    // Subscribe function to added user event
    subAddedUserEvent(fct: (user: User) => void) {
        this.mthSubAddedUserEvent(this.componentName, fct);
    }

    // Subscribe function to user voice connection event
    subUserVoiceConnectionEvent(fct: (user: User) => void) {
        this.mthSubUserVoiceConnectionEvent(this.componentName, fct);
    }

    // Subscribe function to before sent message event
    subBeforeSentEvent(fct: (msg: MsgToSend) => boolean) {
        this.mthSubBeforeSentEvent(this.componentName, fct);
    }

    /** Wake Up Date Event **/

    /**
     * add a new wake up date event
     * @param eventName name of the event
     * @param fct function call
     * @param option option for the event
     */
    addNewWakeupDateEvent<TArgs>(eventName: string,  fct: (args: TArgs) => void, option?: WakeupDateOption): void {
        this.mthAddNewWakeupDateEvent(eventName, this.componentName, fct, option);
    }

    /**
     * add a wake up date event
     * @param wudEventToAdd event to add
     */
    addWakeupDate<TArgs>(wudEventToAdd: WakeupDateEvent<TArgs>) {
        this.mthAddWakeupDateEvent(wudEventToAdd);
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
        this.mthSubToWakeupDateEvent(eventName, subName, args, wakeupDate, nbCallBeforeRemove, nextCall);
    }


}
