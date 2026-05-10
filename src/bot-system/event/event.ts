interface SubEvent<TArgs extends any[], ReturnType> {
    subName: string
    fct: (...args: TArgs) => ReturnType
}

export class Event<TArgs extends any[], ReturnType> {
    readonly name: string
    private subList: Array<SubEvent<TArgs, ReturnType>>

    /**
     * Event to be sub and call
     * @param name name event
     */
    constructor(name: string) {
        this.name = name;
        this.subList = [];
    }

    /**
     * Return the number of sub to the event
     */
    get nbSub(): number {
        return this.subList.length;
    }

    /**
     * Indicate if the event has a specific sub
     * @param subName sub name to search
     */
    hasSub(subName: string): boolean {
        return this.subList.find(s => s.subName == subName) != undefined;
    }

    /**
     * add a sub to the event
     * @param subName name of the sub
     * @param fct function to call
     */
    addSub(subName: string, fct: (...args: TArgs) => ReturnType) {
        this.subList.push({
            subName: subName,
            fct: fct
        });
    }

    /**
     * Call Each sub function without return.
     * @param args arguments for each sub function call
     */
    call(...args: TArgs): void {
        this.subList.forEach( sub =>
            sub.fct(...args)
        );
    }

    /**
     * Call Each sub function.
     * @param initValue default value, and initial value to be reduce
     * @param returnReduceFct function to reduce return value of each sub function call. 2 arguments: sum reduce at the current sub ; and next the current sub return
     * @param args arguments for each sub function call
     * @returns for each reduce sub call. The Type can be different to the function sub return
     */
    callWithReturn<CallReturn>(initValue: CallReturn, returnReduceFct: (reduceReturn: CallReturn, nextReturn: ReturnType) => CallReturn, ...args: TArgs): CallReturn {
        if(this.subList.length == 0) {
            return initValue;
        }

        if(returnReduceFct!=undefined && initValue!=undefined) {
            let valueReturn: CallReturn = initValue;
            this.subList.forEach( sub => {
                valueReturn = returnReduceFct( valueReturn, sub.fct(...args) );
            });
            return valueReturn;
        }
        else {
            this.subList.forEach( sub =>
                sub.fct(...args)
            );
            return initValue;
        }
    }


    /**
     * Get the information about the event and the sub
     * @returns the information about the event
     */
    getInfoEvent(): string {
        if(this.nbSub==0) {
            return `${this.name} event - 0 sub\n`;
        }
        
        let strReturn = `${this.name} event - ${this.nbSub} sub:\n> `;
        for (let i = 0; i < this.subList.length - 1 ; i++) {
            strReturn += this.subList[i].subName + ' - ';
        }
        strReturn += this.subList[this.subList.length-1].subName + '\n';
        return strReturn;
    }
}
