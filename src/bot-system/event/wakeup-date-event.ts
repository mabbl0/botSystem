import { dateStr } from "../../tools/date"

interface WakeupDateSub<TArgs> {
    subName: string
    args: TArgs
    wakeupDate: number // date in ms since 1970

    nbCallBeforeRemove: number
    nextCall: number
}

export interface WakeupDateEventJson {
    name: string,
    ownerName: string,
    subList: Array<WakeupDateSub<any>>
}

export interface WakeupDateOption {
    private?: boolean
    minBeforeSubRecall?: number
    saved?: boolean
} 

export class WakeupDateEvent<TArgs> {
    readonly name: string
    ownerName: string
    private fct: (args: TArgs) => void
    private subAddedCall: (eventName: string, saveFile: boolean)=>void
    private subList: Array<WakeupDateSub<TArgs>> // sub list sort in to the next sub to wake up to the last
    private option: WakeupDateOption
    private nbSuccessiveOverDate: number // number of successive sub add with an over date

    /**
     * Event where sub are call at specific time
     * @param name event name
     * @param fct function to call
     */
    constructor(name: string, ownerName: string, fct?: (args: TArgs) => void, option: WakeupDateOption = {}) {
        this.name = name;
        this.ownerName = ownerName;
        this.fct = fct;
        this.subList = [];
        this.nbSuccessiveOverDate = 0;

        this.option = option;
        if(this.option.private == undefined) {
            this.option.private = false;
        }
        if(this.option.minBeforeSubRecall == undefined) {
            this.option.minBeforeSubRecall = 60_000; // 1min minimum to recall a same sub
        }
        if(this.option.saved == undefined) {
            this.option.saved = true;
        }
    }

    /**
     * Return the number of sub to the event
     */
    get nbSub(): number {
        return this.subList.length;
    }

    /**
     * Indicate if the wake up date event is ready
     */
    get ready(): boolean {
        return this.fct != undefined
    }

    /**
     * Return the date of the next sub called. Undefined if no sub
     */
    get nextCall(): number {
        if(this.subList.length==0 || this.fct==undefined) {
            return undefined;
        }
        return this.subList[0].wakeupDate;
    }

    /**
     * Indicate if the event is private or not
     */
    get private(): boolean {
        return this.option.private;
    }

    /**
     * Indicate if the event should be saved in data file
     */
    get saved(): boolean {
        return this.option.saved;
    }

    /**
     * set the called function if function not already set
     * @param fct function to call
     */
    setFct(fct: (args: TArgs) => void) {
        if (this.fct == undefined) { // only once
            this.fct = fct;
        }
    }

    /**
     * set the function call after a seb added, for the controller
     * @param fct function call after a sub added
     */
    setSubAddedCall( fct: (eventName: string, saveFile: boolean) => void ) {
        if (this.subAddedCall == undefined) { // only once
            this.subAddedCall = fct;
        }
    }

    /**
     * Copy the function and option of an other similaire event
     * @param wudEventToCopy event to copy
     */
    copyFctOpt(wudEventToCopy: WakeupDateEvent<TArgs>) {
        this.setFct( wudEventToCopy.fct );
        this.option = wudEventToCopy.option;
    }

    /**
     * Copy the sub of an other similaire event
     * @param wudEventToCopy event to copy
     */
    copySub(wudEventToCopy: WakeupDateEvent<TArgs>) {
        if(this.subList.length == 0) {
            this.subList = wudEventToCopy.subList.slice();
        }
        else {
            wudEventToCopy.subList.forEach( sub => {
                this.addSubInSortList(sub);
            });
        }
    }

