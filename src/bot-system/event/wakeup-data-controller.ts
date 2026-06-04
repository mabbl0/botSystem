import { MapName } from "../../tools/collection/map";
import { LogLevel } from "../component/component-type";
import { PropInterface } from "../property/property-interface";
import { Prop } from "../property/property";
import { WakeupDateEvent, WakeupDateEventJson, WakeupDateOption } from "./wakeup-date-event";

export interface WakeupDateJson {
    events: WakeupDateEventJson[]
}

/**
 * Every sub event shall be wakeup on the correct date
 * Minimum timeout in the same time
 * A maximum timeout wait to avoid timeout multiplication 
 * Maximum wait shall NEVER more than 2592000000 (= 30days in ms)
 */

export class WakeupDateController {
    #wudMap: MapName<WakeupDateEvent<any>>
    #nextCall: number // date of the next sub call
    #log: (logLevel: number, txt: string) => void
    #saveFct: ()=>void

    #timeoutDateList: Array<number> // sorted list
    #maxWait: number

    #propNbTimeout: Prop<number>
    #propNbSubEvent: Prop<number>

    constructor(log: (logLevel: number, txt: string) => void, propInterface: PropInterface, saveFct: ()=>void, maxWait?: number) {
        this.#wudMap = new MapName<WakeupDateEvent<any>>();
        this.#nextCall = 0;
        this.#log = log;
        this.#saveFct = saveFct;

        this.#timeoutDateList = [];
        if(maxWait==undefined || maxWait > 2_160_000_000) {
            this.#maxWait = 2_160_000_000; // 25 days in ms
        }
        else {
            this.#maxWait = maxWait;
        }
        
        this.#propNbTimeout = propInterface.createAndAddProp('nbTimeout', 0, {readOnly: true});
        this.#propNbSubEvent = propInterface.createAndAddProp('nbSubEvent', 0, {readOnly: true});
    }

    get size(): number {
        return this.#wudMap.size;
    }

    get nbSub(): number {
        return this.#wudMap.reduce<number>(0, (r,e) => r + e.nbSub);
    }


    /**
     * init the timeout at boot
     */
    boot() {
        this.startTimeout();
    }

    /**
     * add a new wake up date event
     * @param eventName name of the event
     * @param ownerName name of the owner component
     * @param fct function call
     * @param option option for the event
     */
    addNewWakeupDateEvent<TArgs>(eventName: string, ownerName: string, fct: (args: TArgs) => void, option?: WakeupDateOption) {
        let wudFound = this.#wudMap.get(eventName);
        if (wudFound != undefined) {
            if (wudFound.ready == false) {
                wudFound.setFct(fct);
                wudFound.ownerName = ownerName;
                wudFound.setSubAddedCall( this.subAdded.bind(this) );
                this.#log(LogLevel.Info, `Wake up date event '${eventName}' ready`);
                return;
            }
            this.#log(LogLevel.Error, `There is already a '${eventName}' wake up date event.`);
            return;
        }
        let wudEvent = new WakeupDateEvent(eventName, ownerName, fct, option);
        wudEvent.setSubAddedCall( this.subAdded.bind(this) );
        this.#wudMap.set(wudEvent);
        this.#log(LogLevel.Info, `New wake up date event add: '${eventName}'`);
    }

    /**
     * add a private wake up date event
     * @param eventName name of the event
     * @param fct function call
     * @param option option for the event
     */
    addWakeupDateEvent<TArgs>(wudEventToAdd: WakeupDateEvent<TArgs>) {
        let wudFound = this.#wudMap.get(wudEventToAdd.name);
        if (wudFound != undefined) {
            if (wudFound.ready == false) {
                wudEventToAdd.copySub(wudFound);
                wudFound.ownerName = wudEventToAdd.ownerName;
                wudEventToAdd.setSubAddedCall( this.subAdded.bind(this) );
                // replace in the map
                this.#wudMap.delete(wudEventToAdd.name);
                this.#wudMap.set(wudEventToAdd);
                this.#log(LogLevel.Info, `Wake up date event '${wudFound.name}' update and ready`);
                return;
            }
            this.#log(LogLevel.Error, `There is already a '${wudFound.name}' wake up date event.`);
            return;
        }
        wudEventToAdd.setSubAddedCall( this.subAdded.bind(this) );
        this.#wudMap.set(wudEventToAdd);
        this.#log(LogLevel.Info, `Wake up date event add: '${wudEventToAdd.name}'`);
    }

    /**
     * Sub to a wake up date event
     * @param eventName name of the event to sub
     * @param subName name of the name
     * @param args arguments for the sub
     * @param wakeupDate date to wake up the sub
     * @param nbCallBeforeRemove indicate the number of call before remove the sub, -1 to call forever
     * @param #nextCall indicate when recall the sub if it is not remove
     */
    subToWakeupDateEvent<TArgs>(eventName: string, subName: string, args: TArgs, wakeupDate: number, nbCallBeforeRemove?: number, nextCall?: number) {
        let wudEvent = this.#wudMap.get(eventName);
        if (wudEvent == undefined) {
            this.#log(LogLevel.Error, `No wake up date event '${eventName}' found, to sub ${subName}`);
            return;
        }
        if(wudEvent.private) {
            this.#log(LogLevel.Error, `Wake up date event '${eventName}' is private. You can not add sub by the controller`);
            return;
        }
        wudEvent.addSub(subName, args, wakeupDate, nbCallBeforeRemove, nextCall);
    }

