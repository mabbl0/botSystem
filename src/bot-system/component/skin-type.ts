import { randInt } from "../../tools/random"


// Class to give the possibility to change a return by an other return. use for the extension
export class Skin<TArgs extends any[], SkinType> {
    readonly name: string // objet name to apply the skin
    private subList: Array<{    // list of possible skin
        name: string  // skin name
        fct: (...args: TArgs) => SkinType // skin replace
    }>

    constructor(name: string){
        this.name = name
        this.subList = [];
    }

    /**
     * subscribe to a skin to change a return
     * @param name skin name
     * @param fct skin function to apply
     */
    sub(name: string, fct: (...args: TArgs) => SkinType){
        this.subList.push({
            name: name, 
            fct: fct
        });
    }

    /**
     * Get a skin
     * @param defaultSkin default return, if no skin
     * @param args arguments for skin function
     * @returns new objet with or without skin
     */
    get(defaultSkin: SkinType, ...args: TArgs): SkinType {
        if(this.subList.length == 0){
            return defaultSkin;
        }
        if(this.subList.length == 1){
            return this.subList[0].fct(...args);
        }
        return this.subList[ randInt(this.subList.length) ].fct(...args);
    }
}