    /**
     * add a sub to the wake up date event
     * call it if the wake up date is pass
     * @param subName name of the sub
     * @param args argument to give
     * @param wakeupDate date to wake up, in ms since 1970
     * @param nbCallBeforeRemove indicate the number of call before remove the sub, -1 to call forever
     * @param nextCall indicate when recall the sub if it is not remove
     */
    addSub(subName: string, args: TArgs, wakeupDate: number, nbCallBeforeRemove?: number, nextCall?: number) {
        let now = Date.now();
        if(now > wakeupDate) {
            // sub add with an over date
            this.nbSuccessiveOverDate += 1;
            if(this.nbSuccessiveOverDate > 16) {
                // risk of infinite loop
                return;
            }
            else if(this.nbSuccessiveOverDate > 4) {
                // add with an over time to not overload the event call
                wakeupDate = now + 500; // +500 ms
            }
            else if(this.fct!=undefined){
                this.fct(args);
                return;
            }
        }
        else {
            this.nbSuccessiveOverDate = 0;
        }

        if(nextCall != undefined && nextCall < this.option.minBeforeSubRecall) { // minimum before call
            nextCall = this.option.minBeforeSubRecall;
        }

        this.addSubInSortList({
            subName: subName,
            args: args,
            wakeupDate: wakeupDate,
            nbCallBeforeRemove: nbCallBeforeRemove,
            nextCall: nextCall
        });
        
        if(this.subAddedCall!=undefined) {
            this.subAddedCall(this.name, this.option.saved);
        }
    }

    /**
     * Add an sub event in the sorted list
     * @param subEventToAdd the sub event to add in the sorted list
     */
    private addSubInSortList(subEventToAdd: WakeupDateSub<TArgs>) {
        // add to the great place, to sort the list
        for (let i = 0; i < this.subList.length; i++) {
            if (subEventToAdd.wakeupDate < this.subList[i].wakeupDate) {
                this.subList.splice(i, 0, subEventToAdd);
                return;
            }
        }
        // add to the end
        this.subList.push(subEventToAdd);
    }

    /**
     * Call Each sub with wake up date pass, without return.
     * Then remove the called sub
     * @returns the number of sub remove
     */
    testAndCall(): number {
        if (this.fct == undefined) {
            return 0;
        }
        
        let now = Date.now();
        let nbRemoved = 0;
        let subEvent: WakeupDateSub<TArgs>;
        for (let i = 0; i < this.subList.length; i++) {
            subEvent = this.subList[i];
            if (now > subEvent.wakeupDate) {
                // remove
                this.subList.splice(i, 1);
                i += -1;

                this.fct(subEvent.args);
                
                // replace again in the sort list to be recall, if needed
                if(subEvent.nbCallBeforeRemove==undefined || subEvent.nextCall==undefined ||
                    subEvent.nbCallBeforeRemove==0 || subEvent.nbCallBeforeRemove==1)
                {
                    nbRemoved += 1;
                }
                else if(subEvent.nextCall != undefined) { // nbCallBeforeRemove > 1 || nbCallBeforeRemove < 0
                    subEvent.wakeupDate = now + subEvent.nextCall;
                    this.addSubInSortList(subEvent);
                    subEvent.nbCallBeforeRemove += -1;
                }
            }
            else {
                // is a sorted list
                return nbRemoved;
            }
        }
        return nbRemoved;
    }


    /** Load and Save **/
    load(data: WakeupDateEventJson) {
        data.subList.forEach(sub => {
            this.addSub(sub.subName, sub.args, sub.wakeupDate);
        });
    }
    toJson(): WakeupDateEventJson {
        return {
            name: this.name,
            ownerName: this.ownerName,
            subList: this.subList
        };
    }

    /** Get event information **/

    /**
     * Get the information about the event and the sub
     * @returns the information about the event
     */
    getInfoEvent(): string {
        if(this.nbSub==0) {
            return `- ${this.name} wud event - 0 sub\n`;
        }

        let strReturn = `- ${this.name} wud event - ${this.nbSub} sub:\n`;
        let nbCallLeftStr: string
        let wakeupDateStr: string
        this.subList.forEach(sub => {
            if(sub.nbCallBeforeRemove > 1) {
                nbCallLeftStr = `${sub.nbCallBeforeRemove?.toString()} left / `;
            }
            else if(sub.nbCallBeforeRemove < 0) {
                nbCallLeftStr = 'infinite / ';
            }
            else {
                nbCallLeftStr = '';
            }
            wakeupDateStr = dateStr(new Date(sub.wakeupDate), true);
            strReturn += `  - ${sub.subName} ${nbCallLeftStr}${wakeupDateStr}\n`;
        })
        return strReturn;
    }
}