    private updateNextCall() {
        if (this.#wudMap.size == 0) {
            this.#nextCall = undefined;
            return;
        }
        this.#nextCall = this.#wudMap.getFirst().nextCall;
        this.#wudMap.forEach(wud => {
            if (wud.nextCall != undefined &&
                (this.#nextCall == undefined || wud.nextCall < this.#nextCall)) {
                this.#nextCall = wud.nextCall;
            }
        });
    }

    private startTimeout() {
        this.updateNextCall();

        if (this.#nextCall == undefined) {
            this.#log(LogLevel.Info, 'No event to wait');
            return;
        }

        if (this.#timeoutDateList.length!=0 &&
            this.#nextCall >= this.#timeoutDateList[0] )
        {
            // there is already a timeout for the next event
            this.#log(LogLevel.Info, 'Already a timeout for the next event');
            return;
        }

        let now = Date.now();
        let nextWait = this.#nextCall - now;
        if (nextWait < 0) {
            // there is event to call
            this.testAndCall();
            this.startTimeout(); // update and restart the timeout
            return;
        }

        let nextWakeup = this.#nextCall;
        if (nextWait > this.#maxWait) {
            // wait no more than the maximum
            nextWait = this.#maxWait;
            nextWakeup = now + this.#maxWait;
        }

        // Start the timeout
        setTimeout(() => {
            this.testAndCall();

            // remove the timeout from the list
            this.#timeoutDateList.splice(0, 1);
            this.#propNbTimeout.value += -1;
            // restart the timeout
            this.startTimeout();
        }, nextWait);

        // update the sorted timeout list
        this.addTimeoutStarted(nextWakeup);
    }

    /**
     * Test and call every sub from every events
     */
    private testAndCall() {
        this.#log(LogLevel.Info, 'Wakeup on date Events Call');

        let nbSubCalled: number;
        let totalSubCalled = 0;
        let hasToSave = false;
        this.#wudMap.forEach(wud => {
            nbSubCalled = wud.testAndCall();
            if(wud.saved && nbSubCalled>0) {
                hasToSave = true;
            }
            totalSubCalled += nbSubCalled;
        });
        if(totalSubCalled!=0) {
            this.#propNbSubEvent.value -= totalSubCalled;
        }
        if(hasToSave) {
            this.#saveFct();
        }
    }

    /**
     * Add a timeout started to the sorted list
     * @param timeoutWakeupDate timeout wakeup date
     */
    private addTimeoutStarted(timeoutWakeupDate: number) {
        this.#propNbTimeout.value += 1;
        for (let i = 0; i < this.#timeoutDateList.length; i++) {
            if (timeoutWakeupDate < this.#timeoutDateList[i]) {
                this.#timeoutDateList.splice(i, 0, timeoutWakeupDate);
                return;
            }
        }
        this.#timeoutDateList.push(timeoutWakeupDate);
    }

    /**
     * Method call after a sub add to an event
     */
    private subAdded(eventName: string = 'unknow', saveFile: boolean = true) {
        this.#log(LogLevel.Info, `New sub to the Wake up date event ${eventName}`);
        this.#propNbSubEvent.value += 1;
        this.startTimeout();
        if(saveFile) {
            this.#saveFct();
        }
    }

    /** Load And Save **/
    load(dataLoaded: WakeupDateJson) {
        this.#propNbSubEvent.value = 0;
        dataLoaded.events.forEach(wudData => {
            let wudEvent = new WakeupDateEvent(wudData.name, wudData.ownerName);
            wudEvent.load(wudData);
            this.#wudMap.set(wudEvent);
            this.#propNbSubEvent.value += wudEvent.nbSub;
        });
        this.#log(LogLevel.Info, `${this.#wudMap.size} wakeup date event loaded, with ${this.#propNbSubEvent.value} sub`);
        // events not ready here
    }
    toJson(): WakeupDateJson {
        return {
            events: this.#wudMap.toJson(wud => wud.saved)
        }
    }

    /** Information event **/

    /**
     * Get the information about the events
     * @returns the information about the events
     */
    getInfoEvents(): string {
        let strReturn = `### ${this.#wudMap.size} wakeup on date Events for ${this.nbSub} current sub\n`;
        this.#wudMap.forEach(wud => strReturn += wud.getInfoEvent());
        return strReturn;
    }
    
    // give event information about an component
    infoComponent(componentName: string): string {
        let eventListStr = '';
        let nbEvent = 0;
        this.#wudMap.forEach(wud => {
            if(wud.ownerName == componentName) {
                nbEvent += 1;
                eventListStr += `  - ${wud.nbSub} sub to ${wud.name} event\n`;
            }
        });
        if(nbEvent!=0) {
            return `- ${nbEvent} wakeup date event:\n${eventListStr}`;
        }
        return '';
    }
}